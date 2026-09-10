const { likePost, unlikePost } = require("../../services/update/posts.service");

/**
 * Controller: Like a post
 * Auth: Required
 */
async function handleLikePost(req, res, next) {
    try {
        const { id } = req.params;
        const result = await likePost({
            postId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Post liked"
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code, message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Unlike a post
 * Auth: Required
 */
async function handleUnlikePost(req, res, next) {
    try {
        const { id } = req.params;
        const result = await unlikePost({
            postId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Post unliked"
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code, message: err.message }
            });
        }
        return next(err);
    }
}

module.exports = {
    handleLikePost,
    handleUnlikePost
};
