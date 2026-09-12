const followsRepository = require('../../repositories/follows.repository');
const User = require('../../models/user.model');

/**
 * Service to follow a target user.
 * Enforces self-follow rejection, existence check, and idempotent counter synchronization.
 *
 * @param {string} followerId
 * @param {string} targetUserId
 * @returns {Promise<{ followed: boolean, targetUserId: string }>}
 */
async function followUser(followerId, targetUserId) {
    if (!followerId || !targetUserId) {
        const error = new Error('Both follower ID and target user ID are required');
        error.code = 'VALIDATION_ERROR';
        error.status = 422;
        throw error;
    }

    if (followerId === targetUserId) {
        const error = new Error('Cannot follow yourself');
        error.code = 'INVALID_ACTION';
        error.status = 400;
        throw error;
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
        const error = new Error('User not found');
        error.code = 'NOT_FOUND';
        error.status = 404;
        throw error;
    }

    const { created } = await followsRepository.createFollow(followerId, targetUserId);

    if (created) {
        // Increment denormalized counters
        await Promise.all([
            User.updateOne({ _id: targetUserId }, { $inc: { followersCount: 1 } }),
            User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } })
        ]);
    }

    return {
        followed: true,
        targetUserId
    };
}

module.exports = { followUser };
