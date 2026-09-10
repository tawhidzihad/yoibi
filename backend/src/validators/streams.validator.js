const { z } = require("zod");
const { CANONICAL_CATEGORIES, STREAM_STATUS } = require("../models/stream.model");

const createStreamSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(120, "Title cannot exceed 120 characters"),
    description: z
        .string()
        .trim()
        .max(2000, "Description cannot exceed 2000 characters")
        .optional()
        .default(""),
    category: z.enum(CANONICAL_CATEGORIES).optional().default("conversations"),
    thumbnailUrl: z
        .string()
        .url("Must be a valid thumbnail URL")
        .or(z.literal(""))
        .optional()
        .nullable()
        .default(null)
});

const listStreamsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(Object.values(STREAM_STATUS)).optional().default(STREAM_STATUS.LIVE),
    category: z.enum(CANONICAL_CATEGORIES).optional(),
    authorId: z.string().optional()
});

const streamIdParamSchema = z.object({
    id: z.string().min(1, "Stream ID is required")
});

module.exports = {
    createStreamSchema,
    listStreamsQuerySchema,
    streamIdParamSchema
};
