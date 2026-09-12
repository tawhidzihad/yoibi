const mongoose = require("mongoose");

const mediaAttachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    type: { type: String, default: "image" },
    publicId: { type: String, default: "" },
    // Optional Cloudinary delivery metadata captured at upload time.
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    format: { type: String }
}, { _id: false });

const tweetSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    mediaUrls: [mediaAttachmentSchema],
    likes: [{ type: String }],
    likesCount: { type: Number, default: 0 },
    retweets: [{ type: String }],
    retweetCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    replyToId: { type: String, default: null, index: true },
    isRetweet: { type: Boolean, default: false },
    quoteTweet: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "tweets", _id: false });

tweetSchema.index({ createdAt: -1 });
tweetSchema.index({ authorId: 1, createdAt: -1 });
tweetSchema.index({ replyToId: 1, createdAt: 1 });

module.exports = mongoose.model("Tweet", tweetSchema);
