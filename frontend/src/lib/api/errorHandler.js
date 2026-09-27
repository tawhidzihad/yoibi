/**
 * API Error Handler
 *
 * Normalizes API error responses for consistent client-side handling.
 * Returns a standardized error object that can be used for:
 * - Displaying user-facing error messages
 * - Conditional routing (e.g., redirect to verification on EMAIL_NOT_VERIFIED)
 * - Retry logic
 *
 * @param {Object} error - Error object from API response
 * @param {string} error.code - Error code from backend
 * @param {string} error.message - Human-readable error message
 * @returns {Object} Normalized error with { code, message }
 */
export function handleApiError(error) {
    // Already normalized from client.js
    if (error && error.code && error.message) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message
            }
        };
    }

    // Fallback for unknown error shapes
    return {
        success: false,
        error: {
            code: "UNKNOWN_ERROR",
            message: error?.message || "An unexpected error occurred"
        }
    };
}

/**
 * Check if an API error requires email verification
 * @param {Object} error - Error object from API response
 * @returns {boolean} True if user needs to verify email
 */
export function requiresEmailVerification(error) {
    return error?.error?.code === "EMAIL_NOT_VERIFIED" || error?.error?.code === "EMAIL_VERIFICATION_REQUIRED";
}

/**
 * Get user-friendly message for email verification errors
 * @param {Object} error - Error object from API response
 * @returns {string|null} Friendly message or null if not an email verification error
 */
export function getEmailVerificationMessage(error) {
    if (requiresEmailVerification(error)) {
        return error?.error?.message || "Please verify your email address to continue.";
    }
    return null;
}