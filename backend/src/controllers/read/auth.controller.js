const User = require('../../models/user.model');
const { findProfileOrCreate } = require('../../services/userProfile.service');
// Same canonical count helper the profile page uses — the sidebar/right-side
// user card must never compute its own duplicated statistics.
const { collectProfileCounts } = require('./users.controller');
const { HANDLE_PREFIX, deriveHandleBaseFor } = require('../../utils/handles');

/**
 * Controller: Handles GET /api/v1/auth/me
 * Returns the authenticated user's profile and identity.
 * Authentication identity (id, email, role, isBlocked) is derived from the
 * verified Better Auth JWT (server-side); mutable application profile data
 * (name, handle, avatarUrl, bio) comes from the MongoDB User collection.
 * If no profile exists yet, one is created server-side from verified JWT
 * claims (Better Auth user exists -> YOIBI profile exists).
 */
async function getMe(req, res) {
    if (!req.user) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'User context not available' }
        });
    }

    const {
        id,
        email,
        name: jwtName = '',
        handle: jwtHandle = '',
        role: jwtRole,
        isBlocked = false,
        avatarUrl: jwtAvatar = '',
        createdAt: jwtCreatedAt
    } = req.user;

    let profile = null;

    try {
        if (id) {
            const profileDoc = await findProfileOrCreate({
                userId: id,
                name: jwtName,
                email: email || '',
                avatarUrl: jwtAvatar,
                // Google/OAuth JWT claims are unreliable server-side — the
                // service derives the canonical handle from name/email only.
            });
            if (profileDoc) {
                profile = profileDoc && typeof profileDoc.toObject === 'function' ? profileDoc.toObject() : profileDoc;
                // Defensive repair for legacy rows: if a profile exists but its
                // handle carries a literal "@" prefix, the public lookup (which
                // queries the bare normalized form) can never match it. Repair
                // the row to its canonical bare form (best-effort).
                if (profile && typeof profile.handle === 'string' && profile.handle.startsWith('@')) {
                    try {
                        const bare = profile.handle.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 24);
                        if (bare && bare.length >= 3) {
                            const collision = await User.findOne({ handle: bare, _id: { $ne: profile._id } }).lean().catch(() => null);
                            if (!collision) {
                                await User.updateOne({ _id: profile._id }, { $set: { handle: bare, updatedAt: new Date() } }).catch(() => {});
                                profile.handle = bare;
                            }
                        }
                    } catch {
                        // Best-effort only — never fail /auth/me on repair.
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[getMe] MongoDB profile query warning:', err.message);
    }

    const fallbackHandle = `${HANDLE_PREFIX}${deriveHandleBaseFor({
        name: jwtName,
        email,
        userId: id
    })}`;

    // Canonical DB-backed counts — the SAME source the profile page uses, so
    // the right-side user card / sidebar can never show stale duplicated stats
    // (tweet create/delete, follow/unfollow all land here on refresh).
    let counts = { tweetsCount: 0, videosCount: 0, streamsCount: 0 };
    try {
        counts = await collectProfileCounts(id);
    } catch (err) {
        console.warn('[getMe] profile counts warning:', err.message);
    }

    const tweetsCount = Number(counts.tweetsCount) || 0;

    const data = {
        id,
        email,
        name: profile?.name || jwtName || '',
        handle: profile?.handle || jwtHandle || fallbackHandle,
        avatarUrl: profile?.avatarUrl || jwtAvatar || '',
        bannerUrl: profile?.bannerUrl || '',
        bio: profile?.bio || '',
        country: profile?.country || '',
        age: profile?.age ?? null,
        phone: profile?.phone || '',
        role: normalizeMeRole((profile?.role || jwtRole || 'user')),
        isBlocked: profile ? Boolean(profile.isBlocked) : Boolean(isBlocked),
        // Live follower/following counts from the canonical users document
        followersCount: profile?.followersCount || 0,
        followingCount: profile?.followingCount || 0,
        // Real content counts (authorId-based) + legacy postsCount alias
        // (posts === tweets in YOIBI, per the API contract).
        tweetsCount,
        postsCount: tweetsCount,
        videosCount: Number(counts.videosCount) || 0,
        streamsCount: Number(counts.streamsCount) || 0,
        createdAt: profile?.createdAt || jwtCreatedAt || new Date().toISOString(),
        updatedAt: profile?.updatedAt || new Date().toISOString()
    };

    return res.status(200).json({ success: true, data, message: '' });
}

/**
 * Restricts the /auth/me role to the only two YOIBI application roles.
 *
 * @param {string} [value]
 * @returns {'user'|'admin'}
 */
function normalizeMeRole(value) {
    return value === 'admin' ? 'admin' : 'user';
}

module.exports = {
    getMe
};
