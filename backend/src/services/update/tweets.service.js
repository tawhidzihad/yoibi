const tweetsRepository = require("../../repositories/tweets.repository");
const notificationsService = require("../notifications.service");

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

    const wasLiked = existing.likes && existing.likes.includes(user.id);
    const updated = await tweetsRepository.addLike(tweetId, user.id);

    // Secondary side effect: Trigger notification on inactive -> active state transition
    if (!wasLiked && existing.authorId) {
        notificationsService.createNotification({
            actorId: user.id,
            recipientId: existing.authorId,
            type: "like_tweet",
            targetId: tweetId,
            targetType: "tweet"
        }).catch((err) => {
            console.error("[Notification Trigger] like_tweet error:", err.message);
        });
    }

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

    const wasLiked = existing.likes && existing.likes.includes(user.id);
    const updated = await tweetsRepository.removeLike(tweetId, user.id);

    // Secondary side effect: Clean up active notification on undo
    if (wasLiked) {
        notificationsService.deleteNotification({
            actorId: user.id,
            type: "like_tweet",
            targetId: tweetId
        }).catch((err) => {
            console.error("[Notification Undo] like_tweet error:", err.message);
        });
    }

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

    const wasRetweeted = existing.retweets && existing.retweets.includes(user.id);
    const updated = await tweetsRepository.addRetweet(tweetId, user.id);

    // Secondary side effect: Trigger notification on inactive -> active state transition
    if (!wasRetweeted && existing.authorId) {
        notificationsService.createNotification({
            actorId: user.id,
            recipientId: existing.authorId,
            type: "retweet",
            targetId: tweetId,
            targetType: "tweet"
        }).catch((err) => {
            console.error("[Notification Trigger] retweet error:", err.message);
        });
    }

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

    const wasRetweeted = existing.retweets && existing.retweets.includes(user.id);
    const updated = await tweetsRepository.removeRetweet(tweetId, user.id);

    // Secondary side effect: Clean up active notification on undo
    if (wasRetweeted) {
        notificationsService.deleteNotification({
            actorId: user.id,
            type: "retweet",
            targetId: tweetId
        }).catch((err) => {
            console.error("[Notification Undo] retweet error:", err.message);
        });
    }

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
