const crypto = require("crypto");
const conversationsRepository = require("../repositories/conversations.repository");
const messagesRepository = require("../repositories/messages.repository");
const followsRepository = require("../repositories/follows.repository");
const usersRepository = require("../repositories/users.repository");
const cloudinaryIntegration = require("../integrations/cloudinary/cloudinary");
const presenceService = require("./presence.service");
const { countCharacters } = require("../utils/charCount");
const {
    MESSAGE_TEXT_MAX_LENGTH,
    MESSAGE_IMAGE_MAX_BYTES,
    MESSAGE_VIDEO_MAX_BYTES
} = require("../config/constants");

class MessagesService {
    /**
     * Finds or creates a direct conversation between userId and recipientId.
     * Enforces the follow gate: starting a new conversation requires following the recipient.
     * Existing conversations remain accessible even if unfollowed.
     */
    async findOrCreateConversation({ userId, recipientId }) {
        if (!userId || !recipientId) {
            const err = new Error("Both participants are required.");
            err.statusCode = 400;
            err.code = "INVALID_REQUEST";
            throw err;
        }

        if (userId === recipientId) {
            const err = new Error("You cannot direct message yourself.");
            err.statusCode = 400;
            err.code = "CANNOT_MESSAGE_SELF";
            throw err;
        }

        // Validate recipient existence and block status
        const recipient = await usersRepository.findById(recipientId);
        if (!recipient) {
            const err = new Error("Recipient user account does not exist.");
            err.statusCode = 404;
            err.code = "RECIPIENT_NOT_FOUND";
            throw err;
        }

        if (recipient.isBlocked) {
            const err = new Error("Recipient user is suspended and cannot receive messages.");
            err.statusCode = 403;
            err.code = "RECIPIENT_BLOCKED";
            throw err;
        }

        const { participantKey } = conversationsRepository.constructor.getParticipantKey(userId, recipientId);
        const existing = await conversationsRepository.findById(participantKey) ||
            await conversationsRepository.findOrCreateDirect(userId, recipientId);

        // If conversation already existed, both can continue chatting
        if (!existing.created) {
            return this.hydrateConversation(existing.conversation, userId);
        }

        // It is a new conversation: enforce follow-gate
        const isFollowing = await followsRepository.isFollowing(userId, recipientId);
        if (!isFollowing) {
            // Delete the prematurely created empty conversation stub
            try {
                const ConversationModel = require("../models/conversation.model");
                await ConversationModel.deleteOne({ participantKey });
            } catch {
                // Ignore cleanup errors
            }
            const err = new Error("You can only message users you follow.");
            err.statusCode = 403;
            err.code = "FOLLOW_REQUIRED";
            throw err;
        }

        return this.hydrateConversation(existing.conversation, userId);
    }

    /**
     * Retrieves a single conversation by ID with membership authorization.
     */
    async getConversationById({ conversationId, userId }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv) {
            const err = new Error("Conversation not found.");
            err.statusCode = 404;
            err.code = "CONVERSATION_NOT_FOUND";
            throw err;
        }

        if (!conv.participants.includes(userId)) {
            const err = new Error("You are not a participant in this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        return this.hydrateConversation(conv, userId);
    }

    /**
     * Lists user's conversations with real filtering, search, and unread counts.
     */
    async listConversations({ userId, filter = "all", search = "", cursor = null, limit = 20 }) {
        const conversations = await conversationsRepository.listForUser(userId, { cursor, limit: 50 });
        const hydrated = await Promise.all(
            conversations.map((c) => this.hydrateConversation(c, userId))
        );

        let filtered = hydrated;

        // Apply filters
        if (filter === "unread") {
            filtered = filtered.filter((c) => c.unreadCount > 0);
        } else if (filter === "following") {
            filtered = filtered.filter((c) => c.recipient?.isFollowing);
        } else if (filter === "online") {
            filtered = filtered.filter((c) => c.recipient?.isOnline);
        }

        // Apply search query
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter((c) => {
                const name = (c.recipient?.name || "").toLowerCase();
                const handle = (c.recipient?.handle || "").toLowerCase();
                const lastMsg = (c.lastMessage?.text || "").toLowerCase();
                return name.includes(q) || handle.includes(q) || lastMsg.includes(q);
            });
        }

        const sliced = filtered.slice(0, limit);
        const nextCursor = sliced.length === limit ? sliced[sliced.length - 1].lastActivityAt : null;
        const totalUnread = await conversationsRepository.getTotalUnreadCount(userId);

        return {
            conversations: sliced,
            nextCursor,
            totalUnread
        };
    }

