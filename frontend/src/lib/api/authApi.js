import { apiClient } from "./client";

export const authApi = {
    /**
     * Fetch authenticated user identity & profile from Express API
     * GET /api/v1/auth/me
     */
    getMe: () => apiClient.get("/auth/me"),
};
