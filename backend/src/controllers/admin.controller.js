const adminService = require('../services/admin.service');
const contentModerationService = require('../services/contentModeration.service');

/**
 * Controller: Get dashboard statistics
 * Auth: Admin required
 */
async function handleGetStats(req, res, next) {
    try {
        const stats = await adminService.getDashboardStats();
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: List users for admin table
 * Auth: Admin required
 */
async function handleListUsers(req, res, next) {
    try {
        const result = await adminService.listUsers(req.query);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Get single user moderation profile
 * Auth: Admin required
 */
async function handleGetUserDetail(req, res, next) {
    try {
        const result = await adminService.getUserDetail(req.params.id);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Block user (reversible suspension)
 * Auth: Admin required
 */
async function handleBlockUser(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const updated = await adminService.blockUser({
            targetUserId: id,
            reason,
            adminUser: req.user,
            adminToken: req.headers.authorization
        });

        return res.status(200).json({
            success: true,
            data: updated,
            message: 'User blocked successfully'
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Unblock user (restore access)
 * Auth: Admin required
 */
async function handleUnblockUser(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await adminService.unblockUser({
            targetUserId: id,
            adminUser: req.user,
            adminToken: req.headers.authorization
        });

        return res.status(200).json({
            success: true,
            data: updated,
            message: 'User unblocked successfully'
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Ban user (permanent purge)
 * Auth: Admin required
 */
async function handleBanUser(req, res, next) {
    try {
        const { id } = req.params;
        const { reason, confirmationHandle } = req.body;
        const result = await adminService.banUser({
            targetUserId: id,
            reason,
            confirmationHandle,
            adminUser: req.user,
            adminToken: req.headers.authorization
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: 'User banned and data cleaned up successfully'
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Browse content for admin moderation
 * Auth: Admin required
 */
async function handleBrowseContent(req, res, next) {
    try {
        const type = req.query.type || 'tweets';
        const result = await contentModerationService.browseContent(type, req.query);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Delete content
 * Auth: Admin required
 */
async function handleDeleteContent(req, res, next) {
    try {
        const { type, id } = req.params;
        const { reason } = req.body || {};
        const result = await contentModerationService.deleteContent(type, id, req.user, reason);
        return res.status(200).json({
            success: true,
            data: result,
            message: 'Content deleted successfully'
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: List audit logs
 * Auth: Admin required
 */
async function handleListAuditLogs(req, res, next) {
    try {
        const result = await adminService.listAuditLogs(req.query);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'BAD_REQUEST', message: err.message }
            });
        }
        return next(err);
    }
}

module.exports = {
    handleGetStats,
    handleListUsers,
    handleGetUserDetail,
    handleBlockUser,
    handleUnblockUser,
    handleBanUser,
    handleBrowseContent,
    handleDeleteContent,
    handleListAuditLogs
};
