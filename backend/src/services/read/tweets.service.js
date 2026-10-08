const tweetsRepository = require("../../repositories/tweets.repository");
const User = require("../../models/user.model");
const {
    FEED_DISCOVERY_EVERY,
    FEED_DISCOVERY_WINDOW_DAYS,
    FEED_DISCOVERY_POOL_SIZE,
    FEED_OWN_PIN_MINUTES
} = require("../../config/constants");
const { mulberry32, weightedRandomSelect } = require("../../utils/prng");

/**
 * Service: List paginated top-level feed tweets
 *
 * `authorHandle` (optional): server-side ownership filter for the profile
 * Tweets tab. The handle is resolved to the canonical user ID and filtering
 * happens in the database query (authorId) — never by fetching the full feed
 * and filtering in the browser, and never by comparing display names.
 *
 * `mode`: when "feed", enables seeded discovery mixing and own-post pinning.
 * When omitted or any other value, remains purely chronological (for /tweets
 * and profile tabs).
 */
async function listTweets({
    page = 1,
    limit = 20,
    _filter = "all",
    authorHandle = null,
    currentUserId = null,
    mode = null,
    seed = null
}) {
    // If not opt-in feed discovery mode, preserve 100% chronological behavior
    if (mode !== "feed") {
        const skip = (page - 1) * limit;

        let authorIds = null;
        if (authorHandle) {
            const author = await User.findOne({ handle: authorHandle }).lean();
            if (!author || !author._id) {
                // Unknown author — an empty, well-formed page (never an error).
                return {
                    items: [],
                    pagination: { page, limit, totalItems: 0, totalPages: 1, hasNextPage: false }
                };
            }
            authorIds = [author._id.toString()];
        }

        const [rawTweets, totalItems] = await Promise.all([
            tweetsRepository.findPaginated({ authorIds, skip, limit }),
            tweetsRepository.count({ authorIds })
        ]);

        const enrichedTweets = await tweetsRepository.attachAuthors(rawTweets);

        const items = enrichedTweets.map((tweet) => {
            const liked = Boolean(currentUserId && Array.isArray(tweet.likes) && tweet.likes.includes(currentUserId));
            const retweeted = Boolean(currentUserId && Array.isArray(tweet.retweets) && tweet.retweets.includes(currentUserId));
            const formatted = { ...tweet, liked, retweeted };
            delete formatted.likes;
            delete formatted.retweets;
            return formatted;
        });

        const totalPages = Math.ceil(totalItems / limit) || 1;
        const hasNextPage = page < totalPages;

        return {
            items,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage
            }
        };
    }

    // MODE === "feed": Seeded discovery tweets & own-post pinning
    const feedSeed = Number.isInteger(seed) && seed > 0
        ? seed
        : Math.floor(Math.random() * 2147483647) + 1;

    // 1. Own-post pinning on page 1 only (last FEED_OWN_PIN_MINUTES)
    let pinnedRaw = [];
    if (page === 1 && currentUserId) {
        const pinCutoff = new Date(Date.now() - FEED_OWN_PIN_MINUTES * 60 * 1000);
        pinnedRaw = await tweetsRepository.findPinnedTweets({
            authorId: currentUserId,
            since: pinCutoff
        });
    }

    const pinnedIdSet = new Set(pinnedRaw.map((t) => (t._id ? t._id.toString() : t.id)));

    // 2. Fetch discovery candidates (last FEED_DISCOVERY_WINDOW_DAYS)
    const windowCutoff = new Date(Date.now() - FEED_DISCOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const rawCandidates = await tweetsRepository.findDiscoveryCandidates({
        windowCutoff,
        limit: FEED_DISCOVERY_POOL_SIZE,
        excludeAuthorId: currentUserId
    });

    // 3. Exclude blocked / banned / deleted authors from discovery pool
    let blockedUserIds = new Set();
    let validUserIds = new Set();
    const candidateAuthorIds = [...new Set(rawCandidates.map((c) => c.authorId).filter(Boolean))];
    if (candidateAuthorIds.length > 0) {
        const [blockedUsers, validUsers] = await Promise.all([
            User.find({ isBlocked: true }, { _id: 1 }).lean(),
            User.find({ _id: { $in: candidateAuthorIds } }, { _id: 1 }).lean()
        ]);
        blockedUserIds = new Set(blockedUsers.map((u) => u._id.toString()));
        validUserIds = new Set(validUsers.map((u) => u._id.toString()));
    }

    const candidatePool = rawCandidates.filter((c) => {
        const id = c._id ? c._id.toString() : c.id;
        if (pinnedIdSet.has(id)) return false;
        if (c.replyToId) return false;
        if (currentUserId && c.authorId === currentUserId) return false;
        if (blockedUserIds.has(c.authorId)) return false;
        if (!validUserIds.has(c.authorId)) return false;
        return true;
    });

    // 4. Select deterministic discovery tweets for this seed session
    const referenceTime = Math.floor(Date.now() / 3600000) * 3600000;
    const prng = mulberry32(feedSeed);
    const allDiscoveryPicks = weightedRandomSelect(
        candidatePool,
        candidatePool.length,
        prng,
        referenceTime
    );

    const discoveryIdSet = new Set(allDiscoveryPicks.map((d) => (d._id ? d._id.toString() : d.id)));
    // Discovery and pinned tweets are strictly excluded from base query to guarantee disjoint sets
    const excludeFromBase = [...Array.from(discoveryIdSet), ...Array.from(pinnedIdSet)];

    // 5. Fetch base chronological stream (excluding discovery picks & pinned items)
    const skip = (page - 1) * limit;
    const [baseRaw, totalItems] = await Promise.all([
        tweetsRepository.findPaginated({ authorIds: null, excludeTweetIds: excludeFromBase, skip, limit }),
        tweetsRepository.count({ authorIds: null, excludeTweetIds: excludeFromBase })
    ]);

    // 6. Slice discovery picks for this specific page
    const discoveryPerPage = Math.floor(limit / FEED_DISCOVERY_EVERY);
    const pageIndex = page - 1;
    const startIdx = pageIndex * discoveryPerPage;
    const discoveryPicks = allDiscoveryPicks.slice(startIdx, startIdx + discoveryPerPage);

    // 7. Enrich all tweets with author profiles
    const allToEnrich = [...pinnedRaw, ...baseRaw, ...discoveryPicks];
    const enrichedAll = await tweetsRepository.attachAuthors(allToEnrich);
    const enrichedMap = new Map(enrichedAll.map((t) => [t.id, t]));

    const formatTweet = (tweet) => {
        const liked = Boolean(currentUserId && Array.isArray(tweet.likes) && tweet.likes.includes(currentUserId));
        const retweeted = Boolean(currentUserId && Array.isArray(tweet.retweets) && tweet.retweets.includes(currentUserId));
        const formatted = { ...tweet, liked, retweeted };
        delete formatted.likes;
        delete formatted.retweets;
        return formatted;
    };

    const pinnedFormatted = pinnedRaw.map((t) => formatTweet(enrichedMap.get(t._id ? t._id.toString() : t.id) || t));
    const baseFormatted = baseRaw.map((t) => formatTweet(enrichedMap.get(t._id ? t._id.toString() : t.id) || t));
    const discoveryFormatted = discoveryPicks.map((t) => formatTweet(enrichedMap.get(t._id ? t._id.toString() : t.id) || t));

    // 7. Interleave base tweets and discovery tweets (1 discovery after every FEED_DISCOVERY_EVERY base tweets)
    const interleaved = [];
    let discIdx = 0;
    for (let i = 0; i < baseFormatted.length; i++) {
        interleaved.push(baseFormatted[i]);
        if ((i + 1) % FEED_DISCOVERY_EVERY === 0 && discIdx < discoveryFormatted.length) {
            interleaved.push(discoveryFormatted[discIdx++]);
        }
    }

    // 8. Place pinned tweets at top (page 1 only), followed by interleaved items
    const items = [...pinnedFormatted, ...interleaved];

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNextPage = page < totalPages;

    return {
        items,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage
        },
        feedSeed
    };
}

