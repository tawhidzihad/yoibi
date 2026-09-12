const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const { fakeMediaItem, assertRejectsForbidden } = require("./tweet-media-helpers");

/**
 * Tweet image-upload contract tests (unauthenticated route, structured media
 * validator, intent issuance + strict provenance verification in the create
 * service). Runs in the deterministic unconfigured-services test mode — the
 * intent store works locally without live Cloudinary credentials.
 *
 * @param {{ createTweet: Function }} deps
 */
async function runTweetMediaContractTests({ createTweet }) {
    const userA = { id: "usr_alice", role: "user" };
    const userB = { id: "usr_bob", role: "user" };

    // Test L: media-signature route requires auth (401).
    const mediaSigServer = http.createServer(app);
    await new Promise((resolve) => mediaSigServer.listen(0, "127.0.0.1", resolve));
    try {
        const mediaBase = `http://127.0.0.1:${mediaSigServer.address().port}`;
        const sigUnauth = await new Promise((resolve, reject) => {
            const req = http.request(
                new URL("/api/v1/tweets/media-signature", mediaBase),
                { method: "POST" },
                (res) => {
                    let data = "";
                    res.on("data", (c) => { data += c; });
                    res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
                }
            );
            req.on("error", reject);
            req.end();
        });
        assert.strictEqual(sigUnauth.status, 401);
        assert.strictEqual(sigUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/tweets/media-signature without token rejected with 401 UNAUTHORIZED.");
    } finally {
        await new Promise((resolve) => mediaSigServer.close(resolve));
    }

    // Test M: validator enforces the structured media contract (max 5).
    const { createTweetSchema: mediaContractSchema } = require("../src/validators/tweets.validator");
    const tooMany = { content: "Too many images", media: [1, 2, 3, 4, 5, 6].map((n) => fakeMediaItem(n)) };
    assert.throws(() => mediaContractSchema.parse(tooMany), "6 media items must be rejected");
    const five = { content: "Five images ok", media: [1, 2, 3, 4, 5].map((n) => fakeMediaItem(n)) };
    assert.strictEqual(mediaContractSchema.parse(five).media.length, 5);
    console.log("✓ Validator: structured media contract allows up to 5 items.");
    assert.throws(
        () => mediaContractSchema.parse({ content: "URL media", media: [{ url: "https://example.com/x.png" }] }),
        "URL-only media items must be rejected"
    );
    console.log("✓ Validator: free-form URL media (no intent reference) is rejected.");

    // Test N: intent issuance is user-scoped (folder + exact publicId).
    const { createTweetImageUploadIntent } = require("../src/integrations/cloudinary/cloudinary");
    const aliceIntent = createTweetImageUploadIntent(userA.id);
    assert.strictEqual(aliceIntent.folder, `yoibi/tweets/${userA.id}`);
    assert(aliceIntent.publicId.startsWith(`yoibi/tweets/${userA.id}/`), "publicId must embed the user folder");
    assert(aliceIntent.uploadIntentId && aliceIntent.signature, "Intent must carry id + signature");
    assert(!JSON.stringify(aliceIntent).toLowerCase().includes("secret"), "Intent must never contain a secret");
    const aliceAssetUrl = `https://res.cloudinary.com/mock/image/upload/${aliceIntent.publicId}.jpg`;

    // Test O: createTweet verifies provenance and stores canonical identity.
    const tweetWithMedia = await createTweet({
        user: userA,
        content: "Tweet with a verified image",
        media: [{
            uploadIntentId: aliceIntent.uploadIntentId,
            publicId: aliceIntent.publicId,
            url: aliceAssetUrl,
            width: 1200,
            height: 800,
            bytes: 204800,
            format: "jpg"
        }]
    });
    assert.strictEqual(tweetWithMedia.mediaUrls.length, 1);
    assert.strictEqual(tweetWithMedia.mediaUrls[0].publicId, aliceIntent.publicId);
    assert.strictEqual(tweetWithMedia.mediaUrls[0].url, aliceAssetUrl);
    assert.strictEqual(tweetWithMedia.mediaUrls[0].type, "image");
    console.log("✓ Service: createTweet verified provenance and stored the canonical media record.");

    // Test P: forged publicId / another user's intent / reused intent → 403.
    const bobIntent = createTweetImageUploadIntent(userB.id);
    const bobAssetUrl = `https://res.cloudinary.com/mock/image/upload/${bobIntent.publicId}.jpg`;

    await assertRejectsForbidden(createTweet({
        user: userA,
        content: "Forge publicId",
        media: [{ uploadIntentId: aliceIntent.uploadIntentId, publicId: bobIntent.publicId, url: bobAssetUrl }]
    }), "Forged publicId must be rejected");

    await assertRejectsForbidden(createTweet({
        user: userA,
        content: "Use another user's intent",
        media: [{ uploadIntentId: bobIntent.uploadIntentId, publicId: bobIntent.publicId, url: bobAssetUrl }]
    }), "Another user's intent must be rejected");

    // A failed verification must NOT burn the intent — its owner can still
    // use it exactly once, after which reuse is rejected.
    const bobTweet = await createTweet({
        user: userB,
        content: "Bob posts his own image",
        media: [{ uploadIntentId: bobIntent.uploadIntentId, publicId: bobIntent.publicId, url: bobAssetUrl }]
    });
    assert.strictEqual(bobTweet.mediaUrls[0].publicId, bobIntent.publicId);

    await assertRejectsForbidden(createTweet({
        user: userB,
        content: "Reuse consumed intent",
        media: [{ uploadIntentId: bobIntent.uploadIntentId, publicId: bobIntent.publicId, url: bobAssetUrl }]
    }), "Consumed intents must be single-use");

    const wrongUrlIntent = createTweetImageUploadIntent(userA.id);
    await assertRejectsForbidden(createTweet({
        user: userA,
        content: "URL does not match asset",
        media: [{
            uploadIntentId: wrongUrlIntent.uploadIntentId,
            publicId: wrongUrlIntent.publicId,
            url: "https://example.com/some-other-image.png"
        }]
    }), "Non-corresponding asset URL must be rejected");

    console.log("✓ Service: forged/foreign/consumed intents and mismatched URLs rejected with 403.");
}

module.exports = { runTweetMediaContractTests };

