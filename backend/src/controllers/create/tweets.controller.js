const { createTweet, generateTweetImageSignature } = require("../../services/create/tweets.service");

/**
 * Controller: Create a new tweet
 * Auth: Required (verifyJwt middleware)
 *
 * Uses the VALIDATED request body (Zod-parsed) so `media` is the structured
 * server-authorized media contract — never raw client strings.
 */
async function handleCreateTweet(req, res, next) {
    try {
        const { content, media = [], replyToId = null } = req.validatedBody || req.body;
        const result = await createTweet({
            user: req.user,
            content,
            media,
            replyToId
        });

        return res.status(201).json({
            success: true,
            data: result,
            message: "Tweet created"
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code, message: err.message }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Issue a server-signed Cloudinary upload authorization for ONE
 * tweet image of the authenticated user. No credentials reach the browser —
 * only a short-lived intent with server-controlled folder + publicId.
 * Auth: Required (verifyJwt middleware)
 */
async function handleGetTweetImageSignature(req, res, next) {
    try {
        const signatureData = await generateTweetImageSignature(req.user);
        return res.status(200).json({
            success: true,
            data: signatureData,
            message: "Tweet image upload signature generated successfully"
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                error: { code: err.code, message: err.message }
            });
        }
        return next(err);
    }
}

module.exports = { handleCreateTweet, handleGetTweetImageSignature };
