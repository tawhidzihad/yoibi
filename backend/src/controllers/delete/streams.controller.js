const { deleteStream } = require("../../services/delete/streams.service");

/**
 * HTTP Handler: Deletes a stream record (ready or ended state only).
 */
async function handleDeleteStream(req, res, next) {
    try {
        const result = await deleteStream(req.user, req.params.id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Stream deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleDeleteStream
};
