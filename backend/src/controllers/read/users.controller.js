const User = require('../../models/user.model');
const followsRepository = require('../../repositories/follows.repository');
const tweetsRepository = require('../../repositories/tweets.repository');
const videosRepository = require('../../repositories/videos.repository');
const streamsRepository = require('../../repositories/streams.repository');
const { normalizeHandleParam } = require('../../utils/handles');


/**
 * Pure public-profile projection. The ONLY fields returned by the public
 * profile endpoint: never email, age, phone, role, block moderation state,
 * or any Better Auth/authentication data.
 */
function buildPublicProfile(user, { isFollowing = false, isOwner = false, counts = {} } = {}) {
    const tweetsCount = Number(counts.tweetsCount) || 0;
    return {
        id: user._id ? user._id.toString() : '',
        handle: user.handle || '',
        name: user.name || '',
        bio: user.bio || '',
        country: user.country || '',
        avatarUrl: user.avatarUrl || '',
        bannerUrl: user.bannerUrl || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        // Real content counts — server-computed from canonical authorId ownership
        tweetsCount,
        videosCount: Number(counts.videosCount) || 0,
        streamsCount: Number(counts.streamsCount) || 0,
        // Legacy alias kept for API-contract compatibility (posts === tweets in YOIBI)
        postsCount: tweetsCount,
        isFollowing: Boolean(isFollowing),
        isOwner: Boolean(isOwner),
        createdAt: user.createdAt
    };
}

/**
 * Collects the real content counts for a user from each canonical domain
 * repository (tweets/videos/streams), all keyed by the canonical user ID.
 * Each domain owns its own count query (authorId-based — never name matching).
 */
async function collectProfileCounts(userId) {
    const [tweetsCount, videosCount, streamsCount] = await Promise.all([
        tweetsRepository.count({ authorIds: [userId] }),
        videosRepository.count({ authorId: userId }),
        // status: null counts streams across every lifecycle state (ready/live/ended)
        streamsRepository.count({ authorId: userId, status: null })
    ]);
    return { tweetsCount, videosCount, streamsCount };
}

/**
 * Controller: Public user profile lookup by handle
 * Auth: Required (verifyJwt). Profile pages live in the protected area;
 * identity (for isFollowing/isOwner) comes only from the verified JWT.
 */
async function getPublicProfile(req, res) {
    const handle = normalizeHandleParam(req.params.handle);
    try {
        if (!handle) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' }
            });
        }
        const user = await User.findOne({ handle }).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' }
            });
        }
        const id = user._id ? user._id.toString() : '';
        const isOwner = Boolean(req.user && req.user.id && req.user.id === id);

        const [isFollowing, counts] = await Promise.all([
            req.user && !isOwner ? followsRepository.isFollowing(req.user.id, id) : Promise.resolve(false),
            collectProfileCounts(id)
        ]);

        const data = buildPublicProfile(user, { isFollowing, isOwner, counts });
        return res.status(200).json({ success: true, data, message: '' });
    } catch (err) {
        console.error('[getPublicProfile] error:', err);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }
        });
    }
}

module.exports = { getPublicProfile, buildPublicProfile, collectProfileCounts };
