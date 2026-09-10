const mongoose = require("mongoose");
const { env } = require("./env");

let isConnected = false;

/**
 * Connects to MongoDB database using Mongoose.
 */
async function connectDatabase() {
    if (!env.MONGODB_URI) {
        console.warn("[Database] MONGODB_URI is not set. Running in unconfigured database mode.");
        return false;
    }

    try {
        mongoose.set("strictQuery", true);

        await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });

        isConnected = true;
        console.log("[Database] Connected successfully to MongoDB.");
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
