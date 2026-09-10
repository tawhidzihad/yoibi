const mongoose = require("mongoose");
const { Meetup } = require("../models/meetup.model");
const User = require("../models/user.model");

/**
 * Creates a new Meet-Up room document in MongoDB.
 */
async function create(meetupData) {
    if (mongoose.connection.readyState !== 1) {
        return {
            ...meetupData,
            _id: meetupData._id || new mongoose.Types.ObjectId().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    const meetup = new Meetup(meetupData);
    await meetup.save();
    return meetup.toObject ? meetup.toObject() : meetup;
}

/**
 * Finds a Meet-Up room by its ID string or ObjectId.
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Meetup.findOne({ _id: id }).lean();
}

/**
 * Finds a Meet-Up room by its unique roomName.
 */
async function findByRoomName(roomName) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Meetup.findOne({ roomName }).lean();
}

/**
 * Builds query filter for Meet-Up rooms.
 */
function buildQueryFilter({ status, ownerId }) {
    const filter = {};
    if (status && status !== "all") {
        filter.status = status;
    }
    if (ownerId) {
        filter.ownerId = ownerId;
    }
    return filter;
}

/**
 * Retrieves paginated Meet-Up rooms matching filters.
 */
async function findPaginated({ status = "active", ownerId = null, skip = 0, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const filter = buildQueryFilter({ status, ownerId });

    return Meetup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts total Meet-Up rooms matching filters.
 */
async function count({ status = "active", ownerId = null }) {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    const filter = buildQueryFilter({ status, ownerId });
    return Meetup.countDocuments(filter);
}

/**
 * Updates room status and optional fields.
 */
async function updateStatus(id, status, extraFields = {}) {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return Meetup.findOneAndUpdate(
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
 * Deletes a Meet-Up room by its ID string.
 */
async function deleteById(id) {
    if (mongoose.connection.readyState !== 1) {
        return true;
    }
    const res = await Meetup.deleteOne({ _id: id });
    return res.deletedCount > 0;
}

/**
 * Enriches a Meet-Up room document with owner profile metadata.
 */
async function enrichOwner(meetup) {
    if (!meetup) return null;
    if (mongoose.connection.readyState !== 1 || !User) {
        return {
            ...meetup,
            id: meetup.id || meetup._id?.toString(),
            owner: meetup.owner || {
                id: meetup.ownerId,
                name: "YOIBI Host",
                handle: "host",
                avatarUrl: null
            }
        };
    }

    try {
        const user = await User.findOne({ id: meetup.ownerId }).lean();
        return {
            ...meetup,
            id: meetup.id || meetup._id?.toString(),
            owner: {
                id: meetup.ownerId,
                name: user?.name || "YOIBI Host",
                handle: user?.handle || "host",
                avatarUrl: user?.avatarUrl || null
            }
        };
    } catch {
        return {
            ...meetup,
            id: meetup.id || meetup._id?.toString(),
            owner: {
                id: meetup.ownerId,
                name: "YOIBI Host",
                handle: "host",
                avatarUrl: null
            }
        };
    }
}

/**
 * Batch enriches a list of Meet-Up room documents with owner profiles.
 */
async function enrichOwners(meetups) {
    if (!Array.isArray(meetups) || meetups.length === 0) return [];
    if (mongoose.connection.readyState !== 1 || !User) {
        return meetups.map((m) => ({
            ...m,
            id: m.id || m._id?.toString(),
            owner: m.owner || {
                id: m.ownerId,
                name: "YOIBI Host",
                handle: "host",
                avatarUrl: null
            }
        }));
    }

    try {
        const ownerIds = [...new Set(meetups.map((m) => m.ownerId).filter(Boolean))];
        const users = await User.find({ id: { $in: ownerIds } }).lean();
        const userMap = new Map(users.map((u) => [u.id, u]));

        return meetups.map((m) => {
            const user = userMap.get(m.ownerId);
            return {
                ...m,
                id: m.id || m._id?.toString(),
                owner: {
                    id: m.ownerId,
                    name: user?.name || "YOIBI Host",
                    handle: user?.handle || "host",
                    avatarUrl: user?.avatarUrl || null
                }
            };
        });
    } catch {
        return meetups.map((m) => ({
            ...m,
            id: m.id || m._id?.toString(),
            owner: {
                id: m.ownerId,
                name: "YOIBI Host",
                handle: "host",
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
    enrichOwner,
    enrichOwners
};
