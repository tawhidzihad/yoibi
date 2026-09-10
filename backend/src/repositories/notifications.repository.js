const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

/**
 * Creates a notification document in MongoDB.
 * Catches duplicate key errors gracefully if compound unique index triggers.
 *
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
async function create(data) {
    if (mongoose.connection.readyState !== 1) {
        return data;
    }
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification.toObject ? notification.toObject() : notification;
    } catch (err) {
        // Handle unique compound index duplicate gracefully
        if (err.code === 11000) {
            return null;
        }
        throw err;
    }
}

/**
 * Finds a notification by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) return null;
    return Notification.findById(id).lean();
}

/**
 * Retrieves paginated notifications for a recipient with optional read filter.
 *
 * @param {{ recipientId: string, read?: boolean, page?: number, limit?: number }} params
 * @returns {Promise<{ items: Array, totalItems: number, totalPages: number, page: number, limit: number, hasNextPage: boolean }>}
 */
async function findPaginated({ recipientId, read, page = 1, limit = 20 }) {
    if (mongoose.connection.readyState !== 1) {
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
            page,
            limit,
            hasNextPage: false
        };
    }

    const query = { recipientId };
    if (typeof read === 'boolean') {
        query.read = read;
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [rawItems, totalItems] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        Notification.countDocuments(query)
    ]);

    const enrichedItems = await attachActors(rawItems);
    const totalPages = Math.ceil(totalItems / parsedLimit) || (totalItems === 0 ? 0 : 1);
    const hasNextPage = parsedPage < totalPages;

    return {
        items: enrichedItems,
        totalItems,
        totalPages,
        page: parsedPage,
        limit: parsedLimit,
        hasNextPage
    };
}

/**
 * Counts unread notifications for a recipient.
 *
 * @param {string} recipientId
 * @returns {Promise<number>}
 */
async function countUnread(recipientId) {
    if (mongoose.connection.readyState !== 1) return 0;
    return Notification.countDocuments({ recipientId, read: false });
}

/**
 * Marks a single notification as read if recipient owns it.
 *
 * @param {string} id
 * @param {string} recipientId
 * @returns {Promise<Object|null>}
 */
async function markAsRead(id, recipientId) {
    if (mongoose.connection.readyState !== 1) return null;
    return Notification.findOneAndUpdate(
        { _id: id, recipientId },
        { $set: { read: true } },
        { new: true }
    ).lean();
}

/**
 * Marks all unread notifications as read for a recipient.
 *
 * @param {string} recipientId
 * @returns {Promise<number>} Number of updated notifications
 */
async function markAllAsRead(recipientId) {
    if (mongoose.connection.readyState !== 1) return 0;
    const res = await Notification.updateMany(
        { recipientId, read: false },
        { $set: { read: true } }
    );
    return res.modifiedCount || 0;
}

/**
 * Deletes a notification by actorId, type, and targetId (undo cleanup).
 *
 * @param {{ actorId: string, type: string, targetId: string }} params
 * @returns {Promise<boolean>}
 */
async function deleteNotification({ actorId, type, targetId }) {
    if (mongoose.connection.readyState !== 1) return false;
    const res = await Notification.deleteOne({ actorId, type, targetId });
    return res.deletedCount > 0;
}

/**
 * Enriches notification items with resolved public actor profiles.
 * Gracefully defaults to "Unknown user" if actor is missing/deleted.
 *
 * @param {Array<Object>|Object} notifications
 * @returns {Promise<Array<Object>|Object>}
 */
async function attachActors(notifications) {
    if (!notifications) return notifications;

    const isArray = Array.isArray(notifications);
    const list = isArray ? notifications : [notifications];
    if (list.length === 0) return [];

    const actorIds = [...new Set(list.map((n) => n.actorId).filter(Boolean))];
    const userMap = new Map();

    if (mongoose.connection.readyState === 1 && actorIds.length > 0) {
        const users = await User.find({ _id: { $in: actorIds } }).lean();
        users.forEach((u) => {
            const rawHandle = u.handle || '';
            const handle = rawHandle ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`) : null;
            userMap.set(u._id ? u._id.toString() : '', {
                id: u._id ? u._id.toString() : '',
                name: u.name || '',
                handle,
                avatarUrl: u.avatarUrl || null
            });
        });
    }

    const enriched = list.map((n) => {
        const id = n._id ? n._id.toString() : (n.id || '');
        const actor = userMap.get(n.actorId) || {
            id: n.actorId,
            name: 'Unknown user',
            handle: null,
            avatarUrl: null
        };

        return {
            id,
            type: n.type,
            actor,
            targetId: n.targetId,
            targetType: n.targetType,
            read: Boolean(n.read),
            createdAt: n.createdAt
        };
    });

    return isArray ? enriched : enriched[0];
}

module.exports = {
    create,
    findById,
    findPaginated,
    countUnread,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    attachActors
};
