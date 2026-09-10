import { apiClient } from "@/lib/api/client";

/**
 * Lists user conversations with pagination.
 * @param {{ page?: number, limit?: number }} params
 */
export async function getConversations({ page = 1, limit = 20 } = {}) {
    return apiClient.get(`/messages/conversations?page=${page}&limit=${limit}`);
}

/**
 * Gets paginated message history for a conversation.
 * @param {string} conversationId
 * @param {{ page?: number, limit?: number }} params
 */
export async function getConversationHistory(conversationId, { page = 1, limit = 30 } = {}) {
    return apiClient.get(`/messages/conversations/${conversationId}?page=${page}&limit=${limit}`);
}

/**
 * Sends a direct message with clientMessageId for idempotency.
 * @param {{ recipientId: string, content: string, clientMessageId: string }} payload
 */
export async function sendMessage({ recipientId, content, clientMessageId }) {
    return apiClient.post("/messages", { recipientId, content, clientMessageId });
}

/**
 * Marks a conversation's messages as read.
 * @param {string} conversationId
 */
export async function markConversationRead(conversationId) {
    return apiClient.patch(`/messages/conversations/${conversationId}/read`, {});
}
