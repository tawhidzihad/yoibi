const tweetsRepository = require("../../repositories/tweets.repository");
const {
    verifyAndConsumeIntent,
    createTweetImageUploadIntent
} = require("../../integrations/cloudinary/cloudinary");
const { TWEET_MAX_LENGTH } = require("../../config/constants");
const { countCharacters } = require("../../utils/charCount");

/**
 * Service: Create a new Tweet
 * Author ID is always taken from the verified JWT user — never trusted from client.
 *
 * Media provenance: every media item must reference a server-issued tweet-image
 * upload intent. Each intent is verified (existence, expiry, ownership by the
 * authenticated user, exact publicId match, URL correspondence) and consumed
 * exactly once. The stored record uses the server-authorized canonical identity
 * (intent.publicId) — never a raw client-supplied public ID — so:
 *   server-authorized asset identity === Cloudinary uploaded asset identity
 *   === stored Tweet media record.
 */
async function createTweet({ user, content, media = [], replyToId = null }) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (!content || !content.trim()) {
        throw { statusCode: 400, code: "VALIDATION_ERROR", message: "Tweet content is required" };
    }

    if (countCharacters(content.trim()) > TWEET_MAX_LENGTH) {
        throw { statusCode: 400, code: "VALIDATION_ERROR", message: `Tweet cannot exceed ${TWEET_MAX_LENGTH} characters` };
    }

    let parent = null;
    let rootTweetId = null;
    let rootCommentId = null;
    // If this is a reply, ensure the parent exists. The parent may be a
    // top-level tweet OR an existing comment (replies are tweets too) —
    // replying to a comment is what creates the nested thread. The thread
    // roots are derived SERVER-SIDE from the stored parent, never from the
    // client, so a comment can never be attributed to a foreign thread.
    if (replyToId) {
        parent = await tweetsRepository.findById(replyToId);
        if (!parent) {
            throw { statusCode: 404, code: "NOT_FOUND", message: "Parent tweet not found" };
        }
        const parentId = parent._id ? parent._id.toString() : parent.id;
        const parentIsComment = Boolean(parent.replyToId);
        if (parentIsComment) {
            // Parent is a comment: inherit its thread roots. `rootTweetId`
            // falls back to the parent's own replyToId for legacy comments
            // stored before rootTweetId existed (their replyToId IS the tweet).
            rootTweetId = parent.rootTweetId || parent.replyToId;
            rootCommentId = parent.rootCommentId || parentId;
        } else {
            // Parent is a top-level tweet: start a new comment thread.
            rootTweetId = parentId;
            rootCommentId = null;
        }
    }

    // Strict asset-provenance verification for every attached image.
    // All-or-nothing: a single invalid attachment rejects the whole tweet so
    // no partial/unverified media is ever stored. Security is never weakened
    // to make uploads succeed.
    const mediaList = Array.isArray(media) ? media : [];
    const verifiedMedia = [];
    for (const item of mediaList) {
        const verification = verifyAndConsumeIntent({
            uploadIntentId: item && item.uploadIntentId,
            userId: user.id,
            publicId: item && item.publicId,
            url: item && item.url
        });

        if (!verification.valid) {
            throw { statusCode: 403, code: "FORBIDDEN", message: verification.error };
        }

        verifiedMedia.push({
            url: String(item.url).trim(),
            type: "image",
            // Canonical identity comes from the server intent — never from the
            // raw client-supplied publicId string.
            publicId: verification.intent.publicId,
            ...(Number.isInteger(item.width) && item.width > 0 ? { width: item.width } : {}),
            ...(Number.isInteger(item.height) && item.height > 0 ? { height: item.height } : {}),
            ...(Number.isInteger(item.bytes) && item.bytes > 0 ? { bytes: item.bytes } : {}),
            ...(typeof item.format === "string" && item.format.length > 0 ? { format: item.format } : {})
        });
    }

    const tweetId = `tweet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const tweetDoc = {
        _id: tweetId,
        authorId: user.id,
        content: content.trim(),
        mediaUrls: verifiedMedia,
        likes: [],
        likesCount: 0,
        retweets: [],
        retweetCount: 0,
        repliesCount: 0,
        replyToId: replyToId || null,
        rootTweetId,
        rootCommentId,
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const created = await tweetsRepository.create(tweetDoc);

    // If this is a reply, increment the parent's repliesCount. For a NESTED
    // reply (reply to a comment) the root tweet's repliesCount — the total
    // comment count of the thread — is incremented as well, so the parent
    // tweet always reflects every comment in its thread.
    if (replyToId) {
        await tweetsRepository.incrementRepliesCount(replyToId);
        if (rootTweetId && rootTweetId !== replyToId) {
            await tweetsRepository.incrementRepliesCount(rootTweetId);
        }
    }

    const enriched = await tweetsRepository.attachAuthors(created);

    return {
        ...enriched,
        liked: false,
        retweeted: false
    };
}

/**
 * Service: Generate a server-signed Cloudinary upload authorization for ONE
 * tweet image of the authenticated user. The folder and exact publicId are
 * server-controlled per user; CLOUDINARY_API_SECRET never leaves the server.
 */
async function generateTweetImageSignature(user) {
    if (!user || !user.id) {
        throw { statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    return createTweetImageUploadIntent(user.id);
}

module.exports = { createTweet, generateTweetImageSignature };
