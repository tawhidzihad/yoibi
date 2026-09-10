const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: {
        type: [String],
        required: true,
        validate: [
            (arr) => arr.length === 2,
            'Conversation must have exactly 2 participants'
        ]
    },
    lastMessage: {
        content: { type: String, default: '' },
        senderId: { type: String, default: '' },
        clientMessageId: { type: String, default: '' },
        createdAt: { type: Date, default: null }
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'conversations' });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
