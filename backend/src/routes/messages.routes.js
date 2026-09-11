const { Router } = require('express');
const {
    handleSendMessage,
    handleListConversations,
    handleGetConversationHistory,
    handleMarkAsRead
} = require('../controllers/messages.controller');
const { verifyJwt } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
    sendMessageBodySchema,
    listConversationsQuerySchema,
    conversationHistoryQuerySchema,
    conversationIdParamSchema
} = require('../validators/messages.validator');
const { writeLimiter } = require('../middleware/rate-limiter');

const router = Router();

router.post(
    '/messages',
    writeLimiter,
    verifyJwt,
    requireAuth,
    validate(sendMessageBodySchema, 'body'),
    handleSendMessage
);

router.get(
    '/messages/conversations',
    verifyJwt,
    requireAuth,
    validate(listConversationsQuerySchema, 'query'),
    handleListConversations
);

router.get(
    '/messages/conversations/:conversationId',
    verifyJwt,
    requireAuth,
    validate(conversationIdParamSchema, 'params'),
    validate(conversationHistoryQuerySchema, 'query'),
    handleGetConversationHistory
);

router.patch(
    '/messages/conversations/:conversationId/read',
    writeLimiter,
    verifyJwt,
    requireAuth,
    validate(conversationIdParamSchema, 'params'),
    handleMarkAsRead
);

module.exports = router;
