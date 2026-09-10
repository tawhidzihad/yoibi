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

const router = Router();

router.post(
    '/messages',
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
    verifyJwt,
    requireAuth,
    validate(conversationIdParamSchema, 'params'),
    handleMarkAsRead
);

module.exports = router;
