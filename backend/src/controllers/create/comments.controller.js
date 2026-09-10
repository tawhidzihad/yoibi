const { createComment } = require("../../services/create/comments.service");

/**
 * Controller: Add a comment to a post
 * Auth: Required
 */
async function handleCreateComment(req, res, next) {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const comment = await createComment({
            postId: id,
            user: req.user,
            content
        });

        return res.status(201).json({
            success: true,
            data: comment,
            message: "Comment created successfully"
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

module.exports = { handleCreateComment };
