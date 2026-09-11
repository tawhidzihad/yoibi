const mongoose = require("mongoose");
const { env } = require("./env");
const { DEFAULT_DATABASE_NAME, normalizeMongoDbUri } = require("./mongoUri");

let isConnected = false;

/**
 * Resolves the active database name from the connected MongoDB client.
 * The driver decrements the database name from the connection string
 * (defaulting to "test" when absent), so this reflects the REAL connection
 * behavior rather than an assumed variable value.
 *
 * @returns {string|null}
 */
function getActiveDatabaseName() {
    try {
        const client = typeof mongoose.connection.getClient === "function"
            ? mongoose.connection.getClient()
            : null;
        if (client) {
            const db = typeof client.db === "function" ? client.db() : null;
            if (db) {
                const name = typeof db.getName === "function" ? db.getName() : db.name;
                if (name) return name;
            }
        }
    } catch {
        // Fall through to the alternate resolution strategy below.
    }
    try {
        if (mongoose.connection && mongoose.connection.db && mongoose.connection.db.name) {
            return mongoose.connection.db.name;
        }
    } catch {
        // No further strategy available.
    }
    return null;
}

/**
 * Connects to MongoDB database using Mongoose.
 *
 * The connection string is normalized so the active database is always
 * "yoibi_database" (see ./mongoUri). After connecting, the REAL database name
 * resolved by the driver is verified and logged (never the URI).
 */
async function connectDatabase() {
    if (!env.MONGODB_URI) {
        console.warn("[Database] MONGODB_URI is not set. Running in unconfigured database mode.");
        return false;
    }

    const normalized = normalizeMongoDbUri(env.MONGODB_URI);
    if (normalized.normalized && normalized.replacedFrom) {
        console.warn(
            `[Database] MONGODB_URI targeted database "${normalized.replacedFrom}"; normalized to "${normalized.databaseName}".`
        );
    }

    try {
        mongoose.set("strictQuery", true);

        await mongoose.connect(normalized.uri, {
            serverSelectionTimeoutMS: 5000
        });

        isConnected = true;

        const activeDbName = getActiveDatabaseName();
        if (activeDbName && activeDbName !== DEFAULT_DATABASE_NAME) {
            console.error(
                `[Database] CRITICAL: connected to database "${activeDbName}" but YOIBI requires "${DEFAULT_DATABASE_NAME}".`
            );
        } else {
            console.log(
                `[Database] Connected successfully to MongoDB database "${activeDbName || DEFAULT_DATABASE_NAME}".`
            );
        }
        return true;
    } catch (error) {
        isConnected = false;
        console.error("[Database] Connection failed:", error.message);
        if (env.NODE_ENV === "production") {
            throw error;
        }
        return false;
    }
}

/**
 * Returns the current database connection health state.
 */
function getDatabaseStatus() {
    if (!env.MONGODB_URI) {
        return "unconfigured";
    }

    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    return states[mongoose.connection.readyState] || "unknown";
}

/**
 * Gracefully disconnects database.
 */
async function disconnectDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
        console.log("[Database] Disconnected cleanly.");
    }
}

module.exports = {
    connectDatabase,
    getDatabaseStatus,
    disconnectDatabase,
    get isConnected() {
        return isConnected;
    }
};
