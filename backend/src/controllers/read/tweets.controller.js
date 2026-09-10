const { listTweets, getTweetById, getReplies } = require("../../services/read/tweets.service");

/**
 * Controller: List paginated tweets (feed)
 * Auth: Optional
 */
async function handleListTweets(req, res, next) {
    try {
        const { page, limit, filter } = req.query;
        const result = await listTweets({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            filter: filter || "all",
            currentUserId: req.user ? req.user.id : null
        });

        return res.status(200).json({
            success: true,
            data: result
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
 * Controller: Get a single tweet by ID with replies
 * Auth: Optional
 */
async function handleGetTweetById(req, res, next) {
    try {
        const { id } = req.params;
        const result = await getTweetById({
            id,
            currentUserId: req.user ? req.user.id : null
        });

        return res.status(200).json({
            success: true,
            data: result
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
 * Controller: Get replies for a tweet
 * Auth: Optional
 */
async function handleGetReplies(req, res, next) {
    try {
        const { id } = req.params;
        const result = await getReplies({
            tweetId: id,
            currentUserId: req.user ? req.user.id : null
        });

        return res.status(200).json({
            success: true,
            data: result
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
    handleListTweets,
    handleGetTweetById,
    handleGetReplies
};
