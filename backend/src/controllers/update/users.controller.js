const User = require('../../models/user.model');
const { findProfileOrCreate } = require('../../services/userProfile.service');

/**
 * Controller: Update current authenticated user profile
 * Auth: Required (verifyJwt middleware ensures req.user)
 */
async function updateMe(req, res) {
    const userId = req.user.id;
    const userHandle = req.user.handle;
    const updates = { updatedAt: new Date() };

    const { name, bio, avatarUrl, country, age, phone } = req.body;
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (country !== undefined) updates.country = country;
    if (age !== undefined) updates.age = age;
    if (phone !== undefined) updates.phone = phone;

    try {
        let updatedUser = await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { handle: userHandle }] },
            { $set: updates },
            { new: true, runValidators: true, lean: true }
        );

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
            updatedUser = created && typeof created.toObject === 'function' ? created.toObject() : created;
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
