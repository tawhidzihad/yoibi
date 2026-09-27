const mongoose = require("mongoose");

/**
 * Short-lived email verification code store.
 *
 * Design:
 *   - One active code per (userId, email) pair at any time.
 *   - Old codes for the same user are deleted before inserting a new one
 *     (ensures single-use + prevents code accumulation).
 *   - 6-digit numeric code, expires after VERIFICATION_CODE_TTL_MS.
 *   - Codes are not hashed — they are short-lived and sent to the user's
 *     own inbox only. The DB document is deleted on successful verification.
 */
const emailVerificationSchema = new mongoose.Schema({
    // The Better Auth user ID this code is for.
    userId: { type: String, required: true, index: true },
    // The email address the code was sent to (for display/logging purposes).
    email: { type: String, required: true },
    // 6-digit numeric verification code (not hashed — short TTL + inbox-bound).
    code: { type: String, required: true },
    // When this code expires and can no longer be used.
    expiresAt: { type: Date, required: true, index: true },
    // When this code was created (used for resend-cooldown enforcement).
    createdAt: { type: Date, default: Date.now },
}, { collection: "emailVerifications" });

// Compound index: one active (non-expired) record per user at a time.
emailVerificationSchema.index({ userId: 1, expiresAt: 1 });

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);