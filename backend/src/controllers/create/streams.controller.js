const { createStream } = require("../../services/create/streams.service");

/**
 * HTTP Handler: Creates a new stream in 'ready' state and returns host LiveKit token.
 */
async function handleCreateStream(req, res, next) {
    try {
        const payload = req.validatedBody || req.body;
        const result = await createStream(req.user, payload);
        return res.status(201).json({
            success: true,
            data: result,
            message: "Stream created successfully in ready state"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleCreateStream
};
