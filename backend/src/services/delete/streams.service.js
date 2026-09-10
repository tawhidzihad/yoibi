const streamsRepository = require("../../repositories/streams.repository");
const { STREAM_STATUS } = require("../../models/stream.model");

/**
 * Deletes a stream record from MongoDB.
 * Rejects deletion if the stream is currently 'live'.
 */
async function deleteStream(user, id) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to delete stream.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const stream = await streamsRepository.findById(id);
    if (!stream) {
        const error = new Error("Stream not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    // Ownership or admin check
    const isOwner = stream.authorId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
        const error = new Error("Only the stream owner or an admin can delete this stream.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    // Guard: Cannot delete an active live stream
    if (stream.status === STREAM_STATUS.LIVE) {
        const error = new Error("Cannot delete an active live stream. Please end the broadcast first.");
        error.statusCode = 403;
        error.code = "STREAM_LIVE";
        throw error;
    }

    await streamsRepository.deleteById(id);

    return {
        deletedId: stream._id?.toString() || stream.id || id
    };
}

module.exports = {
    deleteStream
};
