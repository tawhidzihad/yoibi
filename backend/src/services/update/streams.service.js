const streamsRepository = require("../../repositories/streams.repository");
const { generateHostToken, terminateLiveKitRoom } = require("../../integrations/livekit/livekit");
const { STREAM_STATUS } = require("../../models/stream.model");

/**
 * Transitions a stream from 'ready' to 'live' and issues a fresh host broadcasting token.
 */
async function startStream(user, id) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to start stream.");
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

    // Ownership check
    if (stream.authorId !== user.id) {
        const error = new Error("Only the stream owner can start this broadcast.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    // Cannot start ended stream
    if (stream.status === STREAM_STATUS.ENDED) {
        const error = new Error("Cannot start a stream that has already ended.");
        error.statusCode = 403;
        error.code = "STREAM_ENDED";
        throw error;
    }

    const startedAt = stream.startedAt || new Date();
    const updated = await streamsRepository.updateStatus(id, STREAM_STATUS.LIVE, { startedAt });
    const { token, url } = await generateHostToken(stream.roomName);
    const enriched = await streamsRepository.enrichAuthor(updated || stream);

    return {
        stream: enriched,
        livekit: {
            url,
            token
        },
        isHost: true
    };
}

/**
 * Ends a live stream broadcast, terminates the LiveKit session, and sets status to 'ended'.
 */
async function endStream(user, id) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to end stream.");
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
        const error = new Error("Only the stream owner or an admin can end this broadcast.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    if (stream.status === STREAM_STATUS.ENDED) {
        const error = new Error("Stream is already ended.");
        error.statusCode = 403;
        error.code = "STREAM_ALREADY_ENDED";
        throw error;
    }

    // Terminate LiveKit room session (disconnects all active participants)
    await terminateLiveKitRoom(stream.roomName);

    const endedAt = new Date();
    await streamsRepository.updateStatus(id, STREAM_STATUS.ENDED, { endedAt });

    return {
        id: stream._id?.toString() || stream.id || id,
        status: STREAM_STATUS.ENDED,
        endedAt
    };
}

module.exports = {
    startStream,
    endStream
};
