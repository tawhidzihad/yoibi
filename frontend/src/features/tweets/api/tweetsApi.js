import { apiClient } from "@/lib/api/client";

/**
 * Product image contract for tweet uploads:
 *   - Direct device uploads only (JPEG, PNG, WEBP, AVIF, GIF) — never URLs.
 *   - Application limit: 10 MB per image, maximum 5 images per tweet.
 *   - Uploads use the server-issued Cloudinary signature; the Cloudinary API
 *     secret never reaches the browser.
 */
export const TWEET_IMAGE_MAX_COUNT = 5;
export const TWEET_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const TWEET_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export const TWEET_IMAGE_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
];

/**
 * Fetch paginated tweets for the feed or user profile.
 * `authorHandle` filters server-side to a single author (profile Tweets tab).
 */
export async function getTweets({ page = 1, limit = 20, filter = "all", authorId, authorHandle } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (filter) params.set("filter", filter);
    if (authorId) params.set("authorId", authorId);
    if (authorHandle) params.set("authorHandle", String(authorHandle).replace(/^@/, ""));

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
 * Request a server-issued Cloudinary upload signature + intent for ONE tweet
 * image. The intent is bound to the authenticated user (server-controlled
 * folder `yoibi/tweets/{userId}` + exact publicId) and is consumed when the
 * tweet is registered. NEVER exposes the Cloudinary API secret.
 */
export async function getTweetImageSignature() {
    const res = await apiClient.post("/tweets/media-signature");
    return res;
}

/**
 * Upload ONE tweet image directly to Cloudinary using the server-issued
 * signature. `public_id` already embeds the server-authorized folder — a
 * separate `folder` param is NEVER sent (same signed-parameter rule as the
 * video/profile-image flows) so the returned public_id matches the intent
 * exactly and backend provenance verification passes.
 *
 * Falls back to a simulated upload when Cloudinary is unconfigured
 * (dev/test), mirroring the video upload flow.
 *
 * @param {File} file
 * @param {object} signatureData - { cloudName, apiKey, timestamp, signature, publicId }
 * @param {(percent:number)=>void} [onProgress]
 */
export function uploadTweetImage(file, signatureData, onProgress) {
    return new Promise((resolve, reject) => {
        if (
            !signatureData?.cloudName ||
            signatureData.cloudName === "mock_cloud_name" ||
            signatureData.cloudName === "test_cloud_name"
        ) {
            let current = 0;
            const interval = setInterval(() => {
                current += 25;
                if (onProgress) onProgress(Math.min(100, current));
                if (current >= 100) {
                    clearInterval(interval);
                    const publicId = signatureData?.publicId || `yoibi/tweets/mock/${Date.now()}`;
                    resolve({
                        public_id: publicId,
                        secure_url: `https://res.cloudinary.com/yoibi/image/upload/v1/${publicId}.jpg`,
                        bytes: file.size,
                        format: file.name.split(".").pop() || "jpg",
                    });
                }
            }, 60);
            return;
        }

        const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", String(signatureData.timestamp));
        formData.append("signature", signatureData.signature);
        // NOTE: Do NOT send a separate `folder` param. `public_id` already
        // embeds the server-authorized folder path; Cloudinary prepends
        // `folder` to `public_id` when both are sent, doubling the asset path
        // and failing strict provenance verification.
        if (signatureData.publicId) {
            formData.append("public_id", signatureData.publicId);
        }

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    // Single canonical identity: the uploaded asset must be
                    // exactly the one the server authorized.
                    if (response?.public_id !== signatureData.publicId) {
                        reject(
                            new Error(
                                "The uploaded image did not match its authorized upload. Please try again."
                            )
                        );
                        return;
                    }
                    resolve(response);
                } catch {
                    reject(new Error("Failed to read the image upload response."));
                }
            } else {
                let errorMsg = `Image upload failed (status ${xhr.status}). Please try again.`;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    if (errObj?.error?.message) errorMsg = errObj.error.message;
                } catch {
                    // Ignore JSON parse failure on error response
                }
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => {
            reject(new Error("Network error during the image upload. Please check your connection and try again."));
        };

        xhr.open("POST", url, true);
        xhr.send(formData);
    });
}

/**
 * Create a new tweet or reply.
 * `media` holds the server-verified image attachments:
 * [{ uploadIntentId, publicId, url, width?, height?, bytes?, format? }]
 */
export async function createTweet({ content, media = [], replyToId = null }) {
    const res = await apiClient.post("/tweets", {
        content,
        media,
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
export async function createReply(id, { content }) {
    const res = await apiClient.post(`/tweets/${id}/replies`, {
        content,
    });
    return res;
}

export const tweetsApi = {
    getTweets,
    getTweetById,
    getTweetImageSignature,
    uploadTweetImage,
    createTweet,
    deleteTweet,
    likeTweet,
    unlikeTweet,
    retweetTweet,
    undoRetweet,
    getReplies,
    createReply,
    TWEET_IMAGE_MAX_COUNT,
    TWEET_IMAGE_MAX_BYTES,
    TWEET_IMAGE_ACCEPT,
    TWEET_IMAGE_ALLOWED_TYPES,
};
