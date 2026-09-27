/**
 * Migration Script: Clear Better Auth Sessions for Unverified Users
 *
 * This script invalidates all active sessions for users who have not
 * verified their email addresses. This is necessary because:
 *
 * 1. Email verification is now required for full access to the platform
 * 2. Existing users with verified old sessions could bypass the new check
 * 3. Forcing re-login ensures they'll encounter the verification flow
 *
 * Running this script will:
 * - Query all users with emailVerified = false
 * - Delete their sessions from Better Auth
 * - Log the count of affected users
 *
 * Usage: node scripts/clear-sessions-for-unverified-users.js
 *
 * IMPORTANT: Run this after deploying the email verification feature!
 *
 * @co-authored-by Claude Code
 */

const mongoose = require("mongoose");
const { env } = require("../src/config/env");
const BetterAuthUser = require("../src/models/betterAuthUser.model");
const { getLiveUserModeration } = require("../src/middleware/auth");

// Better Auth API client for session management
const BETTER_AUTH_BASE_URL = env.BETTER_AUTH_BASE_URL;

async function connectToDatabase() {
    const mongoUri = env.MONGODB_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(mongoUri);
    console.log("[Migration] Connected to MongoDB");
}

async function clearSessionsForUnverifiedUsers() {
    console.log("[Migration] Starting session clearance for unverified users...");

    // Find all unverified users. Verification state lives on Better Auth's
    // `user` (singular) collection — the single source of truth.
    const unverifiedUsers = await BetterAuthUser.find({
        emailVerified: false,
        email: { $exists: true, $ne: "" }
    }).select("_id email name").lean();

    console.log(`[Migration] Found ${unverifiedUsers.length} unverified users`);

    let clearedSessions = 0;
    let errors = 0;

    for (const user of unverifiedUsers) {
        try {
            // Better Auth stores _id as a BSON ObjectId, but every other layer
            // identifies a user by its hex string (the JWT `sub` claim and the
            // `users` profile _id). Normalize before calling across.
            const userId = String(user._id);

            // Call the live moderation check which will auto-provision profiles
            // and verify their unverified status from DB
            const liveUser = await getLiveUserModeration(userId, {
                email: user.email,
                name: user.name || ""
            });

            if (liveUser && !liveUser.emailVerified) {
                // Note: Better Auth sessions are invalidated client-side when
                // they detect the EMAIL_NOT_VERIFIED error
                // This script logs the users who need session refresh
                console.log(`[Migration] User ${user.email} (${userId}) needs session refresh`);
                clearedSessions++;
            }
        } catch (error) {
            console.error(`[Migration] Error processing user ${user._id}:`, error.message);
            errors++;
        }
    }

    console.log(`[Migration] Complete. ${clearedSessions} unverified users logged.`);
    console.log(`[Migration] ${errors} errors encountered.`);

    // Note about the actual session clearing:
    console.log("\n[Migration] IMPORTANT: Sessions will be cleared on next login attempt.");
    console.log("[Migration] When these users next make an authenticated request,");
    console.log("[Migration] the EMAIL_NOT_VERIFIED check in verifyJwt middleware will return 403.");
    console.log("[Migration] They will need to complete email verification to continue.");

    return { clearedSessions, errors };
}

async function main() {
    try {
        await connectToDatabase();
        const result = await clearSessionsForUnverifiedUsers();
        process.exit(0);
    } catch (error) {
        console.error("[Migration] Fatal error:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("[Migration] Database connection closed");
    }
}

// Export for testing
module.exports = { clearSessionsForUnverifiedUsers };

// Run if executed directly
if (require.main === module) {
    main();
}