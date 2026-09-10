const notificationsService = require('../services/notifications.service');

/**
 * Controller: List notifications for the authenticated user
 * Auth: Required (req.user.id)
 */
async function handleListNotifications(req, res, next) {
    try {
        const recipientId = req.user.id;
        const { page, limit, read } = req.query;

        const result = await notificationsService.getNotifications({
            recipientId,
            read,
            page,
            limit
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: ''
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Get unread notification count
 * Auth: Required (req.user.id)
 */
async function handleGetUnreadCount(req, res, next) {
    try {
        const recipientId = req.user.id;
        const result = await notificationsService.getUnreadCount(recipientId);

        return res.status(200).json({
            success: true,
            data: result,
            message: ''
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Mark single notification as read
 * Auth: Required (req.user.id)
 */
async function handleMarkAsRead(req, res, next) {
    try {
        const recipientId = req.user.id;
        const { id } = req.params;

        const result = await notificationsService.markAsRead(id, recipientId);

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Notification marked as read'
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Mark all notifications as read
 * Auth: Required (req.user.id)
 */
async function handleMarkAllAsRead(req, res, next) {
    try {
        const recipientId = req.user.id;
        const result = await notificationsService.markAllAsRead(recipientId);

        return res.status(200).json({
            success: true,
            data: result,
            message: 'All notifications marked as read'
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

module.exports = {
    handleListNotifications,
    handleGetUnreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead
};
