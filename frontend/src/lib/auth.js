import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

/**
 * Better Auth server configuration (Next.js Node runtime).
 *
 * Authentication rule (single authority):
 *   YOIBI authenticates with ONLY email + password and Google OAuth.
 *   There is NO outbound mailing step and NO password reset:
 *   - email/password signup creates the account immediately and the user
 *     can sign in right away (no email sent, no login block);
 *   - password reset is not offered.
 *
 * Persistent storage:
 *   Better Auth owns authentication data (email, hashed password, sessions,
 *   OAuth accounts). It uses the official Better Auth MongoDB adapter pointed
 *   at the same Atlas `yoibi_database` as the YOIBI Express backend. Without a
 *   database adapter Better Auth would silently fall back to an in-memory
 *   store and signups would not survive restarts.
 */

const YOIBI_DATABASE_NAME = "yoibi_database";

function warn(message) {
    if (typeof console.warn === "function") {
        console.warn(message);
    } else {
        console.log(`[WARN] ${message}`);
    }
}

let mongoClient = null;

/**
 * Resolves the Better Auth Mongo Db, or null when MONGODB_URI is not set.
 * The database name is pinned to "yoibi_database" (never the driver default).
 *
 * @returns {import("mongodb").Db|null}
 */
function getBetterAuthDatabase() {
    const uri = process.env.MONGODB_URI || "";
    if (!uri) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("MONGODB_URI is required in production for persistent Better Auth user storage.");
        }
        warn("[BetterAuth] MONGODB_URI is not set — falling back to in-memory storage (signups will not persist across restarts).");
        return null;
    }
    mongoClient = mongoClient || new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    return mongoClient.db(YOIBI_DATABASE_NAME);
}

// The Better Auth instance is created lazily on the FIRST REQUEST, not at
// module evaluation: Next.js imports route modules during "collecting page
// data" at build time, when runtime environment variables (MONGODB_URI,
// BETTER_AUTH_SECRET, GOOGLE_*) are not yet available on the build host.
// A module-level `betterAuth(...)` call would therefore fail the production
// build (or bake in fallback secrets). Deferring to request time keeps the
// build environment-independent and secrets read at runtime only.
let authInstance = null;

/**
 * Returns the singleton Better Auth server instance.
 *
 * @returns {ReturnType<typeof betterAuth>}
 */
export function getAuth() {
    if (!authInstance) {
        const betterAuthDatabase = getBetterAuthDatabase();
        authInstance = betterAuth({
            baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
            secret: process.env.BETTER_AUTH_SECRET || "yoibi-dev-secret-key-32-chars-minimum-length",
            // Persistent MongoDB storage for Better Auth authentication-owned data.
            // transaction:false — the Better Auth Mongo adapter defaults to transactions
            // (replica-set only); standalone/dev/test MongoDB rejects them with
            // IllegalOperation. Explicitly disabling keeps sign-up working on both
            // standalone MongoDB and Atlas replica sets.
            database: betterAuthDatabase ? mongodbAdapter(betterAuthDatabase, { client: mongoClient, transaction: false }) : undefined,
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
    }
    return authInstance;
}

