const { likeTweet, unlikeTweet, retweetTweet, undoRetweet } = require("../../services/update/tweets.service");

/**
 * Controller: Like a tweet
 * Auth: Required
 */
async function handleLikeTweet(req, res, next) {
    try {
        const { id } = req.params;
        const result = await likeTweet({
            tweetId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tweet liked"
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
 * Controller: Unlike a tweet
 * Auth: Required
 */
async function handleUnlikeTweet(req, res, next) {
    try {
        const { id } = req.params;
        const result = await unlikeTweet({
            tweetId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tweet unliked"
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
 * Controller: Retweet a tweet
 * Auth: Required
 */
async function handleRetweetTweet(req, res, next) {
    try {
        const { id } = req.params;
        const result = await retweetTweet({
            tweetId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tweet retweeted"
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
 * Controller: Undo retweet
 * Auth: Required
 */
async function handleUndoRetweet(req, res, next) {
    try {
        const { id } = req.params;
        const result = await undoRetweet({
            tweetId: id,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: "Retweet removed"
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
    handleLikeTweet,
    handleUnlikeTweet,
    handleRetweetTweet,
    handleUndoRetweet
};
