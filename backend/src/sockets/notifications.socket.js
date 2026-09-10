let _io = null;

/**
 * Attaches the shared Socket.IO instance to the notifications realtime module.
 *
 * @param {import('socket.io').Server} io
 */
function initNotificationSocket(io) {
    _io = io;
}

/**
 * Gets the current Socket.IO instance.
 *
 * @returns {import('socket.io').Server|null}
 */
function getNotificationIO() {
    return _io;
}

/**
 * Emits a realtime `notification:new` event to the recipient's personal room `user:<recipientId>`.
 * Fails safely without throwing errors.
 *
 * @param {string} recipientId
 * @param {Object} notification
 */
function emitNotification(recipientId, notification) {
    if (!_io || !recipientId || !notification) {
        return;
    }

    try {
        _io.to(`user:${recipientId}`).emit('notification:new', {
            notification
        });
    } catch (err) {
        console.error(`[Notifications Socket] Error emitting to user:${recipientId}:`, err.message);
    }
}

module.exports = {
    initNotificationSocket,
    getNotificationIO,
    emitNotification
};
