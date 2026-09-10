const User = require('../../models/user.model');

/**
 * Controller: Handles GET /api/v1/auth/me
 * Returns the authenticated user's profile and identity.
 * Authentication identity (id, email, role, isEmailVerified, isBlocked) comes from verified Better Auth JWT.
 * Mutable application profile data (name, handle, avatarUrl, bio) comes from MongoDB User collection.
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
        role = 'user',
        isEmailVerified = false,
        isBlocked = false,
        avatarUrl: jwtAvatar = '',
        createdAt: jwtCreatedAt
    } = req.user;

    let profile = null;

    try {
        if (User.db && User.db.readyState === 1) {
            profile = await User.findOne({
                $or: [
                    { _id: id },
                    { handle: jwtHandle }
                ]
            }).lean();

            if (!profile && id) {
                // Upsert initial profile record in MongoDB for new users
                const initialHandle = jwtHandle || (email ? `@${email.split('@')[0]}` : `@user_${id.substring(0, 6)}`);
                profile = await User.create({
                    _id: id,
                    name: jwtName,
                    handle: initialHandle,
                    avatarUrl: jwtAvatar,
                    bio: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                if (profile && typeof profile.toObject === 'function') {
                    profile = profile.toObject();
                }
            }
        }
    } catch (err) {
        console.warn('[getMe] MongoDB profile query warning:', err.message);
    }

    const data = {
        id,
        email,
        name: profile?.name || jwtName || '',
        handle: profile?.handle || jwtHandle || (email ? `@${email.split('@')[0]}` : ''),
        avatarUrl: profile?.avatarUrl || jwtAvatar || '',
        bio: profile?.bio || '',
        role,
        isEmailVerified,
        isBlocked,
        createdAt: profile?.createdAt || jwtCreatedAt || new Date().toISOString()
    };

    return res.status(200).json({ success: true, data, message: '' });
}

module.exports = {
    getMe
};
