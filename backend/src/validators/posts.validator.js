const { z } = require("zod");

const mediaItemSchema = z.object({
    url: z.string().url("Media URL must be a valid URL"),
    type: z.enum(["image", "video"]).default("image"),
    publicId: z.string().optional()
});

const createPostSchema = z.object({
    content: z.string().max(5000, "Content cannot exceed 5000 characters").optional().default(""),
    media: z.array(mediaItemSchema).max(10, "Cannot attach more than 10 media items").optional().default([])
}).refine(
    (data) => (data.content && data.content.trim().length > 0) || (data.media && data.media.length > 0),
    {
        message: "A post must have either text content or at least one media attachment.",
        path: ["content"]
    }
);

const listPostsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    filter: z.enum(["all", "following"]).default("all")
});

const postIdParamSchema = z.object({
    id: z.string().min(1, "Post ID is required")
});

const createCommentSchema = z.object({
    content: z.string().trim().min(1, "Comment content cannot be empty").max(1000, "Comment cannot exceed 1000 characters")
});

const commentParamsSchema = z.object({
    id: z.string().min(1, "Post ID is required"),
    commentId: z.string().min(1, "Comment ID is required")
});

module.exports = {
    createPostSchema,
    listPostsQuerySchema,
    postIdParamSchema,
    createCommentSchema,
    commentParamsSchema
};
