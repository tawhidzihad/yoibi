const mongoose = require('mongoose');
const { jwtVerify, createRemoteJWKSet } = require('jose');
const { env } = require('../config/env');
const User = require('../models/user.model');

let remoteJWKS = null;

// In-memory cache for live user moderation state (TTL 30s)
const userModerationCache = new Map();

/**
 * Invalidates cached moderation status for a user or all users.
 *
 * @param {string} [userId]
 */
function invalidateUserModerationCache(userId) {
    if (userId) {
        userModerationCache.delete(userId);
    } else {
        userModerationCache.clear();
    }
}

/**
 * Checks live user moderation state from database with cache.
 *
 * @param {string} userId
 * @returns {Promise<{ exists: boolean, isBlocked: boolean, blockedReason: string|null, role: string|null }|null>}
 */
async function getLiveUserModeration(userId) {
    if (!userId || mongoose.connection.readyState !== 1) return null;
    const now = Date.now();
    const cached = userModerationCache.get(userId);
    if (cached && cached.expiresAt > now) {
        return cached;
    }
    try {
        const userDoc = await User.findById(userId).select('isBlocked blockedReason role').lean();
        const entry = userDoc
            ? {
                exists: true,
                isBlocked: Boolean(userDoc.isBlocked),
                blockedReason: userDoc.blockedReason || null,
                role: userDoc.role || null,
                expiresAt: now + 30000
            }
            : {
                exists: false,
                isBlocked: false,
                blockedReason: null,
                role: null,
                expiresAt: now + 30000
            };
        userModerationCache.set(userId, entry);
        return entry;
    } catch {
        return null;
    }
}

/**
 * Lazily initializes the remote JWKS set based on Better Auth URL configuration.
 */
function getJWKS() {
    if (remoteJWKS) {
        return remoteJWKS;
    }

    const jwksUrl = env.BETTER_AUTH_JWKS_URL || `${env.BETTER_AUTH_BASE_URL}/api/auth/jwks`;
    try {
        remoteJWKS = createRemoteJWKSet(new URL(jwksUrl));
        return remoteJWKS;
    } catch (err) {
        console.error('[Auth] Failed to initialize JWKS endpoint:', err.message);
        return null;
    }
}

/**
 * Middleware: Verifies Bearer JWT token from Authorization header against Better Auth JWKS.
 * Attaches the verified user payload to req.user.
 */
async function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication token is missing or malformed.'
            }
        });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Bearer token is empty.'
            }
        });
    }

    try {
        const jwks = getJWKS();

        if (!jwks) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'AUTH_SERVICE_UNAVAILABLE',
                    message: 'Authentication verification service is not configured.'
                }
            });
        }

        const { payload } = await jwtVerify(token, jwks, {
            issuer: env.BETTER_AUTH_BASE_URL
        });

        // Blocked user account check from JWT payload
        if (payload.isBlocked === true) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCOUNT_BLOCKED',
                    message: 'Your account has been suspended by an administrator.'
                }
            });
        }

        const userId = payload.sub || payload.id;

        // Live server-side moderation and existence check (prevents stale JWT bypass)
        const liveUser = await getLiveUserModeration(userId);
        if (liveUser) {
            if (!liveUser.exists) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User account no longer exists.'
                    }
                });
            }
            if (liveUser.isBlocked) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_BLOCKED',
                        message: liveUser.blockedReason || 'Your account has been suspended by an administrator.'
                    }
                });
            }
        }

        // Attach server-verified identity only
        req.user = {
            id: userId,
            email: payload.email,
            name: payload.name || '',
            handle: payload.handle || (payload.username ? `@${payload.username.replace(/^@/, '')}` : ''),
            username: payload.username || (payload.handle ? payload.handle.replace(/^@/, '') : ''),
            role: (liveUser && liveUser.role) || payload.role || 'user',
            isEmailVerified: Boolean(payload.emailVerified || payload.isEmailVerified),
            isBlocked: Boolean(liveUser ? liveUser.isBlocked : payload.isBlocked)
        };

        return next();
    } catch (error) {
        // Safe logging without exposing token content
        const isExpired = error.code === 'ERR_JWT_EXPIRED';
        const errorCode = isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        const message = isExpired
            ? 'Authentication token has expired. Please log in again.'
            : 'Authentication token verification failed.';

        return res.status(401).json({
            success: false,
            error: {
                code: errorCode,
                message
            }
        });
    }
}

/**
 * Verifies a JWT token directly and returns the sanitized user object.
 * @param {string} token
 * @returns {Promise<any>}
 */
async function verifyJwtToken(token) {
    if (!token) {
        const err = new Error('Bearer token is empty.');
        err.code = 'UNAUTHORIZED';
        err.status = 401;
        throw err;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
    if (!cleanToken) {
        const err = new Error('Bearer token is empty.');
        err.code = 'UNAUTHORIZED';
        err.status = 401;
        throw err;
    }

    const jwks = getJWKS();
    if (!jwks) {
        const err = new Error('Authentication verification service is not configured.');
        err.code = 'AUTH_SERVICE_UNAVAILABLE';
        err.status = 500;
        throw err;
    }

    const { payload } = await jwtVerify(cleanToken, jwks, {
        issuer: env.BETTER_AUTH_BASE_URL
    });

    if (payload.isBlocked === true) {
        const err = new Error('Your account has been suspended by an administrator.');
        err.code = 'ACCOUNT_BLOCKED';
        err.status = 403;
        throw err;
    }

    const userId = payload.sub || payload.id;

    // Live server-side moderation check
    const liveUser = await getLiveUserModeration(userId);
    if (liveUser) {
        if (!liveUser.exists) {
            const err = new Error('User account no longer exists.');
            err.code = 'UNAUTHORIZED';
            err.status = 401;
            throw err;
        }
        if (liveUser.isBlocked) {
            const err = new Error(liveUser.blockedReason || 'Your account has been suspended by an administrator.');
            err.code = 'ACCOUNT_BLOCKED';
            err.status = 403;
            throw err;
        }
    }

    return {
        id: userId,
        email: payload.email,
        name: payload.name || '',
        handle: payload.handle || (payload.username ? `@${payload.username.replace(/^@/, '')}` : ''),
        username: payload.username || (payload.handle ? payload.handle.replace(/^@/, '') : ''),
        role: (liveUser && liveUser.role) || payload.role || 'user',
        isEmailVerified: Boolean(payload.emailVerified || payload.isEmailVerified),
        isBlocked: Boolean(liveUser ? liveUser.isBlocked : payload.isBlocked)
    };
}

/**
 * Optional authentication middleware:
 * If Bearer token is provided, verify and attach req.user; if missing, proceed as guest.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }
    return verifyJwt(req, res, next);
}

/**
 * Middleware: Enforces that req.user is authenticated.
 */
function requireAuth(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    }
    return next();
}

/**
 * Middleware: Enforces that req.user has administrator role.
 */
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Administrator privileges required'
            }
        });
    }
    return next();
}

module.exports = {
    verifyJwt,
    verifyJwtToken,
    optionalAuth,
    requireAuth,
    requireAdmin,
    getJWKS,
    invalidateUserModerationCache
};
