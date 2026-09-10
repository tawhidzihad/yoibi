const tweetsRepository = require("../../repositories/tweets.repository");

/**
 * Service: Create a new Tweet
 * Author ID is always taken from the verified JWT user — never trusted from client.
 */
async function createTweet({ user, content, mediaUrls = [], replyToId = null }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (!content || !content.trim()) {
        throw { statusCode: 400, code: "VALIDATION_ERROR", message: "Tweet content is required" };
    }

    // If this is a reply, ensure the parent tweet exists
    if (replyToId) {
        const parent = await tweetsRepository.findById(replyToId);
        if (!parent) {
            throw { statusCode: 404, code: "NOT_FOUND", message: "Parent tweet not found" };
        }
    }

    const tweetId = `tweet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const tweetDoc = {
        _id: tweetId,
        authorId: user.id,
        content: content.trim(),
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
        likes: [],
        likesCount: 0,
        retweets: [],
        retweetCount: 0,
        repliesCount: 0,
        replyToId: replyToId || null,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const created = await tweetsRepository.create(tweetDoc);

    // If this is a reply, increment the parent's repliesCount
    if (replyToId) {
        await tweetsRepository.incrementRepliesCount(replyToId);
    }

    const enriched = await tweetsRepository.attachAuthors(created);

    return {
        ...enriched,
        liked: false,
        retweeted: false
    };
}

module.exports = { createTweet };
