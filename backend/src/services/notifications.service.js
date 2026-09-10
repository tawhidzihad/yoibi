const notificationsRepository = require('../repositories/notifications.repository');
const { emitNotification } = require('../sockets/notifications.socket');

class NotificationsService {
    /**
     * Creates a notification as a secondary side effect.
     * Enforces self-notification suppression (actorId === recipientId).
     * Enriches actor profile and emits realtime `notification:new` event.
     * Guaranteed not to throw — logs errors safely.
     *
     * @param {{ actorId: string, recipientId: string, type: string, targetId: string, targetType: string }} params
     * @returns {Promise<Object|null>}
     */
    async createNotification({ actorId, recipientId, type, targetId, targetType }) {
        try {
            if (!actorId || !recipientId || !type || !targetId || !targetType) {
                return null;
            }

            // Self-notification suppression: never notify user of their own actions
            if (actorId === recipientId) {
                return null;
            }

            const doc = await notificationsRepository.create({
                actorId,
                recipientId,
                type,
                targetId,
                targetType
            });

            if (!doc) {
                return null;
            }

            // Enrich actor details for realtime emission
            const enriched = await notificationsRepository.attachActors(doc);

            // Emit to recipient's personal room
            emitNotification(recipientId, enriched);

            return enriched;
        } catch (err) {
            console.error('[NotificationsService.createNotification] Failed to create notification:', err.message);
            return null;
        }
    }

    /**
     * Cleans up / deletes a notification on undo actions (unlike, unfollow, undo retweet).
     * Guaranteed not to throw.
     *
     * @param {{ actorId: string, type: string, targetId: string }} params
     * @returns {Promise<boolean>}
     */
    async deleteNotification({ actorId, type, targetId }) {
        try {
            if (!actorId || !type || !targetId) {
                return false;
            }
            return await notificationsRepository.deleteNotification({ actorId, type, targetId });
        } catch (err) {
            console.error('[NotificationsService.deleteNotification] Failed to delete notification:', err.message);
            return false;
        }
    }

    /**
     * Retrieves paginated notifications for the authenticated user.
     *
     * @param {{ recipientId: string, read?: boolean, page?: number, limit?: number }} params
     * @returns {Promise<{ items: Array, pagination: Object }>}
     */
    async getNotifications({ recipientId, read, page = 1, limit = 20 }) {
        if (!recipientId) {
            const error = new Error('Recipient ID is required');
            error.code = 'UNAUTHORIZED';
            error.status = 401;
            throw error;
        }

        const result = await notificationsRepository.findPaginated({
            recipientId,
            read,
            page,
            limit
        });

        return {
            items: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage
            }
        };
    }

    /**
     * Gets total unread notification count for the authenticated user.
     *
     * @param {string} recipientId
     * @returns {Promise<{ unreadCount: number }>}
     */
    async getUnreadCount(recipientId) {
        if (!recipientId) {
            const error = new Error('Recipient ID is required');
            error.code = 'UNAUTHORIZED';
            error.status = 401;
            throw error;
        }

        const unreadCount = await notificationsRepository.countUnread(recipientId);
        return { unreadCount };
    }

    /**
     * Marks a single notification as read.
     * Verifies existence and recipient ownership.
     *
     * @param {string} id
     * @param {string} recipientId
     * @returns {Promise<{ id: string, read: boolean }>}
     */
    async markAsRead(id, recipientId) {
        if (!id || !recipientId) {
            const error = new Error('Notification ID and recipient ID are required');
            error.code = 'VALIDATION_ERROR';
            error.status = 400;
            throw error;
        }

        const existing = await notificationsRepository.findById(id);
        if (!existing) {
            const error = new Error('Notification not found');
            error.code = 'NOT_FOUND';
            error.status = 404;
            throw error;
        }

        if (existing.recipientId !== recipientId) {
            const error = new Error('Cannot access notifications belonging to another user');
            error.code = 'FORBIDDEN';
            error.status = 403;
            throw error;
        }

        await notificationsRepository.markAsRead(id, recipientId);

        return {
            id,
            read: true
        };
    }

    /**
     * Marks all unread notifications as read for the authenticated user.
     *
     * @param {string} recipientId
     * @returns {Promise<{ updatedCount: number }>}
     */
    async markAllAsRead(recipientId) {
        if (!recipientId) {
            const error = new Error('Recipient ID is required');
            error.code = 'UNAUTHORIZED';
            error.status = 401;
            throw error;
        }

        const updatedCount = await notificationsRepository.markAllAsRead(recipientId);
        return { updatedCount };
    }
}

module.exports = new NotificationsService();
