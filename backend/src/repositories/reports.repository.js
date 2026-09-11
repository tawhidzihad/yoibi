const mongoose = require('mongoose');
const Report = require('../models/report.model');

/**
 * Creates a report document.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function create(data) {
    if (mongoose.connection.readyState !== 1) {
        return data;
    }
    const report = new Report(data);
    await report.save();
    return report.toObject ? report.toObject() : report;
}

/**
 * Finds a report by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    if (mongoose.connection.readyState !== 1) return null;
    return Report.findById(id).lean();
}

/**
 * Checks if a user has already submitted a pending report for a specific target.
 *
 * @param {string} reporterId
 * @param {string} targetType
 * @param {string} targetId
 * @returns {Promise<boolean>}
 */
async function hasUserReported(reporterId, targetType, targetId) {
    if (mongoose.connection.readyState !== 1) return false;
    const existing = await Report.findOne({
        reporterId,
        targetType,
        targetId,
        status: 'pending'
    }).lean();
    return !!existing;
}

/**
 * Lists reports with filtering and pagination.
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

    return Report.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts reports matching a filter.
 *
 * @param {Object} filter
 * @returns {Promise<number>}
 */
async function count(filter = {}) {
    if (mongoose.connection.readyState !== 1) return 0;
    return Report.countDocuments(filter);
}

/**
 * Updates a report document by ID.
 *
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
async function update(id, updateData) {
    if (mongoose.connection.readyState !== 1) return null;
    updateData.updatedAt = new Date();
    return Report.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

module.exports = {
    create,
    findById,
    hasUserReported,
    list,
    count,
    update
};
