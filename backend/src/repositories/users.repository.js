const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * Users repository — database access for the canonical `users` profile collection.
 * Business rules live in services; this layer only executes queries.
 */

/**
 * Finds users matching a pre-built search filter (people search).
 * Only the public search projection (handle/name/avatarUrl) is ever selected,
 * and the result size is clamped server-side so a caller can never scan the
 * whole collection through this path.
 *
 * @param {Object} params
 * @param {Object} params.filter - Pre-built MongoDB filter (service-owned).
 * @param {number} [params.limit=10] - Maximum results (hard-clamped to 20).
 * @param {Object} [params.sort] - Sort specification.
 * @returns {Promise<Array<Object>>} Lean user documents ([] when DB is down).
 */
async function searchUsers({ filter = {}, limit = 10, sort = { followersCount: -1, handle: 1 } } = {}) {
    if (mongoose.connection.readyState !== 1) return [];
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
    return User.find(filter)
        .sort(sort)
        .limit(safeLimit)
        .select('handle name avatarUrl')
        .lean();
}

module.exports = {
    searchUsers
};
