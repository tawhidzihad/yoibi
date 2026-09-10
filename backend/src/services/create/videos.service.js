const crypto = require("crypto");
const videosRepository = require("../../repositories/videos.repository");
const {
    createUploadIntent,
    verifyAndConsumeIntent
} = require("../../integrations/cloudinary/cloudinary");

/**
 * Generates signed upload parameters and an uploadIntentId for the authenticated user.
 */
async function generateUploadSignature(user) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to generate upload signature.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    return createUploadIntent(user.id);
}

/**
 * Creates and registers a new Video record after verifying asset provenance.
 */
async function createVideo(user, input) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to publish video.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    // Strict asset provenance check against server-issued upload intent
    const verification = verifyAndConsumeIntent({
        uploadIntentId: input.uploadIntentId,
        userId: user.id,
        publicId: input.publicId,
        videoUrl: input.videoUrl
    });

    if (!verification.valid) {
        const error = new Error(verification.error);
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    const videoId = `vid_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const publicId = verification.intent.publicId;

    const videoData = {
        _id: videoId,
        id: videoId,
        authorId: user.id,
        title: input.title.trim(),
        description: input.description ? input.description.trim() : "",
        category: input.category || null,
        videoUrl: input.videoUrl.trim(),
        thumbnailUrl: input.thumbnailUrl ? input.thumbnailUrl.trim() : "",
        publicId,
        duration: input.duration || 0,
        viewsCount: 0,
        likes: [],
        likesCount: 0,
        bytes: input.bytes || 0,
        width: input.width || null,
        height: input.height || null,
        format: input.format || "mp4",
        createdAt: new Date()
    };

    const saved = await videosRepository.create(videoData);
    const enriched = await videosRepository.enrichAuthor(saved);
    return enriched;
}

module.exports = {
    generateUploadSignature,
    createVideo
};
