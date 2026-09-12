const tweetsRepository = require("../../repositories/tweets.repository");

/**
 * Service: Like a tweet
 */
async function likeTweet({ tweetId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await tweetsRepository.findById(tweetId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const updated = await tweetsRepository.addLike(tweetId, user.id);

    return {
        liked: true,
        likesCount: updated ? updated.likesCount : 0
    };
}

/**
 * Service: Unlike a tweet
 */
async function unlikeTweet({ tweetId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await tweetsRepository.findById(tweetId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const updated = await tweetsRepository.removeLike(tweetId, user.id);

    return {
        liked: false,
        likesCount: updated ? updated.likesCount : 0
    };
}

/**
 * Service: Retweet a tweet
 */
async function retweetTweet({ tweetId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await tweetsRepository.findById(tweetId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const updated = await tweetsRepository.addRetweet(tweetId, user.id);

    return {
        retweeted: true,
        retweetCount: updated ? updated.retweetCount : 0
    };
}

/**
 * Service: Undo retweet
 */
async function undoRetweet({ tweetId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await tweetsRepository.findById(tweetId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const updated = await tweetsRepository.removeRetweet(tweetId, user.id);

    return {
        retweeted: false,
        retweetCount: updated ? updated.retweetCount : 0
    };
}

module.exports = {
    likeTweet,
    unlikeTweet,
    retweetTweet,
    undoRetweet
};
