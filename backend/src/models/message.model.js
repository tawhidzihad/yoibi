const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: String,
        required: true,
        index: true
    },
    recipientId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    clientMessageId: {
        type: String,
        required: true
    },
    readAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'messages' });

// Idempotency compound unique index
messageSchema.index({ senderId: 1, clientMessageId: 1 }, { unique: true });

// Message history retrieval index
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Unread count and mark-read query index
messageSchema.index({ conversationId: 1, recipientId: 1, readAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
