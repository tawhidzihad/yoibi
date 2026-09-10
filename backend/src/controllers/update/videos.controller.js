const {
    recordVideoView,
    likeVideo,
    unlikeVideo
} = require("../../services/update/videos.service");

/**
 * HTTP Handler: Records video playback initiation event.
 */
async function handleRecordVideoView(req, res, next) {
    try {
        const result = await recordVideoView(req.params.id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Playback recorded"
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Likes a video.
 */
async function handleLikeVideo(req, res, next) {
    try {
        const result = await likeVideo(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Video liked successfully"
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Unlikes a video.
 */
async function handleUnlikeVideo(req, res, next) {
    try {
        const result = await unlikeVideo(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Video unliked successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleRecordVideoView,
    handleLikeVideo,
    handleUnlikeVideo
};
