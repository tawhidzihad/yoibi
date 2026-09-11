const crypto = require('crypto');
const reportsRepository = require('../repositories/reports.repository');
const auditLogRepository = require('../repositories/auditLog.repository');

/**
 * Creates a new moderation report.
 *
 * @param {Object} params
 * @param {string} params.reporterId
 * @param {'tweet'|'video'|'stream'|'meetup'|'user'} params.targetType
 * @param {string} params.targetId
 * @param {string} params.reason
 * @param {string} [params.description]
 * @returns {Promise<Object>}
 */
async function submitReport({ reporterId, targetType, targetId, reason, description = '' }) {
    if (!reporterId) {
        const error = new Error('Authentication required to submit report.');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
    }

    // Check for duplicate pending report by same user
    const hasReported = await reportsRepository.hasUserReported(reporterId, targetType, targetId);
    if (hasReported) {
        const error = new Error('You already have a pending report for this item.');
        error.statusCode = 409;
        error.code = 'DUPLICATE_REPORT';
        throw error;
    }

    const reportId = `rep_${crypto.randomUUID()}`;
    const reportData = {
        _id: reportId,
        reporterId,
        targetType,
        targetId,
        reason,
        description: description || '',
        status: 'pending',
        resolutionNotes: null,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const created = await reportsRepository.create(reportData);
    return created;
}

/**
 * Lists reports for admin moderation with filtering and pagination.
 *
 * @param {Object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=50]
 * @param {string} [query.status]
 * @param {string} [query.targetType]
 * @returns {Promise<Object>}
 */
async function listReports({ page = 1, limit = 50, status, targetType }) {
    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
        reportsRepository.list(filter, { limit, skip, sort: { createdAt: -1 } }),
        reportsRepository.count(filter)
    ]);

    return {
        reports,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
}

/**
 * Updates a report status (resolved or dismissed) and logs an audit record.
 *
 * @param {Object} params
 * @param {string} params.reportId
 * @param {string} params.adminId
 * @param {'resolved'|'dismissed'} params.status
 * @param {string} [params.resolutionNotes]
 * @returns {Promise<Object>}
 */
async function updateReportStatus({ reportId, adminId, status, resolutionNotes = '' }) {
    if (!adminId) {
        const error = new Error('Administrator authentication required.');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
    }

    const existing = await reportsRepository.findById(reportId);
    if (!existing) {
        const error = new Error('Report not found.');
        error.statusCode = 404;
        error.code = 'REPORT_NOT_FOUND';
        throw error;
    }

    const updateData = {
        status,
        resolutionNotes: resolutionNotes || '',
        resolvedBy: adminId,
        resolvedAt: new Date()
    };

    const updated = await reportsRepository.update(reportId, updateData);

    // Create durable audit log entry
    await auditLogRepository.create({
        _id: `aud_${crypto.randomUUID()}`,
        adminId,
        action: status === 'resolved' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
        targetUserId: null,
        targetResourceId: reportId,
        reason: resolutionNotes || `Report ${status}`,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
    });

    return updated;
}

module.exports = {
    submitReport,
    listReports,
    updateReportStatus
};
