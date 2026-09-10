const mongoose = require("mongoose");
const Post = require("../models/post.model");
const User = require("../models/user.model");

/**
 * Creates a new post in MongoDB.
 */
async function create(postData) {
    if (mongoose.connection.readyState !== 1) {
        return postData;
    }
    const post = new Post(postData);
    await post.save();
    return post.toObject ? post.toObject() : post;
}

/**
 * Finds a post by its string _id.
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Post.findOne({ _id: id }).lean();
}

/**
 * Retrieves paginated posts.
 */
async function findPaginated({ authorIds = null, skip = 0, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const query = {};
    if (Array.isArray(authorIds) && authorIds.length > 0) {
        query.authorId = { $in: authorIds };
    }

    return Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts total posts matching query.
 */
async function count({ authorIds = null }) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    const query = {};
    if (Array.isArray(authorIds) && authorIds.length > 0) {
        query.authorId = { $in: authorIds };
    }

    return Post.countDocuments(query);
}

/**
 * Deletes a post by its string _id.
 */
async function deleteById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Post.findOneAndDelete({ _id: id }).lean();
}

/**
 * Adds a user's like to a post.
 */
async function addLike(postId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Post.findOneAndUpdate(
        { _id: postId },
        { $addToSet: { likes: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    // Sync likesCount to array length
    const likesCount = updated.likes ? updated.likes.length : 0;
    if (updated.likesCount !== likesCount) {
        await Post.updateOne({ _id: postId }, { $set: { likesCount } });
        updated.likesCount = likesCount;
    }

    return updated;
}

/**
 * Removes a user's like from a post.
 */
async function removeLike(postId, userId) {
    if (mongoose.connection.readyState !== 1) return null;
    const updated = await Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { likes: userId } },
        { new: true }
    ).lean();

    if (!updated) return null;

    const likesCount = updated.likes ? updated.likes.length : 0;
    if (updated.likesCount !== likesCount) {
        await Post.updateOne({ _id: postId }, { $set: { likesCount } });
        updated.likesCount = likesCount;
    }

    return updated;
}

/**
 * Appends a comment to a post and increments commentsCount.
 */
async function addComment(postId, commentData) {
    if (mongoose.connection.readyState !== 1) return null;
    const post = await Post.findOneAndUpdate(
        { _id: postId },
        {
            $push: { comments: commentData },
            $inc: { commentsCount: 1 }
        },
        { new: true }
    ).lean();

    return post;
}

/**
 * Removes a comment from a post and decrements commentsCount.
 */
async function removeComment(postId, commentId) {
    if (mongoose.connection.readyState !== 1) return null;
    const post = await Post.findOneAndUpdate(
        { _id: postId, "comments._id": commentId },
        {
            $pull: { comments: { _id: commentId } },
            $inc: { commentsCount: -1 }
        },
        { new: true }
    ).lean();

    return post;
}

/**
 * Enriches posts with author data from User collection.
 */
async function attachAuthors(posts) {
    if (!posts || posts.length === 0) return [];

    const isArray = Array.isArray(posts);
    const postList = isArray ? posts : [posts];
    const authorIds = [...new Set(postList.map((p) => p.authorId).filter(Boolean))];

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

    const enriched = postList.map((p) => {
        const author = userMap.get(p.authorId) || {
            id: p.authorId,
            name: "User",
            handle: p.authorId,
            avatarUrl: null
        };
        const id = p._id ? p._id.toString() : p.id;
        const copy = { ...p, id };
        delete copy._id;
        delete copy.__v;
        return {
            ...copy,
            author
        };
    });

    return isArray ? enriched : enriched[0];
}

/**
 * Enriches comments within a post with author data.
 */
async function attachCommentAuthors(comments) {
    if (!comments || comments.length === 0) return [];

    const authorIds = [...new Set(comments.map((c) => c.authorId).filter(Boolean))];
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

    return comments.map((c) => {
        const author = userMap.get(c.authorId) || {
            id: c.authorId,
            name: "User",
            handle: c.authorId,
            avatarUrl: null
        };
        const id = c._id ? c._id.toString() : c.id;
        const copy = { ...c, id };
        delete copy._id;
        return {
            ...copy,
            author
        };
    });
}

module.exports = {
    create,
    findById,
    findPaginated,
    count,
    deleteById,
    addLike,
    removeLike,
    addComment,
    removeComment,
    attachAuthors,
    attachCommentAuthors
};
