const messagesService = require("../services/messages.service");
const {
    MESSAGE_TEXT_MAX_LENGTH,
    MESSAGE_IMAGE_MAX_BYTES,
    MESSAGE_VIDEO_MAX_BYTES,
    MESSAGE_ALLOWED_IMAGE_TYPES,
    MESSAGE_ALLOWED_VIDEO_TYPES,
    MESSAGE_HISTORY_PAGE_SIZE,
    TYPING_TIMEOUT_MS
} = require("../config/constants");

/**
 * Returns messaging constraints and limits.
 * Public / Authenticated.
 */
async function handleGetConfig(_req, res) {
    return res.status(200).json({
        success: true,
        data: {
            textMaxLength: MESSAGE_TEXT_MAX_LENGTH,
            imageMaxBytes: MESSAGE_IMAGE_MAX_BYTES,
            videoMaxBytes: MESSAGE_VIDEO_MAX_BYTES,
            allowedImageTypes: MESSAGE_ALLOWED_IMAGE_TYPES,
            allowedVideoTypes: MESSAGE_ALLOWED_VIDEO_TYPES,
            historyPageSize: MESSAGE_HISTORY_PAGE_SIZE,
            typingTimeoutMs: TYPING_TIMEOUT_MS
        }
    });
}

/**
 * Finds or creates a direct conversation (follow-gated).
 */
async function handleCreateConversation(req, res, next) {
    try {
        const body = req.validatedBody || req.body;
        const conversation = await messagesService.findOrCreateConversation({
            userId: req.user.id,
            recipientId: body.recipientId
        });

        return res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lists user's conversations with real filters, search, and unread counts.
 */
async function handleListConversations(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await messagesService.listConversations({
            userId: req.user.id,
            filter: query.filter,
            search: query.search,
            cursor: query.cursor,
            limit: query.limit
        });

        return res.status(200).json({
            success: true,
            data: result.conversations,
            meta: {
                nextCursor: result.nextCursor,
                totalUnread: result.totalUnread
            }
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Retrieves a single conversation by ID.
 */
async function handleGetConversationById(req, res, next) {
    try {
        const params = req.validatedParams || req.params;
        const conversation = await messagesService.getConversationById({
            conversationId: params.id,
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lists message history with cursor pagination.
 */
async function handleListMessages(req, res, next) {
    try {
        const params = req.validatedParams || req.params;
        const query = req.validatedQuery || req.query;

        const result = await messagesService.listMessages({
            conversationId: params.id,
            userId: req.user.id,
            cursor: query.cursor,
            limit: query.limit
        });

        return res.status(200).json({
            success: true,
            data: result.messages,
            meta: {
                nextCursor: result.nextCursor
            }
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Sends a message via REST endpoint (calls same service as socket).
 */
async function handleSendMessage(req, res, next) {
    try {
        const params = req.validatedParams || req.params;
        const body = req.validatedBody || req.body;

        const result = await messagesService.sendMessage({
            conversationId: params.id,
            userId: req.user.id,
            clientMessageId: body.clientMessageId,
            type: body.type,
            text: body.text,
            media: body.media,
            uploadIntentId: body.uploadIntentId
        });

        return res.status(201).json({
            success: true,
            data: result.message,
            conversation: result.conversation
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Marks messages in a conversation as delivered.
 */
async function handleMarkDelivered(req, res, next) {
    try {
        const params = req.validatedParams || req.params;
        const body = req.validatedBody || req.body;

        const result = await messagesService.markDelivered({
            conversationId: params.id,
            userId: req.user.id,
            messageIds: body.messageIds
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Marks messages and conversation as read.
 */
async function handleMarkRead(req, res, next) {
    try {
        const params = req.validatedParams || req.params;
        const body = req.validatedBody || req.body;

        const result = await messagesService.markRead({
            conversationId: params.id,
            userId: req.user.id,
            messageIds: body?.messageIds
        });

        return res.status(200).json({
            success: true,
            data: result.conversation,
            meta: {
                totalUnread: result.totalUnread
            }
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Generates Cloudinary signed upload intent for image or video message.
 */
async function handleCreateUploadIntent(req, res, next) {
    try {
        const body = req.validatedBody || req.body;

        const intent = await messagesService.createUploadIntent({
            conversationId: body.conversationId,
            userId: req.user.id,
            resourceType: body.resourceType
        });

        return res.status(200).json({
            success: true,
            data: intent
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Returns active friends (followed users who are online).
 */
async function handleGetActiveFriends(req, res, next) {
    try {
        const friends = await messagesService.getActiveFriends({
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: friends
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Returns initial online statuses for connected users.
 */
async function handleGetInitialPresence(req, res, next) {
    try {
        const statuses = await messagesService.getInitialPresence({
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: statuses
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Searches messages within the current user's conversations.
 */
async function handleSearchMessages(req, res, next) {
    try {
        const q = req.query.q || "";
        const limit = Number(req.query.limit) || 20;

        const messages = await messagesService.searchMessages({
            userId: req.user.id,
            query: q,
            limit
        });

        return res.status(200).json({
            success: true,
            data: messages
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
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
};
