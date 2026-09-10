const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Create a new Post
 */
async function createPost({ user, content, media }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const postDoc = {
        _id: postId,
        authorId: user.id,
        content: content ? content.trim() : "",
        media: Array.isArray(media) ? media : [],
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const created = await postsRepository.create(postDoc);
    const enriched = await postsRepository.attachAuthors(created);

    return {
        ...enriched,
        liked: false
    };
}

module.exports = { createPost };
