const { env } = require("../config/env");

/**
 * 404 Handler for undefined API routes
 */
function notFoundHandler(req, res, _next) {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`
        }
    });
}

/**
 * Centralized application error handling middleware
 */
function errorHandler(err, _req, res, _next) {
    let statusCode = err.statusCode || 500;
    let errorCode = err.code || "INTERNAL_SERVER_ERROR";
    let message = err.message || "An unexpected error occurred.";
    let fields = err.fields || null;

    // Handle Mongoose Validation Errors
    if (err.name === "ValidationError" && err.errors) {
        statusCode = 422;
        errorCode = "VALIDATION_ERROR";
        message = "Input validation failed.";
        fields = {};
        for (const [key, value] of Object.entries(err.errors)) {
            fields[key] = value.message;
        }
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        errorCode = "INVALID_ID";
        message = `Invalid identifier format for ${err.path}.`;
    }

    // Handle JSON syntax error
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        errorCode = "MALFORMED_JSON";
        message = "Malformed JSON payload.";
    }

    // Log unexpected errors
    if (statusCode >= 500) {
        console.error("[ServerError]", err);
        if (env.NODE_ENV === "production") {
            message = "An unexpected server error occurred.";
        }
    }

    const errorResponse = {
        code: errorCode,
        message
    };

    if (fields) {
        errorResponse.fields = fields;
    }

    res.status(statusCode).json({
        success: false,
        error: errorResponse
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
