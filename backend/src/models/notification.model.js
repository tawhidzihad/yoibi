const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: String,
        required: true,
        index: true
    },
    actorId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['like_tweet', 'retweet', 'reply', 'follow', 'like_video']
    },
    targetId: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['tweet', 'video', 'user']
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'notifications',
    timestamps: true
});

// Feed query index: list notifications for user, newest first
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Unread count query index
notificationSchema.index({ recipientId: 1, read: 1 });

// Duplicate prevention unique compound index
notificationSchema.index({ actorId: 1, type: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
