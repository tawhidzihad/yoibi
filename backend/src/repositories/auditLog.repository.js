const mongoose = require('mongoose');
const AuditLog = require('../models/auditLog.model');

/**
 * Creates an audit log document.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function create(data) {
    if (mongoose.connection.readyState !== 1) {
        return data;
    }
    const log = new AuditLog(data);
    await log.save();
    return log.toObject ? log.toObject() : log;
}

/**
 * Finds an audit log by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) return null;
    return AuditLog.findById(id).lean();
}

/**
 * Finds the most recent active or incomplete Ban audit log for a target user.
 *
 * @param {string} targetUserId
 * @returns {Promise<Object|null>}
 */
async function findActiveBan(targetUserId) {
    if (mongoose.connection.readyState !== 1) return null;
    return AuditLog.findOne({
        targetUserId,
        action: 'BAN_USER',
        status: { $in: ['REQUESTED', 'IN_PROGRESS', 'PARTIAL', 'FAILED'] }
    }).sort({ startedAt: -1 }).lean();
}

/**
 * Updates an audit log document by ID.
 *
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
async function update(id, updateData) {
    if (mongoose.connection.readyState !== 1) return null;
    updateData.updatedAt = new Date();
    return AuditLog.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

/**
 * Lists audit logs with filtering and pagination.
 *
 * @param {Object} filter
 * @param {Object} options
 * @param {number} options.limit
 * @param {number} options.skip
 * @param {Object} options.sort
 * @returns {Promise<Array<Object>>}
 */
async function list(filter = {}, options = {}) {
    if (mongoose.connection.readyState !== 1) return [];
    const limit = options.limit || 50;
    const skip = options.skip || 0;
    const sort = options.sort || { createdAt: -1 };

    return AuditLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts audit logs matching a filter.
 *
 * @param {Object} filter
 * @returns {Promise<number>}
 */
async function count(filter = {}) {
    if (mongoose.connection.readyState !== 1) return 0;
    return AuditLog.countDocuments(filter);
}

module.exports = {
    create,
    findById,
    findActiveBan,
    update,
    list,
    count
};
