/**
 * YOIBI Email Verification Template
 *
 * A simple string-based HTML template that avoids JSX transformation.
 * Designed to match the YOIBI brand (cyan/teal accent, clean sans-serif).
 * The 6-digit code is displayed prominently in a monospace font.
 *
 * @param {string} code - The 6-digit verification code
 * @param {string} email - Recipient's email address
 * @returns {string} HTML string
 */
function VerificationEmail({ code = "000000", email = "" }) {
    const displayCode = String(code).padStart(6, "0");
    const fromEmail = "contact@yoibi.com";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YOIBI Verification Code</title>
</head>
<body style="background-color: #0f172a; margin: 0; padding: 40px 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <div style="background-color: #1e293b; border-radius: 16px; padding: 40px; max-width: 480px; margin: 0 auto;">
        <!-- Brand -->
        <h1 style="color: #22d3ee; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
            YOIBI
        </h1>
        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0 0 32px 0;">
            Verify your email address
        </p>

        <!-- Greeting -->
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 16px 0;">
            Hi there,
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">
            You requested to verify your YOIBI account email address. Use the code below to complete verification. This code expires in <strong style="color: #e2e8f0;">15 minutes</strong>.
        </p>

        <!-- Code box -->
        <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 28px 0;">
            <div style="
                color: #22d3ee;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 12px;
                font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace;
                margin: 0 0 8px 0;
                text-align: center
            ">
                ${displayCode}
            </div>
            <div style="color: #64748b; font-size: 12px; margin: 0;">
                Your YOIBI verification code
            </div>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.7; margin: 0 0 24px 0;">
            If you did not request this, you can safely ignore this email. This code was sent to <strong style="color: #94a3b8">${fromEmail}</strong> on your behalf.
        </p>

        <p style="color: #475569; font-size: 12px; text-align: center; margin: 0;">
            YOIBI — Be you, be YOIBI.
        </p>
    </div>
</body>
</html>`;
}

module.exports = { VerificationEmail };