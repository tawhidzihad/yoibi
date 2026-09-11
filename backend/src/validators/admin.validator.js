const { z } = require('zod');

const blockUserBodySchema = z.object({
    reason: z.string().min(1, 'Reason is required').max(1000)
});

const banUserBodySchema = z.object({
    reason: z.string().min(1, 'Reason is required').max(1000),
    confirmationHandle: z.string().min(1, 'Confirmation handle is required')
});

const listUsersQuerySchema = z.object({
    search: z.string().max(100).optional(),
    isBlocked: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    page: z.coerce.number().min(1).default(1).optional()
});

const listContentQuerySchema = z.object({
    type: z.enum(['tweets', 'videos', 'streams', 'meetups']).default('tweets'),
    search: z.string().max(100).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    page: z.coerce.number().min(1).default(1).optional()
});

const listAuditLogsQuerySchema = z.object({
    action: z.enum([
        'BAN_USER',
        'BLOCK_USER',
        'UNBLOCK_USER',
        'RESOLVE_REPORT',
        'DISMISS_REPORT',
        'DELETE_CONTENT'
    ]).optional(),
    status: z.enum(['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'FAILED']).optional(),
    targetUserId: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    page: z.coerce.number().min(1).default(1).optional()
});

const adminUserIdParamSchema = z.object({
    id: z.string().min(1, 'Target user ID is required')
});

const contentIdParamSchema = z.object({
    id: z.string().min(1, 'Content ID is required')
});

module.exports = {
    blockUserBodySchema,
    banUserBodySchema,
    listUsersQuerySchema,
    listContentQuerySchema,
    listAuditLogsQuerySchema,
    adminUserIdParamSchema,
    contentIdParamSchema
};
