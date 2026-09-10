const meetupRepository = require("../../repositories/meetup.repository");
const { terminateLiveKitRoom } = require("../../integrations/livekit/livekit");
const { MEETUP_STATUS } = require("../../models/meetup.model");

/**
 * Ends an active Meet-Up room, terminates the LiveKit session, and updates status to 'ended'.
 * Only the room owner (or admin) is authorized.
 */
async function endMeetupRoom(user, id) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to end Meet-Up room.");
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

    // Ownership or admin check
    const isOwner = room.ownerId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
        const error = new Error("Only the room owner can end this Meet-Up room.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    if (room.status === MEETUP_STATUS.ENDED) {
        return {
            id: room._id?.toString() || room.id || id,
            status: MEETUP_STATUS.ENDED,
            endedAt: room.endedAt || new Date()
        };
    }

    // Terminate LiveKit room session (disconnects all participants and clears pending reservations)
    await terminateLiveKitRoom(room.roomName);

    const endedAt = new Date();
    await meetupRepository.updateStatus(id, MEETUP_STATUS.ENDED, { endedAt });

    return {
        id: room._id?.toString() || room.id || id,
        status: MEETUP_STATUS.ENDED,
        endedAt
    };
}

module.exports = {
    endMeetupRoom
};
