const express = require("express");
const helmet = require("helmet");
const { createCorsMiddleware } = require("./middleware/cors");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const apiRouter = require("./routes");

const app = express();

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS policy
app.use(createCorsMiddleware());

// Body parsing with safe size bounds
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Lightweight request logging in development
if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
        console.log(`[HTTP] ${req.method} ${req.url}`);
        next();
    });
}

// Mount versioned API routes under /api/v1
app.use("/api/v1", apiRouter);

// Fallback for undefined routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
