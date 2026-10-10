const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    // Normalized sorted string of participant IDs (e.g. "user1:user2") ensuring uniqueness
    participantKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Canonical Better Auth user ID strings (always length 2 for direct messaging)
    participants: [{
        type: String,
        required: true
    }],
    lastMessage: {
        id: { type: String, default: null },
        type: { type: String, enum: ["text", "image", "video"], default: "text" },
        text: { type: String, default: "" },
        senderId: { type: String, default: null },
        createdAt: { type: Date, default: null }
    },
    lastActivityAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Map of userId -> count (stored as Object / Map)
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    // Map of userId -> lastReadAt Date
    lastReadAt: {
        type: Map,
        of: Date,
        default: {}
    }
}, {
    collection: "conversations",
    timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastActivityAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
