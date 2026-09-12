const mongoose = require('mongoose');

// YOIBI has EXACTLY two application roles. No additional roles are introduced.
const ROLES = ['user', 'admin'];

// Canonical country representation: ISO 3166-1 alpha-2 code, uppercase.
// Arbitrary malformed values never enter the database (Zod strips them upstream;
// the schema guard is the final authority).
function validateCountryCode(value) {
    return value === '' || /^[A-Z]{2}$/.test(value);
}

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
    // Application profile email (from the verified Better Auth/Google identity).
    // Better Auth remains the sole login authority — this is display/sync data.
    email: { type: String, default: '', index: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    country: {
        type: String,
        default: '',
        validate: {
            validator: validateCountryCode,
            message: '{VALUE} is not a valid ISO 3166-1 alpha-2 country code'
        }
    },
    age: {
        type: Number,
        default: null,
        min: [16, 'Age must be at least 16'],
        max: [120, 'Enter a valid age']
    },
    phone: { type: String, default: '' },
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
