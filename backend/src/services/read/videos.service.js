const videosRepository = require("../../repositories/videos.repository");

/**
 * Lists paginated videos with category/search filters and author enrichment.
 */
async function listVideos(query = {}, actingUser = null) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filterOptions = {
        category: query.category || null,
        authorId: query.authorId || null,
        search: query.search || null,
        skip,
        limit
    };

    const rawVideos = await videosRepository.findPaginated(filterOptions);
    const totalItems = await videosRepository.count(filterOptions);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNextPage = page < totalPages;

    const enrichedVideos = await videosRepository.enrichAuthors(rawVideos);

    // Personalize interaction flags for authenticated viewers
    const items = enrichedVideos.map((video) => ({
        ...video,
        liked: Boolean(
            actingUser &&
            actingUser.id &&
            Array.isArray(video.likes) &&
            video.likes.includes(actingUser.id)
        )
    }));

    return {
        items,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage
        }
    };
}

/**
 * Retrieves single video metadata (read-only; does NOT increment viewsCount).
 */
async function getVideoById(id, actingUser = null) {
    const video = await videosRepository.findById(id);
    if (!video) {
        const error = new Error("Video not found.");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const enriched = await videosRepository.enrichAuthor(video);

    return {
        ...enriched,
        liked: Boolean(
            actingUser &&
            actingUser.id &&
            Array.isArray(enriched.likes) &&
            enriched.likes.includes(actingUser.id)
        )
    };
}

module.exports = {
    listVideos,
    getVideoById
};
