/**
 * Guard middleware: Requires authenticated user identity attached to req.user.
 */
function requireAuth(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication is required to access this resource."
            }
        });
    }
    return next();
}

/**
 * Guard middleware: Requires administrator privileges (role === "admin").
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            error: {
                code: "FORBIDDEN",
                message: "Administrator access is required."
            }
        });
    }
    return next();
}

/**
 * Higher-order middleware: Checks that the authenticated user owns the resource or is an admin.
 * @param {Function} getResourceOwnerId - Async function (req) => Promise<string | null>
 */
function requireOwnerOrAdmin(getResourceOwnerId) {
    return async(req, res, next) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication is required."
                }
            });
        }

        if (req.user.role === "admin") {
            return next();
        }

        try {
            const ownerId = await getResourceOwnerId(req);
            if (!ownerId || String(ownerId) !== String(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: "FORBIDDEN",
                        message: "You do not have permission to modify this resource."
                    }
                });
            }
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireOwnerOrAdmin
};
