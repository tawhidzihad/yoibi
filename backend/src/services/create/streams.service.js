const crypto = require("crypto");
const streamsRepository = require("../../repositories/streams.repository");
const { generateHostToken } = require("../../integrations/livekit/livekit");
const { STREAM_STATUS } = require("../../models/stream.model");

/**
 * Creates a new stream record in 'ready' state and issues an initial host token.
 *
 * @param {object} user - Authenticated user context
 * @param {object} input - Validated stream input (title, description, category, thumbnailUrl)
 * @returns {Promise<{ stream: object, livekit: { url: string, token: string }, isHost: boolean }>}
 */
async function createStream(user, input) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to create a stream.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    // Generate cryptographically opaque, non-PII room name and stream ID
    const roomName = `stream_${crypto.randomUUID()}`;
    const streamId = `strm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Generate initial host token for room preparation
    const { token, url } = await generateHostToken(roomName);

    const streamData = {
        _id: streamId,
        id: streamId,
        authorId: user.id,
        title: input.title.trim(),
        description: input.description ? input.description.trim() : "",
        category: input.category || "conversations",
        thumbnailUrl: input.thumbnailUrl ? input.thumbnailUrl.trim() : null,
        roomName,
        status: STREAM_STATUS.READY,
        viewerCount: 0,
        startedAt: null,
        endedAt: null,
        createdAt: new Date()
    };

    const saved = await streamsRepository.create(streamData);
    const enriched = await streamsRepository.enrichAuthor(saved);

    return {
        stream: enriched,
        livekit: {
            url,
            token
        },
        isHost: true
    };
}

module.exports = {
    createStream
};
