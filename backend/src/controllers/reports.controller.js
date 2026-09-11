const reportsService = require('../services/reports.service');

/**
 * Controller: Submit a new moderation report
 * Auth: User required
 */
async function handleCreateReport(req, res, next) {
    try {
        const { targetType, targetId, reason, description } = req.body;
        const report = await reportsService.submitReport({
            reporterId: req.user.id,
            targetType,
            targetId,
            reason,
            description
        });

        return res.status(201).json({
            success: true,
            data: report
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
 * Controller: List reports for admin moderation
 * Auth: Admin required
 */
async function handleListReports(req, res, next) {
    try {
        const result = await reportsService.listReports(req.query);
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
 * Controller: Update report resolution status
 * Auth: Admin required
 */
async function handleUpdateReport(req, res, next) {
    try {
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;
        const updated = await reportsService.updateReportStatus({
            reportId: id,
            adminId: req.user.id,
            status,
            resolutionNotes
        });

        return res.status(200).json({
            success: true,
            data: updated
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
    handleCreateReport,
    handleListReports,
    handleUpdateReport
};
