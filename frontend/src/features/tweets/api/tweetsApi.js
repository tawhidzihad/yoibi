import { apiClient } from "@/lib/api/client";

/**
 * Fetch paginated tweets for the feed or user profile.
 */
export async function getTweets({ page = 1, limit = 20, filter = "all", authorId } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (filter) params.set("filter", filter);
    if (authorId) params.set("authorId", authorId);

    const res = await apiClient.get(`/tweets?${params.toString()}`);
    return res;
}

/**
 * Fetch a single tweet by ID with author details and direct replies.
 */
export async function getTweetById(id) {
    const res = await apiClient.get(`/tweets/${id}`);
    return res;
}

/**
 * Create a new tweet or reply.
 */
export async function createTweet({ content, mediaUrls = [], replyToId = null }) {
    const res = await apiClient.post("/tweets", {
        content,
        mediaUrls,
        replyToId,
    });
    return res;
}

/**
 * Delete a tweet by ID. Requires author or admin authorization.
 */
export async function deleteTweet(id) {
    const res = await apiClient.delete(`/tweets/${id}`);
    return res;
}

/**
 * Like a tweet.
 */
export async function likeTweet(id) {
    const res = await apiClient.post(`/tweets/${id}/like`);
    return res;
}

/**
 * Unlike a tweet.
 */
export async function unlikeTweet(id) {
    const res = await apiClient.delete(`/tweets/${id}/like`);
    return res;
}

/**
 * Retweet a tweet.
 */
export async function retweetTweet(id) {
    const res = await apiClient.post(`/tweets/${id}/retweet`);
    return res;
}

/**
 * Undo a retweet.
 */
export async function undoRetweet(id) {
    const res = await apiClient.delete(`/tweets/${id}/retweet`);
    return res;
}

/**
 * Fetch direct replies for a tweet.
 */
export async function getReplies(id) {
    const res = await apiClient.get(`/tweets/${id}/replies`);
    return res;
}

/**
 * Create a reply for a tweet.
 */
export async function createReply(id, { content, mediaUrls = [] }) {
    const res = await apiClient.post(`/tweets/${id}/replies`, {
        content,
        mediaUrls,
    });
    return res;
}

export const tweetsApi = {
    getTweets,
    getTweetById,
    createTweet,
    deleteTweet,
    likeTweet,
    unlikeTweet,
    retweetTweet,
    undoRetweet,
    getReplies,
    createReply,
};
