const express = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { writeLimiter, expensiveLimiter } = require("../middleware/rate-limiter");
const {
    conversationIdParamSchema,
    createConversationBodySchema,
    listConversationsQuerySchema,
    listMessagesQuerySchema,
    sendMessageBodySchema,
    markDeliveredBodySchema,
    markReadBodySchema,
    uploadIntentBodySchema
} = require("../validators/messages.validator");
const {
    handleGetConfig,
    handleCreateConversation,
    handleListConversations,
    handleGetConversationById,
    handleListMessages,
    handleSendMessage,
    handleMarkDelivered,
    handleMarkRead,
    handleCreateUploadIntent,
    handleGetActiveFriends,
    handleGetInitialPresence,
    handleSearchMessages
} = require("../controllers/messages.controller");

const router = express.Router();

// Public / Optional messaging limits configuration
router.get("/messages/config", optionalAuth, handleGetConfig);

// All subsequent messaging routes require authenticated, verified JWT
router.use("/messages", verifyJwt);

// Inbox conversations list
router.get(
    "/messages/conversations",
    validate(listConversationsQuerySchema, "query", { statusCode: 400 }),
    handleListConversations
);

// Start or find direct conversation (follow-gated)
router.post(
    "/messages/conversations",
    writeLimiter,
    validate(createConversationBodySchema, "body", { statusCode: 400 }),
    handleCreateConversation
);

// Active friends (online follows)
router.get("/messages/active-friends", handleGetActiveFriends);

// Initial presence sync
router.get("/messages/presence", handleGetInitialPresence);

// Message search within current user's conversations
router.get("/messages/search", handleSearchMessages);

// Request media upload intent
router.post(
    "/messages/media/upload-intent",
    expensiveLimiter,
    validate(uploadIntentBodySchema, "body", { statusCode: 400 }),
    handleCreateUploadIntent
);

// Single conversation metadata
router.get(
    "/messages/conversations/:id",
    validate(conversationIdParamSchema, "params", { statusCode: 400 }),
    handleGetConversationById
);

// Conversation message history
router.get(
    "/messages/conversations/:id/messages",
    validate(conversationIdParamSchema, "params", { statusCode: 400 }),
    validate(listMessagesQuerySchema, "query", { statusCode: 400 }),
    handleListMessages
);

// Send message via REST
router.post(
    "/messages/conversations/:id/messages",
    writeLimiter,
    validate(conversationIdParamSchema, "params", { statusCode: 400 }),
    validate(sendMessageBodySchema, "body", { statusCode: 400 }),
    handleSendMessage
);

// Mark delivered
router.post(
    "/messages/conversations/:id/delivered",
    validate(conversationIdParamSchema, "params", { statusCode: 400 }),
    validate(markDeliveredBodySchema, "body", { statusCode: 400 }),
    handleMarkDelivered
);

// Mark read
router.post(
    "/messages/conversations/:id/read",
    validate(conversationIdParamSchema, "params", { statusCode: 400 }),
    validate(markReadBodySchema, "body", { statusCode: 400 }),
    handleMarkRead
);

module.exports = router;
