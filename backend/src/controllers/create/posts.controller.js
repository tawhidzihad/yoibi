const { createPost } = require("../../services/create/posts.service");

/**
 * Controller: Create Post
 * Auth: Required
 */
async function handleCreatePost(req, res, next) {
    try {
        const { content, media } = req.body;
        const post = await createPost({
            user: req.user,
            content,
            media
        });

        return res.status(201).json({
            success: true,
            data: post,
            message: "Post created successfully"
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

module.exports = { handleCreatePost };
