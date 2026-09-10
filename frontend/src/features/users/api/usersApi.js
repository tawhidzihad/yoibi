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
};
