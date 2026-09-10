import { apiClient } from "@/lib/api/client";

/**
 * Fetch paginated streams list with optional filtering by status and category.
 */
export async function getStreams({ page = 1, limit = 20, status = "live", category = null, authorId = null } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (authorId) params.set("authorId", authorId);

    const res = await apiClient.get(`/streams?${params.toString()}`);
    return res;
}

/**
 * Fetch a single stream's details by ID.
 */
export async function getStreamById(id) {
    const res = await apiClient.get(`/streams/${id}`);
    return res;
}

/**
 * Create a new stream record in 'ready' state and receive preparation host token.
 */
export async function createStream(payload) {
    const res = await apiClient.post("/streams", payload);
    return res;
}

/**
 * Start live broadcast and receive fresh host LiveKit token.
 */
export async function startStream(id) {
    const res = await apiClient.post(`/streams/${id}/start`);
    return res;
}

/**
 * Join an active live stream and receive viewer LiveKit token.
 */
export async function joinStream(id) {
    const res = await apiClient.post(`/streams/${id}/join`);
    return res;
}

/**
 * End a live stream broadcast and terminate LiveKit room session.
 */
export async function endStream(id) {
    const res = await apiClient.post(`/streams/${id}/end`);
    return res;
}

/**
 * Delete a stream record (ready or ended status only).
 */
export async function deleteStream(id) {
    const res = await apiClient.delete(`/streams/${id}`);
    return res;
}

export const streamsApi = {
    getStreams,
    getStreamById,
    createStream,
    startStream,
    joinStream,
    endStream,
    deleteStream
};
