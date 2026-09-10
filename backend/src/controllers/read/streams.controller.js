const {
    listStreams,
    getStreamById,
    joinStream
} = require("../../services/read/streams.service");

/**
 * HTTP Handler: Retrieves paginated list of broadcast streams.
 */
async function handleListStreams(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await listStreams(query);
        return res.status(200).json({
            success: true,
            data: result,
            message: ""
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Retrieves single stream metadata and author details.
 */
async function handleGetStreamById(req, res, next) {
    try {
        const stream = await getStreamById(req.params.id);
        return res.status(200).json({
            success: true,
            data: stream,
            message: ""
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Issues LiveKit connection token for joining an active stream.
 */
async function handleJoinStream(req, res, next) {
    try {
        const result = await joinStream(req.params.id, req.user || null);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Joined stream successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleListStreams,
    handleGetStreamById,
    handleJoinStream
};
