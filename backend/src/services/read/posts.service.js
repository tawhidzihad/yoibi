const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: List paginated feed posts
 */
async function listPosts({ page = 1, limit = 20, _filter = "all", currentUserId = null }) {
    const skip = (page - 1) * limit;

    const [rawPosts, totalItems] = await Promise.all([
        postsRepository.findPaginated({ skip, limit }),
        postsRepository.count({})
    ]);

    const enrichedPosts = await postsRepository.attachAuthors(rawPosts);

    const items = enrichedPosts.map((post) => {
        const liked = Boolean(currentUserId && Array.isArray(post.likes) && post.likes.includes(currentUserId));
        const formatted = { ...post, liked };
        delete formatted.likes;
        delete formatted.comments; // Keep feed lightweight; details endpoint returns comments
        return formatted;
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNextPage = page < totalPages;

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
 * Service: Get single post by ID with comments thread
 */
async function getPostById({ id, currentUserId = null }) {
    const rawPost = await postsRepository.findById(id);
    if (!rawPost) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const enriched = await postsRepository.attachAuthors(rawPost);
    const enrichedComments = await postsRepository.attachCommentAuthors(rawPost.comments || []);

    const liked = Boolean(currentUserId && Array.isArray(rawPost.likes) && rawPost.likes.includes(currentUserId));
    const result = {
        ...enriched,
        comments: enrichedComments,
        liked
    };
    delete result.likes;

    return result;
}

module.exports = {
    listPosts,
    getPostById
};
