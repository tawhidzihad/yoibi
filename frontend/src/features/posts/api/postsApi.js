import { apiClient } from "@/lib/api/client";

/**
 * Fetch paginated posts for the feed.
 */
export async function getPosts({ page = 1, limit = 20, filter = "all" } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (filter) params.set("filter", filter);

    const res = await apiClient.get(`/posts?${params.toString()}`);
    return res;
}

/**
 * Fetch a single post by ID with comments.
 */
export async function getPostById(id) {
    const res = await apiClient.get(`/posts/${id}`);
    return res;
}

/**
 * Create a new post.
 */
export async function createPost({ content, media = [] }) {
    const res = await apiClient.post("/posts", { content, media });
    return res;
}

/**
 * Delete a post by ID.
 */
export async function deletePost(id) {
    const res = await apiClient.delete(`/posts/${id}`);
    return res;
}

/**
 * Like a post.
 */
export async function likePost(id) {
    const res = await apiClient.post(`/posts/${id}/like`);
    return res;
}

/**
 * Unlike a post.
 */
export async function unlikePost(id) {
    const res = await apiClient.delete(`/posts/${id}/like`);
    return res;
}

/**
 * Get comments for a post.
 */
export async function getComments(postId) {
    const res = await apiClient.get(`/posts/${postId}/comments`);
    return res;
}

/**
 * Add a comment to a post.
 */
export async function createComment(postId, { content }) {
    const res = await apiClient.post(`/posts/${postId}/comments`, { content });
    return res;
}

/**
 * Delete a comment from a post.
 */
export async function deleteComment(postId, commentId) {
    const res = await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
    return res;
}

export const postsApi = {
    getPosts,
    getPostById,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    getComments,
    createComment,
    deleteComment,
};
