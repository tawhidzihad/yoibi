/**
 * YOIBI profile update services (own-profile media upload authorization).
 */
const { createImageUploadIntent } = require("../../integrations/cloudinary/cloudinary");

/**
 * Generates a server-signed Cloudinary upload authorization for the
 * authenticated user's profile image (avatar or banner).
 *
 * The Cloudinary folder is server-controlled per user and per image kind;
 * CLOUDINARY_API_SECRET never leaves the server.
 *
 * @param {{ id: string }} user - Authenticated identity from the verified JWT
 * @param {'avatar'|'banner'} kind
 */
function generateProfileMediaSignature(user, kind) {
    if (!user || !user.id) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }
    return createImageUploadIntent(user.id, kind);
}

module.exports = { generateProfileMediaSignature };
