const {
    listVideos,
    getVideoById
} = require("../../services/read/videos.service");

/**
 * HTTP Handler: Lists paginated videos with optional filters.
 */
async function handleListVideos(req, res, next) {
    try {
        const result = await listVideos(req.query, req.user);
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
 * HTTP Handler: Retrieves single video details (read-only; does NOT increment views).
 */
async function handleGetVideoById(req, res, next) {
    try {
        const video = await getVideoById(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            data: video,
            message: ""
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleListVideos,
    handleGetVideoById
};
