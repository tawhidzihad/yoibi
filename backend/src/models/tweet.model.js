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
    // Threaded comments (arbitrary-depth parent-child):
    //   replyToId    — the DIRECT parent (a top-level tweet OR another comment).
    //                  This chain preserves the true nesting depth; no depth
    //                  limit is stored in the schema (visual flattening is a
    //                  frontend presentation rule only).
    //   rootTweetId  — the top-level TWEET that owns this comment's whole
    //                  thread (null on top-level tweets). Enables a single
    //                  indexed query to fetch a tweet's entire comment tree.
    //   rootCommentId — the top-level COMMENT this comment belongs to (null
    //                  for direct replies to the tweet). Enables flat grouping
    //                  of all descendants under their top-level comment.
    rootTweetId: { type: String, default: null, index: true },
    rootCommentId: { type: String, default: null, index: true },
    isRetweet: { type: Boolean, default: false },
    quoteTweet: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "tweets", _id: false });

tweetSchema.index({ createdAt: -1 });
tweetSchema.index({ authorId: 1, createdAt: -1 });
tweetSchema.index({ replyToId: 1, createdAt: 1 });

module.exports = mongoose.model("Tweet", tweetSchema);
