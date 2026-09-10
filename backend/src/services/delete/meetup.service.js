const meetupRepository = require("../../repositories/meetup.repository");
const { MEETUP_STATUS } = require("../../models/meetup.model");

/**
 * Permanently deletes a Meet-Up room document from MongoDB.
 * Rejects deletion with 403 ROOM_ACTIVE if the room is currently active.
 * Only the room owner (or admin) is authorized.
 */
async function deleteMeetupRoom(user, id) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to delete Meet-Up room.");
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
        const error = new Error("Only the room owner can delete this Meet-Up room.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    // Guard: Cannot delete an active room
    if (room.status === MEETUP_STATUS.ACTIVE) {
        const error = new Error("Cannot delete an active room. End the room first.");
        error.statusCode = 403;
        error.code = "ROOM_ACTIVE";
        throw error;
    }

    await meetupRepository.deleteById(id);

    return {
        id: room._id?.toString() || room.id || id
    };
}

module.exports = {
    deleteMeetupRoom
};
