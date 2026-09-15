const tweetsRepository = require("../../repositories/tweets.repository");

/**
 * Service: Delete a tweet or comment
 * Only the author or an admin may delete.
 *
 * Threaded-comment cascades (Facebook-style):
 *   - Deleting a COMMENT removes the comment AND all of its nested replies
 *     (the whole subtree), keeps the parent comment's direct-reply count and
 *     the root tweet's total thread-comment count consistent.
 *   - Deleting a top-level TWEET also removes its entire comment thread, so
 *     no orphaned comments are left behind.
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

    const isComment = Boolean(existing.replyToId);
    // Legacy comments (pre-threading) have no rootTweetId — their replyToId
    // is always the root tweet, so the fallback is exact.
    const rootTweetId = isComment
        ? (existing.rootTweetId || existing.replyToId)
        : null;

    // Collect every document that must be removed.
    const removedIds = [tweetId];
    if (isComment) {
        // Remove the comment's whole nested-reply subtree.
        const threadComments = await tweetsRepository.findThreadComments(rootTweetId);
        const childrenOf = new Map();
        for (const comment of threadComments) {
            const parentId = comment.replyToId;
            if (!childrenOf.has(parentId)) {
                childrenOf.set(parentId, []);
            }
            childrenOf.get(parentId).push(comment._id);
        }
        const queue = [tweetId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            for (const childId of childrenOf.get(currentId) || []) {
                removedIds.push(childId);
                queue.push(childId);
            }
        }
    } else {
        // Top-level tweet: cascade-delete its entire comment thread.
        const threadComments = await tweetsRepository.findThreadComments(tweetId);
        for (const comment of threadComments) {
            removedIds.push(comment._id);
        }
    }

    await tweetsRepository.deleteManyByIds(removedIds);

    // Keep the counters consistent:
    //   - the direct parent comment loses exactly one direct reply;
    //   - the root tweet loses every removed comment of its thread.
    if (isComment) {
        if (existing.replyToId && existing.replyToId !== rootTweetId) {
            await tweetsRepository.decrementRepliesCount(existing.replyToId, 1);
        }
        await tweetsRepository.decrementRepliesCount(rootTweetId, removedIds.length);
    }

    return {
        deletedId: tweetId,
        deletedCount: removedIds.length
    };
}

module.exports = { deleteTweet };
