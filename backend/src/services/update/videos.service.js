const videosRepository = require("../../repositories/videos.repository");

/**
 * Records a video playback initiation event and increments viewsCount.
 */
async function recordVideoView(id) {
    const video = await videosRepository.findById(id);
    if (!video) {
        const error = new Error("Video not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const updated = await videosRepository.incrementViews(id);
    return {
        viewsCount: updated ? updated.viewsCount : (video.viewsCount || 0) + 1
    };
}

/**
 * Likes a video for the authenticated user.
 */
async function likeVideo(id, user) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to like video.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const video = await videosRepository.findById(id);
    if (!video) {
        const error = new Error("Video not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const updated = await videosRepository.addLike(id, user.id);
    const likesCount = updated ? updated.likesCount : (video.likesCount || 0) + 1;

    return {
        liked: true,
        likesCount
    };
}

/**
 * Unlikes a video for the authenticated user.
 */
async function unlikeVideo(id, user) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to unlike video.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const video = await videosRepository.findById(id);
    if (!video) {
        const error = new Error("Video not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const updated = await videosRepository.removeLike(id, user.id);
    const likesCount = updated ? updated.likesCount : Math.max(0, (video.likesCount || 0) - 1);

    return {
        liked: false,
        likesCount
    };
}

module.exports = {
    recordVideoView,
    likeVideo,
    unlikeVideo
};
