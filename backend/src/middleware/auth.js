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
async function getLiveUserModeration(userId, payload = null) {
    if (!userId || mongoose.connection.readyState !== 1) return null;
    const now = Date.now();
    const cached = userModerationCache.get(userId);
    if (cached && cached.expiresAt > now) {
        return cached;
    }
    try {
        let userDoc = await User.findById(userId).select('handle isBlocked blockedReason role').lean();
        if (!userDoc && payload) {
            const rawHandle = payload.handle || payload.username || (payload.email ? `@${payload.email.split('@')[0]}` : `@user_${userId.substring(0, 6)}`);
            const cleanHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
            try {
                userDoc = await User.create({
                    _id: userId,
                    handle: cleanHandle,
                    name: payload.name || '',
                    avatarUrl: payload.avatarUrl || payload.image || '',
                    bio: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                if (userDoc && typeof userDoc.toObject === 'function') {
                    userDoc = userDoc.toObject();
                }
            } catch (createErr) {
                if (createErr.code === 11000) {
                    try {
                        userDoc = await User.create({
                            _id: userId,
                            handle: `${cleanHandle}_${Date.now().toString(36)}`,
                            name: payload.name || '',
                            avatarUrl: payload.avatarUrl || payload.image || '',
                            bio: '',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                        if (userDoc && typeof userDoc.toObject === 'function') {
                            userDoc = userDoc.toObject();
                        }
                    } catch {
                        userDoc = await User.findById(userId).select('handle isBlocked blockedReason role').lean();
                    }
                }
            }
        }
        const entry = userDoc
            ? {
                exists: true,
                isBlocked: Boolean(userDoc.isBlocked),
                blockedReason: userDoc.blockedReason || null,
                role: userDoc.role || null,
                handle: userDoc.handle || null,
                expiresAt: now + 30000
            }
            : {
                exists: false,
                isBlocked: false,
                blockedReason: null,
                role: null,
                handle: null,
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

        // Verify token signature against JWKS and validate issuer + audience.
        // Better Auth v1.7.4 jwt() plugin issues tokens with sub, iat, exp, and
        // aud claims; `iss` and the default `aud` both equal the Better Auth
        // baseURL (verified in dist/plugins/jwt/sign.mjs: setIssuer/setAudience).
        // Both are validated strictly against the configured environment.
        const { payload } = await jwtVerify(token, jwks, {
            issuer: env.BETTER_AUTH_BASE_URL,
            audience: env.BETTER_AUTH_BASE_URL
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
        const liveUser = await getLiveUserModeration(userId, payload);
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
            handle: (liveUser && liveUser.handle) || payload.handle || (payload.username ? `@${payload.username.replace(/^@/, '')}` : (payload.email ? `@${payload.email.split('@')[0]}` : '')),
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

    try {
        // Verify token signature against JWKS and validate issuer + audience.
        // See verifyJwt: Better Auth v1.7.4 sets iss and the default aud to baseURL.
        const { payload } = await jwtVerify(cleanToken, jwks, {
            issuer: env.BETTER_AUTH_BASE_URL,
            audience: env.BETTER_AUTH_BASE_URL
        });

        if (payload.isBlocked === true) {
            const err = new Error('Your account has been suspended by an administrator.');
            err.code = 'ACCOUNT_BLOCKED';
            err.status = 403;
            throw err;
        }

        const userId = payload.sub || payload.id;

        // Live server-side moderation check
        const liveUser = await getLiveUserModeration(userId, payload);
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
            handle: (liveUser && liveUser.handle) || payload.handle || (payload.username ? `@${payload.username.replace(/^@/, '')}` : (payload.email ? `@${payload.email.split('@')[0]}` : '')),
            username: payload.username || (payload.handle ? payload.handle.replace(/^@/, '') : ''),
            role: (liveUser && liveUser.role) || payload.role || 'user',
            isEmailVerified: Boolean(payload.emailVerified || payload.isEmailVerified),
            isBlocked: Boolean(liveUser ? liveUser.isBlocked : payload.isBlocked)
        };
    } catch (error) {
        // Keep the explicit error shape above as-is; normalize raw jose errors
        // into the same { code, status } contract used by the Express middleware
        // so every consumer (REST + Socket.IO) gets consistent 401 semantics.
        if (error && error.status && error.code) {
            throw error;
        }
        const isExpired = error.code === 'ERR_JWT_EXPIRED';
        const err = new Error(
            isExpired
                ? 'Authentication token has expired. Please log in again.'
                : 'Authentication token verification failed.'
        );
        err.code = isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        err.status = 401;
        err.cause = error;
        throw err;
    }
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

/**
 * Resets the cached remote JWKS set so it is re-initialized from the current
 * configuration on the next verification (used after config changes/tests).
 */
function invalidateJWKS() {
    remoteJWKS = null;
}

module.exports = {
    verifyJwt,
    verifyJwtToken,
    optionalAuth,
    requireAuth,
    requireAdmin,
    getJWKS,
    invalidateJWKS,
    invalidateUserModerationCache
};
