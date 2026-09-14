import { apiClient } from "@/lib/api/client";

/**
 * Gets overview dashboard statistics for the admin panel.
 */
export async function getAdminStats() {
    return apiClient.get("/admin/stats");
}

/**
 * Lists users with pagination, search, and optional filter.
 * @param {{ page?: number, limit?: number, search?: string, isBlocked?: boolean }} params
 */
export async function getAdminUsers({ page = 1, limit = 20, search, isBlocked } = {}) {
    let url = `/admin/users?page=${page}&limit=${limit}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    if (typeof isBlocked === "boolean") {
        url += `&isBlocked=${isBlocked}`;
    }
    return apiClient.get(url);
}

/**
 * Gets single user details for admin moderation.
 * @param {string} id
 */
export async function getAdminUserById(id) {
    return apiClient.get(`/admin/users/${id}`);
}

/**
 * Blocks a user account with a reason (reversible suspension).
 * @param {string} id
 * @param {{ reason: string }} body
 */
export async function blockUser(id, { reason }) {
    return apiClient.post(`/admin/users/${id}/block`, { reason });
}

/**
 * Unblocks a user account with an optional reason.
 * @param {string} id
 * @param {{ reason?: string }} body
 */
export async function unblockUser(id, { reason } = {}) {
    return apiClient.post(`/admin/users/${id}/unblock`, { reason: reason || "Admin unblock" });
}

/**
 * Permanently bans a user, purging content and accounts (irreversible).
 * @param {string} id
 * @param {{ reason: string, confirmationHandle: string }} body
 */
export async function banUser(id, { reason, confirmationHandle }) {
    return apiClient.post(`/admin/users/${id}/ban`, { reason, confirmationHandle });
}

/**
 * Browses platform content for moderation.
 * @param {{ type: "tweet"|"video"|"stream"|"meetup", page?: number, limit?: number, search?: string }} params
 */
export async function getAdminContent({ type = "tweets", page = 1, limit = 20, search } = {}) {
    const typeMap = { tweet: "tweets", video: "videos", stream: "streams", meetup: "meetups" };
    const normalizedType = typeMap[type] || type;
    let url = `/admin/content?type=${normalizedType}&page=${page}&limit=${limit}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get(url);
}

/**
 * Moderates and deletes a specific content item.
 * @param {string} type
 * @param {string} id
 * @param {{ reason: string }} body
 */
export async function deleteAdminContent(type, id, { reason }) {
    const typeMap = { tweet: "tweets", video: "videos", stream: "streams", meetup: "meetups" };
    const normalizedType = typeMap[type] || type;
    return apiClient.delete(`/admin/content/${normalizedType}/${id}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
    });
}

/**
 * Lists moderation reports for admin review.
 * @param {{ page?: number, limit?: number, status?: "pending"|"resolved"|"dismissed" }} params
 */
export async function getAdminReports({ page = 1, limit = 20, status } = {}) {
    let url = `/admin/reports?page=${page}&limit=${limit}`;
    if (status) {
        url += `&status=${status}`;
    }
    return apiClient.get(url);
}

/**
 * Resolves or dismisses a moderation report.
 * @param {string} id
 * @param {{ status: "resolved"|"dismissed", resolutionNotes?: string }} body
 */
export async function updateAdminReport(id, { status, resolutionNotes }) {
    return apiClient.patch(`/admin/reports/${id}`, { status, resolutionNotes });
}

/**
 * Lists audit logs with pagination and filters.
 * @param {{ page?: number, limit?: number, action?: string, adminId?: string, targetUserId?: string }} params
 */
export async function getAdminAuditLogs({ page = 1, limit = 20, action, adminId, targetUserId } = {}) {
    let url = `/admin/audit-logs?page=${page}&limit=${limit}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    if (adminId) url += `&adminId=${encodeURIComponent(adminId)}`;
    if (targetUserId) url += `&targetUserId=${encodeURIComponent(targetUserId)}`;
    return apiClient.get(url);
}
