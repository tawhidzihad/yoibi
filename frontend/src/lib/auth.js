import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || "yoibi-dev-secret-key-32-chars-minimum-length",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
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
});

