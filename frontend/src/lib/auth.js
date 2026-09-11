import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";
import { sendEmail } from "@/lib/email";

/**
 * Better Auth server configuration (Next.js Node runtime).
 *
 * Email delivery:
 *   Verification and password-reset emails are delivered through Resend via
 *   `sendEmail` (see `@/lib/email`). `RESEND_API_KEY` and `EMAIL_FROM` are
 *   server-only environment variables. If they are not set (e.g. local dev),
 *   Better Auth still generates the real verification URL/token and hands it
 *   to `sendVerificationEmail`, but delivery is skipped with a console
 *   warning instead of faking success.
 */
export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || "yoibi-dev-secret-key-32-chars-minimum-length",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            // Official Better Auth hook: password reset email delivery.
            // `url` is the real Better Auth reset link (contains a one-time token).
            await sendEmail({
                to: user.email,
                subject: "Reset your YOIBI password",
                text: [
                    `Hello ${user.name || "there"},`,
                    "",
                    "We received a request to reset your YOIBI password.",
                    "Open the link below to choose a new password:",
                    url,
                    "",
                    "If you did not request this, you can safely ignore this email.",
                ].join("\n"),
            });
        },
    },
    emailVerification: {
        // Official Better Auth configuration (v1.7.4):
        // `sendVerificationEmail` receives the real Better Auth verification URL
        // (`${baseURL}/api/auth/verify-email?token=...&callbackURL=...`).
        // The token is only ever embedded in the email link - never logged,
        // never returned to the browser outside of that link.
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Verify your YOIBI email address",
                text: [
                    `Hello ${user.name || "there"},`,
                    "",
                    "Welcome to YOIBI! Please confirm your email address by opening the link below:",
                    url,
                    "",
                    "After verification you can sign in with your email and password.",
                ].join("\n"),
            });
        },
        // Send the verification email automatically at signup (official option).
        sendOnSignUp: true,
        // YOIBI rule: signup does NOT auto sign-in; after verification the
        // user is redirected to the login flow (signUp.email is called with
        // callbackURL "/login" - see AuthContext.signupEmail).
        autoSignInAfterVerification: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
        },
    },
    plugins: [
        jwt({
            jwt: {
                expirationTime: "1d",
            },
        }),
        admin(),
    ],
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 10,
            },
            "/sign-up/email": {
                window: 60,
                max: 5,
            },
            "/forget-password": {
                window: 300,
                max: 5,
            },
            "/reset-password": {
                window: 300,
                max: 5,
            },
            "/send-verification-email": {
                window: 300,
                max: 5,
            },
        },
    },
});

