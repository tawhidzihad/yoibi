const { deletePost } = require("../../services/delete/posts.service");

/**
 * Controller: Delete a post
 * Auth: Required
 */
async function handleDeletePost(req, res, next) {
    try {
        const { id } = req.params;
        const result = await deletePost({
            postId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Post deleted successfully"
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

module.exports = { handleDeletePost };
