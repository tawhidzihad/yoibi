/**
 * Minimal transactional email sender for YOIBI transactional flows
 * (email verification, password reset).
 *
 * Provider: Resend (https://resend.com) — production-safe, simple REST API,
 * invoked with the global `fetch` available in the Next.js Node runtime.
 * No SDK dependency is added.
 *
 * Environment variables (frontend, server-only — NEVER NEXT_PUBLIC_*):
 *   RESEND_API_KEY  - Resend API key (secret).
 *   EMAIL_FROM      - Verified sender, e.g. "YOIBI <noreply@notifications.yourdomain.com>".
 *                     The sending domain must be verified in the Resend dashboard
 *                     before production delivery works (deployment prerequisite).
 *
 * Local development behavior:
 *   If RESEND_API_KEY is not set, no email is sent and a single console warning
 *   is logged instead (delivery is intentionally disabled in local dev).
 *   Verification tokens are NEVER logged and are never exposed to the browser
 *   outside of the email link itself.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends a plain-text + simple HTML email via Resend.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} params
 * @returns {Promise<{ sent: boolean, skipped: boolean, error: string|null }>}
 */
export async function sendEmail({ to, subject, text, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        console.warn(
            "[Email] RESEND_API_KEY / EMAIL_FROM not configured - skipping email delivery " +
            "(set them in the frontend server environment to enable verification/reset emails)."
        );
        return { sent: false, skipped: true, error: null };
    }

    try {
        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                text,
                ...(html ? { html } : {}),
            }),
        });

        if (!response.ok) {
            // Log status only - never log API keys or full provider payloads.
            console.error(`[Email] Resend delivery failed (status ${response.status}).`);
            return { sent: false, skipped: false, error: `Resend request failed with status ${response.status}` };
        }

        return { sent: true, skipped: false, error: null };
    } catch (err) {
        console.error("[Email] Resend delivery error:", err?.message);
        return { sent: false, skipped: false, error: err?.message || "Email delivery error" };
    }
}
