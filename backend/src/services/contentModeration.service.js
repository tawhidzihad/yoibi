const crypto = require('crypto');
const adminRepository = require('../repositories/admin.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const streamsRepository = require('../repositories/streams.repository');
const meetupRepository = require('../repositories/meetup.repository');
const { deleteTweet } = require('./delete/tweets.service');
const { deleteVideo } = require('./delete/videos.service');
const { terminateLiveKitRoom } = require('../integrations/livekit/livekit');

/**
 * Browses application content by type for admin review.
 *
 * @param {'tweets'|'videos'|'streams'|'meetups'} type
 * @param {Object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=20]
 * @param {string} [query.search]
 * @returns {Promise<Object>}
 */
async function browseContent(type, { page = 1, limit = 20, search }) {
    const filter = {};
    if (search) {
        if (type === 'tweets') {
            filter.content = { $regex: search, $options: 'i' };
        } else if (type === 'videos') {
            filter.title = { $regex: search, $options: 'i' };
        } else if (type === 'streams') {
            filter.title = { $regex: search, $options: 'i' };
        } else if (type === 'meetups') {
            filter.title = { $regex: search, $options: 'i' };
        }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        adminRepository.listContent(type, filter, { limit, skip, sort: { createdAt: -1 } }),
        adminRepository.countContent(type, filter)
    ]);

    return {
        type,
        items,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
}

/**
 * Deletes content with appropriate cleanup and creates an audit record.
 *
 * @param {'tweets'|'videos'|'streams'|'meetups'} type
 * @param {string} id
 * @param {Object} adminUser
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
async function deleteContent(type, id, adminUser, reason = 'Content violates moderation guidelines') {
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

    const typeMap = { tweet: 'tweets', video: 'videos', stream: 'streams', meetup: 'meetups' };
    const normalizedType = typeMap[type] || type;
    let deletedId = id;

    switch (normalizedType) {
        case 'tweets': {
            const result = await deleteTweet({ tweetId: id, user: adminUser });
            deletedId = result.deletedId;
            break;
        }
        case 'videos': {
            const result = await deleteVideo(id, adminUser);
            deletedId = result.deletedId;
            break;
        }
        case 'streams': {
            const stream = await streamsRepository.findById(id);
            if (!stream) {
                const error = new Error('Stream not found.');
                error.statusCode = 404;
                error.code = 'NOT_FOUND';
                throw error;
            }
            if (stream.roomName) {
                await terminateLiveKitRoom(stream.roomName);
            }
            await streamsRepository.deleteById(id);
            deletedId = id;
            break;
        }
        case 'meetups': {
            const room = await meetupRepository.findById(id);
            if (!room) {
                const error = new Error('Meet-Up room not found.');
                error.statusCode = 404;
                error.code = 'ROOM_NOT_FOUND';
                throw error;
            }
            if (room.roomName) {
                await terminateLiveKitRoom(room.roomName);
            }
            await meetupRepository.deleteById(id);
            deletedId = id;
            break;
        }
        default: {
            const error = new Error(`Unsupported content type: ${type}`);
            error.statusCode = 400;
            error.code = 'INVALID_CONTENT_TYPE';
            throw error;
        }
    }

    // Record audit log entry
    await auditLogRepository.create({
        _id: `aud_${crypto.randomUUID()}`,
        adminId: adminUser.id,
        action: 'DELETE_CONTENT',
        targetUserId: null,
        targetResourceId: deletedId,
        reason: reason || 'Deleted by administrator',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
    });

    return {
        deletedId,
        type
    };
}

module.exports = {
    browseContent,
    deleteContent
};
