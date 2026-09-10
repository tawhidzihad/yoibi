const { followUser } = require('../../services/create/follows.service');

/**
 * Controller: Follow a user
 * Auth: Required (req.user)
 */
async function handleFollowUser(req, res, next) {
    try {
        const followerId = req.user.id;
        const targetUserId = req.params.id;

        const result = await followUser(followerId, targetUserId);

        return res.status(200).json({
            success: true,
            data: result,
            message: 'User followed successfully'
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

module.exports = { handleFollowUser };
