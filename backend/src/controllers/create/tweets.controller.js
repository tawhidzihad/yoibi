const { createTweet } = require("../../services/create/tweets.service");

/**
 * Controller: Create a new tweet
 * Auth: Required (verifyJwt middleware)
 */
async function handleCreateTweet(req, res, next) {
    try {
        const { content, mediaUrls = [], replyToId = null } = req.body;
        const result = await createTweet({
            user: req.user,
            content,
            mediaUrls,
            replyToId
        });

        return res.status(201).json({
            success: true,
            data: result,
            message: "Tweet created"
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

module.exports = { handleCreateTweet };
