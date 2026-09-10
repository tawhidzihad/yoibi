import { apiClient } from "@/lib/api/client";

/**
 * Fetch paginated Meet-Up rooms list with optional status filter.
 */
export async function getMeetupRooms({ page = 1, limit = 20, status = "active", ownerId = null } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (ownerId) params.set("ownerId", ownerId);

    const res = await apiClient.get(`/meetup/rooms?${params.toString()}`);
    return res;
}

/**
 * Fetch a single Meet-Up room by ID.
 */
export async function getMeetupRoomById(roomId) {
    const res = await apiClient.get(`/meetup/rooms/${roomId}`);
    return res;
}

/**
 * Create a new Meet-Up room and receive host LiveKit token.
 */
export async function createMeetupRoom(payload) {
    const res = await apiClient.post("/meetup/rooms", payload);
    return res;
}

/**
 * Join an active Meet-Up room and receive participant LiveKit token.
 */
export async function joinMeetupRoom(roomId) {
    const res = await apiClient.post(`/meetup/rooms/${roomId}/join`);
    return res;
}

/**
 * End an active Meet-Up room and terminate LiveKit session (room owner only).
 */
export async function endMeetupRoom(roomId) {
    const res = await apiClient.post(`/meetup/rooms/${roomId}/end`);
    return res;
}

/**
 * Delete an ended Meet-Up room permanently (room owner only).
 */
export async function deleteMeetupRoom(roomId) {
    const res = await apiClient.delete(`/meetup/rooms/${roomId}`);
    return res;
}

export const meetupApi = {
    getMeetupRooms,
    getMeetupRoomById,
    createMeetupRoom,
    joinMeetupRoom,
    endMeetupRoom,
    deleteMeetupRoom
};
