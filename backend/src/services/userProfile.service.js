const User = require("../models/user.model");
const {
    HANDLE_PREFIX,
    MAX_HANDLE_LENGTH,
    deriveHandleBaseFor
} = require("../utils/handles");

/**
 * YOIBI application-profile synchronization service.
 *
 * Guarantees:
 *   Better Auth user exists  ->  YOIBI MongoDB profile exists
 *
 * Identity mapping (single canonical identity):
 *   Better Auth user ID (JWT `sub`)  <->  users._id (String)
 *
 * The backend derives identity exclusively from the verified JWT — never from
 * a client-supplied `userId`, `role`, or `handle`. Roles always default to
 * "user" unless an admin is provisioned server-side (see docs/ENVIRONMENT.md).
 */

const DEFAULT_ROLE = "user";

/** @returns {boolean} True only when the application database is reachable. */
function isDatabaseConnected() {
    return Boolean(User.db && User.db.readyState === 1);
}

/** @returns {boolean} True for MongoDB duplicate-key errors (E11000). */
function isDuplicateKeyError(error) {
    if (!error) return false;
    return error.code === 11000
        || error.name === "DuplicateKeyError"
        || (error.name === "MongoServerError" && error.code === 11000);
}

/**
 * Creates a YOIBI profile with a deterministic, collision-safe canonical handle.
 *
 * Strategy (@base, @base2, @base3, ...): each NOT-INSERTED handle advances the
 * suffix. Duplicate-key errors (race with a concurrent signup) are retried with
 * the next suffix; a concurrent winner for the same user ID is adopted.
 *
 * @param {{ userId: string, name?: string, email?: string, avatarUrl?: string }} input
 * @returns {Promise<Object|null>} Lean profile document or null when DB is down.
 */
async function createProfileWithUniqueHandle({ userId, name = "", email = "", avatarUrl = "" }) {
    if (!userId) return null;
    if (!isDatabaseConnected()) return null;

    const base = deriveHandleBaseFor({ name, email, userId });
    const now = new Date();

    // Primary deterministic collision-safe sequence: @base, @base2, @base3, ...
    for (let attempt = 0; attempt < 60; attempt += 1) {
        const suffix = attempt === 0 ? "" : String(attempt + 1);
        const candidate = `${HANDLE_PREFIX}${base}${suffix}`.substring(0, HANDLE_PREFIX.length + MAX_HANDLE_LENGTH);
        try {
            const doc = await User.create({
                _id: userId,
                handle: candidate,
                name: typeof name === "string" ? name : "",
                avatarUrl: typeof avatarUrl === "string" ? avatarUrl : "",
                bio: "",
                role: DEFAULT_ROLE,
                createdAt: now,
                updatedAt: now
            });
            return typeof doc.toObject === "function" ? doc.toObject() : doc;
        } catch (err) {
            if (!isDuplicateKeyError(err)) {
                throw err;
            }
            // Either this candidate handle was taken concurrently or the same
            // user ID was provisioned by a racing request — adopt the winner.
            const winner = await User.findById(userId).lean().catch(() => null);
            if (winner) return winner;
        }
    }

    // Pathologically crowded base: fall back to short timestamp suffixes.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const stamp = (Date.now() + attempt).toString(36);
        const candidate = `${HANDLE_PREFIX}${base.substring(0, Math.max(1, MAX_HANDLE_LENGTH - stamp.length - 1))}_${stamp}`;
        try {
            const doc = await User.create({
                _id: userId,
                handle: candidate,
                name: typeof name === "string" ? name : "",
                avatarUrl: typeof avatarUrl === "string" ? avatarUrl : "",
                bio: "",
                role: DEFAULT_ROLE,
                createdAt: now,
                updatedAt: now
            });
            return typeof doc.toObject === "function" ? doc.toObject() : doc;
        } catch (err) {
            if (!isDuplicateKeyError(err)) {
                throw err;
            }
            const winner = await User.findById(userId).lean().catch(() => null);
            if (winner) return winner;
        }
    }

    return null;
}

/**
 * Returns the existing profile for a Better Auth user ID, creating it
 * (server-side, from verified JWT claims only) when it is missing.
 *
 * @param {{ userId: string, name?: string, email?: string, avatarUrl?: string }} input
 * @returns {Promise<Object|null>} Lean profile document (or null when DB is down).
 */
async function findProfileOrCreate({ userId, name = "", email = "", avatarUrl = "" }) {
    if (!userId) return null;
    if (!isDatabaseConnected()) return null;

    const existing = await User.findById(userId).lean();
    if (existing) return existing;

    return createProfileWithUniqueHandle({ userId, name, email, avatarUrl });
}

module.exports = {
    DEFAULT_ROLE,
    createProfileWithUniqueHandle,
    findProfileOrCreate,
    isDatabaseConnected,
    isDuplicateKeyError
};