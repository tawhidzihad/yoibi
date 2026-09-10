const { z } = require("zod");
const { CANONICAL_CATEGORIES } = require("../models/video.model");

// Maximum application upload limit: 100 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const createVideoSchema = z.object({
    uploadIntentId: z.string().min(1, "uploadIntentId is required"),
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
    category: z.enum(CANONICAL_CATEGORIES).optional().nullable(),
    videoUrl: z.string().url("Must be a valid video URL"),
    thumbnailUrl: z.string().url("Must be a valid thumbnail URL").or(z.literal("")).optional().default(""),
    publicId: z.string().optional(),
    duration: z.coerce.number().min(0).optional().default(0),
    bytes: z
        .coerce.number()
        .int()
        .min(0)
        .max(MAX_VIDEO_BYTES, "Video size exceeds maximum 100 MB application limit")
        .optional()
        .default(0),
    width: z.coerce.number().int().positive().optional().nullable(),
    height: z.coerce.number().int().positive().optional().nullable(),
    format: z.enum(["mp4", "webm", "mov", "quicktime"]).optional().default("mp4")
});

const listVideosQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    category: z.enum(CANONICAL_CATEGORIES).optional(),
    authorId: z.string().optional(),
    search: z.string().max(100).optional()
});

const videoIdParamSchema = z.object({
    id: z.string().min(1, "Video ID is required")
});

module.exports = {
    createVideoSchema,
    listVideosQuerySchema,
    videoIdParamSchema,
    MAX_VIDEO_BYTES
};
