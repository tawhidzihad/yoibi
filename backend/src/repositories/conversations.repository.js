const mongoose = require("mongoose");
const Conversation = require("../models/conversation.model");

class ConversationsRepository {
    /**
     * Normalizes two participant IDs into a canonical sorted pair and key.
     */
    static getParticipantKey(userA, userB) {
        const sorted = [String(userA), String(userB)].sort();
        return {
            participantKey: sorted.join(":"),
            participants: sorted
        };
    }

    /**
     * Finds or creates a direct conversation between two users.
     * Prevents race conditions with duplicate key error handling.
     */
    async findOrCreateDirect(userA, userB) {
        const { participantKey, participants } = ConversationsRepository.getParticipantKey(userA, userB);

        const existing = await Conversation.findOne({ participantKey }).lean();
        if (existing) {
            return { conversation: existing, created: false };
        }

        try {
            const initialUnread = {};
            const initialLastRead = {};
            initialUnread[userA] = 0;
            initialUnread[userB] = 0;
            initialLastRead[userA] = new Date();
            initialLastRead[userB] = new Date();

            const doc = await Conversation.create({
                participantKey,
                participants,
                unreadCounts: initialUnread,
                lastReadAt: initialLastRead,
                lastActivityAt: new Date()
            });

            return { conversation: doc.toObject(), created: true };
        } catch (err) {
            if (err.code === 11000) {
                const found = await Conversation.findOne({ participantKey }).lean();
                return { conversation: found, created: false };
            }
            throw err;
        }
    }

    /**
     * Finds conversation by ID.
     */
    async findById(conversationId) {
        if (!conversationId || !mongoose.isValidObjectId(conversationId)) return null;
        return Conversation.findById(conversationId).lean();
    }

    /**
     * Lists conversations for a participant with cursor pagination, optional search & filters.
     */
    async listForUser(userId, { cursor = null, limit = 20, participantIds = null } = {}) {
        const query = { participants: userId };

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!Number.isNaN(cursorDate.getTime())) {
                query.lastActivityAt = { $lt: cursorDate };
            }
        }

        if (Array.isArray(participantIds)) {
            query.participants = { $in: participantIds, $eq: userId };
        }

        return Conversation.find(query)
            .sort({ lastActivityAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Updates conversation lastMessage and atomically increments unread count for the recipient.
     */
    async updateLastMessage(conversationId, { id, type, text, senderId, createdAt }, recipientId) {
        const unreadField = `unreadCounts.${recipientId}`;
        const update = {
            $set: {
                lastMessage: {
                    id,
                    type,
                    text,
                    senderId,
                    createdAt: createdAt || new Date()
                },
                lastActivityAt: createdAt || new Date()
            },
            $inc: {
                [unreadField]: 1
            }
        };

        return Conversation.findByIdAndUpdate(conversationId, update, { new: true }).lean();
    }

    /**
     * Marks a conversation as read for a specific participant.
     */
    async markConversationRead(conversationId, userId) {
        const unreadField = `unreadCounts.${userId}`;
        const lastReadField = `lastReadAt.${userId}`;

        return Conversation.findByIdAndUpdate(
            conversationId,
            {
                $set: {
                    [unreadField]: 0,
                    [lastReadField]: new Date()
                }
            },
            { new: true }
        ).lean();
    }

    /**
     * Computes total unread count for a user across all conversations.
     */
    async getTotalUnreadCount(userId) {
        const conversations = await Conversation.find(
            { participants: userId },
            { unreadCounts: 1 }
        ).lean();

        let total = 0;
        for (const conv of conversations) {
            if (conv.unreadCounts) {
                const count = conv.unreadCounts instanceof Map
                    ? conv.unreadCounts.get(userId)
                    : conv.unreadCounts[userId];
                total += Number(count) || 0;
            }
        }
        return total;
    }
}

module.exports = new ConversationsRepository();
