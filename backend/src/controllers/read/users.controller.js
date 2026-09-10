const User = require('../../models/user.model');

/**
 * Controller: Public user profile lookup by handle
 * Auth: Optional (if token provided, req.user will be set by auth middleware)
 */
async function getPublicProfile(req, res) {
    const { handle } = req.params;
    try {
        const user = await User.findOne({ handle }).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' }
            });
        }
        const publicData = { ...user };
        const id = user._id ? user._id.toString() : undefined;
        delete publicData._id;
        delete publicData.__v;

        const data = {
            id,
            ...publicData,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            tweetsCount: 0
        };
        return res.status(200).json({ success: true, data, message: '' });
    } catch (err) {
        console.error('[getPublicProfile] error:', err);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }
        });
    }
}

module.exports = { getPublicProfile };
