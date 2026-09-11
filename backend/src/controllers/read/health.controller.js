const { getDatabaseStatus } = require("../../config/db");
const { env } = require("../../config/env");

/**
 * Controller: Handles GET /api/v1/health
 *
 * Health check behavior:
 * - If DB is connected: HTTP 200, status: "ok"
 * - If DB is configured (MONGODB_URI set) but not connected: HTTP 503, status: "degraded"
 * - If DB is unconfigured in development/test (no MONGODB_URI): HTTP 200, status: "ok"
 */
function getHealth(_req, res) {
    const dbStatus = getDatabaseStatus();
    const isDbDegraded = Boolean(env.MONGODB_URI) && dbStatus !== "connected";
    const httpStatus = isDbDegraded ? 503 : 200;
    const overallStatus = isDbDegraded ? "degraded" : "ok";

    res.status(httpStatus).json({
        success: !isDbDegraded,
        data: {
            status: overallStatus,
            database: dbStatus,
            version: "1.0.0",
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        },
        message: isDbDegraded ? "Database connection degraded" : "Backend service healthy"
    });
}

module.exports = {
    getHealth
};
