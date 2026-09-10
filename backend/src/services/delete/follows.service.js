const followsRepository = require('../../repositories/follows.repository');
const notificationsService = require('../notifications.service');
const User = require('../../models/user.model');

/**
 * Service to unfollow a target user.
 * Enforces idempotent behavior and non-negative counter synchronization.
 *
 * @param {string} followerId
 * @param {string} targetUserId
 * @returns {Promise<{ unfollowed: boolean, targetUserId: string }>}
 */
async function unfollowUser(followerId, targetUserId) {
    if (!followerId || !targetUserId) {
        const error = new Error('Both follower ID and target user ID are required');
        error.code = 'VALIDATION_ERROR';
        error.status = 422;
        throw error;
    }

    if (followerId === targetUserId) {
        const error = new Error('Cannot unfollow yourself');
        error.code = 'INVALID_ACTION';
        error.status = 400;
        throw error;
    }

    const { deleted } = await followsRepository.deleteFollow(followerId, targetUserId);

    if (deleted) {
        // Safely decrement counters without going below zero
        await Promise.all([
            User.updateOne({ _id: targetUserId, followersCount: { $gt: 0 } }, { $inc: { followersCount: -1 } }),
            User.updateOne({ _id: followerId, followingCount: { $gt: 0 } }, { $inc: { followingCount: -1 } })
        ]);

        // Secondary side effect: Clean up active notification on unfollow
        notificationsService.deleteNotification({
            actorId: followerId,
            type: 'follow',
            targetId: targetUserId
        }).catch((err) => {
            console.error('[Notification Undo] follow error:', err.message);
        });
    }

    return {
        unfollowed: true,
        targetUserId
    };
}

module.exports = { unfollowUser };
