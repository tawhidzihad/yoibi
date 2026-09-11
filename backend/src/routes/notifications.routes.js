const { Router } = require('express');
const {
    handleListNotifications,
    handleGetUnreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead
} = require('../controllers/notifications.controller');
const { verifyJwt } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
    listNotificationsQuerySchema,
    notificationIdParamSchema
} = require('../validators/notifications.validator');
const { writeLimiter } = require('../middleware/rate-limiter');

const router = Router();

router.get(
    '/notifications',
    verifyJwt,
    requireAuth,
    validate(listNotificationsQuerySchema, 'query'),
    handleListNotifications
);

router.get(
    '/notifications/unread-count',
    verifyJwt,
    requireAuth,
    handleGetUnreadCount
);

router.patch(
    '/notifications/read-all',
    writeLimiter,
    verifyJwt,
    requireAuth,
    handleMarkAllAsRead
);

router.patch(
    '/notifications/:id/read',
    writeLimiter,
    verifyJwt,
    requireAuth,
    validate(notificationIdParamSchema, 'params'),
    handleMarkAsRead
);

module.exports = router;
