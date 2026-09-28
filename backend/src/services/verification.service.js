const EmailVerification = require("../models/emailVerification.model");
const { getEmailVerificationStatus, setEmailVerified } = require("../repositories/authUser.repository");
// The auth middleware caches live moderation state (including emailVerified)
// for 30s. It must be invalidated on verification so a just-verified user is
// not momentarily still reported EMAIL_NOT_VERIFIED and bounced back.
const { invalidateUserModerationCache } = require("../middleware/auth");
const {
    sendVerificationEmail,
    generateVerificationCode,
    getVerificationExpiry,
    VERIFICATION_CODE_TTL_MS,
} = require("./email.service");

/**
 * Default cooldown period for resending verification codes (60 seconds).
 * This prevents abuse of the resend endpoint.
 */
const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Checks if enough time has passed since the last verification was sent.
 * @param {string} userId
 * @returns {Promise<boolean>} True if cool, can send new code
 */
async function canSendNewCode(userId) {
    const lastVerification = await EmailVerification.findOne({
        userId,
        expiresAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS * 2) },
    }).sort({ createdAt: -1 });

    if (!lastVerification) {
        return true;
    }

    const now = new Date();
    const lastSent = new Date(lastVerification.createdAt);
    const diff = now.getTime() - lastSent.getTime();

    return diff >= RESEND_COOLDOWN_MS;
}

/**
 * Sends a verification code to the specified email address.
 * Creates a new code, delete any existing pending codes for the user, sends email.
 *
 * @param {Object} params
 * @param {string} params.userId - Better Auth user ID
 * @param {string} params.email - Email address to send to
 * @param {string} params.name - User's display name (for personalization)
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
async function sendVerificationCode({ userId, email, name }) {
    try {
        // Check cooldown
        const isCooldown = await canSendNewCode(userId);
        if (!isCooldown) {
            return {
                success: false,
                error: "Please wait before requesting another verification code.",
            };
        }

        // Generate new code
        const code = generateVerificationCode();
        const expiresAt = getVerificationExpiry();

        // Delete any existing pending verifications for this user
        await EmailVerification.deleteMany({ userId });

        // Create new verification record
        const verificationDoc = await EmailVerification.create({
            userId,
            email,
            code,
            expiresAt,
        });

        // Send verification email
        const emailResult = await sendVerificationEmail({
            to: email,
            name: name || "",
            code,
        });

        if (!emailResult.success) {
            // Roll back: delete the verification record
            await EmailVerification.deleteOne({ _id: verificationDoc._id });
            return {
                success: false,
                error: emailResult.error || "Failed to send verification email",
            };
        }

        return {
            success: true,
            message: "Verification code sent",
        };
    } catch (err) {
        return {
            success: false,
            error: err.message || "Unexpected error sending verification code",
        };
    }
}

/**
 * Verifies a code for the specified user.
 * Checks expiration, consumes the code if valid, updates user profile.
 *
 * @param {Object} params
 * @param {string} params.userId - Better Auth user ID
 * @param {string} params.code - The 6-digit code submitted by the user
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
async function verifyCode({ userId, code }) {
    try {
        if (!code || String(code).trim().length !== 6) {
            return {
                success: false,
                error: "Invalid verification code format.",
            };
        }

        const normalizedCode = String(code).trim();

        // Find the verification record
        const verification = await EmailVerification.findOne({
            userId,
            code: normalizedCode,
        });

        if (!verification) {
            return {
                success: false,
                error: "Invalid or expired verification code.",
            };
        }

        // Check expiration
        if (verification.expiresAt < new Date()) {
            // Clean up expired record
            await EmailVerification.deleteOne({ _id: verification._id });
            return {
                success: false,
                error: "Verification code has expired. Please request a new code.",
            };
        }

        // Mark the email as verified. This writes to Better Auth's `user`
        // (singular) collection — the single source of truth for verification
        // status. The repository uses returnDocument:'after' so this is a real
        // post-write database read, not an assumption that the write landed.
        const verified = await setEmailVerified(userId);

        // Delete the used code (single-use)
        await EmailVerification.deleteOne({ _id: verification._id });

        if (!verified.exists) {
            return {
                success: false,
                error: "Could not find user account to verify.",
            };
        }

        if (!verified.emailVerified) {
            return {
                success: false,
                error: "Failed to update email verification status.",
            };
        }

        // The auth gate caches emailVerified for 30s; drop that stale entry so
        // the very next authenticated request reads the fresh verified state
        // instead of bouncing the user back to /verify-email.
        invalidateUserModerationCache(userId);

        return {
            success: true,
            message: "Email verified successfully",
        };
    } catch (err) {
        return {
            success: false,
            error: err.message || "Unexpected error verifying code",
        };
    }
}

/**
 * Resends a verification code (rate-limited).
 *
 * @param {Object} params
 * @param {string} params.userId - Better Auth user ID
 * @param {string} params.email - Email address to send to
 * @param {string} params.name - User's display name (for personalization)
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
async function resendVerificationCode({ userId, email, name }) {
    // First check if the email is already verified on the Better Auth `user`
    // (singular) account — the same source the auth gate reads.
    const status = await getEmailVerificationStatus(userId);
    if (!status.exists) {
        return { success: false, error: "User not found" };
    }

    if (status.emailVerified) {
        return { success: false, error: "Email is already verified" };
    }

    return sendVerificationCode({ userId, email, name });
}

/**
 * Gets the cooldown time remaining in seconds.
 *
 * @param {string} userId
 * @returns {Promise<number>} Seconds until user can request a new code (0 if ready)
 */
async function getCooldownRemaining(userId) {
    const lastVerification = await EmailVerification.findOne({
        userId,
        expiresAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS * 2) },
    }).sort({ createdAt: -1 });

    if (!lastVerification) {
        return 0;
    }

    const now = new Date();
    const lastSent = new Date(lastVerification.createdAt);
    const diffMs = RESEND_COOLDOWN_MS - (now.getTime() - lastSent.getTime());

    return Math.max(0, Math.floor(diffMs / 1000));
}

module.exports = {
    sendVerificationCode,
    verifyCode,
    resendVerificationCode,
    getCooldownRemaining,
    canSendNewCode,
    VERIFICATION_CODE_TTL_MS,
    RESEND_COOLDOWN_MS,
};