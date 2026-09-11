import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";

/**
 * Better Auth server configuration (Next.js Node runtime).
 *
 * Authentication rule (single authority):
 *   YOIBI authenticates with ONLY email + password and Google OAuth.
 *   There is NO outbound mailing step and NO password reset:
 *   - email/password signup creates the account immediately and the user
 *     can sign in right away (no email sent, no login block);
 *   - password reset is not offered.
 */
export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || "yoibi-dev-secret-key-32-chars-minimum-length",
    emailAndPassword: {
        enabled: true,
        // No extra account gate is configured (Better Auth default),
        // so signup creates an immediately usable account with no login block.
        // No account email is generated or sent, and no password-reset
        // hook is configured (that feature is removed).
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
            // NOTE: no rules are configured for removed auth flows.
        },
    },
});

