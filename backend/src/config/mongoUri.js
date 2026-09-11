/**
 * MongoDB connection-string normalization.
 *
 * YOIBI exclusively uses the "yoibi_database" MongoDB database.
 *
 * MongoDB drivers infer the database name from the first path segment of the
 * connection string and, when the URI contains NO database name, silently
 * fall back to the "test" database. This module guarantees that the database
 * resolved from the connection string is always "yoibi_database" so the
 * application can never accidentally read/write a sibling/test database.
 *
 * Credentials are never inspected, logged, or modified.
 */

const DEFAULT_DATABASE_NAME = "yoibi_database";

/**
 * Ensures a MongoDB connection URI targets the canonical database.
 *
 * - Inserts "/yoibi_database" when the URI has no database path segment.
 * - Replaces a different explicit database name with "yoibi_database"
 *   (guards against accidental test/legacy database names).
 * - Returns the URI untouched when it already targets the canonical database.
 *
 * @param {string} uri Raw MONGODB_URI value.
 * @returns {{ uri: string, databaseName: string, normalized: boolean, replacedFrom: string|null }}
 */
function normalizeMongoDbUri(uri) {
    const fallback = {
        uri: uri || "",
        databaseName: DEFAULT_DATABASE_NAME,
        normalized: false,
        replacedFrom: null
    };

    if (typeof uri !== "string" || !uri.trim()) {
        return { ...fallback, uri: (uri || "").trim() };
    }

    const trimmed = uri.trim();
    // Captures: scheme://authority   /db-part(optional)   ?query(optional)
    const match = trimmed.match(/^(mongodb(?:\+srv)?:\/\/[^/]*)(\/[^?]*)?(\?.*)?$/);
    if (!match) {
        // Unrecognized shape — leave untouched; connection behavior is
        // verified at connect time.
        return { ...fallback, uri: trimmed };
    }

    const [, authority, pathPart, queryPart] = match;
    const explicitDb = pathPart ? pathPart.slice(1).split("/")[0] : "";

    if (!explicitDb) {
        return {
            uri: `${authority}/${DEFAULT_DATABASE_NAME}${queryPart || ""}`,
            databaseName: DEFAULT_DATABASE_NAME,
            normalized: true,
            replacedFrom: null
        };
    }

    if (explicitDb === DEFAULT_DATABASE_NAME) {
        return { ...fallback, uri: trimmed };
    }

    const remainder = pathPart.slice(explicitDb.length + 1) || "";
    return {
        uri: `${authority}/${DEFAULT_DATABASE_NAME}${remainder}${queryPart || ""}`,
        databaseName: DEFAULT_DATABASE_NAME,
        normalized: true,
        replacedFrom: explicitDb
    };
}

module.exports = {
    DEFAULT_DATABASE_NAME,
    normalizeMongoDbUri
};