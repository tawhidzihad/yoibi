const { z } = require("zod");
const { countCharacters } = require("../utils/charCount");
const {
    MESSAGE_TEXT_MAX_LENGTH,
    MESSAGE_IMAGE_MAX_BYTES,
    MESSAGE_VIDEO_MAX_BYTES
} = require("../config/constants");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const conversationIdParamSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid conversation identifier format" })
});

const createConversationBodySchema = z.object({
    recipientId: z.string().min(1, { message: "recipientId is required" })
}).strict();

const listConversationsQuerySchema = z.object({
    filter: z.enum(["all", "unread", "following", "online"]).optional().default("all"),
    search: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});

const listMessagesQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(30)
});

const mediaPayloadSchema = z.object({
    url: z.string().url({ message: "Valid media URL is required" }),
    publicId: z.string().min(1, { message: "publicId is required" }),
    resourceType: z.enum(["image", "video"]),
    bytes: z.number().int().nonnegative().optional(),
    format: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    duration: z.number().nonnegative().optional(),
    thumbnailUrl: z.string().url().optional().nullable(),
    originalFilename: z.string().optional()
});

const sendMessageBodySchema = z.object({
    clientMessageId: z.string().min(1, { message: "clientMessageId is required" }).max(100),
    type: z.enum(["text", "image", "video"]).default("text"),
    text: z.string().optional().default(""),
    uploadIntentId: z.string().optional().nullable(),
    media: mediaPayloadSchema.optional().nullable()
}).refine((data) => {
    // If type is text, text must not be empty after trim
    if (data.type === "text") {
        return typeof data.text === "string" && data.text.trim().length > 0;
    }
    // If type is image or video, media must be provided with matching resourceType
    if (data.type === "image" || data.type === "video") {
        return Boolean(data.media && data.media.resourceType === data.type);
    }
    return false;
}, {
    message: "A message must contain text or a valid media attachment corresponding to its type"
}).refine((data) => {
    // Check 2000-grapheme character limit on text/caption
    if (data.text) {
        return countCharacters(data.text) <= MESSAGE_TEXT_MAX_LENGTH;
    }
    return true;
}, {
    message: `Message text exceeds maximum length of ${MESSAGE_TEXT_MAX_LENGTH} characters`
}).refine((data) => {
    if (data.media && data.media.bytes) {
        if (data.type === "image" && data.media.bytes > MESSAGE_IMAGE_MAX_BYTES) {
            return false;
        }
        if (data.type === "video" && data.media.bytes > MESSAGE_VIDEO_MAX_BYTES) {
            return false;
        }
    }
    return true;
}, {
    message: "Media attachment exceeds maximum allowed file size"
});

const markDeliveredBodySchema = z.object({
    messageIds: z.array(z.string().min(1)).min(1, { message: "At least one messageId is required" })
}).strict();

const markReadBodySchema = z.object({
    messageIds: z.array(z.string().min(1)).optional()
}).strict();

const uploadIntentBodySchema = z.object({
    conversationId: z.string().regex(objectIdRegex, { message: "Invalid conversation identifier format" }),
    resourceType: z.enum(["image", "video"])
}).strict();

module.exports = {
    conversationIdParamSchema,
    createConversationBodySchema,
    listConversationsQuerySchema,
    listMessagesQuerySchema,
    sendMessageBodySchema,
    markDeliveredBodySchema,
    markReadBodySchema,
    uploadIntentBodySchema
};
