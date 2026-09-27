const { sendVerificationCode, verifyCode, resendVerificationCode } = require("../../services/verification.service");
const { getCooldownRemaining } = require("../../services/verification.service");

/**
 * Controller: POST /api/v1/auth/verification/send
 * Generates and sends a verification code to the authenticated user's email.
 * Rate-limited per user to prevent abuse.
 */
async function sendVerification(req, res) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
    }

    const userId = req.user.id;
    const email = req.user.email;
    const name = req.user.name || "";

    const result = await sendVerificationCode({ userId, email, name });

    if (!result.success) {
        // Check if it's a cooldown error - return 429
        if (result.error?.includes("wait") || result.error?.includes("cooldown")) {
            return res.status(429).json({
                success: false,
                error: { code: "RATE_LIMITED", message: result.error },
            });
        }
        return res.status(400).json({
            success: false,
            error: { code: "VERIFICATION_SEND_FAILED", message: result.error },
        });
    }

    return res.status(200).json({
        success: true,
        message: result.message || "Verification code sent",
    });
}

/**
 * Controller: POST /api/v1/auth/verification/verify
 * Verifies the submitted code and marks the user's email as verified.
 */
async function verifyVerification(req, res) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
    }

    const { code } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Verification code is required" },
        });
    }

    const result = await verifyCode({
        userId: req.user.id,
        code: String(code).trim(),
    });

    if (!result.success) {
        const statusCode = result.error?.includes("expired") ? 400 : 400;
        return res.status(statusCode).json({
            success: false,
            error: { code: "VERIFICATION_FAILED", message: result.error },
        });
    }

    return res.status(200).json({
        success: true,
        message: result.message,
    });
}

/**
 * Controller: POST /api/v1/auth/verification/resend
 * Resends a verification code with cooldown enforcement.
 */
async function resendVerification(req, res) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
    }

    const userId = req.user.id;
    const email = req.user.email;
    const name = req.user.name || "";

    // Check cooldown
    const cooldown = await getCooldownRemaining(userId);
    if (cooldown > 0) {
        return res.status(429).json({
            success: false,
            error: {
                code: "RATE_LIMITED",
                message: `Please wait ${Math.ceil(cooldown / 60)} minute(s) before requesting a new verification code.`,
                cooldownRemaining: cooldown,
            },
        });
    }

    const result = await resendVerificationCode({ userId, email, name });

    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: { code: "VERIFICATION_RESEND_FAILED", message: result.error },
        });
    }

    return res.status(200).json({
        success: true,
        message: result.message || "Verification code resent",
    });
}

module.exports = {
    sendVerification,
    verifyVerification,
    resendVerification,
};