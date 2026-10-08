const { z } = require("zod");

// Tweet images are server-authorized direct Cloudinary uploads (never
// free-form URLs). Each entry must reference a server-issued upload intent:
//  - uploadIntentId: the server intent that authorized this asset
//  - publicId: the exact server-assigned canonical asset path
//    (yoibi/tweets/{userId}/intent_tweetimg_...)
//  - url: the Cloudinary secure_url returned for that exact asset
//  - width/height/bytes/format: optional delivery metadata from the upload
// The service strictly verifies intent ownership, expiry, publicId and URL
// correspondence before consuming the intent and storing the media record.
const tweetMediaItemSchema = z.object({
    uploadIntentId: z.string().min(1, "uploadIntentId is required"),
    publicId: z.string().min(1, "publicId is required"),
    url: z.string().url("Media URL must be a valid URL"),
    type: z.literal("image").default("image"),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    bytes: z.number().int().positive().optional(),
    format: z.string().max(10).optional()
});

const { TWEET_MAX_LENGTH } = require("../config/constants");
const { countCharacters } = require("../utils/charCount");

/**
 * Schema for creating a tweet.
 * Content: 1–380 characters (trimmed).
 * Media: optional, up to 5 server-authorized Cloudinary image attachments.
 */
const createTweetSchema = z.object({
    content: z.string()
        .min(1, "Tweet cannot be empty")
        .refine((val) => countCharacters(val.trim()) <= TWEET_MAX_LENGTH, {
            message: `Tweet cannot exceed ${TWEET_MAX_LENGTH} characters`
        })
        .transform((s) => s.trim()),
    media: z.array(tweetMediaItemSchema).max(5, "Cannot attach more than 5 media items").optional().default([]),
    replyToId: z.string().optional().nullable().default(null)
}).refine(
    (data) => data.content.length >= 1,
    {
        message: "Tweet content is required.",
        path: ["content"]
    }
);

/**
 * Schema for listing / paginating tweets.
 * `authorHandle`: optional server-side ownership filter — resolves the handle
 * to the canonical user ID in the service and filters by `authorId` (never by
 * display-name comparison). Used by the profile Tweets tab.
 */
const listTweetsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    filter: z.enum(["all", "following"]).default("all"),
    mode: z.enum(["feed", "tweets"]).optional(),
    seed: z.coerce.number().int().min(1).optional(),
    cursor: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Cursor must be alphanumeric").max(100).optional(),
    authorHandle: z
        .string()
        .max(30)
        .optional()
        .transform((value) => (value ? value.trim().replace(/^@+/, "").toLowerCase() : undefined))
});

/**
 * Schema for :id param validation.
 */
const tweetIdParamSchema = z.object({
    id: z.string().min(1, "Tweet ID is required")
});

/**
 * Schema for reply creation (replies are tweets with replyToId set).
 * `replyToId` is injected server-side from the URL param before validation —
 * it is never trusted from the client body. Requiring it here is fail-safe:
 * if the route ever fails to inject it, the request is rejected (422) instead
 * of silently storing the reply as a standalone top-level tweet.
 */
const createReplySchema = z.object({
    content: z.string()
        .min(1, "Reply cannot be empty")
        .refine((val) => countCharacters(val.trim()) <= TWEET_MAX_LENGTH, {
            message: `Reply cannot exceed ${TWEET_MAX_LENGTH} characters`
        })
        .transform((s) => s.trim()),
    replyToId: z.string().min(1, "Parent tweet ID is required")
});

module.exports = {
    createTweetSchema,
    tweetMediaItemSchema,
    listTweetsQuerySchema,
    tweetIdParamSchema,
    createReplySchema
};
