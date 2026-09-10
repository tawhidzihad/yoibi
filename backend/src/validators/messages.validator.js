const { z } = require('zod');

const sendMessageBodySchema = z.object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
    content: z.string().min(1, 'Content cannot be empty').max(2000, 'Content cannot exceed 2000 characters'),
    clientMessageId: z.string().min(1, 'clientMessageId is required')
});

const listConversationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(20)
});

const conversationHistoryQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(30)
});

const conversationIdParamSchema = z.object({
    conversationId: z.string().min(1, 'Conversation ID is required')
});

module.exports = {
    sendMessageBodySchema,
    listConversationsQuerySchema,
    conversationHistoryQuerySchema,
    conversationIdParamSchema
};
