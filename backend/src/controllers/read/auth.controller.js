const { findProfileOrCreate } = require('../../services/userProfile.service');
const { HANDLE_PREFIX, deriveHandleBaseFor } = require('../../utils/handles');

/**
 * Controller: Handles GET /api/v1/auth/me
 * Returns the authenticated user's profile and identity.
 * Authentication identity (id, email, role, isBlocked) is derived from the
 * verified Better Auth JWT (server-side); mutable application profile data
 * (name, handle, avatarUrl, bio) comes from the MongoDB User collection.
 * If no profile exists yet, one is created server-side from verified JWT
 * claims (Better Auth user exists -> YOIBI profile exists).
 */
async function getMe(req, res) {
    if (!req.user) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'User context not available' }
        });
    }

    const {
        id,
        email,
        name: jwtName = '',
        handle: jwtHandle = '',
        role: jwtRole,
        isBlocked = false,
        avatarUrl: jwtAvatar = '',
        createdAt: jwtCreatedAt
    } = req.user;

    let profile = null;

    try {
        if (id) {
            const profileDoc = await findProfileOrCreate({
                userId: id,
                name: jwtName,
                email: email || '',
                avatarUrl: jwtAvatar
            });
            if (profileDoc) {
                profile = profileDoc && typeof profileDoc.toObject === 'function' ? profileDoc.toObject() : profileDoc;
            }
        }
    } catch (err) {
        console.warn('[getMe] MongoDB profile query warning:', err.message);
    }

    const fallbackHandle = `${HANDLE_PREFIX}${deriveHandleBaseFor({
        name: jwtName,
        email,
        userId: id
    })}`;

    const data = {
        id,
        email,
        name: profile?.name || jwtName || '',
        handle: profile?.handle || jwtHandle || fallbackHandle,
        avatarUrl: profile?.avatarUrl || jwtAvatar || '',
        bio: profile?.bio || '',
        role: normalizeMeRole((profile?.role || jwtRole || 'user')),
        isBlocked: profile ? Boolean(profile.isBlocked) : Boolean(isBlocked),
        createdAt: profile?.createdAt || jwtCreatedAt || new Date().toISOString(),
        updatedAt: profile?.updatedAt || new Date().toISOString()
    };

    return res.status(200).json({ success: true, data, message: '' });
}

/**
 * Restricts the /auth/me role to the only two YOIBI application roles.
 *
 * @param {string} [value]
 * @returns {'user'|'admin'}
 */
function normalizeMeRole(value) {
    return value === 'admin' ? 'admin' : 'user';
}

module.exports = {
    getMe
};
