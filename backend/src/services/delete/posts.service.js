const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Delete a post
 */
async function deletePost({ postId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await postsRepository.findById(postId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const isAuthor = existing.authorId === user.id;
    const isAdmin = user.role === "admin";

    if (!isAuthor && !isAdmin) {
        throw {
            statusCode: 403,
            code: "FORBIDDEN",
            message: "You are not authorized to delete this post"
        };
    }

    await postsRepository.deleteById(postId);

    return {
        deletedId: postId
    };
}

module.exports = { deletePost };
