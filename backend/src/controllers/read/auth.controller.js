/**
 * Controller: Handles GET /api/v1/auth/me
 * Returns current authenticated user context from verified req.user.
 */
function getMe(req, res) {
    res.status(200).json({
        success: true,
        data: req.user,
        message: ""
    });
}

module.exports = {
    getMe
};
