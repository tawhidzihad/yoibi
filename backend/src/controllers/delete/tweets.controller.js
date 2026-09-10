const { deleteTweet } = require("../../services/delete/tweets.service");

/**
 * Controller: Delete a tweet
 * Auth: Required — only author or admin
 */
async function handleDeleteTweet(req, res, next) {
    try {
        const { id } = req.params;
        const result = await deleteTweet({
            tweetId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tweet deleted"
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

module.exports = { handleDeleteTweet };
