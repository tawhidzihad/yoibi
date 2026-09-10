const crypto = require("crypto");
const { AccessToken, RoomServiceClient } = require("livekit-server-sdk");
const { env } = require("../../config/env");

/**
 * Checks whether livekit environment configuration is present.
 */
function isLiveKitConfigured() {
    return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
}

/**
 * Generates an opaque LiveKit host token with publishing permissions.
 *
 * @param {string} roomName - Opaque room identifier (stream_<uuid>)
 * @param {object} [options]
 * @param {string} [options.ttl="4h"] - Token time-to-live
 * @returns {Promise<{ token: string, url: string }>}
 */
async function generateHostToken(roomName, options = {}) {
    const ttl = options.ttl || "4h";
    const identity = `host_${crypto.randomUUID()}`;
    const livekitUrl = env.LIVEKIT_URL || "wss://mock.livekit.local";
    const apiKey = env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = env.LIVEKIT_API_SECRET || "secret123456789012345678901234567890";

    const at = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        roomAdmin: false
    });

    const token = await at.toJwt();
    return { token, url: livekitUrl };
}

/**
 * Generates an opaque LiveKit viewer token with subscribe-only permissions.
 *
 * @param {string} roomName - Opaque room identifier (stream_<uuid>)
 * @param {object} [options]
 * @param {string} [options.ttl="4h"] - Token time-to-live
 * @returns {Promise<{ token: string, url: string }>}
 */
async function generateViewerToken(roomName, options = {}) {
    const ttl = options.ttl || "4h";
    const identity = `viewer_${crypto.randomUUID()}`;
    const livekitUrl = env.LIVEKIT_URL || "wss://mock.livekit.local";
    const apiKey = env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = env.LIVEKIT_API_SECRET || "secret123456789012345678901234567890";

    const at = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
        roomAdmin: false
    });

    const token = await at.toJwt();
    return { token, url: livekitUrl };
}

// In-memory slot reservation manager with 20-second TTL to prevent race conditions during concurrent joins
const reservations = new Map(); // roomName -> Map<reservationId, expireTimestamp>

/**
 * Purges expired reservations for a room and returns active count.
 *
 * @param {string} roomName
 * @returns {number}
 */
function getActiveReservationCount(roomName) {
    const now = Date.now();
    const roomReservations = reservations.get(roomName);
    if (!roomReservations) {
        return 0;
    }

    for (const [resId, expiresAt] of roomReservations.entries()) {
        if (now >= expiresAt) {
            roomReservations.delete(resId);
        }
    }

    if (roomReservations.size === 0) {
        reservations.delete(roomName);
        return 0;
    }

    return roomReservations.size;
}

/**
 * Attempts an atomic capacity reservation before LiveKit token issuance.
 *
 * @param {string} roomName
 * @param {number} maxParticipants
 * @param {number} [ttlMs=20000] - 20 seconds reservation TTL
 * @returns {Promise<{ success: boolean, reservationId?: string, currentCount: number }>}
 */
async function reserveSlot(roomName, maxParticipants, ttlMs = 20000) {
    const activeReservations = getActiveReservationCount(roomName);
    let connectedParticipants = 0;

    if (isLiveKitConfigured()) {
        try {
            let httpUrl = env.LIVEKIT_URL;
            if (httpUrl.startsWith("wss://")) {
                httpUrl = httpUrl.replace("wss://", "https://");
            } else if (httpUrl.startsWith("ws://")) {
                httpUrl = httpUrl.replace("ws://", "http://");
            }
            const roomService = new RoomServiceClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
            const participants = await roomService.listParticipants(roomName);
            connectedParticipants = Array.isArray(participants) ? participants.length : 0;
        } catch {
            connectedParticipants = 0;
        }
    }

    const effectiveCount = connectedParticipants + activeReservations;
    if (effectiveCount >= maxParticipants) {
        return {
            success: false,
            currentCount: effectiveCount
        };
    }

    const reservationId = crypto.randomUUID();
    let roomReservations = reservations.get(roomName);
    if (!roomReservations) {
        roomReservations = new Map();
        reservations.set(roomName, roomReservations);
    }
    roomReservations.set(reservationId, Date.now() + ttlMs);

    return {
        success: true,
        reservationId,
        currentCount: effectiveCount + 1
    };
}

