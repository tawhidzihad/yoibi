const tweetsRepository = require("../../repositories/tweets.repository");
const User = require("../../models/user.model");

/**
 * Service: List paginated top-level feed tweets
 *
 * `authorHandle` (optional): server-side ownership filter for the profile
 * Tweets tab. The handle is resolved to the canonical user ID and filtering
 * happens in the database query (authorId) — never by fetching the full feed
 * and filtering in the browser, and never by comparing display names.
 */
async function listTweets({ page = 1, limit = 20, _filter = "all", authorHandle = null, currentUserId = null }) {
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