/**
 * Formats a raw comment document into the public comment shape (personalized
 * `liked`/`retweeted` for the viewer, interaction arrays stripped).
 */
function formatComment(comment, currentUserId) {
    const liked = Boolean(currentUserId && Array.isArray(comment.likes) && comment.likes.includes(currentUserId));
    const retweeted = Boolean(currentUserId && Array.isArray(comment.retweets) && comment.retweets.includes(currentUserId));
    const copy = { ...comment, liked, retweeted };
    delete copy.likes;
    delete copy.retweets;
    return copy;
}

/**
 * Builds the Facebook-style thread structure for a tweet's comments.
 *
 * Returns an array of TOP-LEVEL comments (direct replies to the tweet), each
 * carrying a flat chronological `replies` array with ALL of its descendants
 * (any depth). The backend stores the true arbitrary-depth parent chain
 * (`replyToId`) — flattening everything deeper than the first level under the
 * top-level comment is purely a presentation/grouping rule, so deeper visual
 * nesting can be introduced later without any schema change.
 *
 * Each nested reply also carries `parentAuthor` (the author of the comment it
 * directly replied to) so clients can render "replying to @handle" context.
 */
function buildCommentThread(rawComments, currentUserId) {
    const formatted = rawComments.map((c) => formatComment(c, currentUserId));
    const byId = new Map(formatted.map((c) => [c.id, c]));

    const topLevel = [];
    const repliesByRoot = new Map();
    for (const comment of formatted) {
        const rootId = comment.rootCommentId;
        if (rootId && rootId !== comment.id && byId.has(rootId)) {
            if (!repliesByRoot.has(rootId)) {
                repliesByRoot.set(rootId, []);
            }
            repliesByRoot.get(rootId).push(comment);
        } else {
            // Direct reply to the tweet — or a defensive fallback: a reply
            // whose top-level comment no longer exists renders as top-level.
            topLevel.push(comment);
        }
    }

    for (const comment of topLevel) {
        const replies = repliesByRoot.get(comment.id) || [];
        comment.replies = replies.map((reply) => ({
            ...reply,
            parentAuthor: byId.has(reply.replyToId) ? byId.get(reply.replyToId).author : null
        }));
    }

    return topLevel;
}

