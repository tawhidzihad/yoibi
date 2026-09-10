const Follow = require('../models/follow.model');

class FollowsRepository {
    /**
     * Creates a follow relationship. Idempotent at DB level via unique compound index.
     * @param {string} followerId
     * @param {string} followingId
     * @returns {Promise<{ created: boolean, follow?: any }>}
     */
    async createFollow(followerId, followingId) {
        try {
            const follow = await Follow.create({ followerId, followingId });
            return { created: true, follow };
        } catch (err) {
            // Duplicate key error code 11000 indicates already following
            if (err.code === 11000) {
                const existing = await Follow.findOne({ followerId, followingId }).lean();
                return { created: false, follow: existing };
            }
            throw err;
        }
    }

    /**
     * Deletes a follow relationship.
     * @param {string} followerId
     * @param {string} followingId
     * @returns {Promise<{ deleted: boolean }>}
     */
    async deleteFollow(followerId, followingId) {
        const result = await Follow.deleteOne({ followerId, followingId });
        return { deleted: result.deletedCount > 0 };
    }

    /**
     * Checks if followerId is following followingId.
     * @param {string} followerId
     * @param {string} followingId
     * @returns {Promise<boolean>}
     */
    async isFollowing(followerId, followingId) {
        if (!followerId || !followingId) return false;
        const exists = await Follow.exists({ followerId, followingId });
        return Boolean(exists);
    }

    /**
     * Gets total followers count for a user (users who follow this user).
     * @param {string} userId
     * @returns {Promise<number>}
     */
    async getFollowersCount(userId) {
        return Follow.countDocuments({ followingId: userId });
    }

    /**
     * Gets total following count for a user (users this user follows).
     * @param {string} userId
     * @returns {Promise<number>}
     */
    async getFollowingCount(userId) {
        return Follow.countDocuments({ followerId: userId });
    }

    /**
     * Retrieves array of user IDs that the user is following.
     * @param {string} followerId
     * @returns {Promise<string[]>}
     */
    async getFollowingIds(followerId) {
        const follows = await Follow.find({ followerId }).select('followingId').lean();
        return follows.map((f) => f.followingId);
    }
}

module.exports = new FollowsRepository();
