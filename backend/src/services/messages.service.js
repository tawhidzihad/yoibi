const messagesRepository = require('../repositories/messages.repository');
const followsRepository = require('../repositories/follows.repository');
const User = require('../models/user.model');

function formatMessage(msg) {
    if (!msg) return null;
    return {
        id: (msg._id ? msg._id.toString() : msg.id),
        conversationId: msg.conversationId ? msg.conversationId.toString() : '',
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        clientMessageId: msg.clientMessageId,
        readAt: msg.readAt || null,
        createdAt: msg.createdAt
    };
}

class MessagesService {
    /**
     * Sends a direct message.
     * Enforces:
     * 1. Non-empty required fields
     * 2. Self-messaging prevention
     * 3. Idempotency (returns existing message on retry without duplicate insert)
     * 4. Follow-gated permission (sender must follow recipient)
     * 5. Conversation find/create with canonical ordering
     * 6. Persistence before broadcast
     *
     * @param {{ senderId: string, recipientId: string, content: string, clientMessageId: string }} params
     * @returns {Promise<{ message: any, conversationId: string, isRetry: boolean }>}
     */
    async sendMessage({ senderId, recipientId, content, clientMessageId }) {
        if (!senderId || !recipientId || !content || !clientMessageId) {
            const error = new Error('recipientId, content, and clientMessageId are required');
            error.code = 'VALIDATION_ERROR';
            error.status = 422;
            throw error;
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
            const error = new Error('Message content must be between 1 and 2000 characters');
            error.code = 'VALIDATION_ERROR';
            error.status = 422;
            throw error;
        }

        if (senderId === recipientId) {
            const error = new Error('Cannot message yourself');
            error.code = 'CANNOT_MESSAGE_SELF';
            error.status = 400;
            throw error;
        }

        // Idempotency check: if message already persisted with this idempotency key, return it safely
        const existing = await messagesRepository.findMessageByIdempotency(senderId, clientMessageId);
        if (existing) {
            return {
                message: formatMessage(existing),
                conversationId: existing.conversationId.toString(),
                isRetry: true
            };
        }

        // Target user verification
        const recipientUser = await User.findById(recipientId).lean();
        if (!recipientUser) {
            const error = new Error('Recipient user not found');
            error.code = 'NOT_FOUND';
            error.status = 404;
            throw error;
        }

        // Follow relationship check: sender must follow recipient
        const isFollowing = await followsRepository.isFollowing(senderId, recipientId);
        if (!isFollowing) {
            const error = new Error('You can only message users whom you follow.');
            error.code = 'DM_FOLLOW_REQUIRED';
            error.status = 403;
            throw error;
        }

        // Find or create canonical conversation
        const conversation = await messagesRepository.findOrCreateConversation(senderId, recipientId);

        // Persist message
        let createdMessage;
        try {
            createdMessage = await messagesRepository.createMessage({
                conversationId: conversation._id,
                senderId,
                recipientId,
                content: trimmedContent,
                clientMessageId
            });
        } catch (err) {
            // Handle race condition on duplicate key for { senderId, clientMessageId }
            if (err.code === 11000) {
                const retryMessage = await messagesRepository.findMessageByIdempotency(senderId, clientMessageId);
                return {
                    message: formatMessage(retryMessage),
                    conversationId: conversation._id.toString(),
                    isRetry: true
                };
            }
            throw err;
        }

        // Update conversation summary
        await messagesRepository.updateConversationSummary(
            conversation._id,
            createdMessage,
            recipientId
        );

        return {
            message: formatMessage(createdMessage),
            conversationId: conversation._id.toString(),
            isRetry: false
        };
    }

    /**
     * Lists paginated conversations for a user.
     * @param {string} userId
     * @param {{ page?: number, limit?: number }} params
     */
    async listConversations(userId, { page = 1, limit = 20 }) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

        const { items, totalItems } = await messagesRepository.listConversationsForUser(userId, {
            page: pageNum,
            limit: limitNum
        });

        // Collect all distinct participant IDs to batch-fetch profiles
        const participantIdSet = new Set();
        items.forEach((conv) => {
            (conv.participants || []).forEach((pid) => participantIdSet.add(pid));
        });

        const users = await User.find({ _id: { $in: Array.from(participantIdSet) } }).lean();
        const userMap = new Map();
        users.forEach((u) => {
            userMap.set(u._id.toString(), {
                id: u._id.toString(),
                name: u.name || '',
                handle: u.handle || '',
                avatarUrl: u.avatarUrl || ''
            });
        });

        const formattedItems = items.map((conv) => {
            const participants = (conv.participants || []).map((pid) => {
                return (
                    userMap.get(pid) || {
                        id: pid,
                        name: 'Unknown User',
                        handle: '@user',
                        avatarUrl: ''
                    }
                );
            });

            let unreadCount = 0;
            if (conv.unreadCounts) {
                if (typeof conv.unreadCounts.get === 'function') {
                    unreadCount = conv.unreadCounts.get(userId) || 0;
                } else if (conv.unreadCounts[userId] !== undefined) {
                    unreadCount = conv.unreadCounts[userId] || 0;
                }
            }

            return {
                id: conv._id.toString(),
                participants,
                lastMessage: conv.lastMessage || null,
                unreadCount,
                updatedAt: conv.updatedAt || conv.createdAt
            };
        });

        const totalPages = Math.ceil(totalItems / limitNum) || 1;
        const hasNextPage = pageNum < totalPages;

        return {
            items: formattedItems,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage
            }
        };
    }

    /**
     * Gets paginated message history for a conversation.
     * @param {string} conversationId
     * @param {string} userId
     * @param {{ page?: number, limit?: number }} params
     */
    async getConversationHistory(conversationId, userId, { page = 1, limit = 30 }) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

        const conversation = await messagesRepository.getConversationById(conversationId);
        if (!conversation) {
            const error = new Error('Conversation not found');
            error.code = 'NOT_FOUND';
            error.status = 404;
            throw error;
        }

        if (!conversation.participants.includes(userId)) {
            const error = new Error('You are not a participant in this conversation');
            error.code = 'FORBIDDEN';
            error.status = 403;
            throw error;
        }

        const { items, totalItems } = await messagesRepository.getMessagesByConversationId(
            conversationId,
            { page: pageNum, limit: limitNum }
        );

        const formattedItems = items.map(formatMessage);
        const totalPages = Math.ceil(totalItems / limitNum) || 1;
        const hasNextPage = pageNum < totalPages;

        return {
            items: formattedItems,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage
            }
        };
    }

    /**
     * Marks all unread messages received by userId in a conversation as read.
     * @param {string} conversationId
     * @param {string} userId
     */
    async markAsRead(conversationId, userId) {
        const conversation = await messagesRepository.getConversationById(conversationId);
        if (!conversation) {
            const error = new Error('Conversation not found');
            error.code = 'NOT_FOUND';
            error.status = 404;
            throw error;
        }

        if (!conversation.participants.includes(userId)) {
            const error = new Error('You are not a participant in this conversation');
            error.code = 'FORBIDDEN';
            error.status = 403;
            throw error;
        }

        const updatedCount = await messagesRepository.markConversationMessagesAsRead(
            conversationId,
            userId
        );

        return {
            conversationId,
            updatedCount
        };
    }
}

module.exports = new MessagesService();
