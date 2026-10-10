const Message = require("../models/message.model");

class MessagesRepository {
    /**
     * Creates a message. Idempotent: returns existing message if clientMessageId already exists for this sender.
     */
    async createMessage({
        id,
        conversationId,
        senderId,
        clientMessageId,
        type = "text",
        text = "",
        media = null,
        recipients = [],
        createdAt = null
    }) {
        try {
            const message = await Message.create({
                _id: id,
                conversationId,
                senderId,
                clientMessageId,
                type,
                text,
                media,
                recipients,
                createdAt: createdAt || new Date()
            });

            return { created: true, message: message.toObject() };
        } catch (err) {
            // Duplicate key error on compound index (conversationId, senderId, clientMessageId)
            if (err.code === 11000) {
                const existing = await Message.findOne({
                    conversationId,
                    senderId,
                    clientMessageId
                }).lean();
                return { created: false, message: existing };
            }
            throw err;
        }
    }

    /**
     * Finds a message by its ID.
     */
    async findById(messageId) {
        if (!messageId) return null;
        return Message.findById(messageId).lean();
    }

    /**
     * Finds a message by clientMessageId for a sender.
     */
    async findByClientMessageId(conversationId, senderId, clientMessageId) {
        return Message.findOne({
            conversationId,
            senderId,
            clientMessageId
        }).lean();
    }

    /**
     * Paginated message history (newest first).
     */
    async listMessages(conversationId, { cursor = null, limit = 30 } = {}) {
        const query = { conversationId };

        if (cursor) {
            // If cursor is a valid ISO date or timestamp
            const cursorDate = new Date(cursor);
            if (!Number.isNaN(cursorDate.getTime())) {
                query.createdAt = { $lt: cursorDate };
            } else {
                // If cursor is a message ID
                const cursorMsg = await Message.findById(cursor).lean();
                if (cursorMsg) {
                    query.$or = [
                        { createdAt: { $lt: cursorMsg.createdAt } },
                        { createdAt: cursorMsg.createdAt, _id: { $lt: cursorMsg._id } }
                    ];
                }
            }
        }

        const items = await Message.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean();

        return items;
    }

    /**
     * Monotonically marks messages delivered for a recipient.
     */
    async markDelivered(conversationId, recipientId, messageIds = null) {
        const now = new Date();
        const filter = {
            conversationId,
            senderId: { $ne: recipientId },
            "recipients.userId": recipientId,
            "recipients.deliveredAt": null
        };

        if (Array.isArray(messageIds) && messageIds.length > 0) {
            filter._id = { $in: messageIds };
        }

        const result = await Message.updateMany(
            filter,
            {
                $set: {
                    "recipients.$[elem].deliveredAt": now
                }
            },
            {
                arrayFilters: [{ "elem.userId": recipientId, "elem.deliveredAt": null }]
            }
        );

        return { modifiedCount: result.modifiedCount, deliveredAt: now };
    }

    /**
     * Monotonically marks messages read for a recipient. Also sets deliveredAt if unset.
     */
    async markRead(conversationId, recipientId, messageIds = null) {
        const now = new Date();
        const filter = {
            conversationId,
            senderId: { $ne: recipientId },
            "recipients.userId": recipientId,
            "recipients.readAt": null
        };

        if (Array.isArray(messageIds) && messageIds.length > 0) {
            filter._id = { $in: messageIds };
        }

        const result = await Message.updateMany(
            filter,
            {
                $set: {
                    "recipients.$[elem].readAt": now,
                    // If deliveredAt was still null, mark it as delivered too
                    "recipients.$[elemDelivered].deliveredAt": now
                }
            },
            {
                arrayFilters: [
                    { "elem.userId": recipientId, "elem.readAt": null },
                    { "elemDelivered.userId": recipientId, "elemDelivered.deliveredAt": null }
                ]
            }
        );

        return { modifiedCount: result.modifiedCount, readAt: now };
    }

    /**
     * Searches messages inside allowed conversations.
     */
    async searchInConversations(conversationIds, queryText, limit = 20) {
        if (!conversationIds || conversationIds.length === 0 || !queryText) return [];

        const sanitized = queryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return Message.find({
            conversationId: { $in: conversationIds },
            text: { $regex: sanitized, $options: "i" }
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
}

module.exports = new MessagesRepository();
