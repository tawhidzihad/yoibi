const mongoose = require("mongoose");

const MEETUP_STATUS = {
    ACTIVE: "active",
    ENDED: "ended"
};

const meetupSchema = new mongoose.Schema(
    {
        _id: {
            type: String
        },
        ownerId: {
            type: String,
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },
        topic: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },
        roomName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        maxParticipants: {
            type: Number,
            required: true,
            min: 2,
            max: 50,
            default: 12
        },
        status: {
            type: String,
            enum: {
                values: [MEETUP_STATUS.ACTIVE, MEETUP_STATUS.ENDED],
                message: "{VALUE} is not a valid Meet-Up room status"
            },
            default: MEETUP_STATUS.ACTIVE,
            index: true
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        collection: "meetup_rooms"
    }
);

meetupSchema.index({ status: 1, createdAt: -1 });
meetupSchema.index({ ownerId: 1, createdAt: -1 });

const Meetup = mongoose.models.Meetup || mongoose.model("Meetup", meetupSchema);

module.exports = {
    Meetup,
    MEETUP_STATUS
};
