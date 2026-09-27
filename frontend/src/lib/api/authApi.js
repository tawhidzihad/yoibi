import { apiClient } from "./client";
import { requiresEmailVerification } from "./errorHandler";

export const authApi = {
    /**
     * Fetch authenticated user identity & profile from Express API
     * GET /api/v1/auth/me
     */
    getMe: () => apiClient.get("/auth/me"),

    /**
     * Send email verification code
     * POST /api/v1/auth/verification/send
     */
    sendVerificationCode: () => apiClient.post("/auth/verification/send"),

    /**
     * Verify email with submitted code
     * POST /api/v1/auth/verification/verify
     * @param {string} code - 6-digit verification code
     */
    verifyCode: (code) => apiClient.post("/auth/verification/verify", { code }),

    /**
     * Resend verification email
     * POST /api/v1/auth/verification/resend
     */
    resendVerification: () => apiClient.post("/auth/verification/resend"),
};

// Re-export error utilities for consumers who need them
export { requiresEmailVerification };
