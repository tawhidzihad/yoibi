const streamsRepository = require("../../repositories/streams.repository");
const { generateViewerToken, generateHostToken } = require("../../integrations/livekit/livekit");
const { STREAM_STATUS } = require("../../models/stream.model");

/**
 * Lists broadcast streams by lifecycle status with pagination.
 * `status` accepts any canonical lifecycle value or "all" (every lifecycle
 * state — used by the profile Streams tab).
 */
async function listStreams({ page = 1, limit = 20, status = STREAM_STATUS.LIVE, category = null, authorId = null }) {
    const skip = (page - 1) * limit;
    const statusFilter = status === "all" ? null : status;

    const [streams, totalItems] = await Promise.all([
        streamsRepository.findPaginated({
            status: statusFilter,
            category,
            authorId,
            skip,
            limit
        }),
        streamsRepository.count({
            status: statusFilter,
            category,
            authorId
        })
    ]);

    const enriched = await streamsRepository.enrichAuthors(streams);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        items: enriched,
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
 * Retrieves a single stream by ID with populated author details.
 */
async function getStreamById(id) {
    const stream = await streamsRepository.findById(id);
    if (!stream) {
        const error = new Error("Stream not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    return streamsRepository.enrichAuthor(stream);
}

/**
 * Generates an appropriate LiveKit connection token for joining an active stream.
 * Enforces server-authoritative ready vs live vs ended join rules.
 */
async function joinStream(id, user = null) {
    const stream = await streamsRepository.findById(id);
    if (!stream) {
        const error = new Error("Stream not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    // Check if requester is stream owner
    const isOwner = Boolean(user && user.id && user.id === stream.authorId);

    // Rule: Viewer cannot join a stream in 'ready' state
    if (stream.status === STREAM_STATUS.READY) {
        if (!isOwner) {
            const error = new Error("Stream is not live yet. Viewer joins are not permitted until the broadcast starts.");
            error.statusCode = 400;
            error.code = "STREAM_NOT_LIVE";
            throw error;
        }
        // Host joining ready stream for preparation
        const { token, url } = await generateHostToken(stream.roomName);
        const enriched = await streamsRepository.enrichAuthor(stream);
        return {
            stream: enriched,
            livekit: { url, token },
            isHost: true
        };
    }

    // Rule: No new joins permitted on ended streams
    if (stream.status === STREAM_STATUS.ENDED) {
        const error = new Error("This stream broadcast has ended.");
        error.statusCode = 403;
        error.code = "STREAM_ENDED";
        throw error;
    }

    // Stream is 'live'
    if (isOwner) {
        const { token, url } = await generateHostToken(stream.roomName);
        const enriched = await streamsRepository.enrichAuthor(stream);
        return {
            stream: enriched,
            livekit: { url, token },
            isHost: true
        };
    }

    // Issue viewer token
    const { token, url } = await generateViewerToken(stream.roomName);
    const enriched = await streamsRepository.enrichAuthor(stream);
    return {
        stream: enriched,
        livekit: { url, token },
        isHost: false
    };
}

module.exports = {
    listStreams,
    getStreamById,
    joinStream
};
