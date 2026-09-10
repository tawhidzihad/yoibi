const {
    generateUploadSignature,
    createVideo
} = require("../../services/create/videos.service");

/**
 * HTTP Handler: Generates signed Cloudinary upload parameters.
 */
async function handleGetUploadSignature(req, res, next) {
    try {
        const signatureData = await generateUploadSignature(req.user);
        return res.status(200).json({
            success: true,
            data: signatureData,
            message: "Upload signature generated successfully"
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Registers uploaded video metadata.
 */
async function handleCreateVideo(req, res, next) {
    try {
        const video = await createVideo(req.user, req.body);
        return res.status(201).json({
            success: true,
            data: video,
            message: "Video published successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleGetUploadSignature,
    handleCreateVideo
};
