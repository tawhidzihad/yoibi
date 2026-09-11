const path = require("path");
const dotenv = require("dotenv");

// Load .env from backend directory if present
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "5000", 10),
    HOST: process.env.HOST || "0.0.0.0",
    MONGODB_URI: process.env.MONGODB_URI || "",
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3000",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "yoibi-dev-secret-key-32-chars-minimum-length",
    BETTER_AUTH_JWKS_URL: process.env.BETTER_AUTH_JWKS_URL || "",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
    LIVEKIT_URL: process.env.LIVEKIT_URL || "",
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || "",
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || ""
};

/**
 * Validates critical environment settings without exposing secret values.
 * Returns { isValid: boolean, missing: string[] }
 */
function validateEnv() {
    const missing = [];

    // In production, MONGODB_URI and LiveKit credentials are mandatory
    if (env.NODE_ENV === "production") {
        if (!env.MONGODB_URI) missing.push("MONGODB_URI");
        if (!env.LIVEKIT_URL) missing.push("LIVEKIT_URL");
        if (!env.LIVEKIT_API_KEY) missing.push("LIVEKIT_API_KEY");
        if (!env.LIVEKIT_API_SECRET) missing.push("LIVEKIT_API_SECRET");
    }

    return {
        isValid: missing.length === 0,
        missing
    };
}

module.exports = {
    env,
    validateEnv
};
