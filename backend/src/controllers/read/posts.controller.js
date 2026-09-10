const { listPosts, getPostById } = require("../../services/read/posts.service");

/**
 * Controller: List feed posts
 * Auth: Optional
 */
async function handleListPosts(req, res, next) {
    try {
        const { page = 1, limit = 20, filter = "all" } = req.query;
        const currentUserId = req.user ? req.user.id : null;

        const result = await listPosts({
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
            filter,
            currentUserId
        });

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

/**
 * Controller: Get post by ID
 * Auth: Optional
 */
async function handleGetPostById(req, res, next) {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user.id : null;

        const post = await getPostById({
            id,
            currentUserId
        });

        return res.status(200).json({
            success: true,
            data: post,
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

module.exports = {
    handleListPosts,
    handleGetPostById
};
