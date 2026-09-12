"use client";

import { apiClient } from "@/lib/api/client";

/**
 * Requests a server-issued Cloudinary upload signature for a profile image
 * (avatar or banner). The Cloudinary API secret NEVER reaches the browser —
 * only a short-lived folder-scoped signature.
 * @param {'avatar'|'banner'} kind
 */
export async function getProfileMediaSignature(kind) {
    return apiClient.post("/users/me/upload-signature", { kind });
}

/**
 * Uploads a profile image (avatar/banner) directly to Cloudinary using the
 * server-issued signature. Falls back to a simulated upload when Cloudinary
 * is unconfigured (dev/test), mirroring the video upload flow.
 * @param {File} file
 * @param {object} signatureData - { cloudName, apiKey, timestamp, signature, folder, publicId }
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<{ public_id: string, secure_url: string }>}
 */
export function uploadProfileImage(file, signatureData, onProgress) {
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
                    const publicId = signatureData.publicId || `yoibi/profiles/mock/${Date.now()}`;
                    resolve({
                        public_id: publicId,
                        secure_url: `https://res.cloudinary.com/yoibi/image/upload/v1/${publicId}.jpg`,
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
        formData.append("folder", signatureData.folder);
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
                    resolve(JSON.parse(xhr.responseText));
                } catch {
                    reject(new Error("Failed to parse the upload response."));
                }
            } else {
                let errorMsg = `Upload failed with status ${xhr.status}`;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    if (errObj?.error?.message) errorMsg = errObj.error.message;
                } catch {
                    // Ignore JSON parse failure on error response
                }
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => reject(new Error("Network error occurred during the image upload."));

        xhr.open("POST", url, true);
        xhr.send(formData);
    });
}

/**
 * Fetch a public user profile by handle (without the "@" prefix).
 * GET /api/v1/users/:handle
 */
export async function getProfile(handle) {
    return apiClient.get(`/users/${encodeURIComponent(String(handle).replace(/^@/, ""))}`);
}

/**
 * Update the authenticated user's profile (server-side whitelist applies).
 * PATCH /api/v1/users/me
 */
export async function updateProfile(data) {
    return apiClient.patch("/users/me", data);
}

export const profileApi = {
    getProfile,
    updateProfile,
    getProfileMediaSignature,
    uploadProfileImage,
};
