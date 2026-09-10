const {
    startStream,
    endStream
} = require("../../services/update/streams.service");

/**
 * HTTP Handler: Starts live broadcast and returns fresh host LiveKit token.
 */
async function handleStartStream(req, res, next) {
    try {
        const result = await startStream(req.user, req.params.id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Stream is now live"
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Ends live broadcast and terminates LiveKit room session.
 */
async function handleEndStream(req, res, next) {
    try {
        const result = await endStream(req.user, req.params.id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Stream broadcast ended and LiveKit room closed"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleStartStream,
    handleEndStream
};
