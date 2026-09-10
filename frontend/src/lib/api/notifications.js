import { apiClient } from "@/lib/api/client";

/**
 * Lists notifications with pagination and optional read filter.
 * @param {{ page?: number, limit?: number, read?: boolean }} params
 */
export async function getNotifications({ page = 1, limit = 20, read } = {}) {
    let url = `/notifications?page=${page}&limit=${limit}`;
    if (typeof read === "boolean") {
        url += `&read=${read}`;
    }
    return apiClient.get(url);
}

/**
 * Gets unread notification count.
 */
export async function getUnreadCount() {
    return apiClient.get("/notifications/unread-count");
}

/**
 * Marks a single notification as read.
 * @param {string} id
 */
export async function markNotificationRead(id) {
    return apiClient.patch(`/notifications/${id}/read`, {});
}

/**
 * Marks all notifications as read.
 */
export async function markAllNotificationsRead() {
    return apiClient.patch("/notifications/read-all", {});
}
