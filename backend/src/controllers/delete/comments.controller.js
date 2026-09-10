const { deleteComment } = require("../../services/delete/comments.service");

/**
 * Controller: Delete a comment from a post
 * Auth: Required
 */
async function handleDeleteComment(req, res, next) {
    try {
        const { id, commentId } = req.params;
        const result = await deleteComment({
            postId: id,
            commentId,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Comment deleted successfully"
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

module.exports = { handleDeleteComment };
