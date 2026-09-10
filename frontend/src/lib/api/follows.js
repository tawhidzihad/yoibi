import { apiClient } from "@/lib/api/client";

/**
 * Follow a user by ID.
 * @param {string} userId
 */
export async function followUser(userId) {
    return apiClient.post(`/users/${userId}/follow`, {});
}

/**
 * Unfollow a user by ID.
 * @param {string} userId
 */
export async function unfollowUser(userId) {
    return apiClient.delete(`/users/${userId}/follow`);
}
