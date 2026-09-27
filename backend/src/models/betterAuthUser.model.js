const mongoose = require("mongoose");

/**
 * Better Auth `user` collection — the SINGLE SOURCE OF TRUTH for email
 * verification status.
 *
 * YOIBI has two user-shaped collections and they must never be conflated:
 *   - `user`  (SINGULAR, this model) — Better Auth's own account store. It owns
 *     email, password hash, sessions and `emailVerified`. This is where YOIBI
 *     reads and writes "has this user verified their email?".
 *   - `users` (PLURAL, models/user.model.js) — YOIBI's canonical public profile
 *     (handle, bio, avatars, counters). It deliberately carries NO verification
 *     state; mirroring it there duplicated the source of truth and is removed.
 *
 * Only the fields YOIBI actually needs are declared. `_id` is typed Mixed
 * because Better Auth stores it as a BSON ObjectId while the same identity
 * travels through JWTs and the API as its hex string — declaring it as
 * ObjectId would make every lookup by that string silently miss.
 */
const betterAuthUserSchema = new mongoose.Schema(
    {
        email: { type: String, default: "" },
        // Whether the email address on this account has been verified.
        emailVerified: { type: Boolean, default: false },
    },
    { collection: "user", strict: false }
);

betterAuthUserSchema.path("_id").options.type = mongoose.Schema.Types.Mixed;

module.exports = mongoose.model("BetterAuthUser", betterAuthUserSchema);
