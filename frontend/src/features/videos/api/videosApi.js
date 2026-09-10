import { apiClient } from "@/lib/api/client";

/**
 * Request server-issued Cloudinary upload signature and intent.
 */
export async function getUploadSignature() {
    const res = await apiClient.post("/videos/upload-signature");
    return res;
}

/**
 * Uploads video directly to Cloudinary with live progress tracking.
 * Falls back to simulated upload in local test/mock environments where Cloudinary is unconfigured.
 */
export function uploadToCloudinary(file, signatureData, onProgress) {
    return new Promise((resolve, reject) => {
        // If server returned test/mock cloud name, simulate upload for seamless offline/dev testing
        if (!signatureData.cloudName || signatureData.cloudName === "mock_cloud_name" || signatureData.cloudName === "test_cloud_name") {
            let current = 0;
            const interval = setInterval(() => {
                current += 25;
                if (onProgress) onProgress(Math.min(100, current));
                if (current >= 100) {
                    clearInterval(interval);
                    const mockPublicId = signatureData.publicId || `yoibi/videos/mock/${Date.now()}`;
                    resolve({
                        public_id: mockPublicId,
                        secure_url: `https://res.cloudinary.com/yoibi/video/upload/v1/${mockPublicId}.mp4`,
                        thumbnail_url: `https://res.cloudinary.com/yoibi/video/upload/v1/${mockPublicId}.jpg`,
                        duration: 60,
                        bytes: file.size,
                        width: 1920,
                        height: 1080,
                        format: file.name.split(".").pop() || "mp4"
                    });
                }
            }, 80);
            return;
        }

        const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", String(signatureData.timestamp));
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);
        if (signatureData.publicId) {
            formData.append("public_id", signatureData.publicId);
        }

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch {
                    reject(new Error("Failed to parse Cloudinary upload response."));
                }
            } else {
                let errorMsg = `Upload failed with status ${xhr.status}`;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    if (errObj?.error?.message) {
                        errorMsg = errObj.error.message;
                    }
                } catch {
                    // Ignore JSON parse failure on error response
                }
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => {
            reject(new Error("Network error occurred during video upload."));
        };

        xhr.open("POST", url, true);
        xhr.send(formData);
    });
}

/**
 * Register uploaded video metadata in backend.
 */
export async function createVideo(payload) {
    const res = await apiClient.post("/videos", payload);
    return res;
}

/**
 * Fetch paginated community videos.
 */
export async function getVideos({ page = 1, limit = 20, category = null, authorId = null, search = null } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (category) params.set("category", category);
    if (authorId) params.set("authorId", authorId);
    if (search) params.set("search", search);

    const res = await apiClient.get(`/videos?${params.toString()}`);
    return res;
}

/**
 * Fetch single video details (read-only; does NOT increment views).
 */
export async function getVideoById(id) {
    const res = await apiClient.get(`/videos/${id}`);
    return res;
}

/**
 * Record a video playback initiation event (increments views).
 */
export async function recordVideoView(id) {
    const res = await apiClient.post(`/videos/${id}/view`);
    return res;
}

/**
 * Like a video.
 */
export async function likeVideo(id) {
    const res = await apiClient.post(`/videos/${id}/like`);
    return res;
}

/**
 * Unlike a video.
 */
export async function unlikeVideo(id) {
    const res = await apiClient.delete(`/videos/${id}/like`);
    return res;
}

/**
 * Delete a video by ID. Requires author or admin authorization.
 */
export async function deleteVideo(id) {
    const res = await apiClient.delete(`/videos/${id}`);
    return res;
}

export const videosApi = {
    getUploadSignature,
    uploadToCloudinary,
    createVideo,
    getVideos,
    getVideoById,
    recordVideoView,
    likeVideo,
    unlikeVideo,
    deleteVideo
};
