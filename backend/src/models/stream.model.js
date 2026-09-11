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

const STREAM_STATUS = {
    READY: "ready",
    LIVE: "live",
    ENDED: "ended"
};

const streamSchema = new mongoose.Schema(
    {
        _id: {
            type: String
        },
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
                message: "{VALUE} is not an authorized stream category"
            },
            default: "conversations",
            index: true
        },
        thumbnailUrl: {
            type: String,
            trim: true,
            default: null
        },
        roomName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        status: {
            type: String,
            enum: {
                values: Object.values(STREAM_STATUS),
                message: "{VALUE} is not a valid stream status"
            },
            default: STREAM_STATUS.READY,
            index: true
        },
        viewerCount: {
            type: Number,
            default: 0,
            min: 0
        },
        startedAt: {
            type: Date,
            default: null
        },
        endedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Performance compound indexes
streamSchema.index({ status: 1, createdAt: -1 });
streamSchema.index({ authorId: 1, createdAt: -1 });
streamSchema.index({ category: 1, status: 1, createdAt: -1 });

const Stream = mongoose.models.Stream || mongoose.model("Stream", streamSchema);

module.exports = {
    Stream,
    CANONICAL_CATEGORIES,
    STREAM_STATUS
};