/**
 * Clears a specific slot reservation (e.g., upon successful connect or explicit cancellation).
 *
 * @param {string} roomName
 * @param {string} reservationId
 */
function clearReservation(roomName, reservationId) {
    const roomReservations = reservations.get(roomName);
    if (roomReservations) {
        roomReservations.delete(reservationId);
        if (roomReservations.size === 0) {
            reservations.delete(roomName);
        }
    }
}

/**
 * Resets all reservations for testing or room cleanup.
 *
 * @param {string} [roomName]
 */
function resetReservations(roomName) {
    if (roomName) {
        reservations.delete(roomName);
    } else {
        reservations.clear();
    }
}

/**
 * Gets the total effective participant count (connected LiveKit peers + active reservations).
 *
 * @param {string} roomName
 * @returns {Promise<number>}
 */
async function getActiveParticipantCount(roomName) {
    const activeReservations = getActiveReservationCount(roomName);
    let connectedParticipants = 0;

    if (isLiveKitConfigured()) {
        try {
            let httpUrl = env.LIVEKIT_URL;
            if (httpUrl.startsWith("wss://")) {
                httpUrl = httpUrl.replace("wss://", "https://");
            } else if (httpUrl.startsWith("ws://")) {
                httpUrl = httpUrl.replace("ws://", "http://");
            }
            const roomService = new RoomServiceClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
            const participants = await roomService.listParticipants(roomName);
            connectedParticipants = Array.isArray(participants) ? participants.length : 0;
        } catch {
            connectedParticipants = 0;
        }
    }

    return connectedParticipants + activeReservations;
}

/**
 * Generates an opaque LiveKit participant token with interactive media permissions.
 * Metadata contains ONLY public presentation fields: name, handle, avatarUrl (zero MongoDB user _id or credentials).
 *
 * @param {string} roomName - Opaque room identifier (meetup_<uuid>)
 * @param {object} user - Authenticated YOIBI user profile
 * @param {object} [options]
 * @param {string} [options.ttl="4h"] - Token time-to-live
 * @returns {Promise<{ token: string, url: string, participantIdentity: string }>}
 */
async function generateMeetupParticipantToken(roomName, user, options = {}) {
    const ttl = options.ttl || "4h";
    const identity = `participant_${crypto.randomUUID()}`;
    const livekitUrl = env.LIVEKIT_URL || "wss://mock.livekit.local";
    const apiKey = env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = env.LIVEKIT_API_SECRET || "secret123456789012345678901234567890";

    // Public presentation snapshot only — zero Mongo user _id, email, or credentials
    const metadata = JSON.stringify({
        name: user?.name || "YOIBI Member",
        handle: user?.handle || "member",
        avatarUrl: user?.avatarUrl || null
    });

    const at = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl,
        metadata
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        roomAdmin: false
    });

    const token = await at.toJwt();
    return {
        token,
        url: livekitUrl,
        participantIdentity: identity
    };
}

/**
 * Terminates an active LiveKit room session, disconnecting all peers.
 *
 * @param {string} roomName - Opaque room identifier
 * @returns {Promise<boolean>}
 */
async function terminateLiveKitRoom(roomName) {
    // Clear pending reservations for the room
    resetReservations(roomName);

    if (!isLiveKitConfigured()) {
        return true;
    }

    try {
        let httpUrl = env.LIVEKIT_URL;
        if (httpUrl.startsWith("wss://")) {
            httpUrl = httpUrl.replace("wss://", "https://");
        } else if (httpUrl.startsWith("ws://")) {
            httpUrl = httpUrl.replace("ws://", "http://");
        }

        const roomService = new RoomServiceClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
        await roomService.deleteRoom(roomName);
        return true;
    } catch (error) {
        if (error && (error.message?.includes("not found") || error.status === 404)) {
            return true;
        }
        console.warn(`[LiveKit] Room termination warning for ${roomName}:`, error?.message || error);
        return false;
    }
}

module.exports = {
    isLiveKitConfigured,
    generateHostToken,
    generateViewerToken,
    generateMeetupParticipantToken,
    reserveSlot,
    clearReservation,
    resetReservations,
    getActiveParticipantCount,
    terminateLiveKitRoom
};
