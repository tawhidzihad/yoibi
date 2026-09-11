import { apiClient } from "@/lib/api/client";

/**
 * Submits a new moderation report for a user or content item.
 * @param {{ targetType: "user"|"tweet"|"video"|"stream"|"meetup", targetId: string, reason: string, description?: string }} body
 */
export async function submitReport({ targetType, targetId, reason, description }) {
    return apiClient.post("/reports", {
        targetType,
        targetId,
        reason,
        description
    });
}
