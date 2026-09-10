const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    followerId: {
        type: String,
        required: true,
        index: true
    },
    followingId: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'follows' });

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1 });

module.exports = mongoose.model('Follow', followSchema);
