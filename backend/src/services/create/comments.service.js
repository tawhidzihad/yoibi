const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Create a comment on a post
 */
async function createComment({ postId, user, content }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const post = await postsRepository.findById(postId);
    if (!post) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const commentDoc = {
        _id: commentId,
        authorId: user.id,
        content: content.trim(),
        likesCount: 0,
        createdAt: new Date()
    };

    await postsRepository.addComment(postId, commentDoc);

    const [enriched] = await postsRepository.attachCommentAuthors([commentDoc]);

    return enriched;
}

module.exports = { createComment };
