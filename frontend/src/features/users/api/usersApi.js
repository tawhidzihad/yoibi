import { apiClient } from "@/lib/api/client";

export const usersApi = {
    /**
     * Get public user profile by handle
     * GET /api/v1/users/:handle
     */
    getUserProfile: (handle) => apiClient.get(`/users/${encodeURIComponent(handle)}`),

    /**
     * Update current authenticated user profile
     * PATCH /api/v1/users/me
     */
    updateUserProfile: (data) => apiClient.patch("/users/me", data),

    /**
     * Search users by display name / username
     * GET /api/v1/users/search?q=<query>&limit=<n>
     */
    searchUsers: (q, limit = 10) =>
        apiClient.get(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};
