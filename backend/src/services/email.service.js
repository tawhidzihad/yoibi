const { render } = require("@react-email/render");
const { VerificationEmail } = require("../emails/VerificationEmail");
const { env } = require("../config/env");

let resendClient = null;

/**
 * Gets the initialized Resend client (lazy-loaded on first use).
 * @returns {import("resend").Resend|null}
 */
function getResendClient() {
    if (!resendClient && env.RESEND_API_KEY) {
        // Require the resend package only when the API key is available
        // (prevents build failures in environments without the key)
        const resend = require("resend");
        resendClient = resend.Resend ? new resend.Resend(env.RESEND_API_KEY) : null;
    }
    return resendClient;
}

/**
 * Default verification code TTL in milliseconds (15 minutes).
 */
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Generates a 6-digit random verification code.
 * @returns {string} 6-digit numeric string
 */
function generateVerificationCode() {
    const digits = Math.floor(100000 + Math.random() * 900000);
    return String(digits);
}

/**
 * Gets the expiry timestamp for a new verification code.
 * @returns {Date}
 */
function getVerificationExpiry() {
    return new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
}

/**
 * Renders the verification email template to HTML.
 * @param {string} code - The 6-digit verification code
 * @param {string} name - Recipient's display name (optional)
 * @returns {string} HTML string
 */
function renderVerificationEmail({ code, name }) {
    return render(VerificationEmail({ code, name: name || "" }));
}

/**
 * Sends a verification email to the specified recipient.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Recipient's display name (for personalization)
 * @param {string} params.code - The 6-digit verification code
 * @returns {Promise<{ success: boolean, error?: string, messageId?: string }>}
 */
async function sendVerificationEmail({ to, name, code }) {
    const resend = getResendClient();

    if (!resend) {
        return {
            success: false,
            error: "Resend client not configured. Set RESEND_API_KEY.",
        };
    }

    if (!to || !code) {
        return {
            success: false,
            error: "Missing required parameters: to, code",
        };
    }

    const fromAddress = env.EMAIL_FROM_ADDRESS || "contact@yoibi.com";
    const htmlContent = renderVerificationEmail({ code, name });

    try {
        const response = await resend.emails.send({
            from: fromAddress,
            to: to,
            subject: "Your YOIBI verification code",
            html: htmlContent,
        });

        if (response.error) {
            return {
                success: false,
                error: response.error.message || "Failed to send verification email",
            };
        }

        return {
            success: true,
            messageId: response.data?.id,
        };
    } catch (err) {
        return {
            success: false,
            error: err.message || "Unexpected error sending email",
        };
    }
}

module.exports = {
    sendVerificationEmail,
    generateVerificationCode,
    getVerificationExpiry,
    renderVerificationEmail,
    VERIFICATION_CODE_TTL_MS,
};