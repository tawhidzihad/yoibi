import { apiFetch } from "@/lib/api/client";

export const messagesApi = {
    /**
     * Gets messaging limits and configuration.
     */
    async getConfig() {
        return apiFetch("/messages/config");
    },

    /**
     * Lists user's direct conversations.
     */
    async getConversations({ filter = "all", search = "", cursor = null, limit = 20 } = {}) {
        const params = new URLSearchParams();
        if (filter) params.set("filter", filter);
        if (search) params.set("search", search);
        if (cursor) params.set("cursor", cursor);
        if (limit) params.set("limit", String(limit));

        const queryStr = params.toString();
        return apiFetch(`/messages/conversations${queryStr ? `?${queryStr}` : ""}`);
    },

    /**
     * Finds or creates a direct conversation (follow-gated).
     */
    async createConversation(recipientId) {
        return apiFetch("/messages/conversations", {
            method: "POST",
            body: JSON.stringify({ recipientId })
        });
    },

    /**
     * Gets a single conversation by ID.
     */
    async getConversation(id) {
        return apiFetch(`/messages/conversations/${id}`);
    },

    async getConversationById(id) {
        return apiFetch(`/messages/conversations/${id}`);
    },

    /**
     * Lists paginated messages for a conversation.
     */
    async getMessages(conversationId, { cursor = null, limit = 30 } = {}) {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (limit) params.set("limit", String(limit));

        const queryStr = params.toString();
        return apiFetch(`/messages/conversations/${conversationId}/messages${queryStr ? `?${queryStr}` : ""}`);
    },

    /**
     * Sends a message via REST fallback.
     */
    async sendMessage(conversationId, payload) {
        return apiFetch(`/messages/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Marks messages as delivered.
     */
    async markDelivered(conversationId, messageIds) {
        return apiFetch(`/messages/conversations/${conversationId}/delivered`, {
            method: "POST",
            body: JSON.stringify({ messageIds })
        });
    },

    /**
     * Marks a conversation as read.
     */
    async markRead(conversationId, messageIds = null) {
        return apiFetch(`/messages/conversations/${conversationId}/read`, {
            method: "POST",
            body: JSON.stringify(messageIds ? { messageIds } : {})
        });
    },


    /**
     * Requests a Cloudinary signed upload intent for image or video.
     */
    async getUploadIntent(conversationId, resourceType = "image") {
        return apiFetch("/messages/media/upload-intent", {
            method: "POST",
            body: JSON.stringify({ conversationId, resourceType })
        });
    },

    /**
     * Gets active friends (online followed users).
     */
    async getActiveFriends() {
        return apiFetch("/messages/active-friends");
    },

    /**
     * Gets initial presence statuses.
     */
    async getInitialPresence() {
        return apiFetch("/messages/presence");
    },

    /**
     * Searches messages within current user's conversations.
     */
    async searchMessages(query) {
        return apiFetch(`/messages/search?q=${encodeURIComponent(query)}`);
    }
};
