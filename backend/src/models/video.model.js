const mongoose = require("mongoose");

const CANONICAL_CATEGORIES = [
    "politics",
    "current-events",
    "learning",
    "governmental",
    "fun",
    "conversations",
    "commentary",
    "news"
];

const videoSchema = new mongoose.Schema(
    {
        // Application-generated string id (vid_...), mirroring the Tweet model.
        // Mongoose's default ObjectId type rejects these string ids at write time.
        _id: { type: String, required: true },
        authorId: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 120
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },
        category: {
            type: String,
            enum: {
                values: CANONICAL_CATEGORIES,
                message: "{VALUE} is not an authorized video category"
            },
            default: null,
            index: true
        },
        videoUrl: {
            type: String,
            required: true,
            trim: true
        },
        thumbnailUrl: {
            type: String,
            trim: true,
            default: ""
        },
        publicId: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: Number,
            default: 0,
            min: 0
        },
        viewsCount: {
            type: Number,
            default: 0,
            min: 0
        },
        likes: {
            type: [String],
            default: []
        },
        likesCount: {
            type: Number,
            default: 0,
            min: 0
        },
        bytes: {
            type: Number,
            default: 0
        },
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        },
        format: {
            type: String,
            default: "mp4"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);

// Performance compound indexes
videoSchema.index({ createdAt: -1 });
videoSchema.index({ category: 1, createdAt: -1 });
videoSchema.index({ authorId: 1, createdAt: -1 });

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

module.exports = {
    Video,
    CANONICAL_CATEGORIES
};
