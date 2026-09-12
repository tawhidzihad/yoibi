const mongoose = require("mongoose");
const { Video } = require("../models/video.model");
const User = require("../models/user.model");

/**
 * Creates a new video record in MongoDB.
 */
async function create(videoData) {
    if (mongoose.connection.readyState !== 1) {
        return videoData;
    }
    const video = new Video(videoData);
    await video.save();
    return video.toObject ? video.toObject() : video;
}

/**
 * Finds a video by its string _id.
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Video.findOne({ _id: id }).lean();
}

/**
 * Builds MongoDB query filter from query options.
 */
function buildQueryFilter({ category, authorId, search }) {
    const filter = {};
    if (category) {
        filter.category = category;
    }
    if (authorId) {
        filter.authorId = authorId;
    }
    if (search && typeof search === "string" && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [{ title: regex }, { description: regex }];
    }
    return filter;
}

/**
 * Retrieves paginated videos.
 */
async function findPaginated({ category = null, authorId = null, search = null, skip = 0, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const filter = buildQueryFilter({ category, authorId, search });

    return Video.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts total videos matching filter.
 */
async function count({ category = null, authorId = null, search = null }) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    const filter = buildQueryFilter({ category, authorId, search });
    return Video.countDocuments(filter);
}

/**
 * Atomically increments viewsCount on video playback initiation.
 */
async function incrementViews(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Video.findOneAndUpdate(
        { _id: id },
        { $inc: { viewsCount: 1 } },
        { new: true }
    ).lean();
}

/**
 * Atomically adds a like to a video.
 */
async function addLike(id, userId) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Video.findOneAndUpdate(
        { _id: id, likes: { $ne: userId } },
        {
            $push: { likes: userId },
            $inc: { likesCount: 1 }
        },
        { new: true }
    ).lean();
}

/**
 * Atomically removes a like from a video.
 */
async function removeLike(id, userId) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Video.findOneAndUpdate(
        { _id: id, likes: userId },
        {
            $pull: { likes: userId },
            $inc: { likesCount: -1 }
        },
        { new: true }
    ).lean();
}

/**
 * Deletes a video by its string _id.
 */
async function deleteById(id) {
    if (mongoose.connection.readyState !== 1) {
        return true;
    }
    const res = await Video.deleteOne({ _id: id });
    return res.deletedCount > 0;
}

/**
 * Enriches a video document with author profile metadata.
 */
async function enrichAuthor(video) {
    if (!video) return null;
    if (mongoose.connection.readyState !== 1 || !User) {
        return {
            ...video,
            id: video.id || video._id,
            author: video.author || {
                id: video.authorId,
                name: "Yoibi Member",
                handle: "member",
                avatarUrl: null
            }
        };
    }

    try {
        // The canonical user identity field is `_id` (String = Better Auth
        // user ID); `authorId` on every content domain equals users._id.
        const user = await User.findOne({ _id: video.authorId }).lean();
        return {
            ...video,
            id: video.id || video._id,
            author: {
                id: video.authorId,
                name: user?.name || "Yoibi Member",
                handle: user?.handle || "member",
                avatarUrl: user?.avatarUrl || null
            }
        };
    } catch {
        return {
            ...video,
            id: video.id || video._id,
            author: {
                id: video.authorId,
                name: "Yoibi Member",
                handle: "member",
                avatarUrl: null
            }
        };
    }
}

/**
 * Batch enriches a list of video documents with author profiles.
 */
async function enrichAuthors(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return [];
    if (mongoose.connection.readyState !== 1 || !User) {
        return videos.map((v) => ({
            ...v,
            id: v.id || v._id,
            author: v.author || {
                id: v.authorId,
                name: "Yoibi Member",
                handle: "member",
                avatarUrl: null
            }
        }));
    }

    try {
        // The canonical user identity field is `_id` (String = Better Auth
        // user ID); `authorId` on every content domain equals users._id.
        const authorIds = [...new Set(videos.map((v) => v.authorId).filter(Boolean))];
        const users = await User.find({ _id: { $in: authorIds } }).lean();
        const userMap = new Map(users.map((u) => [u._id ? u._id.toString() : "", u]));

        return videos.map((v) => {
            const user = userMap.get(v.authorId);
            return {
                ...v,
                id: v.id || v._id,
                author: {
                    id: v.authorId,
                    name: user?.name || "Yoibi Member",
                    handle: user?.handle || "member",
                    avatarUrl: user?.avatarUrl || null
                }
            };
        });
    } catch {
        return videos.map((v) => ({
            ...v,
            id: v.id || v._id,
            author: {
                id: v.authorId,
                name: "Yoibi Member",
                handle: "member",
                avatarUrl: null
            }
        }));
    }
}

module.exports = {
    create,
    findById,
    findPaginated,
    count,
    incrementViews,
    addLike,
    removeLike,
    deleteById,
    enrichAuthor,
    enrichAuthors
};
