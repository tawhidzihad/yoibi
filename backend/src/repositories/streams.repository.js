const mongoose = require("mongoose");
const { Stream } = require("../models/stream.model");
const User = require("../models/user.model");

/**
 * Creates a new stream record in MongoDB.
 */
async function create(streamData) {
    if (mongoose.connection.readyState !== 1) {
        return {
            ...streamData,
            _id: streamData._id || new mongoose.Types.ObjectId().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    const stream = new Stream(streamData);
    await stream.save();
    return stream.toObject ? stream.toObject() : stream;
}

/**
 * Finds a stream by its string or ObjectId _id.
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Stream.findOne({ _id: id }).lean();
}

/**
 * Finds a stream by its unique roomName.
 */
async function findByRoomName(roomName) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Stream.findOne({ roomName }).lean();
}

/**
 * Builds MongoDB query filter from query options.
 */
function buildQueryFilter({ status, category, authorId }) {
    const filter = {};
    if (status) {
        filter.status = status;
    }
    if (category) {
        filter.category = category;
    }
    if (authorId) {
        filter.authorId = authorId;
    }
    return filter;
}

/**
 * Retrieves paginated streams matching filters.
 */
async function findPaginated({ status = "live", category = null, authorId = null, skip = 0, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const filter = buildQueryFilter({ status, category, authorId });

    return Stream.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts total streams matching filter.
 */
async function count({ status = "live", category = null, authorId = null }) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    const filter = buildQueryFilter({ status, category, authorId });
    return Stream.countDocuments(filter);
}

/**
 * Updates stream status and optional timestamps/fields.
 */
async function updateStatus(id, status, extraFields = {}) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Stream.findOneAndUpdate(
        { _id: id },
        {
            $set: {
                status,
                ...extraFields
            }
        },
        { new: true }
    ).lean();
}

/**
 * Deletes a stream by its string _id.
 */
async function deleteById(id) {
    if (mongoose.connection.readyState !== 1) {
        return true;
    }
    const res = await Stream.deleteOne({ _id: id });
    return res.deletedCount > 0;
}

/**
 * Enriches a stream document with author profile metadata.
 */
async function enrichAuthor(stream) {
    if (!stream) return null;
    if (mongoose.connection.readyState !== 1 || !User) {
        return {
            ...stream,
            id: stream.id || stream._id?.toString(),
            author: stream.author || {
                id: stream.authorId,
                name: "Yoibi Broadcaster",
                handle: "broadcaster",
                avatarUrl: null
            }
        };
    }

    try {
        const user = await User.findOne({ id: stream.authorId }).lean();
        return {
            ...stream,
            id: stream.id || stream._id?.toString(),
            author: {
                id: stream.authorId,
                name: user?.name || "Yoibi Broadcaster",
                handle: user?.handle || "broadcaster",
                avatarUrl: user?.avatarUrl || null
            }
        };
    } catch {
        return {
            ...stream,
            id: stream.id || stream._id?.toString(),
            author: {
                id: stream.authorId,
                name: "Yoibi Broadcaster",
                handle: "broadcaster",
                avatarUrl: null
            }
        };
    }
}

/**
 * Batch enriches a list of stream documents with author profiles.
 */
async function enrichAuthors(streams) {
    if (!Array.isArray(streams) || streams.length === 0) return [];
    if (mongoose.connection.readyState !== 1 || !User) {
        return streams.map((s) => ({
            ...s,
            id: s.id || s._id?.toString(),
            author: s.author || {
                id: s.authorId,
                name: "Yoibi Broadcaster",
                handle: "broadcaster",
                avatarUrl: null
            }
        }));
    }

    try {
        const authorIds = [...new Set(streams.map((s) => s.authorId).filter(Boolean))];
        const users = await User.find({ id: { $in: authorIds } }).lean();
        const userMap = new Map(users.map((u) => [u.id, u]));

        return streams.map((s) => {
            const user = userMap.get(s.authorId);
            return {
                ...s,
                id: s.id || s._id?.toString(),
                author: {
                    id: s.authorId,
                    name: user?.name || "Yoibi Broadcaster",
                    handle: user?.handle || "broadcaster",
                    avatarUrl: user?.avatarUrl || null
                }
            };
        });
    } catch {
        return streams.map((s) => ({
            ...s,
            id: s.id || s._id?.toString(),
            author: {
                id: s.authorId,
                name: "Yoibi Broadcaster",
                handle: "broadcaster",
                avatarUrl: null
            }
        }));
    }
}

module.exports = {
    create,
    findById,
    findByRoomName,
    findPaginated,
    count,
    updateStatus,
    deleteById,
    enrichAuthor,
    enrichAuthors
};
