const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Delete a comment from a post
 */
async function deleteComment({ postId, commentId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const post = await postsRepository.findById(postId);
    if (!post) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const comment = (post.comments || []).find((c) => (c._id ? c._id.toString() : c.id) === commentId);
    if (!comment) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Comment not found" };
    }

    const isCommentAuthor = comment.authorId === user.id;
    const isPostAuthor = post.authorId === user.id;
    const isAdmin = user.role === "admin";

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
        throw {
            statusCode: 403,
            code: "FORBIDDEN",
            message: "You are not authorized to delete this comment"
        };
    }

    await postsRepository.removeComment(postId, commentId);

    return {
        deletedId: commentId
    };
}

module.exports = { deleteComment };
