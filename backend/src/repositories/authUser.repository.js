const mongoose = require('mongoose');
const BetterAuthUser = require('../models/betterAuthUser.model');

/**
 * Better Auth user repository — database access for the `user` (singular)
 * collection that Better Auth owns.
 *
 * Email verification status lives ONLY here. Business rules live in services;
 * this layer only executes queries.
 *
 * The Better Auth user ID arrives from the verified JWT `sub` claim as a hex
 * string, while the stored `_id` is a BSON ObjectId. The model types `_id` as
 * Mixed so a lookup by that hex string resolves correctly; `isDbReady()` keeps
 * every caller on the same "unconfigured database" convention the other
 * repositories use.
 */

/**
 * @returns {boolean} True when MongoDB is connected and queries are safe.
 */
function isDbReady() {
    return mongoose.connection.readyState === 1;
}

/**
 * Reads email verification status for a user.
 *
 * @param {string} userId - Better Auth user ID (hex string from the JWT `sub`).
 * @returns {Promise<{ exists: boolean, emailVerified: boolean }>}
 */
async function getEmailVerificationStatus(userId) {
    if (!userId || !isDbReady()) {
        return { exists: false, emailVerified: false };
    }
    const doc = await BetterAuthUser.findById(userId).select('emailVerified').lean();
    if (!doc) {
        return { exists: false, emailVerified: false };
    }
    return { exists: true, emailVerified: Boolean(doc.emailVerified) };
}

/**
 * Marks a user's email as verified on their Better Auth account.
 *
 * `returnDocument: 'after'` gives us a real post-write database read so callers
 * can confirm the flag actually persisted instead of assuming the write landed.
 *
 * @param {string} userId - Better Auth user ID (hex string from the JWT `sub`).
 * @returns {Promise<{ exists: boolean, emailVerified: boolean }>}
 */
async function setEmailVerified(userId) {
    if (!userId || !isDbReady()) {
        return { exists: false, emailVerified: false };
    }
    const doc = await BetterAuthUser.findOneAndUpdate(
        { _id: userId },
        { $set: { emailVerified: true } },
        { returnDocument: 'after' }
    ).select('emailVerified').lean();
    if (!doc) {
        return { exists: false, emailVerified: false };
    }
    return { exists: true, emailVerified: Boolean(doc.emailVerified) };
}

module.exports = {
    getEmailVerificationStatus,
    setEmailVerified,
    isDbReady
};
