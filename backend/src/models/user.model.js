const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String },
    handle: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'users', _id: false });

userSchema.index({ handle: 1 });

module.exports = mongoose.model('User', userSchema);
