const mongoose = require("mongoose");
const Tweet = require("../models/tweet.model");
const User = require("../models/user.model");

/**
 * Creates a new tweet in MongoDB.
 */
async function create(tweetData) {
    if (mongoose.connection.readyState !== 1) {
        return tweetData;
    }
    const tweet = new Tweet(tweetData);
    await tweet.save();
    return tweet.toObject ? tweet.toObject() : tweet;
}

/**
 * Finds a tweet by its string _id.
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Tweet.findOne({ _id: id }).lean();
}

/**
 * Retrieves paginated top-level tweets (replyToId === null).
 */
async function findPaginated({ authorIds = null, skip = 0, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const query = { replyToId: null };
    if (Array.isArray(authorIds) && authorIds.length > 0) {
        query.authorId = { $in: authorIds };
    }

    return Tweet.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts total top-level tweets matching query.
 */
async function count({ authorIds = null }) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    const query = { replyToId: null };
    if (Array.isArray(authorIds) && authorIds.length > 0) {
        query.authorId = { $in: authorIds };
    }

    return Tweet.countDocuments(query);
}

/**
 * Finds reply tweets for a given parent tweet ID.
 */
async function findReplies(tweetId) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    return Tweet.find({ replyToId: tweetId })
        .sort({ createdAt: 1 })
        .lean();
}

/**
 * Counts replies for a given parent tweet ID.
 */
async function countReplies(tweetId) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    return Tweet.countDocuments({ replyToId: tweetId });
}

/**
 * Deletes a tweet by its string _id.
 */
async function deleteById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Tweet.findOneAndDelete({ _id: id }).lean();
}

/**
 * Adds a user's like to a tweet (atomic, no duplicate).
 */
async function addLike(tweetId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $addToSet: { likes: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    const likesCount = updated.likes ? updated.likes.length : 0;
    if (updated.likesCount !== likesCount) {
        await Tweet.updateOne({ _id: tweetId }, { $set: { likesCount } });
        updated.likesCount = likesCount;
    }

    return updated;
}

/**
 * Removes a user's like from a tweet.
 */
async function removeLike(tweetId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $pull: { likes: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    const likesCount = updated.likes ? updated.likes.length : 0;
    if (updated.likesCount !== likesCount) {
        await Tweet.updateOne({ _id: tweetId }, { $set: { likesCount } });
        updated.likesCount = likesCount;
    }

    return updated;
}

/**
 * Adds a retweet by a user (atomic, no duplicate).
 */
async function addRetweet(tweetId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $addToSet: { retweets: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    const retweetCount = updated.retweets ? updated.retweets.length : 0;
    if (updated.retweetCount !== retweetCount) {
        await Tweet.updateOne({ _id: tweetId }, { $set: { retweetCount } });
        updated.retweetCount = retweetCount;
    }

    return updated;
}

/**
 * Removes a retweet by a user.
 */
async function removeRetweet(tweetId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $pull: { retweets: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    const retweetCount = updated.retweets ? updated.retweets.length : 0;
    if (updated.retweetCount !== retweetCount) {
        await Tweet.updateOne({ _id: tweetId }, { $set: { retweetCount } });
        updated.retweetCount = retweetCount;
    }

    return updated;
}

/**
 * Increments the repliesCount on a parent tweet.
 */
async function incrementRepliesCount(tweetId) {
    if (mongoose.connection.readyState !== 1) return null;
    return Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $inc: { repliesCount: 1 } },
        { new: true }
    ).lean();
}

/**
 * Decrements the repliesCount on a parent tweet (floor at 0).
 */
async function decrementRepliesCount(tweetId) {
    if (mongoose.connection.readyState !== 1) return null;
    const tweet = await Tweet.findOne({ _id: tweetId }).lean();
    if (!tweet) return null;
    const newCount = Math.max(0, (tweet.repliesCount || 0) - 1);
    return Tweet.findOneAndUpdate(
        { _id: tweetId },
        { $set: { repliesCount: newCount } },
        { new: true }
    ).lean();
}

/**
 * Enriches tweets with author data from User collection.
 */
async function attachAuthors(tweets) {
    if (!tweets || (Array.isArray(tweets) && tweets.length === 0)) return Array.isArray(tweets) ? [] : tweets;

    const isArray = Array.isArray(tweets);
    const tweetList = isArray ? tweets : [tweets];
    const authorIds = [...new Set(tweetList.map((t) => t.authorId).filter(Boolean))];

    const userMap = new Map();
    if (mongoose.connection.readyState === 1 && authorIds.length > 0) {
        const users = await User.find({ _id: { $in: authorIds } }).lean();
        users.forEach((u) => {
            userMap.set(u._id ? u._id.toString() : "", {
                id: u._id ? u._id.toString() : "",
                name: u.name || "",
                handle: u.handle || "",
                avatarUrl: u.avatarUrl || null
            });
        });
    }

    const enriched = tweetList.map((t) => {
        const author = userMap.get(t.authorId) || {
            id: t.authorId,
            name: "User",
            handle: t.authorId,
            avatarUrl: null
        };
        const id = t._id ? t._id.toString() : t.id;
        const copy = { ...t, id };
        delete copy._id;
        delete copy.__v;
        return {
            ...copy,
            author
        };
    });

    return isArray ? enriched : enriched[0];
}

module.exports = {
    create,
    findById,
    findPaginated,
    count,
    findReplies,
    countReplies,
    deleteById,
    addLike,
    removeLike,
    addRetweet,
    removeRetweet,
    incrementRepliesCount,
    decrementRepliesCount,
    attachAuthors
};
