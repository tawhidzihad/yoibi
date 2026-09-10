const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const streamsRepository = require("../src/repositories/streams.repository");
const { createStream } = require("../src/services/create/streams.service");
const { listStreams, getStreamById, joinStream } = require("../src/services/read/streams.service");
const { startStream, endStream } = require("../src/services/update/streams.service");
const { deleteStream } = require("../src/services/delete/streams.service");
const { generateHostToken, generateViewerToken } = require("../src/integrations/livekit/livekit");
const { env } = require("../src/config/env");

/**
 * Decodes a JWT token payload without signature verification for test assertions.
 */
function decodeJwtPayload(token) {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(json);
}

async function runStreamsTests() {
    console.log("[Test] Starting Phase 4 Milestone 5 Streams slice verification...");

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
        // Test 1: GET /api/v1/streams (public)
        const listRes = await request("/api/v1/streams");
        assert.strictEqual(listRes.status, 200, "GET /api/v1/streams must return 200 OK");
        assert.strictEqual(listRes.body.success, true);
        assert(Array.isArray(listRes.body.data.items), "Items must be an array");
        assert(listRes.body.data.pagination, "Pagination object must be present");
        console.log("✓ GET /api/v1/streams returned 200 OK with paginated envelope.");

        // Test 2: POST /api/v1/streams without auth -> 401
        const createUnauthRes = await request("/api/v1/streams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { title: "Unauthenticated Stream" }
        });
        assert.strictEqual(createUnauthRes.status, 401);
        assert.strictEqual(createUnauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/streams without token rejected with 401 UNAUTHORIZED.");

        // Test 3: GET /api/v1/streams/:id non-existent -> 404
        const notFoundRes = await request("/api/v1/streams/strm_nonexistent_9999");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.error.code, "NOT_FOUND");
        console.log("✓ GET /api/v1/streams/:id with non-existent ID returned 404 NOT_FOUND.");

        // Test 4: POST /api/v1/streams/:id/start without token -> 401
        const startUnauthRes = await request("/api/v1/streams/strm_test/start", { method: "POST" });
        assert.strictEqual(startUnauthRes.status, 401);
        console.log("✓ POST /api/v1/streams/:id/start without token rejected with 401.");

        // Test 5: POST /api/v1/streams/:id/end without token -> 401
        const endUnauthRes = await request("/api/v1/streams/strm_test/end", { method: "POST" });
        assert.strictEqual(endUnauthRes.status, 401);
        console.log("✓ POST /api/v1/streams/:id/end without token rejected with 401.");

        // Test 6: DELETE /api/v1/streams/:id without token -> 401
        const deleteUnauthRes = await request("/api/v1/streams/strm_test", { method: "DELETE" });
        assert.strictEqual(deleteUnauthRes.status, 401);
        console.log("✓ DELETE /api/v1/streams/:id without token rejected with 401.");
    } finally {
        server.close();
    }

    console.log("\n[Test] Testing Streams domain logic, anti-PII naming, lifecycle, and permissions...");

    // In-memory mock store for business logic isolation
    const mockDb = new Map();
    streamsRepository.create = async (doc) => {
        const item = { ...doc };
        mockDb.set(item._id, item);
        return item;
    };
    streamsRepository.findById = async (id) => {
        const item = mockDb.get(id);
        return item ? { ...item } : null;
    };
    streamsRepository.findByRoomName = async (roomName) => {
        for (const item of mockDb.values()) {
            if (item.roomName === roomName) return { ...item };
        }
        return null;
    };
    streamsRepository.findPaginated = async ({ status = "live", category, authorId, skip = 0, limit = 20 }) => {
        let all = Array.from(mockDb.values());
        if (status) all = all.filter((s) => s.status === status);
        if (category) all = all.filter((s) => s.category === category);
        if (authorId) all = all.filter((s) => s.authorId === authorId);
        return all.slice(skip, skip + limit);
    };
    streamsRepository.count = async ({ status = "live", category, authorId }) => {
        let all = Array.from(mockDb.values());
        if (status) all = all.filter((s) => s.status === status);
        if (category) all = all.filter((s) => s.category === category);
        if (authorId) all = all.filter((s) => s.authorId === authorId);
        return all.length;
    };
    streamsRepository.updateStatus = async (id, status, extraFields = {}) => {
        const item = mockDb.get(id);
        if (!item) return null;
        const updated = { ...item, status, ...extraFields };
        mockDb.set(id, updated);
        return { ...updated };
    };
    streamsRepository.deleteById = async (id) => {
        return mockDb.delete(id);
    };

    const hostUser = { id: "usr_host_abc123", email: "host@yoibi.com", name: "Host Jane", role: "user" };
    const viewerUser = { id: "usr_viewer_xyz789", email: "viewer@yoibi.com", name: "Viewer Bob", role: "user" };
    const adminUser = { id: "usr_admin_001", email: "admin@yoibi.com", name: "Admin Alice", role: "admin" };

    // Test 7: Create stream -> status: "ready", roomName is opaque without PII
    const createResult = await createStream(hostUser, {
        title: "Live Coding YOIBI with LiveKit",
        description: "Realtime streaming architectural walkthrough",
        category: "learning"
    });

    assert(createResult.stream, "Stream must be created");
    assert.strictEqual(createResult.stream.status, "ready", "Initial stream status must be 'ready'");
    assert.strictEqual(createResult.stream.authorId, hostUser.id);
    assert.strictEqual(createResult.isHost, true);
    assert(createResult.livekit.token, "Host token must be returned");

    // Room Name Anti-PII Invariant Check
    const roomName = createResult.stream.roomName;
    assert(roomName.startsWith("stream_"), "Room name must start with stream_ prefix");
    assert(!roomName.includes(hostUser.id), "Room name must NEVER contain user ID");
    assert(!roomName.includes(hostUser.email), "Room name must NEVER contain user email");
    assert(!roomName.includes("jane"), "Room name must NEVER contain user name");
    assert(!roomName.includes("Host"), "Room name must NEVER contain user name");
    console.log(`✓ Room Naming: Opaque room name '${roomName}' verified to contain ZERO user PII.`);

    // Test 8: Decode Host Token & Assert Least-Privilege Grants
    const hostPayload = decodeJwtPayload(createResult.livekit.token);
    assert(hostPayload, "Host token payload must decode");
    assert(hostPayload.sub.startsWith("host_"), "Host identity must be opaque (host_<uuid>)");
    assert(!hostPayload.sub.includes(hostUser.id), "Host token identity must not leak user ID");
    assert.strictEqual(hostPayload.video.room, roomName, "Host token must be granted to correct room");
    assert.strictEqual(hostPayload.video.roomJoin, true, "Host must have roomJoin = true");
    assert.strictEqual(hostPayload.video.canPublish, true, "Host must have canPublish = true");
    assert.strictEqual(hostPayload.video.canSubscribe, true, "Host must have canSubscribe = true");
    assert.strictEqual(hostPayload.video.canPublishData, true, "Host can publish data channel");
    assert.strictEqual(hostPayload.video.roomAdmin, false, "Host must NOT receive roomAdmin privileges");
    console.log("✓ Permissions: Host token permissions verified (canPublish: true, roomAdmin: false, opaque identity).");

    // Test 9: Viewer cannot join a stream in 'ready' state -> 400 STREAM_NOT_LIVE
    let viewerJoinReadyBlocked = false;
    try {
        await joinStream(createResult.stream._id, viewerUser);
    } catch (err) {
        viewerJoinReadyBlocked = true;
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "STREAM_NOT_LIVE");
    }
    assert(viewerJoinReadyBlocked, "Viewer must NOT be allowed to join a ready stream");
    console.log("✓ Lifecycle: Viewer join on 'ready' stream rejected with 400 STREAM_NOT_LIVE.");

    // Test 10: Anonymous viewer cannot join a stream in 'ready' state -> 400 STREAM_NOT_LIVE
    let anonJoinReadyBlocked = false;
    try {
        await joinStream(createResult.stream._id, null);
    } catch (err) {
        anonJoinReadyBlocked = true;
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "STREAM_NOT_LIVE");
    }
    assert(anonJoinReadyBlocked, "Anonymous viewer must NOT be allowed to join a ready stream");
    console.log("✓ Lifecycle: Anonymous viewer join on 'ready' stream rejected with 400 STREAM_NOT_LIVE.");

    // Test 11: Host joining own 'ready' stream succeeds (for preparation)
    const hostReadyJoin = await joinStream(createResult.stream._id, hostUser);
    assert.strictEqual(hostReadyJoin.isHost, true);
    assert(hostReadyJoin.livekit.token, "Host can join ready stream for preparation");
    console.log("✓ Lifecycle: Host joining own 'ready' stream for device preparation succeeded.");

    // Test 12: Non-owner cannot start stream -> 403 FORBIDDEN
    let nonOwnerStartBlocked = false;
    try {
        await startStream(viewerUser, createResult.stream._id);
    } catch (err) {
        nonOwnerStartBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "FORBIDDEN");
    }
    assert(nonOwnerStartBlocked, "Non-owner must not be able to start stream");
    console.log("✓ Security: Non-owner start attempt rejected with 403 FORBIDDEN.");

    // Test 13: Owner starts stream -> status: "live", startedAt recorded
    const startResult = await startStream(hostUser, createResult.stream._id);
    assert.strictEqual(startResult.stream.status, "live");
    assert(startResult.stream.startedAt, "startedAt timestamp must be populated");
    assert.strictEqual(startResult.isHost, true);
    console.log("✓ Lifecycle: Host successfully transitioned stream from 'ready' to 'live'.");

    // Test 14: Viewer joins 'live' stream -> 200 OK with viewer token
    const viewerJoinResult = await joinStream(createResult.stream._id, viewerUser);
    assert.strictEqual(viewerJoinResult.isHost, false);
    assert(viewerJoinResult.livekit.token, "Viewer token must be issued");

    // Decode Viewer Token & Assert Least-Privilege
    const viewerPayload = decodeJwtPayload(viewerJoinResult.livekit.token);
    assert(viewerPayload.sub.startsWith("viewer_"), "Viewer identity must be opaque (viewer_<uuid>)");
    assert(!viewerPayload.sub.includes(viewerUser.id), "Viewer token identity must not leak user ID");
    assert.strictEqual(viewerPayload.video.room, roomName, "Viewer token must be granted to correct room");
    assert.strictEqual(viewerPayload.video.roomJoin, true, "Viewer must have roomJoin = true");
    assert.strictEqual(viewerPayload.video.canPublish, false, "Viewer must have canPublish = false");
    assert.strictEqual(viewerPayload.video.canSubscribe, true, "Viewer must have canSubscribe = true");
    assert.strictEqual(viewerPayload.video.canPublishData, false, "Viewer cannot publish data");
    assert.strictEqual(viewerPayload.video.roomAdmin, false, "Viewer must NOT receive roomAdmin");
    console.log("✓ Permissions: Viewer token permissions verified (canPublish: false, canSubscribe: true, opaque identity).");

    // Test 15: Cannot delete active 'live' stream -> 403 STREAM_LIVE
    let liveDeleteBlocked = false;
    try {
        await deleteStream(hostUser, createResult.stream._id);
    } catch (err) {
        liveDeleteBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "STREAM_LIVE");
    }
    assert(liveDeleteBlocked, "Deleting active live stream must be blocked");
    console.log("✓ Security: Direct delete on 'live' stream rejected with 403 STREAM_LIVE.");

    // Test 16: Non-owner cannot end stream -> 403 FORBIDDEN
    let nonOwnerEndBlocked = false;
    try {
        await endStream(viewerUser, createResult.stream._id);
    } catch (err) {
        nonOwnerEndBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "FORBIDDEN");
    }
    assert(nonOwnerEndBlocked, "Non-owner cannot end stream");
    console.log("✓ Security: Non-owner end attempt rejected with 403 FORBIDDEN.");

    // Test 17: Owner ends stream -> status: "ended", endedAt recorded
    const endResult = await endStream(hostUser, createResult.stream._id);
    assert.strictEqual(endResult.status, "ended");
    assert(endResult.endedAt, "endedAt timestamp must be populated");
    console.log("✓ Lifecycle: Host successfully ended stream broadcast (status: 'ended').");

    // Test 18: Viewer cannot join 'ended' stream -> 403 STREAM_ENDED
    let viewerJoinEndedBlocked = false;
    try {
        await joinStream(createResult.stream._id, viewerUser);
    } catch (err) {
        viewerJoinEndedBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "STREAM_ENDED");
    }
    assert(viewerJoinEndedBlocked, "Viewer must NOT be allowed to join an ended stream");
    console.log("✓ Lifecycle: Viewer join on 'ended' stream rejected with 403 STREAM_ENDED.");

    // Test 19: Cannot start already ended stream -> 403 STREAM_ENDED
    let restartEndedBlocked = false;
    try {
        await startStream(hostUser, createResult.stream._id);
    } catch (err) {
        restartEndedBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "STREAM_ENDED");
    }
    assert(restartEndedBlocked, "Cannot start already ended stream");
    console.log("✓ Lifecycle: Re-starting an ended stream rejected with 403 STREAM_ENDED.");

    // Test 20: Cannot end already ended stream -> 403 STREAM_ALREADY_ENDED
    let reEndBlocked = false;
    try {
        await endStream(hostUser, createResult.stream._id);
    } catch (err) {
        reEndBlocked = true;
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "STREAM_ALREADY_ENDED");
    }
    assert(reEndBlocked, "Cannot re-end already ended stream");
    console.log("✓ Lifecycle: Re-ending an ended stream rejected with 403 STREAM_ALREADY_ENDED.");

    // Test 21: Delete ended stream by owner succeeds -> 200
    const deleteEndedRes = await deleteStream(hostUser, createResult.stream._id);
    assert.strictEqual(deleteEndedRes.deletedId, createResult.stream._id);
    const checkDeleted = await streamsRepository.findById(createResult.stream._id);
    assert.strictEqual(checkDeleted, null, "Stream must be deleted from database");
    console.log("✓ Security: Stream owner successfully deleted ended stream.");

    // Test 22: listStreams and getStreamById service operations
    const streamB = await createStream(hostUser, {
        title: "Second Test Broadcast",
        category: "news"
    });
    await startStream(hostUser, streamB.stream._id);

    const listed = await listStreams({ status: "live", category: "news" });
    assert.strictEqual(listed.items.length, 1);
    assert.strictEqual(listed.items[0]._id, streamB.stream._id);

    const retrieved = await getStreamById(streamB.stream._id);
    assert.strictEqual(retrieved._id, streamB.stream._id);
    assert.strictEqual(retrieved.title, "Second Test Broadcast");
    console.log("✓ Services: listStreams and getStreamById performed successfully.");

    // Test 23: Admin user can end and delete streams
    const adminEndRes = await endStream(adminUser, streamB.stream._id);
    assert.strictEqual(adminEndRes.status, "ended");
    const adminDelRes = await deleteStream(adminUser, streamB.stream._id);
    assert.strictEqual(adminDelRes.deletedId, streamB.stream._id);
    console.log("✓ Security: Admin successfully ended and deleted stream.");

    // Test 24: Direct LiveKit helper functions
    const directHost = await generateHostToken("stream_direct_test");
    assert(directHost.token);
    const directViewer = await generateViewerToken("stream_direct_test");
    assert(directViewer.token);
    console.log("✓ Helpers: Direct generateHostToken and generateViewerToken generated valid JWTs.");

    // Test 25: Secret Containment Assertion — LIVEKIT_API_SECRET is never present
    const secretValue = env.LIVEKIT_API_SECRET || "secret123456789012345678901234567890";
    const createPayloadString = JSON.stringify(createResult);
    assert(!createPayloadString.includes(secretValue), "API response MUST NEVER contain LIVEKIT_API_SECRET");
    console.log("✓ Security: Secret containment verified (LIVEKIT_API_SECRET never present in responses).");

    console.log("\nAll Phase 4 Milestone 5 Streams tests passed successfully!");
}

module.exports = {
    runStreamsTests
};
