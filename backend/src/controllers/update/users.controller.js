const User = require('../../models/user.model');

/**
 * Controller: Update current authenticated user profile
 * Auth: Required (verifyJwt middleware ensures req.user)
 */
async function updateMe(req, res) {
    const userId = req.user.id;
    const userHandle = req.user.handle;
    const updates = { updatedAt: new Date() };

    const { name, bio, avatarUrl } = req.body;
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    try {
        let updatedUser = await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { handle: userHandle }] },
            { $set: updates },
            { new: true, runValidators: true, lean: true }
        );

        if (!updatedUser) {
            // Create user profile if it doesn't exist yet
            updatedUser = await User.create({
                _id: userId,
                handle: userHandle || `@user_${userId.substring(0, 6)}`,
                name: updates.name || req.user.name || '',
                avatarUrl: updates.avatarUrl || '',
                bio: updates.bio || '',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            if (updatedUser && typeof updatedUser.toObject === 'function') {
                updatedUser = updatedUser.toObject();
            }
        }

        const data = { ...updatedUser };
        delete data.__v;
        const resultData = {
            id: data._id || userId,
            ...data
        };
        delete resultData._id;

        return res.status(200).json({ success: true, data: resultData, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('[updateMe] error:', err);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error updating profile' }
        });
    }
}

module.exports = { updateMe };
