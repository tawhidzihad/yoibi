const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const mediaAttachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    type: { type: String, default: "image" },
    publicId: { type: String, default: "" }
}, { _id: false });

const postSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    content: { type: String, default: "" },
    media: [mediaAttachmentSchema],
    likes: [{ type: String }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    comments: [commentSchema],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "posts", _id: false });

postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
