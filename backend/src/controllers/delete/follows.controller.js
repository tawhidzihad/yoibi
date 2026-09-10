const { unfollowUser } = require('../../services/delete/follows.service');

/**
 * Controller: Unfollow a user
 * Auth: Required (req.user)
 */
async function handleUnfollowUser(req, res, next) {
    try {
        const followerId = req.user.id;
        const targetUserId = req.params.id;

        const result = await unfollowUser(followerId, targetUserId);

        return res.status(200).json({
            success: true,
            data: result,
            message: 'User unfollowed successfully'
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

module.exports = { handleUnfollowUser };
