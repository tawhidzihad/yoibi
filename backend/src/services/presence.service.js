/**
 * In-Memory Presence Service with multi-connection / multi-tab tracking.
 * Provides a clean interface for presence queries and updates.
 *
 * Designed behind an interface so an external distributed adapter (e.g., Redis)
 * can be plugged in when scaling horizontally across multiple Railway instances.
 */
class PresenceService {
    constructor() {
        // userId -> Set<socketId>
        this.userSockets = new Map();
        // socketId -> userId
        this.socketUsers = new Map();
    }

    /**
     * Adds an active socket connection for a user.
     * Returns true if this is the user's FIRST active connection (transitioned to online).
     */
    addConnection(userId, socketId) {
        if (!userId || !socketId) return false;

        this.socketUsers.set(socketId, userId);

        let sockets = this.userSockets.get(userId);
        const isFirst = !sockets || sockets.size === 0;

        if (!sockets) {
            sockets = new Set();
            this.userSockets.set(userId, sockets);
        }

        sockets.add(socketId);
        return isFirst;
    }

    /**
     * Removes an active socket connection for a user.
     * Returns true if this was the user's LAST connection (transitioned to offline).
     */
    removeConnection(socketId) {
        if (!socketId) return { wasLast: false, userId: null };

        const userId = this.socketUsers.get(socketId);
        if (!userId) return { wasLast: false, userId: null };

        this.socketUsers.delete(socketId);

        const sockets = this.userSockets.get(userId);
        if (!sockets) return { wasLast: false, userId };

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.userSockets.delete(userId);
            return { wasLast: true, userId };
        }

        return { wasLast: false, userId };
    }

    /**
     * Checks if a user is currently online.
     */
    isOnline(userId) {
        if (!userId) return false;
        const sockets = this.userSockets.get(userId);
        return Boolean(sockets && sockets.size > 0);
    }

    /**
     * Gets online statuses for an array of user IDs.
     * Returns an object mapping userId -> boolean.
     */
    getOnlineStatuses(userIds) {
        if (!Array.isArray(userIds)) return {};
        const result = {};
        for (const uid of userIds) {
            result[uid] = this.isOnline(uid);
        }
        return result;
    }

    /**
     * Returns all socket IDs for a given user.
     */
    getUserSockets(userId) {
        if (!userId) return [];
        const sockets = this.userSockets.get(userId);
        return sockets ? Array.from(sockets) : [];
    }

    /**
     * Clears all presence state (useful in test environments).
     */
    clear() {
        this.userSockets.clear();
        this.socketUsers.clear();
    }
}

module.exports = new PresenceService();
