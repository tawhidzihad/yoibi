const usersRepository = require("../../repositories/users.repository");

/**
 * People search service (GET /users/search).
 *
 * Matches users by display name or username (case-insensitive partial match),
 * excludes blocked accounts, and returns only the public search projection.
 */

/** Escapes regex metacharacters so the raw query can never inject/DoS a pattern. */
function escapeSearchRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the MongoDB filter for a people-search query.
 * Blocked accounts are never discoverable through search.
 *
 * @param {string} rawQuery - User-typed query (may carry a leading "@").
 * @returns {Object|null} Filter, or null when the query is effectively empty.
 */
function buildUserSearchFilter(rawQuery) {
    // Display handles carry a leading "@" but storage is bare — strip it so
    // "@janedoe" and "janedoe" find the same people.
    const trimmed = String(rawQuery || "").trim().replace(/^@+/, "");
    if (!trimmed) return null;
    const pattern = new RegExp(escapeSearchRegex(trimmed), "i");
    return {
        isBlocked: { $ne: true },
        $or: [{ handle: pattern }, { name: pattern }]
    };
}

/**
 * Maps a user document to the strict public search projection — only the
 * fields the search-result UI needs; never email, role, or moderation state.
 */
function toSearchResult(user) {
    return {
        id: user._id ? user._id.toString() : "",
        handle: user.handle || "",
        name: user.name || "",
        avatarUrl: user.avatarUrl || ""
    };
}

/**
 * Searches users by name/handle for the people-search UI.
 *
 * @param {Object} params
 * @param {string} params.q - Search query (1-100 chars, validated upstream).
 * @param {number} [params.limit=10] - Maximum results (1-20, clamped in the repository).
 * @returns {Promise<{users: Array<Object>}>}
 */
async function searchUsers({ q, limit = 10 } = {}) {
    const filter = buildUserSearchFilter(q);
    if (!filter) {
        return { users: [] };
    }
    const docs = await usersRepository.searchUsers({ filter, limit });
    return { users: docs.map(toSearchResult) };
}

module.exports = {
    escapeSearchRegex,
    buildUserSearchFilter,
    toSearchResult,
    searchUsers
};
