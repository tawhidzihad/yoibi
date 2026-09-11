const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    reporterId: { type: String, required: true, index: true },
    targetType: {
        type: String,
        required: true,
        enum: ["tweet", "video", "stream", "meetup", "user"],
        index: true
    },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "resolved", "dismissed"],
        index: true
    },
    resolutionNotes: { type: String, default: null, trim: true, maxlength: 2000 },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "reports", _id: false });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("Report", reportSchema);
