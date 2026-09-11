const mongoose = require('mongoose');
const User = require('../models/user.model');
const Tweet = require('../models/tweet.model');
const Video = require('../models/video.model');
const Stream = require('../models/stream.model');
const MeetUp = require('../models/meetup.model');
const Report = require('../models/report.model');
const AuditLog = require('../models/auditLog.model');

/**
 * Aggregates high-level admin dashboard metrics using indexed count queries.
 *
 * @returns {Promise<Object>}
 */
async function getDashboardMetrics() {
    if (mongoose.connection.readyState !== 1) {
        return {
            currentUsers: 0,
            activeUsers: 0,
            blockedUsers: 0,
            bannedUsers: 0,
            liveStreams: 0,
            activeMeetUpRooms: 0,
            pendingReports: 0,
            totalTweets: 0,
            totalVideos: 0
        };
    }

    const [
        currentUsers,
        activeUsers,
        blockedUsers,
        bannedUsers,
        liveStreams,
        activeMeetUpRooms,
        pendingReports,
        totalTweets,
        totalVideos
    ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isBlocked: { $ne: true } }),
        User.countDocuments({ isBlocked: true }),
        AuditLog.countDocuments({ action: 'BAN_USER', status: 'COMPLETED' }),
        Stream.countDocuments({ status: 'live' }),
        MeetUp.countDocuments({ status: 'active' }),
        Report.countDocuments({ status: 'pending' }),
        Tweet.countDocuments({}),
        Video.countDocuments({})
    ]);

    return {
        currentUsers,
        activeUsers,
        blockedUsers,
        bannedUsers,
        liveStreams,
        activeMeetUpRooms,
        pendingReports,
        totalTweets,
        totalVideos
    };
}

/**
 * Lists users with filtering, searching, and pagination.
 *
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Array<Object>>}
 */
async function listUsers(filter = {}, options = {}) {
    if (mongoose.connection.readyState !== 1) return [];
    const limit = options.limit || 50;
    const skip = options.skip || 0;
    const sort = options.sort || { createdAt: -1 };

    return User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts users matching a filter.
 *
 * @param {Object} filter
 * @returns {Promise<number>}
 */
async function countUsers(filter = {}) {
    if (mongoose.connection.readyState !== 1) return 0;
    return User.countDocuments(filter);
}

/**
 * Finds user by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findUserById(id) {
    if (mongoose.connection.readyState !== 1) return null;
    return User.findById(id).lean();
}

/**
 * Updates user by ID.
 *
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
async function updateUser(id, updateData) {
    if (mongoose.connection.readyState !== 1) return null;
    updateData.updatedAt = new Date();
    return User.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

/**
 * Deletes user by ID.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteUser(id) {
    if (mongoose.connection.readyState !== 1) return false;
    const res = await User.findByIdAndDelete(id);
    return !!res;
}

/**
 * Lists content by type with filtering and pagination.
 *
 * @param {'tweets'|'videos'|'streams'|'meetups'} type
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Array<Object>>}
 */
async function listContent(type, filter = {}, options = {}) {
    if (mongoose.connection.readyState !== 1) return [];
    const limit = options.limit || 20;
    const skip = options.skip || 0;
    const sort = options.sort || { createdAt: -1 };

    switch (type) {
        case 'tweets':
            return Tweet.find(filter).sort(sort).skip(skip).limit(limit).lean();
        case 'videos':
            return Video.find(filter).sort(sort).skip(skip).limit(limit).lean();
        case 'streams':
            return Stream.find(filter).sort(sort).skip(skip).limit(limit).lean();
        case 'meetups':
            return MeetUp.find(filter).sort(sort).skip(skip).limit(limit).lean();
        default:
            return [];
    }
}

/**
 * Counts content by type.
 *
 * @param {'tweets'|'videos'|'streams'|'meetups'} type
 * @param {Object} filter
 * @returns {Promise<number>}
 */
async function countContent(type, filter = {}) {
    if (mongoose.connection.readyState !== 1) return 0;
    switch (type) {
        case 'tweets':
            return Tweet.countDocuments(filter);
        case 'videos':
            return Video.countDocuments(filter);
        case 'streams':
            return Stream.countDocuments(filter);
        case 'meetups':
            return MeetUp.countDocuments(filter);
        default:
            return 0;
    }
}

module.exports = {
    getDashboardMetrics,
    listUsers,
    countUsers,
    findUserById,
    updateUser,
    deleteUser,
    listContent,
    countContent
};
