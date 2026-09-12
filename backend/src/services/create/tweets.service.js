const tweetsRepository = require("../../repositories/tweets.repository");
const {
    verifyAndConsumeIntent,
    createTweetImageUploadIntent
} = require("../../integrations/cloudinary/cloudinary");

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

    let parent = null;
    // If this is a reply, ensure the parent tweet exists
    if (replyToId) {
        parent = await tweetsRepository.findById(replyToId);
        if (!parent) {
            throw { statusCode: 404, code: "NOT_FOUND", message: "Parent tweet not found" };
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
        isRetweet: false,
        quoteTweet: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const created = await tweetsRepository.create(tweetDoc);

    // If this is a reply, increment the parent's repliesCount
    if (replyToId) {
        await tweetsRepository.incrementRepliesCount(replyToId);
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
