const mongoose = require('mongoose');

// YOIBI has EXACTLY two application roles. No additional roles are introduced.
const ROLES = ['user', 'admin'];

const userSchema = new mongoose.Schema({
    // _id IS the canonical Better Auth user ID (verified from the JWT `sub` claim).
    // All YOIBI ownership fields reuse this same String identity:
    //   Tweet.authorId, Video.authorId, Stream.authorId, MeetUp.ownerId,
    //   Follow.*Id, Message.senderId/recipientId, Notification.actorId/recipientId,
    //   Report.reporterId/targetId, admin target IDs.
    // Better Auth owns authentication data (email credentials, hashed password,
    // sessions, provider accounts) — it is NEVER duplicated in this profile.
    _id: { type: String },
    handle: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: {
        type: String,
        enum: { values: ROLES, message: '{VALUE} is not a valid YOIBI role' },
        default: 'user',
        index: true
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: null },
    blockedAt: { type: Date, default: null },
    blockedBy: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'users', _id: false });

userSchema.index({ isBlocked: 1 });
// `handle` carries a unique index (declared above) — the database is the final
// authority for handle uniqueness.

module.exports = mongoose.model('User', userSchema);
