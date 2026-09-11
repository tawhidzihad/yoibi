const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    adminId: { type: String, required: true, index: true },
    action: {
        type: String,
        required: true,
        enum: [
            'BAN_USER',
            'BLOCK_USER',
            'UNBLOCK_USER',
            'RESOLVE_REPORT',
            'DISMISS_REPORT',
            'DELETE_CONTENT'
        ],
        index: true
    },
    targetUserId: { type: String, default: null, index: true },
    targetResourceId: { type: String, default: null, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
        type: String,
        default: 'COMPLETED',
        enum: ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'FAILED'],
        index: true
    },
    failedPhase: { type: String, default: null },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date, default: null },
    deletedCounts: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    externalSnapshots: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({ cloudinary: [], livekit: [] })
    },
    failedCleanups: {
        type: [mongoose.Schema.Types.Mixed],
        default: () => []
    },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'audit_logs', _id: false });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetUserId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
