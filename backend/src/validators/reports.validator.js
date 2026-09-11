const { z } = require('zod');

const createReportBodySchema = z.object({
    targetType: z.enum(['tweet', 'video', 'stream', 'meetup', 'user']),
    targetId: z.string().min(1, 'Target ID is required'),
    reason: z.string().min(1, 'Reason is required').max(500),
    description: z.string().max(2000).optional()
});

const updateReportBodySchema = z.object({
    status: z.enum(['resolved', 'dismissed']),
    resolutionNotes: z.string().max(2000).optional()
});

const listReportsQuerySchema = z.object({
    status: z.enum(['pending', 'resolved', 'dismissed']).optional(),
    targetType: z.enum(['tweet', 'video', 'stream', 'meetup', 'user']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    page: z.coerce.number().min(1).default(1).optional()
});

const reportIdParamSchema = z.object({
    id: z.string().min(1, 'Report ID is required')
});

module.exports = {
    createReportBodySchema,
    updateReportBodySchema,
    listReportsQuerySchema,
    reportIdParamSchema
};
