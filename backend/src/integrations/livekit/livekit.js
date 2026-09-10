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

/**
 * Terminates an active LiveKit room session, disconnecting all peers.
 *
 * @param {string} roomName - Opaque room identifier
 * @returns {Promise<boolean>}
 */
async function terminateLiveKitRoom(roomName) {
    if (!isLiveKitConfigured()) {
        return true;
    }

    try {
        // Convert wss:// to https:// for RoomServiceClient HTTP API if needed
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
        // If room is not found on SFU or already cleaned up, treat as success
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
    terminateLiveKitRoom
};
