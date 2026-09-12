import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Tweet image-upload frontend regression tests (static contract checks):
 *   - URL-based image posting is gone from the composer (no URL field)
 *   - composer selects images from the device (file input, multiple, image MIME allowlist)
 *   - 5-image cap enforced in UI copy + uploader
 *   - uploads use the server-issued signature route (no Cloudinary secret in the browser)
 *   - single-image + carousel + full-screen viewer components exist with
 *     Escape/backdrop/a11y affordances
 *   - the API client posts the structured `media` contract (not `mediaUrls`)
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function readSrc(relativePath) {
    return readFileSync(path.join(ROOT, "src", relativePath), "utf8");
}

describe("tweet composer: URL posting removed, device upload added", () => {
    const composer = readSrc("features/tweets/ui/CreateTweetCard.js");

    it("has no URL-based image input", () => {
        expect(composer).not.toMatch(/mediaUrl/);
        expect(composer).not.toContain("Enter image or media URL");
        expect(composer).not.toContain('type="url"');
        expect(composer).not.toContain("paste an image URL");
    });

    it("opens a native multi-file image picker from the device", () => {
        expect(composer).toContain('type="file"');
        expect(composer).toContain("multiple");
        expect(composer).toContain("TWEET_IMAGE_ACCEPT");
        expect(composer).toContain("Add media");
        // MIME allowlist lives in the API client contract (single source of truth).
        const apiForPicker = readSrc("features/tweets/api/tweetsApi.js");
        expect(apiForPicker).toContain("image/avif");
        expect(apiForPicker).toContain("image/gif");
    });

    it("shows in-composer previews with per-image removal (no upload modal)", () => {
        expect(composer).toContain("TweetMediaPreviewGrid");
        expect(composer).toContain("Remove image");
        expect(composer).not.toMatch(/upload modal/i);
    });

    it("enforces the 5-image cap in the UI", () => {
        expect(composer).toContain("TWEET_IMAGE_MAX_COUNT");
        expect(composer).toContain("attach up to ${TWEET_IMAGE_MAX_COUNT} images per tweet");
        expect(composer).toContain("remainingSlots");
        expect(composer).toContain("slice(0, TWEET_IMAGE_MAX_COUNT)");
    });

    it("validates size and dedupes selections (types via shared allowlist)", () => {
        expect(composer).toContain("TWEET_IMAGE_ALLOWED_TYPES");
        expect(composer).toContain("TWEET_IMAGE_MAX_BYTES");
        expect(composer).toContain("must be 10 MB or smaller");
        expect(composer).toContain("Duplicate selection");
    });

    it("posts with user-facing progress states (no infrastructure wording)", () => {
        expect(composer).toContain("Preparing images...");
        expect(composer).toContain("Uploading images...");
        expect(composer).toContain("Posting...");
        expect(composer).not.toMatch(/Cloudinary/i);
        // Images come only from the device picker; the only URL touchpoint is
        // the server-returned `secure_url` stored on the media record.
        expect(composer).not.toContain("Enter image or media URL");
        expect(composer).not.toContain('type="url"');
    });
});

describe("tweet API client: signed upload + structured media contract", () => {
    const api = readSrc("features/tweets/api/tweetsApi.js");

    it("requests a server-issued signature per image", () => {
        expect(api).toContain('apiClient.post("/tweets/media-signature")');
        expect(api).toContain("getTweetImageSignature");
    });

    it("uploads to Cloudinary with public_id only (no folder param, no secret)", () => {
        expect(api).toContain("image/upload");
        expect(api).toContain('formData.append("public_id"');
        expect(api).not.toMatch(/formData\.append\("folder"/);
        expect(api).not.toContain("CLOUDINARY_API_SECRET");
    });

    it("rejects a mismatched returned public_id (canonical identity)", () => {
        expect(api).toContain("response?.public_id !== signatureData.publicId");
    });

    it("posts the structured `media` contract instead of `mediaUrls`", () => {
        expect(api).toContain("media,");
        expect(api).not.toMatch(/mediaUrls/);
        expect(api).toContain("TWEET_IMAGE_MAX_COUNT");
        expect(api).toContain("TWEET_IMAGE_ACCEPT");
    });

    it("supports the five required image formats", () => {
        for (const mime of ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]) {
            expect(api).toContain(mime);
        }
    });
});

describe("tweet media display: gallery carousel + full-screen viewer", () => {
    const gallery = readSrc("features/tweets/ui/TweetMediaGallery.js");
    const viewer = readSrc("features/tweets/ui/TweetMediaViewer.js");
    const card = readSrc("features/tweets/ui/TweetCard.js");

    it("gallery renders single images and a multi-image carousel", () => {
        expect(gallery).toContain("TweetMediaViewer");
        expect(gallery).toContain("Previous image");
        expect(gallery).toContain("Next image");
        expect(gallery).toContain("aria-roledescription");
        expect(gallery).toContain("onTouchStart");
        expect(gallery).toContain("max-h-96");
    });

    it("viewer covers the viewport with counter, close, Escape and navigation", () => {
        expect(viewer).toContain("fixed inset-0");
        expect(viewer).toContain('role="dialog"');
        expect(viewer).toContain('aria-modal="true"');
        expect(viewer).toContain("Close image viewer");
        expect(viewer).toContain("Escape");
        expect(viewer).toContain("ArrowRight");
        expect(viewer).toContain("ArrowLeft");
        expect(viewer).toMatch(/Image \{.*\} of \{count\}/);
    });

    it("TweetCard delegates media rendering to the gallery", () => {
        expect(card).toContain("TweetMediaGallery");
        expect(card).not.toMatch(/mediaUrlValue|setShowMediaInput/);
    });

    it("legacy media representations keep rendering (strings + objects)", () => {
        expect(viewer).toContain("normalizeTweetMedia");
        expect(viewer).toContain('typeof item === "string"');
    });
});
