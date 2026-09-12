const { z } = require("zod");

const mediaItemSchema = z.object({
    url: z.string().url("Media URL must be a valid URL"),
    type: z.enum(["image", "video"]).default("image"),
    publicId: z.string().optional()
});

/**
 * Schema for creating a tweet.
 * Content: 1–280 characters (trimmed).
 * MediaUrls: optional, up to 4 attachments.
 */
const createTweetSchema = z.object({
    content: z.string()
        .min(1, "Tweet cannot be empty")
        .max(280, "Tweet cannot exceed 280 characters")
        .transform((s) => s.trim()),
    mediaUrls: z.array(mediaItemSchema).max(4, "Cannot attach more than 4 media items").optional().default([]),
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
 * Schema for reply creation (same as tweet — replies are tweets with replyToId set).
 */
const createReplySchema = z.object({
    content: z.string()
        .min(1, "Reply cannot be empty")
        .max(280, "Reply cannot exceed 280 characters")
        .transform((s) => s.trim())
});

module.exports = {
    createTweetSchema,
    listTweetsQuerySchema,
    tweetIdParamSchema,
    createReplySchema
};
