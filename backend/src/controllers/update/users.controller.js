const User = require('../../models/user.model');
const { findProfileOrCreate, isDuplicateKeyError } = require('../../services/userProfile.service');
const { generateProfileMediaSignature } = require('../../services/update/users.service');

/**
 * Pure own-profile response projection (the authenticated owner only).
 * Excludes moderation internals (blockedReason/blockedAt/blockedBy) and any
 * Better Auth/authentication data. role/isBlocked are included because the
 * client layout needs them, and both reflect live server-side state.
 */
function sanitizeOwnProfile(user, fallbackId = '') {
    return {
        id: (user._id && user._id.toString()) || fallbackId,
        handle: user.handle || '',
        name: user.name || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
        bannerUrl: user.bannerUrl || '',
        bio: user.bio || '',
        country: user.country || '',
        age: user.age ?? null,
        phone: user.phone || '',
        role: user.role === 'admin' ? 'admin' : 'user',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        isBlocked: Boolean(user.isBlocked),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

/**
 * Controller: Update current authenticated user profile
 * Auth: Required (verifyJwt + requireAuth middleware ensure req.user)
 *
 * Security invariants:
 *   - Identity comes EXCLUSIVELY from the verified JWT (`req.user.id`).
 *     Client-submitted userId/betterAuthUserId/role/isBlocked/ownerId are
 *     structurally impossible here (Zod `.strict()` validator strips them).
 *   - The update query is keyed by _id ONLY — never by a possibly-stale
 *     cached handle, which could match a DIFFERENT user after a handle edit.
 *   - Handle uniqueness is enforced by the database unique index; a collision
 *     returns 422 HANDLE_TAKEN (never a raw 500 duplicate-key error).
 */
async function updateMe(req, res) {
    const userId = req.user.id;
    const updates = { updatedAt: new Date() };

    const { name, bio, avatarUrl, bannerUrl, country, age, phone, handle } = req.validatedBody || req.body;
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
    if (country !== undefined) updates.country = country;
    if (age !== undefined) updates.age = age;
    if (phone !== undefined) updates.phone = phone;
    if (handle !== undefined) updates.handle = handle;

    try {
        let updatedUser = await applyProfileUpdate(userId, updates);

        if (!updatedUser) {
            // Create the profile server-side if it does not exist yet. Role and
            // handle are always derived server-side; role can never be changed
            // through this endpoint (Zod strips it before it reaches here).
            const created = await findProfileOrCreate({
                userId,
                name: updates.name || req.user.name || '',
                email: req.user.email || '',
                avatarUrl: updates.avatarUrl || ''
            });
            if (created) {
                // Persist the remaining editable fields for freshly provisioned
                // profiles (findProfileOrCreate only sets server-derived data).
                updatedUser = await applyProfileUpdate(userId, updates);
            }
        }

        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error updating profile' }
            });
        }

        const data = sanitizeOwnProfile(updatedUser, userId);
        return res.status(200).json({ success: true, data, message: 'Profile updated successfully' });
    } catch (err) {
        if (err.statusCode && err.code) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code, message: err.message }
            });
        }
        console.error('[updateMe] error:', err);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error updating profile' }
        });
    }
}

/**
 * Applies a whitelisted profile update keyed strictly by the verified user ID.
 * Maps a database duplicate-key collision (unique handle index) to the
 * canonical 422 HANDLE_TAKEN error instead of a raw 500.
 */
async function applyProfileUpdate(userId, updates) {
    try {
        return await User.findOneAndUpdate(
            { _id: userId },
            { $set: updates },
            { new: true, runValidators: true, lean: true }
        );
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            const error = new Error('That username is already taken. Please choose another.');
            error.statusCode = 422;
            error.code = 'HANDLE_TAKEN';
            throw error;
        }
        throw err;
    }
}

/**
 * Controller: Issues a server-signed Cloudinary upload authorization for the
 * authenticated user's profile image (avatar or banner). The signature is
 * generated server-side; CLOUDINARY_API_SECRET never reaches the browser.
 */
async function handleGetProfileMediaSignature(req, res, next) {
    try {
        const { kind } = req.validatedBody || req.body;
        const signatureData = generateProfileMediaSignature(req.user, kind);
        return res.status(200).json({
            success: true,
            data: signatureData,
            message: 'Profile image upload signature generated successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { updateMe, handleGetProfileMediaSignature, sanitizeOwnProfile };
