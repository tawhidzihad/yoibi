const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const videosRepository = require("../src/repositories/videos.repository");
const {
    generateUploadSignature,
    createVideo
} = require("../src/services/create/videos.service");
const {
    listVideos,
    getVideoById
} = require("../src/services/read/videos.service");
const {
    recordVideoView,
    likeVideo,
    unlikeVideo
} = require("../src/services/update/videos.service");
const {
    deleteVideo
} = require("../src/services/delete/videos.service");

async function runVideosTests() {
    console.log("[Test] Starting Phase 4 Milestone 4 Videos slice verification...");

    // 1. In-process HTTP endpoint verification
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    function request(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, baseUrl);
            const req = http.request(url, options, (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(data);
                    } catch {
                        parsed = data;
                    }
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                });
            });
            req.on("error", reject);
            if (options.body) {
                req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
            }
            req.end();
        });
    }

    try {
        // Test 1: GET /api/v1/videos (public, optional auth)
        const listRes = await request("/api/v1/videos");
        assert.strictEqual(listRes.status, 200, "GET /api/v1/videos must return 200 OK");
        assert.strictEqual(listRes.body.success, true);
        assert(Array.isArray(listRes.body.data.items), "Items must be an array");
        assert(listRes.body.data.pagination, "Pagination object must be present");
        console.log("✓ GET /api/v1/videos returned 200 OK with paginated envelope.");

        // Test 2: POST /api/v1/videos/upload-signature without token -> 401
        const sigUnauthRes = await request("/api/v1/videos/upload-signature", {
            method: "POST"
        });
        assert.strictEqual(sigUnauthRes.status, 401);
        assert.strictEqual(sigUnauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/videos/upload-signature without token rejected with 401 UNAUTHORIZED.");

        // Test 3: POST /api/v1/videos without token -> 401
        const createUnauthRes = await request("/api/v1/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { title: "My Video", videoUrl: "https://res.cloudinary.com/test.mp4" }
        });
        assert.strictEqual(createUnauthRes.status, 401);
        console.log("✓ POST /api/v1/videos without token rejected with 401.");

        // Test 4: DELETE /api/v1/videos/:id without token -> 401
        const deleteUnauthRes = await request("/api/v1/videos/vid_test", {
            method: "DELETE"
        });
        assert.strictEqual(deleteUnauthRes.status, 401);
        console.log("✓ DELETE /api/v1/videos/:id without token rejected with 401.");

        // Test 5: POST /api/v1/videos/:id/like without token -> 401
        const likeUnauthRes = await request("/api/v1/videos/vid_test/like", {
            method: "POST"
        });
        assert.strictEqual(likeUnauthRes.status, 401);
        console.log("✓ POST /api/v1/videos/:id/like without token rejected with 401.");

        // Test 6: GET /api/v1/videos/:id with non-existent ID -> 404
        const notFoundRes = await request("/api/v1/videos/vid_nonexistent_9999");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.error.code, "NOT_FOUND");
        console.log("✓ GET /api/v1/videos/:id with non-existent ID returned 404 NOT_FOUND.");

        // Test 7: POST /api/v1/videos/:id/view with non-existent ID -> 404
        const notFoundViewRes = await request("/api/v1/videos/vid_nonexistent_9999/view", {
            method: "POST"
        });
        assert.strictEqual(notFoundViewRes.status, 404);
        console.log("✓ POST /api/v1/videos/:id/view with non-existent ID returned 404 NOT_FOUND.");
    } finally {
        server.close();
    }

    console.log("\n[Test] Testing Video business logic & asset provenance (mocked repository)...");

    // In-memory mock store for business logic test isolation
    const mockDb = new Map();
    videosRepository.create = async (doc) => {
        const item = { ...doc };
        mockDb.set(item._id, item);
        return item;
    };
    videosRepository.findById = async (id) => {
        const item = mockDb.get(id);
        return item ? { ...item } : null;
    };
    videosRepository.findPaginated = async ({ category, authorId, search, skip = 0, limit = 20 }) => {
        let all = Array.from(mockDb.values());
        if (category) all = all.filter((v) => v.category === category);
        if (authorId) all = all.filter((v) => v.authorId === authorId);
        if (search) {
            const s = search.toLowerCase();
            all = all.filter((v) => (v.title && v.title.toLowerCase().includes(s)) || (v.description && v.description.toLowerCase().includes(s)));
        }
        return all.slice(skip, skip + limit);
    };
    videosRepository.count = async ({ category, authorId, search }) => {
        let all = Array.from(mockDb.values());
        if (category) all = all.filter((v) => v.category === category);
        if (authorId) all = all.filter((v) => v.authorId === authorId);
        if (search) {
            const s = search.toLowerCase();
            all = all.filter((v) => (v.title && v.title.toLowerCase().includes(s)) || (v.description && v.description.toLowerCase().includes(s)));
        }
        return all.length;
    };
    videosRepository.incrementViews = async (id) => {
        const item = mockDb.get(id);
        if (!item) return null;
        item.viewsCount = (item.viewsCount || 0) + 1;
        mockDb.set(id, item);
        return { ...item };
    };
    videosRepository.addLike = async (id, userId) => {
        const item = mockDb.get(id);
        if (!item) return null;
        if (!item.likes) item.likes = [];
        if (!item.likes.includes(userId)) {
            item.likes.push(userId);
            item.likesCount = (item.likesCount || 0) + 1;
        }
        mockDb.set(id, item);
        return { ...item };
    };
    videosRepository.removeLike = async (id, userId) => {
        const item = mockDb.get(id);
        if (!item) return null;
        if (!item.likes) item.likes = [];
        if (item.likes.includes(userId)) {
            item.likes = item.likes.filter((u) => u !== userId);
            item.likesCount = Math.max(0, (item.likesCount || 0) - 1);
        }
        mockDb.set(id, item);
        return { ...item };
    };
    videosRepository.deleteById = async (id) => {
        return mockDb.delete(id);
    };

    const userA = { id: "usr_author_123", email: "author@yoibi.com", role: "user" };
    const userB = { id: "usr_viewer_456", email: "viewer@yoibi.com", role: "user" };
    const adminUser = { id: "usr_admin_999", email: "admin@yoibi.com", role: "admin" };

    // Test 8: Generate upload signature produces user-bound folder & publicId
    const sig = await generateUploadSignature(userA);
    assert(sig.uploadIntentId, "Signature must include uploadIntentId");
    assert.strictEqual(sig.folder, `yoibi/videos/${userA.id}`, "Folder must be server-controlled to user ID");
    assert(sig.publicId.startsWith(`yoibi/videos/${userA.id}/`), "Public ID must start with user's folder");
    console.log("✓ Service: generateUploadSignature produced server-controlled folder & intent.");

    // Test 9: Asset Provenance — User B attempting to register User A's upload intent rejected with 403
    let provenanceMismatch = false;
    try {
        await createVideo(userB, {
            uploadIntentId: sig.uploadIntentId,
            title: "Pirated Video",
            videoUrl: `https://res.cloudinary.com/test/${sig.publicId}.mp4`,
            publicId: sig.publicId
        });
    } catch (err) {
        provenanceMismatch = true;
        assert.strictEqual(err.statusCode, 403);
    }
    assert(provenanceMismatch, "User B must not be able to claim User A's upload intent");
    console.log("✓ Provenance: Cross-user upload intent hijacking rejected with 403 FORBIDDEN.");

    // Test 10: Asset Provenance — Forged publicId not matching intent rejected with 403
    let forgedPublicIdRejected = false;
    try {
        await createVideo(userA, {
            uploadIntentId: sig.uploadIntentId,
            title: "Forged Public ID",
            videoUrl: "https://res.cloudinary.com/test/yoibi/videos/usr_other/hacked.mp4",
            publicId: "yoibi/videos/usr_other/hacked"
        });
    } catch (err) {
        forgedPublicIdRejected = true;
        assert.strictEqual(err.statusCode, 403);
    }
    assert(forgedPublicIdRejected, "Forged public ID must be rejected");
    console.log("✓ Provenance: Forged publicId not matching server intent rejected with 403 FORBIDDEN.");

    // Test 11: Valid metadata registration consumes intent and creates video
    const videoUrl = `https://res.cloudinary.com/yoibi/video/upload/v1/${sig.publicId}.mp4`;
    const createdVideo = await createVideo(userA, {
        uploadIntentId: sig.uploadIntentId,
        title: "Introduction to YOIBI Videos",
        description: "Exploring community videos without algorithms.",
        category: "learning",
        videoUrl,
        thumbnailUrl: `https://res.cloudinary.com/yoibi/video/upload/v1/${sig.publicId}.jpg`,
        publicId: sig.publicId,
        duration: 360,
        bytes: 15728640,
        format: "mp4"
    });
    assert(createdVideo._id, "Video must have an _id");
    assert.strictEqual(createdVideo.authorId, userA.id);
    assert.strictEqual(createdVideo.title, "Introduction to YOIBI Videos");
    assert.strictEqual(createdVideo.category, "learning");
    assert.strictEqual(createdVideo.viewsCount, 0, "Initial viewsCount must be 0");
    console.log("✓ Service: createVideo verified provenance, consumed intent, and created video.");

    // Test 12: Intent replay rejection — Same intent cannot be used a second time
    let intentReplayBlocked = false;
    try {
        await createVideo(userA, {
            uploadIntentId: sig.uploadIntentId,
            title: "Duplicate Video",
            videoUrl,
            publicId: sig.publicId
        });
    } catch (err) {
        intentReplayBlocked = true;
        assert.strictEqual(err.statusCode, 403);
    }
    assert(intentReplayBlocked, "Consumed intent must not be reusable");
    console.log("✓ Provenance: Intent replay blocked with 403 FORBIDDEN.");

    // Test 13: View count isolation — GET /videos/:id does NOT increment viewsCount
    const detailBefore = await getVideoById(createdVideo._id, userB);
    assert.strictEqual(detailBefore.viewsCount, 0, "Detail view must NOT increment viewsCount");
    const detailBefore2 = await getVideoById(createdVideo._id, userB);
    assert.strictEqual(detailBefore2.viewsCount, 0, "Repeated detail view must still NOT increment viewsCount");
    console.log("✓ Semantics: getVideoById is pure read-only and does NOT increment viewsCount.");

    // Test 14: Playback view recording — POST /videos/:id/view increments viewsCount
    const view1 = await recordVideoView(createdVideo._id);
    assert.strictEqual(view1.viewsCount, 1, "First playback event must increment viewsCount to 1");
    const view2 = await recordVideoView(createdVideo._id);
    assert.strictEqual(view2.viewsCount, 2, "Second playback event must increment viewsCount to 2");

    const detailAfter = await getVideoById(createdVideo._id, userB);
    assert.strictEqual(detailAfter.viewsCount, 2, "Detail view accurately reflects updated viewsCount");
    console.log("✓ Semantics: recordVideoView correctly records playback events (viewsCount = 2).");

    // Test 15: Category filtering & pagination
    // Create second video in 'news' category
    const sig2 = await generateUploadSignature(userA);
    const video2 = await createVideo(userA, {
        uploadIntentId: sig2.uploadIntentId,
        title: "Breaking Community Update",
        category: "news",
        videoUrl: `https://res.cloudinary.com/yoibi/video/upload/v1/${sig2.publicId}.mp4`,
        publicId: sig2.publicId
    });

    const allVideos = await listVideos({}, userB);
    assert.strictEqual(allVideos.items.length, 2, "All filter must return both videos");

    const learningVideos = await listVideos({ category: "learning" }, userB);
    assert.strictEqual(learningVideos.items.length, 1, "Category filter 'learning' must return 1 video");
    assert.strictEqual(learningVideos.items[0]._id, createdVideo._id);

    const newsVideos = await listVideos({ category: "news" }, userB);
    assert.strictEqual(newsVideos.items.length, 1, "Category filter 'news' must return 1 video");
    assert.strictEqual(newsVideos.items[0]._id, video2._id);
    console.log("✓ Service: listVideos correctly handles category filtering and pagination.");

    // Test 16: Like & Unlike toggles
    const likeRes = await likeVideo(createdVideo._id, userB);
    assert.strictEqual(likeRes.liked, true);
    assert.strictEqual(likeRes.likesCount, 1);

    const detailLiked = await getVideoById(createdVideo._id, userB);
    assert.strictEqual(detailLiked.liked, true);
    assert.strictEqual(detailLiked.likesCount, 1);

    const unlikeRes = await unlikeVideo(createdVideo._id, userB);
    assert.strictEqual(unlikeRes.liked, false);
    assert.strictEqual(unlikeRes.likesCount, 0);
    console.log("✓ Service: likeVideo and unlikeVideo updated likes and personalized flags.");

    // Test 17: Delete authorization — User B (non-author) blocked with 403
    let nonAuthorDeleteBlocked = false;
    try {
        await deleteVideo(createdVideo._id, userB);
    } catch (err) {
        nonAuthorDeleteBlocked = true;
        assert.strictEqual(err.statusCode, 403);
    }
    assert(nonAuthorDeleteBlocked, "Non-author delete must be blocked with 403 FORBIDDEN");
    console.log("✓ Security: Non-author delete attempt rejected with 403 FORBIDDEN.");

    // Test 18: Delete by author succeeds
    const deleteRes = await deleteVideo(createdVideo._id, userA);
    assert.strictEqual(deleteRes.deletedId, createdVideo._id);
    const checkDeleted = await videosRepository.findById(createdVideo._id);
    assert.strictEqual(checkDeleted, null, "Video must be deleted from repository");
    console.log("✓ Security: Video author successfully deleted video.");

    // Test 19: Delete by admin succeeds for another user's video
    const adminDeleteRes = await deleteVideo(video2._id, adminUser);
    assert.strictEqual(adminDeleteRes.deletedId, video2._id);
    console.log("✓ Security: Admin successfully deleted video.");

    console.log("\nAll Phase 4 Milestone 4 Videos tests passed successfully!");
}

module.exports = {
    runVideosTests
};
