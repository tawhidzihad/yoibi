/**
 * Correction Script: Remove stray email-verification fields from the `users` profile collection
 *
 * TASK-028 originally added `emailVerified` / `emailVerifiedAt` /
 * `emailVerificationSentAt` to the YOIBI `users` (plural) profile collection.
 * That was wrong: email verification is authentication state, and the single
 * source of truth is `emailVerified` on Better Auth's `user` (SINGULAR)
 * collection (see src/models/betterAuthUser.model.js).
 *
 * This script unsets those fields from every `users` document so the profile
 * collection can never disagree with the auth collection. It is safe to run
 * repeatedly — it only ever removes the three stray fields and touches nothing
 * else on the documents.
 *
 * Usage: node scripts/unset-profile-email-verification-fields.js
 */

const mongoose = require("mongoose");
const { env } = require("../src/config/env");

const STRAY_FIELDS = ["emailVerified", "emailVerifiedAt", "emailVerificationSentAt"];

async function main() {
    const mongoUri = env.MONGODB_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(mongoUri);
    console.log("[Correction] Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("No database bound to the Mongoose connection");
    }

    const profiles = db.collection("users");
    const before = await profiles.countDocuments({
        $or: STRAY_FIELDS.map((f) => ({ [f]: { $exists: true } }))
    });
    console.log(`[Correction] users documents carrying stray verification fields: ${before}`);

    if (before > 0) {
        const result = await profiles.updateMany(
            { $or: STRAY_FIELDS.map((f) => ({ [f]: { $exists: true } })) },
            { $unset: { emailVerified: "", emailVerifiedAt: "", emailVerificationSentAt: "" } }
        );
        console.log(`[Correction] Unset stray fields on ${result.modifiedCount} document(s)`);
    } else {
        console.log("[Correction] Nothing to clean up — no users document holds these fields.");
    }

    const after = await profiles.countDocuments({
        $or: STRAY_FIELDS.map((f) => ({ [f]: { $exists: true } }))
    });
    console.log(`[Correction] Verification complete. Remaining stray fields: ${after}`);

    // The `user` (singular) collection must still carry the real state.
    const authUsers = db.collection("user");
    const verified = await authUsers.countDocuments({ emailVerified: true });
    const unverified = await authUsers.countDocuments({ emailVerified: false });
    console.log(`[Correction] Better Auth 'user' collection — verified: ${verified}, unverified: ${unverified}`);

    await mongoose.connection.close();
    console.log("[Correction] Database connection closed");
    process.exit(0);
}

main().catch((error) => {
    console.error("[Correction] Fatal error:", error);
    process.exit(1);
});
