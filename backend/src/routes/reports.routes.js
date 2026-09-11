const { Router } = require('express');
const { verifyJwt, requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    createReportBodySchema,
    updateReportBodySchema,
    listReportsQuerySchema,
    reportIdParamSchema
} = require('../validators/reports.validator');
const {
    handleCreateReport,
    handleListReports,
    handleUpdateReport
} = require('../controllers/reports.controller');
const { reportLimiter, adminLimiter } = require('../middleware/rate-limiter');

const router = Router();

// User Report Submission
router.post(
    '/reports',
    reportLimiter,
    verifyJwt,
    requireAuth,
    validate(createReportBodySchema, 'body'),
    handleCreateReport
);

// Admin Reports Moderation
router.get(
    '/admin/reports',
    adminLimiter,
    verifyJwt,
    requireAuth,
    requireAdmin,
    validate(listReportsQuerySchema, 'query'),
    handleListReports
);

router.patch(
    '/admin/reports/:id',
    adminLimiter,
    verifyJwt,
    requireAuth,
    requireAdmin,
    validate(reportIdParamSchema, 'params'),
    validate(updateReportBodySchema, 'body'),
    handleUpdateReport
);

module.exports = router;