/**
 * Service: Get single tweet by ID with its threaded replies
 */
async function getTweetById({ id, currentUserId = null }) {
    const rawTweet = await tweetsRepository.findById(id);
    if (!rawTweet) {
        throw { statusCode: 404, code: "NOT_FOUND", message: "Tweet not found" };
    }

    const enriched = await tweetsRepository.attachAuthors(rawTweet);
    const rawReplies = await tweetsRepository.findThreadComments(id);
    const enrichedReplies = await tweetsRepository.attachAuthors(rawReplies);

    const liked = Boolean(currentUserId && Array.isArray(rawTweet.likes) && rawTweet.likes.includes(currentUserId));
    const retweeted = Boolean(currentUserId && Array.isArray(rawTweet.retweets) && rawTweet.retweets.includes(currentUserId));

    // Threaded comment structure: top-level comments with nested reply groups.
    const replies = buildCommentThread(enrichedReplies, currentUserId);

    const result = {
        ...enriched,
        replies,
        liked,
        retweeted
    };
    delete result.likes;
    delete result.retweets;

    return result;
}

/**
 * Service: Get the threaded comment tree for a tweet
 */
async function getReplies({ tweetId, currentUserId = null }) {
    const rawReplies = await tweetsRepository.findThreadComments(tweetId);
    const enrichedReplies = await tweetsRepository.attachAuthors(rawReplies);
    const items = buildCommentThread(enrichedReplies, currentUserId);
    return { items };
}

module.exports = {
    listTweets,
    getTweetById,
    getReplies
};