    /**
     * Lists messages for a conversation with cursor pagination.
     */
    async listMessages({ conversationId, userId, cursor = null, limit = 30 }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv) {
            const err = new Error("Conversation not found.");
            err.statusCode = 404;
            err.code = "CONVERSATION_NOT_FOUND";
            throw err;
        }

        if (!conv.participants.includes(userId)) {
            const err = new Error("You are not a participant in this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        const messages = await messagesRepository.listMessages(conversationId, { cursor, limit });
        const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt : null;

        return {
            messages,
            nextCursor
        };
    }

    /**
     * Sends a message with idempotency, validation, and delivery state tracking.
     */
    async sendMessage({
        conversationId,
        userId,
        clientMessageId,
        type = "text",
        text = "",
        media = null,
        uploadIntentId = null
    }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv) {
            const err = new Error("Conversation not found.");
            err.statusCode = 404;
            err.code = "CONVERSATION_NOT_FOUND";
            throw err;
        }

        if (!conv.participants.includes(userId)) {
            const err = new Error("You are not a participant in this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        // Idempotency check: if message with clientMessageId already exists for this sender
        const existing = await messagesRepository.findByClientMessageId(conversationId, userId, clientMessageId);
        if (existing) {
            return {
                message: existing,
                conversation: await this.hydrateConversation(conv, userId),
                isDuplicate: true
            };
        }

        // Validate text length
        if (text) {
            const charLen = countCharacters(text);
            if (charLen > MESSAGE_TEXT_MAX_LENGTH) {
                const err = new Error(`Message text exceeds limit of ${MESSAGE_TEXT_MAX_LENGTH} characters.`);
                err.statusCode = 400;
                err.code = "TEXT_TOO_LONG";
                throw err;
            }
        }

        // Validate media intent if image or video
        if (type === "image" || type === "video") {
            if (!media || !media.url || !media.publicId) {
                const err = new Error("Media attachment is missing required metadata.");
                err.statusCode = 400;
                err.code = "INVALID_MEDIA";
                throw err;
            }

            if (type === "image" && media.bytes && media.bytes > MESSAGE_IMAGE_MAX_BYTES) {
                const err = new Error("Image exceeds maximum allowed size of 10 MB.");
                err.statusCode = 400;
                err.code = "MEDIA_TOO_LARGE";
                throw err;
            }

            if (type === "video" && media.bytes && media.bytes > MESSAGE_VIDEO_MAX_BYTES) {
                const err = new Error("Video exceeds maximum allowed size of 50 MB.");
                err.statusCode = 400;
                err.code = "MEDIA_TOO_LARGE";
                throw err;
            }

            if (uploadIntentId) {
                const verification = cloudinaryIntegration.verifyAndConsumeIntent({
                    uploadIntentId,
                    userId,
                    publicId: media.publicId,
                    url: media.url
                });

                if (!verification.valid) {
                    const err = new Error(verification.error || "Media upload verification failed.");
                    err.statusCode = 403;
                    err.code = "INVALID_UPLOAD_INTENT";
                    throw err;
                }
            }
        }

        const recipientId = conv.participants.find((p) => p !== userId);
        const messageId = `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
        const createdAt = new Date();

        const recipients = [
            {
                userId: recipientId,
                deliveredAt: null,
                readAt: null
            }
        ];

        const { message } = await messagesRepository.createMessage({
            id: messageId,
            conversationId,
            senderId: userId,
            clientMessageId,
            type,
            text,
            media,
            recipients,
            createdAt
        });

        // Update conversation summary
        const previewText = type === "text"
            ? (text.length > 80 ? text.substring(0, 80) + "..." : text)
            : (type === "image" ? "📷 Sent a photo" : "🎥 Sent a video");

        const updatedConv = await conversationsRepository.updateLastMessage(
            conversationId,
            {
                id: messageId,
                type,
                text: previewText,
                senderId: userId,
                createdAt
            },
            recipientId
        );

        return {
            message,
            conversation: await this.hydrateConversation(updatedConv || conv, userId),
            recipientId,
            isDuplicate: false
        };
    }

    /**
     * Marks messages delivered for recipient.
     */
    async markDelivered({ conversationId, userId, messageIds }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv || !conv.participants.includes(userId)) {
            const err = new Error("Not authorized for this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        return messagesRepository.markDelivered(conversationId, userId, messageIds);
    }

    /**
     * Marks conversation and messages read for participant.
     */
    async markRead({ conversationId, userId, messageIds }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv || !conv.participants.includes(userId)) {
            const err = new Error("Not authorized for this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        await messagesRepository.markRead(conversationId, userId, messageIds);
        const updatedConv = await conversationsRepository.markConversationRead(conversationId, userId);
        const totalUnread = await conversationsRepository.getTotalUnreadCount(userId);

        return {
            conversation: await this.hydrateConversation(updatedConv || conv, userId),
            totalUnread
        };
    }

    /**
     * Marks all conversations read for user.
     */
    async markAllRead({ userId }) {
        const modifiedCount = await conversationsRepository.markAllRead(userId);
        return {
            modifiedCount,
            totalUnread: 0
        };
    }

    /**
     * Issues a signed Cloudinary intent for messaging media.
     */
    async createUploadIntent({ conversationId, userId, resourceType }) {
        const conv = await conversationsRepository.findById(conversationId);
        if (!conv || !conv.participants.includes(userId)) {
            const err = new Error("Not authorized for this conversation.");
            err.statusCode = 403;
            err.code = "FORBIDDEN";
            throw err;
        }

        return cloudinaryIntegration.createMessageMediaUploadIntent(userId, conversationId, resourceType);
    }

    /**
     * Gets active friends (users the current user follows who are currently online).
     */
    async getActiveFriends({ userId }) {
        const followingIds = await followsRepository.getFollowingIds(userId);
        if (!followingIds || followingIds.length === 0) return [];

        const onlineIds = followingIds.filter((id) => presenceService.isOnline(id));
        if (onlineIds.length === 0) return [];

        const users = await usersRepository.findByIds(onlineIds);
        return users.map((u) => ({
            id: u._id,
            name: u.name,
            handle: u.handle,
            avatarUrl: u.avatarUrl,
            isOnline: true
        }));
    }

    /**
     * Gets initial online presence map for users connected to the current user (conversations + follows).
     */
    async getInitialPresence({ userId }) {
        const conversations = await conversationsRepository.listForUser(userId, { limit: 100 });
        const partnerIds = new Set();
        for (const c of conversations) {
            for (const p of c.participants) {
                if (p !== userId) partnerIds.add(p);
            }
        }

        const followingIds = await followsRepository.getFollowingIds(userId);
        for (const f of followingIds) {
            partnerIds.add(f);
        }

        return presenceService.getOnlineStatuses(Array.from(partnerIds));
    }

    /**
     * Searches message content scoped strictly to user's conversations.
     */
    async searchMessages({ userId, query, limit = 20 }) {
        const conversations = await conversationsRepository.listForUser(userId, { limit: 100 });
        const convIds = conversations.map((c) => c._id);
        if (convIds.length === 0) return [];

        return messagesRepository.searchInConversations(convIds, query, limit);
    }

    /**
     * Helper to hydrate a conversation with other participant's profile and follow status.
     */
    async hydrateConversation(conv, currentUserId) {
        if (!conv) return null;
        const otherId = conv.participants.find((p) => p !== currentUserId);

        const recipientProfile = otherId ? await usersRepository.findById(otherId) : null;
        let isFollowing = false;
        let isFollowedBy = false;

        if (otherId) {
            [isFollowing, isFollowedBy] = await Promise.all([
                followsRepository.isFollowing(currentUserId, otherId),
                followsRepository.isFollowing(otherId, currentUserId)
            ]);
        }

        const isMutual = isFollowing && isFollowedBy;
        const isOnline = otherId ? presenceService.isOnline(otherId) : false;

        const unreadCount = conv.unreadCounts
            ? (conv.unreadCounts instanceof Map
                ? Number(conv.unreadCounts.get(currentUserId)) || 0
                : Number(conv.unreadCounts[currentUserId]) || 0)
            : 0;

        const lastReadAt = conv.lastReadAt
            ? (conv.lastReadAt instanceof Map
                ? conv.lastReadAt.get(currentUserId)
                : conv.lastReadAt[currentUserId])
            : null;

        return {
            id: conv._id.toString(),
            participantKey: conv.participantKey,
            participants: conv.participants,
            lastMessage: conv.lastMessage,
            lastActivityAt: conv.lastActivityAt,
            unreadCount,
            lastReadAt,
            createdAt: conv.createdAt,
            recipient: recipientProfile ? {
                id: recipientProfile._id,
                name: recipientProfile.name,
                handle: recipientProfile.handle,
                avatarUrl: recipientProfile.avatarUrl,
                role: recipientProfile.role,
                isFollowing,
                isMutual,
                isOnline
            } : null
        };
    }
}

module.exports = new MessagesService();
