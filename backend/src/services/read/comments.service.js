const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Get all comments for a post
 */
async function getComments({ postId }) {
    const post = await postsRepository.findById(postId);
    if (!post) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const comments = post.comments || [];
    const enriched = await postsRepository.attachCommentAuthors(comments);

    return {
        items: enriched
    };
}

module.exports = { getComments };
