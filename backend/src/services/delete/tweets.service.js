const tweetsRepository = require("../../repositories/tweets.repository");

/**
 * Service: Delete a tweet
 * Only the tweet author or an admin may delete.
 * When a reply is deleted, the parent repliesCount is decremented.
 */
async function deleteTweet({ tweetId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await tweetsRepository.findById(tweetId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const isAuthor = existing.authorId === user.id;
    const isAdmin = user.role === "admin";

    if (!isAuthor && !isAdmin) {
        throw {
            statusCode: 403,
            code: "FORBIDDEN",
            message: "You are not authorized to delete this tweet"
        };
    }

    await tweetsRepository.deleteById(tweetId);

    // If this was a reply, decrement parent repliesCount
    if (existing.replyToId) {
        await tweetsRepository.decrementRepliesCount(existing.replyToId);
    }

    return {
        deletedId: tweetId
    };
}

module.exports = { deleteTweet };
