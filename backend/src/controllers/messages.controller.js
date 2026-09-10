const messagesService = require('../services/messages.service');

/**
 * Controller: Send a direct message
 * Auth: Required (req.user.id)
 */
async function handleSendMessage(req, res, next) {
    try {
        const senderId = req.user.id;
        const { recipientId, content, clientMessageId } = req.body;

        const result = await messagesService.sendMessage({
            senderId,
            recipientId,
            content,
            clientMessageId
        });

        // 200 if idempotent retry, 201 if created freshly
        const statusCode = result.isRetry ? 200 : 201;

        return res.status(statusCode).json({
            success: true,
            data: result.message,
            message: result.isRetry ? 'Message already sent (idempotent)' : 'Message sent successfully'
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: List conversations for authenticated user
 * Auth: Required (req.user.id)
 */
async function handleListConversations(req, res, next) {
    try {
        const userId = req.user.id;
        const { page, limit } = req.query;

        const result = await messagesService.listConversations(userId, { page, limit });

        return res.status(200).json({
            success: true,
            data: result,
            message: ''
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Get message history for conversation
 * Auth: Required (req.user.id)
 */
async function handleGetConversationHistory(req, res, next) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { page, limit } = req.query;

        const result = await messagesService.getConversationHistory(conversationId, userId, {
            page,
            limit
        });

        return res.status(200).json({
            success: true,
            data: result,
            message: ''
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

/**
 * Controller: Mark conversation messages as read
 * Auth: Required (req.user.id)
 */
async function handleMarkAsRead(req, res, next) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const result = await messagesService.markAsRead(conversationId, userId);

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Conversation marked as read'
        });
    } catch (err) {
        if (err.status || err.statusCode) {
            return res.status(err.status || err.statusCode).json({
                success: false,
                error: {
                    code: err.code || 'ERROR',
                    message: err.message
                }
            });
        }
        return next(err);
    }
}

module.exports = {
    handleSendMessage,
    handleListConversations,
    handleGetConversationHistory,
    handleMarkAsRead
};
