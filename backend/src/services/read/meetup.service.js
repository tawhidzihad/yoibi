const meetupRepository = require("../../repositories/meetup.repository");
const {
    generateMeetupParticipantToken,
    reserveSlot,
    getActiveParticipantCount
} = require("../../integrations/livekit/livekit");
const { MEETUP_STATUS } = require("../../models/meetup.model");

/**
 * Lists Meet-Up rooms with status filter, pagination, and enriched owner data.
 */
async function listMeetupRooms({ page = 1, limit = 20, status = "active", ownerId = null }) {
    const skip = (page - 1) * limit;

    const [rooms, totalItems] = await Promise.all([
        meetupRepository.findPaginated({
            status,
            ownerId,
            skip,
            limit
        }),
        meetupRepository.count({
            status,
            ownerId
        })
    ]);

    const enriched = await meetupRepository.enrichOwners(rooms);

    // Enrich active rooms with live participant counts
    const withCounts = await Promise.all(
        enriched.map(async (room) => {
            if (room.status === MEETUP_STATUS.ACTIVE) {
                const participantCount = await getActiveParticipantCount(room.roomName);
                return {
                    ...room,
                    participantCount
                };
            }
            return {
                ...room,
                participantCount: 0
            };
        })
    );

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        items: withCounts,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages
        }
    };
}

/**
 * Retrieves a single Meet-Up room by ID.
 */
async function getMeetupRoomById(id) {
    const room = await meetupRepository.findById(id);
    if (!room) {
        const error = new Error("Meet-Up room not found.");
        error.statusCode = 404;
        error.code = "ROOM_NOT_FOUND";
        throw error;
    }

    const enriched = await meetupRepository.enrichOwner(room);
    const participantCount = await getActiveParticipantCount(room.roomName);

    return {
        ...enriched,
        participantCount: room.status === MEETUP_STATUS.ACTIVE ? participantCount : 0
    };
}

/**
 * Validates room state and capacity, atomicity-reserves slot, and issues an interactive LiveKit participant token.
 *
 * @param {string} id - Meet-Up room ID
 * @param {object} user - Authenticated user context
 * @returns {Promise<{ room: object, livekitUrl: string, token: string, participantIdentity: string }>}
 */
async function joinMeetupRoom(id, user) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to join a Meet-Up room.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const room = await meetupRepository.findById(id);
    if (!room) {
        const error = new Error("Meet-Up room not found.");
        error.statusCode = 404;
        error.code = "ROOM_NOT_FOUND";
        throw error;
    }

    // Guard: Ended rooms cannot be joined
    if (room.status === MEETUP_STATUS.ENDED) {
        const error = new Error("Meet-Up room has ended.");
        error.statusCode = 403;
        error.code = "ROOM_ENDED";
        throw error;
    }

    // Atomic capacity reservation
    const reservation = await reserveSlot(room.roomName, room.maxParticipants);
    if (!reservation.success) {
        const error = new Error("Room is at maximum capacity.");
        error.statusCode = 403;
        error.code = "ROOM_FULL";
        throw error;
    }

    // Generate participant token with opaque identity & minimized display metadata
    const { token, url, participantIdentity } = await generateMeetupParticipantToken(room.roomName, user);
    const enriched = await meetupRepository.enrichOwner(room);

    return {
        room: enriched,
        livekitUrl: url,
        token,
        participantIdentity
    };
}

module.exports = {
    listMeetupRooms,
    getMeetupRoomById,
    joinMeetupRoom
};
