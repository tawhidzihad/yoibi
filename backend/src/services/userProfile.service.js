const User = require("../models/user.model");
const {
    MAX_HANDLE_LENGTH,
    deriveHandleBaseFor,
    normalizeHandleParam
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
 * Normalizes an optional application-profile field to the canonical empty
 * representation (""). Google/OAuth-derived values that are unavailable are
 * never fabricated — they stay empty and the user completes them later.
 *
 * @param {unknown} value
 * @returns {string}
 */
function toEmptyString(value) {
    return typeof value === "string" ? value : "";
}

/**
 * Creates a YOIBI profile with a deterministic, collision-safe canonical handle.
 *
 * CANONICAL STORAGE: the stored handle NEVER carries the "@" prefix
 * ("garrisonhester", not "@garrisonhester"). The "@" is display-only. Every
 * reader (profile lookup, tweets authorHandle filter, frontend URLs) queries
 * the bare normalized form, so storing the prefix breaks all lookups.
 *
 * Strategy (base, base2, base3, ...): each NOT-INSERTED handle advances the
 * suffix. Duplicate-key errors (race with a concurrent signup) are retried with
 * the next suffix; a concurrent winner for the same user ID is adopted.
 *
 * Application fields (email/country/age/phone/bio) come exclusively from
 * verified server contexts: the verified Better Auth JWT `email` claim
 * (email/password or Google identity) and the authenticated PATCH /users/me
 * flow. The client can never set role, block state, or identity.
 *
 * @param {{ userId: string, name?: string, email?: string, avatarUrl?: string, country?: string, age?: number|null, phone?: string, bio?: string }} input
 * @returns {Promise<Object|null>} Lean profile document or null when DB is down.
 */
async function createProfileWithUniqueHandle({ userId, name = "", email = "", avatarUrl = "", country = "", age = null, phone = "", bio = "" }) {
    if (!userId) return null;
    if (!isDatabaseConnected()) return null;

    const base = deriveHandleBaseFor({ name, email, userId });
    const now = new Date();

    // CANONICAL STORAGE RULE: handles are stored WITHOUT the "@" prefix
    // (normalizeHandleParam strips it). The "@" lives only in the UI
    // (`@${handle}`) and in URL display — never in the database.

    // Defensive normalization: every candidate is re-normalized through
    // normalizeHandleParam so a bare canonical handle is ALWAYS stored
    // (no "@"), even if a caller passes a prefixed value. Any legacy "@..."
    // rows are repaired by the one-time normalizeLegacyHandles() migration,
    // not trusted here.
    const toCanonicalCandidate = (value) => normalizeHandleParam(value);

    const profileFields = {
        name: typeof name === "string" ? name : "",
        email: typeof email === "string" ? email : "",
        avatarUrl: toEmptyString(avatarUrl),
        country: validateCountry(country),
        age: normalizeAge(age),
        phone: typeof phone === "string" ? phone : "",
        bio: typeof bio === "string" ? bio : ""
    };

    for (let suffix = 0; suffix < 25; suffix += 1) {
        const rawCandidate = suffix === 0 ? `${base}` : `${base}${suffix + 1}`;
        const candidate = toCanonicalCandidate(rawCandidate).substring(0, MAX_HANDLE_LENGTH);
        if (!candidate) break;
        try {
            const doc = await User.create({
                _id: userId,
                handle: candidate,
                ...profileFields,
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

    // NOTE: the primary sequence above is authoritative. What follows is the
    // pathological-crowding fallback (short timestamp suffixes, bare form).
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const stamp = (Date.now() + attempt).toString(36);
        const candidate = toCanonicalCandidate(`${base.substring(0, Math.max(1, MAX_HANDLE_LENGTH - stamp.length - 1))}_${stamp}`);
        try {
            const doc = await User.create({
                _id: userId,
                handle: candidate,
                ...profileFields,
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
 * Restricts country to the canonical ISO 3166-1 alpha-2 representation.
 *
 * @param {unknown} value
 * @returns {string}
 */
function validateCountry(value) {
    return typeof value === "string" && /^[A-Z]{2}$/.test(value) ? value : "";
}

/**
 * Restricts age to the validated onboarding range (>= 16 per YOIBI policy),
 * or null when unavailable (Google users complete it later).
 *
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeAge(value) {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && Number.isInteger(parsed) && parsed >= 16 && parsed <= 120 ? parsed : null;
}

/**
 * Returns the existing profile for a Better Auth user ID, creating it
 * (server-side, from verified JWT claims only) when it is missing.
 *
 * @param {{ userId: string, name?: string, email?: string, avatarUrl?: string, country?: string, age?: number|null, phone?: string, bio?: string }} input
 * @returns {Promise<Object|null>} Lean profile document (or null when DB is down).
 */
async function findProfileOrCreate({ userId, name = "", email = "", avatarUrl = "", country = "", age = null, phone = "", bio = "" }) {
    if (!userId) return null;
    if (!isDatabaseConnected()) return null;

    const existing = await User.findById(userId).lean();
    if (existing) return existing;

    return createProfileWithUniqueHandle({ userId, name, email, avatarUrl, country, age, phone, bio });
}

module.exports = {
    DEFAULT_ROLE,
    createProfileWithUniqueHandle,
    findProfileOrCreate,
    isDatabaseConnected,
    isDuplicateKeyError
};