const { rateLimit } = require('express-rate-limit');

/**
 * Standard factory for rate limiters enforcing YOIBI API error envelope.
 * Automatically bypassed in test environments (`NODE_ENV === 'test'`).
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests allowed in window
 * @param {string} options.message - User-friendly rate limit message
 * @returns {Function} Express rate limit middleware
 */
function createLimiter({ windowMs, max, message }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skip: () => process.env.NODE_ENV === 'test',
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message
                }
            });
        }
    });
}

/**
 * Global application rate limiter.
 * Backstop against high-frequency volumetric flooding.
 * 300 requests / 1 minute per IP.
 */
const globalLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 300,
    message: 'Too many requests. Please slow down.'
});

/**
 * Sensitive auth endpoint rate limiter (e.g., GET /auth/me probing).
 * 15 requests / 15 minutes per IP.
 */
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many authentication attempts. Please try again later.'
});

/**
 * Write / mutation endpoint rate limiter (tweets, replies, likes, follows, etc.).
 * 60 requests / 1 minute per IP.
 */
const writeLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many write actions. Please slow down.'
});

/**
 * Expensive operations rate limiter (Cloudinary signatures, LiveKit rooms/tokens).
 * 10 requests / 15 minutes per IP.
 */
const expensiveLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many requests for live media or upload resources. Please wait a few minutes.'
});

/**
 * User reporting rate limiter to prevent spam reporting.
 * 20 requests / 1 hour per IP.
 */
const reportLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many reports submitted. Please try again later.'
});

/**
 * Admin action rate limiter.
 * 60 requests / 1 minute per IP.
 */
const adminLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many admin requests. Please slow down.'
});

module.exports = {
    globalLimiter,
    authLimiter,
    writeLimiter,
    expensiveLimiter,
    reportLimiter,
    adminLimiter
};
