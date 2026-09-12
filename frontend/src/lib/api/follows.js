import { apiClient } from "@/lib/api/client";
import { emitProfileChanged } from "@/lib/profileSync";

/**
 * Follow a user by ID. Emits the profile-changed event on success so the
 * sidebar's Following count (fed by /auth/me) refreshes without a page reload.
 * @param {string} userId
 */
export async function followUser(userId) {
    const res = await apiClient.post(`/users/${userId}/follow`, {});
    if (res?.success) emitProfileChanged();
    return res;
}

/**
 * Unfollow a user by ID. Emits the profile-changed event on success so the
 * sidebar's Following count (fed by /auth/me) refreshes without a page reload.
 * @param {string} userId
 */
export async function unfollowUser(userId) {
    const res = await apiClient.delete(`/users/${userId}/follow`);
    if (res?.success) emitProfileChanged();
    return res;
}
