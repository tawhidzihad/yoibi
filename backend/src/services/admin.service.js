const crypto = require('crypto');
const User = require('../models/user.model');
const Tweet = require('../models/tweet.model');
const { Video } = require('../models/video.model');
const { Stream } = require('../models/stream.model');
const { Meetup: MeetUp } = require('../models/meetup.model');
const Follow = require('../models/follow.model');
const Report = require('../models/report.model');
const tweetsRepository = require('../repositories/tweets.repository');
const adminRepository = require('../repositories/admin.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const betterAuthAdmin = require('../integrations/betterAuth/betterAuthAdmin');
const { deleteCloudinaryAsset } = require('../integrations/cloudinary/cloudinary');
const { terminateLiveKitRoom } = require('../integrations/livekit/livekit');
const { invalidateUserModerationCache } = require('../middleware/auth');

/**
 * Retrieves aggregate system metrics for admin dashboard.
 *
 * @returns {Promise<Object>}
 */
async function getDashboardStats() {
    return adminRepository.getDashboardMetrics();
}

/**
 * Lists users with filtering, searching, and pagination.
 *
 * @param {Object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=50]
 * @param {string} [query.search]
 * @param {string} [query.isBlocked]
 * @returns {Promise<Object>}
 */
async function listUsers({ page = 1, limit = 50, search, isBlocked }) {
    const filter = {};
    if (search) {
        filter.$or = [
            { handle: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }
    if (isBlocked === 'true') {
        filter.isBlocked = true;
    } else if (isBlocked === 'false') {
        filter.isBlocked = { $ne: true };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        adminRepository.listUsers(filter, { limit, skip, sort: { createdAt: -1 } }),
        adminRepository.countUsers(filter)
    ]);

    return {
        users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
}

/**
 * Retrieves detailed user moderation profile.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getUserDetail(userId) {
    const user = await adminRepository.findUserById(userId);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const [
        tweetsCount,
        videosCount,
        streamsCount,
        meetupsCount,
        reportsFiledCount,
        reportsAgainstCount,
        auditLogs
    ] = await Promise.all([
        Tweet.countDocuments({ authorId: userId }),
        Video.countDocuments({ authorId: userId }),
        Stream.countDocuments({ authorId: userId }),
        MeetUp.countDocuments({ ownerId: userId }),
        Report.countDocuments({ reporterId: userId }),
        Report.countDocuments({ targetType: 'user', targetId: userId }),
        auditLogRepository.list({ targetUserId: userId }, { limit: 10, sort: { createdAt: -1 } })
    ]);

    return {
        user,
        stats: {
            tweetsCount,
            videosCount,
            streamsCount,
            meetupsCount,
            reportsFiledCount,
            reportsAgainstCount
        },
        auditLogs
    };
}

/**
 * Blocks a user account (reversible suspension).
 *
 * @param {Object} params
 * @param {string} params.targetUserId
 * @param {string} params.reason
 * @param {Object} params.adminUser
 * @param {string} [params.adminToken]
 * @returns {Promise<Object>}
 */
async function blockUser({ targetUserId, reason, adminUser, adminToken = null }) {
    if (!adminUser || !adminUser.id) {
        const error = new Error('Administrator authentication required.');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
    }
    if (adminUser.role !== 'admin') {
        const error = new Error('Administrator privileges required.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
    }

    // Protection 1: Cannot block oneself
    if (targetUserId === adminUser.id) {
        const error = new Error('Administrators cannot block their own account.');
        error.statusCode = 403;
        error.code = 'CANNOT_BLOCK_SELF';
        throw error;
    }

    const target = await adminRepository.findUserById(targetUserId);
    if (!target) {
        const error = new Error('Target user not found.');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    // Protection 2: Cannot block another administrator
    if (target.role === 'admin') {
        const error = new Error('Administrators cannot block another administrator.');
        error.statusCode = 403;
        error.code = 'CANNOT_BLOCK_ADMIN';
        throw error;
    }

    // 1. Better Auth suspension
    await betterAuthAdmin.banUser(targetUserId, reason, adminToken);
    await betterAuthAdmin.revokeUserSessions(targetUserId, adminToken);

    // 2. Application status update
    const updatedUser = await adminRepository.updateUser(targetUserId, {
        isBlocked: true,
        blockedReason: reason,
        blockedAt: new Date(),
        blockedBy: adminUser.id
    });

    // 3. Invalidate cached moderation state immediately
    invalidateUserModerationCache(targetUserId);

    // 4. Create durable audit entry
    await auditLogRepository.create({
        _id: `aud_${crypto.randomUUID()}`,
        adminId: adminUser.id,
        action: 'BLOCK_USER',
        targetUserId,
        reason,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
    });

    return updatedUser;
}

/**
 * Unblocks a user account (restores access).
 *
 * @param {Object} params
 * @param {string} params.targetUserId
 * @param {Object} params.adminUser
 * @param {string} [params.adminToken]
 * @returns {Promise<Object>}
 */
async function unblockUser({ targetUserId, adminUser, adminToken = null }) {
    if (!adminUser || !adminUser.id) {
        const error = new Error('Administrator authentication required.');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
    }
    if (adminUser.role !== 'admin') {
        const error = new Error('Administrator privileges required.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
    }

    const target = await adminRepository.findUserById(targetUserId);
    if (!target) {
        const error = new Error('Target user not found.');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    // 1. Better Auth unban
    await betterAuthAdmin.unbanUser(targetUserId, adminToken);

    // 2. Application status restoration
    const updatedUser = await adminRepository.updateUser(targetUserId, {
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        blockedBy: null
    });

    // 3. Invalidate cached moderation state immediately
    invalidateUserModerationCache(targetUserId);

    // 4. Create durable audit entry
    await auditLogRepository.create({
        _id: `aud_${crypto.randomUUID()}`,
        adminId: adminUser.id,
        action: 'UNBLOCK_USER',
        targetUserId,
        reason: 'Account unblocked by administrator',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
    });

    return updatedUser;
}

/**
 * Canonical 5-Phase / 9-Stage Ban Orchestrator
 * Fully adheres to docs/BAN-DELETION-PLAN.md.
 *
 * @param {Object} params
 * @param {string} params.targetUserId
 * @param {string} params.reason
 * @param {string} params.confirmationHandle
 * @param {Object} params.adminUser
 * @param {string} [params.adminToken]
 * @returns {Promise<Object>}
 */
async function banUser({ targetUserId, reason, confirmationHandle, adminUser, adminToken = null }) {
    // -------------------------------------------------------------
    // Phase A — Validation & Protection (Stage A)
    // -------------------------------------------------------------
    if (!adminUser || !adminUser.id) {
        const error = new Error('Administrator authentication required.');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
    }
    if (adminUser.role !== 'admin') {
        const error = new Error('Administrator privileges required.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
    }

    // Protection 1: Self-Ban is strictly forbidden
    if (targetUserId === adminUser.id) {
        const error = new Error('Administrators cannot ban their own account.');
        error.statusCode = 403;
        error.code = 'CANNOT_BAN_SELF';
        throw error;
    }

    // Validate target existence
    const targetUser = await adminRepository.findUserById(targetUserId);
    if (!targetUser) {
        const error = new Error('Target user not found.');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    // Protection 2: Banning another administrator is strictly forbidden
    if (targetUser.role === 'admin') {
        const error = new Error('Administrators cannot ban another administrator.');
        error.statusCode = 403;
        error.code = 'CANNOT_BAN_ADMIN';
        throw error;
    }

    // Validate confirmation handle
    const rawTargetHandle = (targetUser.handle || '').replace(/^@/, '').toLowerCase();
    const rawConfirmHandle = (confirmationHandle || '').replace(/^@/, '').toLowerCase();
    if (!rawConfirmHandle || rawTargetHandle !== rawConfirmHandle) {
        const error = new Error(`Confirmation handle "${confirmationHandle}" does not match target handle "${targetUser.handle}".`);
        error.statusCode = 400;
        error.code = 'HANDLE_CONFIRMATION_MISMATCH';
        throw error;
    }

    // -------------------------------------------------------------
    // Check for Active / Incomplete Ban or Create Durable Audit Record
    // -------------------------------------------------------------
    let auditLog = await auditLogRepository.findActiveBan(targetUserId);
    if (!auditLog) {
        const auditLogId = `aud_ban_${crypto.randomUUID()}`;
        auditLog = await auditLogRepository.create({
            _id: auditLogId,
            adminId: adminUser.id,
            action: 'BAN_USER',
            targetUserId,
            reason,
            status: 'REQUESTED',
            startedAt: new Date(),
            deletedCounts: {},
            externalSnapshots: { cloudinary: [], livekit: [] },
            failedCleanups: []
        });
    }

    // Transition audit log to IN_PROGRESS
    auditLog = await auditLogRepository.update(auditLog._id, {
        status: 'IN_PROGRESS',
        updatedAt: new Date()
    });

    const externalSnapshots = auditLog.externalSnapshots || { cloudinary: [], livekit: [] };
    const failedCleanups = [];
    const deletedCounts = auditLog.deletedCounts || {};

    // -------------------------------------------------------------
    // Phase B — External Resource Teardown (Stages B–E)
    // -------------------------------------------------------------
    try {
        // Stage B: Discover and snapshot external resources if not already snapshotted
        if (!externalSnapshots.cloudinary || externalSnapshots.cloudinary.length === 0) {
            const userVideos = await Video.find({ authorId: targetUserId }).lean();
            externalSnapshots.cloudinary = userVideos
                .filter(v => v.publicId)
                .map(v => ({
                    publicId: v.publicId,
                    resourceType: 'video',
                    status: 'pending',
                    error: null
                }));
        }

        if (!externalSnapshots.livekit || externalSnapshots.livekit.length === 0) {
            const [userStreams, userMeetups] = await Promise.all([
                Stream.find({ authorId: targetUserId }).lean(),
                MeetUp.find({ ownerId: targetUserId }).lean()
            ]);

            const livekitItems = [];
            for (const s of userStreams) {
                if (s.roomName) {
                    livekitItems.push({
                        roomName: s.roomName,
                        resourceType: 'stream',
                        status: 'pending',
                        error: null
                    });
                }
            }
            for (const m of userMeetups) {
                if (m.roomName) {
                    livekitItems.push({
                        roomName: m.roomName,
                        resourceType: 'meetup',
                        status: 'pending',
                        error: null
                    });
                }
            }
            externalSnapshots.livekit = livekitItems;
        }

        // Persist external snapshots before executing teardowns
        await auditLogRepository.update(auditLog._id, {
            externalSnapshots
        });

        // Stage C: Teardown LiveKit rooms
        for (const item of externalSnapshots.livekit) {
            if (item.status === 'completed') continue; // Idempotent resume
            try {
                const ok = await terminateLiveKitRoom(item.roomName);
                if (ok) {
                    item.status = 'completed';
                    item.error = null;
                } else {
                    item.status = 'failed';
                    item.error = 'LiveKit termination returned false';
                    failedCleanups.push(item);
                }
            } catch (err) {
                item.status = 'failed';
                item.error = err.message || 'LiveKit termination error';
                failedCleanups.push(item);
            }
        }

        // Stage D: Destroy Cloudinary assets
        for (const item of externalSnapshots.cloudinary) {
            if (item.status === 'completed') continue; // Idempotent resume
            try {
                const res = await deleteCloudinaryAsset(item.publicId);
                if (res.success) {
                    item.status = 'completed';
                    item.error = null;
                } else {
                    item.status = 'failed';
                    item.error = res.error || 'Cloudinary asset deletion failed';
                    failedCleanups.push(item);
                }
            } catch (err) {
                item.status = 'failed';
                item.error = err.message || 'Cloudinary asset deletion error';
                failedCleanups.push(item);
            }
        }

        // Update snapshots and failed cleanups
        await auditLogRepository.update(auditLog._id, {
            externalSnapshots,
            failedCleanups
        });
    } catch (phaseBError) {
        console.error('[Ban Orchestrator] Phase B error:', phaseBError);
        await auditLogRepository.update(auditLog._id, {
            status: 'FAILED',
            failedPhase: 'Phase B — External Resource Teardown',
            error: phaseBError.message,
            failedCleanups
        });
        throw phaseBError;
    }

    // -------------------------------------------------------------
    // Phase C — Application Data Purge & Anonymization (Stage F)
    // -------------------------------------------------------------
    try {
        // 1. Tweet Cleanups
        const userTweets = await Tweet.find({ authorId: targetUserId }).lean();
        for (const t of userTweets) {
            if (t.replyToId) {
                await tweetsRepository.decrementRepliesCount(t.replyToId);
            }
        }
        const tweetDeleteRes = await Tweet.deleteMany({ authorId: targetUserId });
        deletedCounts.tweets = (deletedCounts.tweets || 0) + (tweetDeleteRes.deletedCount || 0);

        // Remove interactions on surviving tweets
        await Tweet.updateMany(
            { likes: targetUserId },
            { $pull: { likes: targetUserId }, $inc: { likesCount: -1 } }
        );
        await Tweet.updateMany({ likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });

        await Tweet.updateMany(
            { retweets: targetUserId },
            { $pull: { retweets: targetUserId }, $inc: { retweetCount: -1 } }
        );
        await Tweet.updateMany({ retweetCount: { $lt: 0 } }, { $set: { retweetCount: 0 } });

        // 2. Video Cleanups
        const videoDeleteRes = await Video.deleteMany({ authorId: targetUserId });
        deletedCounts.videos = (deletedCounts.videos || 0) + (videoDeleteRes.deletedCount || 0);

        // Remove video likes
        await Video.updateMany(
            { likes: targetUserId },
            { $pull: { likes: targetUserId }, $inc: { likesCount: -1 } }
        );
        await Video.updateMany({ likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });

        // 3. Streams Cleanups
        const streamDeleteRes = await Stream.deleteMany({ authorId: targetUserId });
        deletedCounts.streams = (deletedCounts.streams || 0) + (streamDeleteRes.deletedCount || 0);

        // 4. Meet-Ups Cleanups
        const meetupDeleteRes = await MeetUp.deleteMany({ ownerId: targetUserId });
        deletedCounts.meetups = (deletedCounts.meetups || 0) + (meetupDeleteRes.deletedCount || 0);

        // 5. Follows Cleanups (Bidirectional + Counter updates)
        const outgoingFollows = await Follow.find({ followerId: targetUserId }).lean();
        for (const f of outgoingFollows) {
            await User.findByIdAndUpdate(f.followingId, { $inc: { followersCount: -1 } });
        }
        await Follow.deleteMany({ followerId: targetUserId });

        const incomingFollows = await Follow.find({ followingId: targetUserId }).lean();
        for (const f of incomingFollows) {
            await User.findByIdAndUpdate(f.followerId, { $inc: { followingCount: -1 } });
        }
        await Follow.deleteMany({ followingId: targetUserId });

        // Guard against negative follower/following counters
        await User.updateMany({ followersCount: { $lt: 0 } }, { $set: { followersCount: 0 } });
        await User.updateMany({ followingCount: { $lt: 0 } }, { $set: { followingCount: 0 } });

        deletedCounts.follows = (outgoingFollows.length || 0) + (incomingFollows.length || 0);

        // 6. Reports Policy: Moderation reports are PRESERVED and never deleted
    } catch (phaseCError) {
        console.error('[Ban Orchestrator] Phase C error:', phaseCError);
        await auditLogRepository.update(auditLog._id, {
            status: 'FAILED',
            failedPhase: 'Phase C — Application Data Purge & Anonymization',
            error: phaseCError.message,
            deletedCounts,
            failedCleanups
        });
        throw phaseCError;
    }

    // -------------------------------------------------------------
    // Phase D — Account & Identity Removal (Stages G–H)
    // -------------------------------------------------------------
    try {
        // Stage G: Better Auth account removal & session revocation
        await betterAuthAdmin.removeUser(targetUserId, adminToken);
        await betterAuthAdmin.revokeUserSessions(targetUserId, adminToken);

        // Stage H: MongoDB User document purge
        await adminRepository.deleteUser(targetUserId);

        // Invalidate moderation cache
        invalidateUserModerationCache(targetUserId);
    } catch (phaseDError) {
        console.error('[Ban Orchestrator] Phase D error:', phaseDError);
        await auditLogRepository.update(auditLog._id, {
            status: 'FAILED',
            failedPhase: 'Phase D — Account & Identity Removal',
            error: phaseDError.message,
            deletedCounts,
            failedCleanups
        });
        throw phaseDError;
    }

    // -------------------------------------------------------------
    // Phase E — Audit Finalization (Stage I)
    // -------------------------------------------------------------
    const finalStatus = failedCleanups.length > 0 ? 'PARTIAL' : 'COMPLETED';
    const failedPhase = failedCleanups.length > 0 ? 'Phase B — External Resource Teardown' : null;

    const finalizedAudit = await auditLogRepository.update(auditLog._id, {
        status: finalStatus,
        failedPhase,
        deletedCounts,
        externalSnapshots,
        failedCleanups,
        completedAt: new Date()
    });

    return {
        auditLogId: finalizedAudit._id,
        status: finalStatus,
        deletedCounts,
        failedCleanups
    };
}

/**
 * Lists audit logs for compliance tracking.
 *
 * @param {Object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=50]
 * @param {string} [query.action]
 * @param {string} [query.status]
 * @param {string} [query.targetUserId]
 * @returns {Promise<Object>}
 */
async function listAuditLogs({ page = 1, limit = 50, action, status, targetUserId }) {
    const filter = {};
    if (action) filter.action = action;
    if (status) filter.status = status;
    if (targetUserId) filter.targetUserId = targetUserId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        auditLogRepository.list(filter, { limit, skip, sort: { createdAt: -1 } }),
        auditLogRepository.count(filter)
    ]);

    return {
        auditLogs: logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
}

module.exports = {
    getDashboardStats,
    listUsers,
    getUserDetail,
    blockUser,
    unblockUser,
    banUser,
    listAuditLogs
};
