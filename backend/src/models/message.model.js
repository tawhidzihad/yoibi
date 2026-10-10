const mongoose = require("mongoose");

const recipientStatusSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null }
}, { _id: false });

const messageMediaSchema = new mongoose.Schema({
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    resourceType: { type: String, enum: ["image", "video"], default: null },
    bytes: { type: Number, default: 0 },
    format: { type: String, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    thumbnailUrl: { type: String, default: null },
    originalFilename: { type: String, default: null }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    senderId: {
        type: String,
        required: true,
        index: true
    },
    clientMessageId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["text", "image", "video"],
        required: true,
        default: "text"
    },
    text: {
        type: String,
        default: ""
    },
    media: {
        type: messageMediaSchema,
        default: null
    },
    recipients: [recipientStatusSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: "messages",
    timestamps: true,
    _id: false
});

// Idempotency: exact conversationId + senderId + clientMessageId must be unique
messageSchema.index(
    { conversationId: 1, senderId: 1, clientMessageId: 1 },
    { unique: true }
);

// Chronological pagination query
messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model("Message", messageSchema);
