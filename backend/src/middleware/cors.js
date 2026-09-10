const cors = require("cors");
const { env } = require("../config/env");

/**
 * Configures CORS with trusted origin validation.
 */
function createCorsMiddleware() {
    const allowedOrigins = [
        env.FRONTEND_URL,
        env.CORS_ORIGIN
    ].filter(Boolean);

    return cors({
        origin: function(origin, callback) {
            // Allow requests with no origin (such as server-to-server or mobile tools)
            if (!origin) {
                return callback(null, true);
            }

            // In development, allow localhost variations
            if (env.NODE_ENV === "development") {
                if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                    return callback(null, true);
                }
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
    });
}

module.exports = {
    createCorsMiddleware
};
