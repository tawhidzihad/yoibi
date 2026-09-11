/**
 * YOIBI handle (@username) generation utilities.
 *
 * A handle is the canonical URL-safe identifier used across YOIBI (public
 * profiles, routes, mentions). Rules:
 *   - lowercase
 *   - unsupported characters removed / collapsed
 *   - spaces normalized to separators
 *   - URL-safe (alphanumeric [a-z0-9])
 *   - maximum sensible length (24 chars)
 *   - minimum valid length (3 chars)
 *   - unique — enforced by the database unique index on `users.handle`
 *
 * The client NEVER proposes the final handle. The backend derives a canonical
 * base from the Better Auth `name` (server-owned) and the database unique index
 * is the final authority for uniqueness. Collisions are resolved
 * deterministically (`@johndoe`, `@johndoe2`, `@johndoe3`, ...).
 */

const HANDLE_PREFIX = "@";
const MAX_HANDLE_LENGTH = 24;
const MIN_HANDLE_LENGTH = 3;

/**
 * Normalizes arbitrary input (display name / email local part) into a
 * URL-safe handle base WITHOUT the "@" prefix.
 *
 * @param {string} raw
 * @returns {string}
 */
function deriveHandleBase(raw) {
    if (!raw) return "";
    const lowered = String(raw).toLowerCase();
    let normalized;
    try {
        // Drop combining diacritical marks (NFKD) so "José" -> "jose".
        normalized = lowered.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    } catch {
        normalized = lowered;
    }
    return normalized
        .replace(/[^a-z0-9]+/g, "")
        .substring(0, MAX_HANDLE_LENGTH);
}

/**
 * Chooses the best base from available server-owned identity fields.
 * Guarantees at least MIN_HANDLE_LENGTH characters.
 *
 * @param {{ name?: string, email?: string, userId?: string }} identity
 * @returns {string}
 */
function deriveHandleBaseFor({ name, email, userId }) {
    const candidates = [];
    if (name) candidates.push(deriveHandleBase(name));
    if (email) candidates.push(deriveHandleBase(email.split("@")[0]));
    if (userId) candidates.push(deriveHandleBase(String(userId).replace(/[^a-z0-9]/gi, "").substring(0, 16)));
    for (const candidate of candidates) {
        if (candidate && candidate.length >= MIN_HANDLE_LENGTH) {
            return candidate.substring(0, MAX_HANDLE_LENGTH);
        }
    }
    return "user";
}

module.exports = {
    HANDLE_PREFIX,
    MAX_HANDLE_LENGTH,
    MIN_HANDLE_LENGTH,
    deriveHandleBase,
    deriveHandleBaseFor
};