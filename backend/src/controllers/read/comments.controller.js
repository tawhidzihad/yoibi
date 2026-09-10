const { getComments } = require("../../services/read/comments.service");

/**
 * Controller: Get comments for a post
 * Auth: Optional
 */
async function handleGetComments(req, res, next) {
    try {
        const { id } = req.params;
        const result = await getComments({ postId: id });

        return res.status(200).json({
            success: true,
            data: result,
            message: ""
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

module.exports = { handleGetComments };
