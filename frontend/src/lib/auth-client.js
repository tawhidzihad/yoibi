import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [
        jwtClient(),
    ],
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    // NOTE: no extra client actions are exported - account confirmation
    // emails and password reset are removed from YOIBI.
} = authClient;
