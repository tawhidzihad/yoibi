const crypto = require("crypto");
const { env } = require("../../config/env");

// In-memory intent store for server-issued upload intents
const uploadIntents = new Map();

/**
 * Periodically purge expired intents (older than 30 minutes)
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, intent] of uploadIntents.entries()) {
        if (intent.expiresAt < now) {
            uploadIntents.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();

/**
 * Creates a server-controlled upload intent and generates Cloudinary signed upload parameters.
 */
function createUploadIntent(userId) {
    const hasConfig = Boolean(
        env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
    );

    // In production, Cloudinary credentials are strictly mandatory
    if (env.NODE_ENV === "production" && !hasConfig) {
        const error = new Error("Cloudinary media service is not configured on the server.");
        error.statusCode = 503;
        error.code = "SERVICE_UNCONFIGURED";
        throw error;
    }

    const intentId = `intent_vid_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const folder = `yoibi/videos/${userId}`;
    const publicId = `${folder}/${intentId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Parameters to sign in alphabetical order.
    // IMPORTANT: sign ONLY `public_id` + `timestamp`. `public_id` already embeds the
    // server-controlled folder path. Cloudinary treats `public_id` as RELATIVE to the
    // `folder` parameter when both are provided (result: folder + '/' + public_id),
    // which would double the path and break strict asset-provenance verification.
    // The folder structure remains fully server-controlled via public_id.
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;

    let signature = "";
    if (hasConfig) {
        signature = crypto
            .createHash("sha1")
            .update(`${paramsToSign}${env.CLOUDINARY_API_SECRET}`)
            .digest("hex");
    } else {
        // Safe mock signature strictly for test/dev environment
        signature = `mock_sig_${crypto.randomBytes(8).toString("hex")}`;
    }

    const intent = {
        intentId,
        userId,
        publicId,
        folder,
        timestamp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        consumed: false
    };

    uploadIntents.set(intentId, intent);

    return {
        uploadIntentId: intentId,
        publicId,
        folder,
        timestamp,
        signature,
        apiKey: env.CLOUDINARY_API_KEY || "mock_api_key",
        cloudName: env.CLOUDINARY_CLOUD_NAME || "mock_cloud_name"
    };
}

/**
 * Verifies asset provenance against a previously issued upload intent and consumes it.
 */
function verifyAndConsumeIntent({ uploadIntentId, userId, publicId, videoUrl }) {
    if (!uploadIntentId) {
        return {
            valid: false,
            error: "uploadIntentId is required for video registration."
        };
    }

    const intent = uploadIntents.get(uploadIntentId);
    if (!intent) {
        return {
            valid: false,
            error: "Upload intent not found or expired. Please re-upload the video."
        };
    }

    if (intent.consumed) {
        return {
            valid: false,
            error: "Upload intent has already been consumed."
        };
    }

    if (intent.expiresAt < Date.now()) {
        uploadIntents.delete(uploadIntentId);
        return {
            valid: false,
            error: "Upload intent has expired. Please re-upload the video."
        };
    }

    if (intent.userId !== userId) {
        return {
            valid: false,
            error: "Upload intent does not belong to the authenticated user."
        };
    }

    if (publicId && publicId !== intent.publicId) {
        return {
            valid: false,
            error: "Provided asset publicId does not match the server-authorized upload intent."
        };
    }

    if (videoUrl && !videoUrl.includes(intent.publicId)) {
        return {
            valid: false,
            error: "Provided videoUrl does not correspond to the server-authorized asset path."
        };
    }

    // Mark intent as consumed to prevent double registration
    intent.consumed = true;

    return {
        valid: true,
        intent
    };
}

/**
 * Creates a server-controlled IMAGE upload intent (profile avatar / banner)
 * and generates Cloudinary signed upload parameters.
 *
 * Security: the signature is issued server-side only (CLOUDINARY_API_SECRET
 * never reaches the browser), the folder is server-controlled per user and
 * per image kind, and the intent is single-user.
 *
 * @param {string} userId
 * @param {'avatar'|'banner'} kind
 */
function createImageUploadIntent(userId, kind) {
    const hasConfig = Boolean(
        env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
    );

    // In production, Cloudinary credentials are strictly mandatory
    if (env.NODE_ENV === "production" && !hasConfig) {
        const error = new Error("Cloudinary media service is not configured on the server.");
        error.statusCode = 503;
        error.code = "SERVICE_UNCONFIGURED";
        throw error;
    }

    const normalizedKind = kind === "banner" ? "banners" : "avatars";
    const intentId = `intent_img_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const folder = `yoibi/profiles/${userId}/${normalizedKind}`;
    const publicId = `${folder}/${intentId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Parameters to sign in alphabetical order.
    // IMPORTANT: sign ONLY `public_id` + `timestamp`. `public_id` already embeds the
    // server-controlled folder path. Cloudinary treats `public_id` as RELATIVE to the
    // `folder` parameter when both are provided (result: folder + '/' + public_id),
    // which would double the asset path. Folder structure stays server-controlled
    // via public_id. See createUploadIntent for the same rationale on videos.
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;

    let signature = "";
    if (hasConfig) {
        signature = crypto
            .createHash("sha1")
            .update(`${paramsToSign}${env.CLOUDINARY_API_SECRET}`)
            .digest("hex");
    } else {
        // Safe mock signature strictly for test/dev environment
        signature = `mock_sig_${crypto.randomBytes(8).toString("hex")}`;
    }

    return {
        uploadIntentId: intentId,
        publicId,
        folder,
        timestamp,
        signature,
        apiKey: env.CLOUDINARY_API_KEY || "mock_api_key",
        cloudName: env.CLOUDINARY_CLOUD_NAME || "mock_cloud_name"
    };
}

/**
 * Destroys a video asset in Cloudinary using the Admin/REST API.
 */
async function deleteCloudinaryAsset(publicId) {
    if (!publicId) return { success: true };

    const hasConfig = Boolean(
        env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
    );

    if (!hasConfig) {
        // In mock / test environment, return mock success
        return { success: true, mock: true };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
        .createHash("sha1")
        .update(`${paramsToSign}${env.CLOUDINARY_API_SECRET}`)
        .digest("hex");

    try {
        const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/destroy`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                public_id: publicId,
                timestamp,
                signature,
                api_key: env.CLOUDINARY_API_KEY
            })
        });

        const data = await response.json();
        // Cloudinary returns { result: 'ok' } or { result: 'not found' }
        return {
            success: data?.result === "ok" || data?.result === "not found",
            result: data?.result
        };
    } catch (err) {
        console.warn("[Cloudinary] Failed to destroy asset:", publicId, err.message);
        return {
            success: false,
            error: err.message
        };
    }
}

module.exports = {
    createUploadIntent,
    createImageUploadIntent,
    verifyAndConsumeIntent,
    deleteCloudinaryAsset,
    _uploadIntents: uploadIntents // Exposed for tests
};
