const { jwtVerify, createRemoteJWKSet } = require("jose");
const { env } = require("../config/env");

let remoteJWKS = null;

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
        console.error("[Auth] Failed to initialize JWKS endpoint:", err.message);
        return null;
    }
}

/**
 * Middleware: Verifies Bearer JWT token from Authorization header against Better Auth JWKS.
 * Attaches the verified user payload to req.user.
 */
async function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication token is missing or malformed."
            }
        });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Bearer token is empty."
            }
        });
    }

    try {
        const jwks = getJWKS();

        if (!jwks) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "AUTH_SERVICE_UNAVAILABLE",
                    message: "Authentication verification service is not configured."
                }
            });
        }

        const { payload } = await jwtVerify(token, jwks, {
            issuer: env.BETTER_AUTH_BASE_URL
        });

        // Blocked user account check
        if (payload.isBlocked === true) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "ACCOUNT_BLOCKED",
                    message: "Your account has been suspended by an administrator."
                }
            });
        }

        // Attach server-verified identity only
        req.user = {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.name || "",
            handle: payload.handle || (payload.username ? `@${payload.username.replace(/^@/, "")}` : ""),
            username: payload.username || (payload.handle ? payload.handle.replace(/^@/, "") : ""),
            role: payload.role || "user",
            isEmailVerified: Boolean(payload.emailVerified || payload.isEmailVerified),
            isBlocked: Boolean(payload.isBlocked)
        };

        return next();
    } catch (error) {
        // Safe logging without exposing token content
        const isExpired = error.code === "ERR_JWT_EXPIRED";
        const errorCode = isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
        const message = isExpired
            ? "Authentication token has expired. Please log in again."
            : "Authentication token verification failed.";

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
 * Optional authentication middleware:
 * If Bearer token is provided, verify and attach req.user; if missing, proceed as guest.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }
    return verifyJwt(req, res, next);
}

module.exports = {
    verifyJwt,
    optionalAuth
};
