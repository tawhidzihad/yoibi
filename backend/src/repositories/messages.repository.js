const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

class MessagesRepository {
    /**
     * Canonical ordering helper to ensure [A, B] and [B, A] resolve to the exact same conversation.
     * @param {string} userA
     * @param {string} userB
     * @returns {string[]}
     */
    getCanonicalParticipants(userA, userB) {
        return [userA, userB].sort();
    }

    /**
     * Finds an existing one-to-one conversation or creates a new one.
     * @param {string} userA
     * @param {string} userB
     * @returns {Promise<any>}
     */
    async findOrCreateConversation(userA, userB) {
        const canonical = this.getCanonicalParticipants(userA, userB);
        let conv = await Conversation.findOne({
            participants: { $all: canonical, $size: 2 }
        });

        if (!conv) {
            conv = await Conversation.create({
                participants: canonical,
                unreadCounts: {
                    [userA]: 0,
                    [userB]: 0
                }
            });
        }

        return conv;
    }

    /**
     * Retrieves a conversation by its MongoDB ObjectId.
     * @param {string} conversationId
     * @returns {Promise<any>}
     */
    async getConversationById(conversationId) {
        return Conversation.findById(conversationId);
    }

    /**
     * Lists conversations for a user with page-based pagination.
     * @param {string} userId
     * @param {{ page: number, limit: number }} pagination
     * @returns {Promise<{ items: any[], totalItems: number }>}
     */
    async listConversationsForUser(userId, { page = 1, limit = 20 }) {
        const query = { participants: userId };
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            Conversation.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Conversation.countDocuments(query)
        ]);

        return { items, totalItems };
    }

    /**
     * Looks up an existing message by senderId and clientMessageId for idempotency.
     * @param {string} senderId
     * @param {string} clientMessageId
     * @returns {Promise<any>}
     */
    async findMessageByIdempotency(senderId, clientMessageId) {
        return Message.findOne({ senderId, clientMessageId }).lean();
    }

    /**
     * Persists a direct message to MongoDB.
     * @param {{ conversationId: any, senderId: string, recipientId: string, content: string, clientMessageId: string }} payload
     * @returns {Promise<any>}
     */
    async createMessage({ conversationId, senderId, recipientId, content, clientMessageId }) {
        return Message.create({
            conversationId,
            senderId,
            recipientId,
            content,
            clientMessageId
        });
    }

    /**
     * Updates conversation metadata with the last message snippet and increments unread count.
     * @param {any} conversationId
     * @param {{ content: string, senderId: string, clientMessageId: string, createdAt: Date }} lastMessage
     * @param {string} recipientId
     */
    async updateConversationSummary(conversationId, lastMessage, recipientId) {
        const unreadField = `unreadCounts.${recipientId}`;
        return Conversation.findByIdAndUpdate(
            conversationId,
            {
                $set: {
                    lastMessage: {
                        content: lastMessage.content,
                        senderId: lastMessage.senderId,
                        clientMessageId: lastMessage.clientMessageId,
                        createdAt: lastMessage.createdAt
                    },
                    updatedAt: new Date()
                },
                $inc: {
                    [unreadField]: 1
                }
            },
            { new: true }
        );
    }

    /**
     * Retrieves paginated message history for a conversation.
     * Messages returned chronologically (oldest to newest within the paginated set).
     * @param {string} conversationId
     * @param {{ page: number, limit: number }} pagination
     * @returns {Promise<{ items: any[], totalItems: number }>}
     */
    async getMessagesByConversationId(conversationId, { page = 1, limit = 30 }) {
        const query = { conversationId };
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            Message.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments(query)
        ]);

        // Reverse to provide natural chronological presentation (oldest to newest)
        return { items: items.reverse(), totalItems };
    }

    /**
     * Marks messages received by userId in a conversation as read.
     * @param {string} conversationId
     * @param {string} userId
     * @returns {Promise<number>} Number of modified messages
     */
    async markConversationMessagesAsRead(conversationId, userId) {
        const result = await Message.updateMany(
            {
                conversationId,
                recipientId: userId,
                readAt: null
            },
            {
                $set: { readAt: new Date() }
            }
        );

        const unreadField = `unreadCounts.${userId}`;
        await Conversation.findByIdAndUpdate(conversationId, {
            $set: { [unreadField]: 0 }
        });

        return result.modifiedCount || 0;
    }
}

module.exports = new MessagesRepository();
