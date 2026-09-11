const { Router } = require('express');
const { verifyJwt, requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    blockUserBodySchema,
    banUserBodySchema,
    listUsersQuerySchema,
    listContentQuerySchema,
    listAuditLogsQuerySchema,
    adminUserIdParamSchema
} = require('../validators/admin.validator');
const {
    handleGetStats,
    handleListUsers,
    handleGetUserDetail,
    handleBlockUser,
    handleUnblockUser,
    handleBanUser,
    handleBrowseContent,
    handleDeleteContent,
    handleListAuditLogs
} = require('../controllers/admin.controller');

const { adminLimiter } = require('../middleware/rate-limiter');

const router = Router();

// Base Admin Guards: adminLimiter -> verifyJwt -> requireAuth -> requireAdmin
router.use('/admin', adminLimiter, verifyJwt, requireAuth, requireAdmin);

// Dashboard Statistics
router.get('/admin/stats', handleGetStats);

// User Management
router.get('/admin/users', validate(listUsersQuerySchema, 'query'), handleListUsers);
router.get('/admin/users/:id', validate(adminUserIdParamSchema, 'params'), handleGetUserDetail);
router.post(
    '/admin/users/:id/block',
    validate(adminUserIdParamSchema, 'params'),
    validate(blockUserBodySchema, 'body'),
    handleBlockUser
);
router.post(
    '/admin/users/:id/unblock',
    validate(adminUserIdParamSchema, 'params'),
    handleUnblockUser
);
router.post(
    '/admin/users/:id/ban',
    validate(adminUserIdParamSchema, 'params'),
    validate(banUserBodySchema, 'body'),
    handleBanUser
);

// Content Moderation
router.get('/admin/content', validate(listContentQuerySchema, 'query'), handleBrowseContent);
router.delete('/admin/content/:type/:id', handleDeleteContent);

// Audit Logs
router.get('/admin/audit-logs', validate(listAuditLogsQuerySchema, 'query'), handleListAuditLogs);

module.exports = router;
