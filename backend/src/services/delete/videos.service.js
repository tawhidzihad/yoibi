const videosRepository = require("../../repositories/videos.repository");
const { deleteCloudinaryAsset } = require("../../integrations/cloudinary/cloudinary");

/**
 * Deletes a video record and its associated Cloudinary media asset.
 * Enforces that only the video author or an admin can delete.
 */
async function deleteVideo(id, user) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to delete video.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const video = await videosRepository.findById(id);
    if (!video) {
        const error = new Error("Video not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const isAuthor = user.id === video.authorId;
    const isAdmin = user.role === "admin";

    if (!isAuthor && !isAdmin) {
        const error = new Error("You are not authorized to delete this video.");
        error.statusCode = 403;
        error.code = "FORBIDDEN";
        throw error;
    }

    // Step 1: Destroy external media asset in Cloudinary
    if (video.publicId) {
        await deleteCloudinaryAsset(video.publicId);
    }

    // Step 2: Delete metadata from MongoDB
    await videosRepository.deleteById(id);

    return {
        deletedId: id
    };
}

module.exports = {
    deleteVideo
};
