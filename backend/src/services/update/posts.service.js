const postsRepository = require("../../repositories/posts.repository");

/**
 * Service: Like a post
 */
async function likePost({ postId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await postsRepository.findById(postId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const updated = await postsRepository.addLike(postId, user.id);

    return {
        liked: true,
        likesCount: updated ? updated.likesCount : 0
    };
}

/**
 * Service: Unlike a post
 */
async function unlikePost({ postId, user }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    const existing = await postsRepository.findById(postId);
    if (!existing) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Post not found" };
    }

    const updated = await postsRepository.removeLike(postId, user.id);

    return {
        liked: false,
        likesCount: updated ? updated.likesCount : 0
    };
}

module.exports = {
    likePost,
    unlikePost
};
