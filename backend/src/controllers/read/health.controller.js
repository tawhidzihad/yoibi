const { getDatabaseStatus } = require("../../config/db");

/**
 * Controller: Handles GET /api/v1/health
 */
function getHealth(_req, res) {
    const dbStatus = getDatabaseStatus();

    res.status(200).json({
        success: true,
        data: {
            status: "healthy",
            timestamp: new Date().toISOString(),
            database: dbStatus,
            version: "1.0.0"
        },
        message: "Backend service healthy"
    });
}

module.exports = {
    getHealth
};
