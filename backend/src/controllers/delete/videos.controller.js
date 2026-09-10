const { deleteVideo } = require("../../services/delete/videos.service");

/**
 * HTTP Handler: Deletes a video.
 */
async function handleDeleteVideo(req, res, next) {
    try {
        const result = await deleteVideo(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Video deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleDeleteVideo
};
