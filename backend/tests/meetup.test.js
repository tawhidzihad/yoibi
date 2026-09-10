const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const meetupRepository = require("../src/repositories/meetup.repository");
const { createMeetupRoom } = require("../src/services/create/meetup.service");
const { listMeetupRooms, getMeetupRoomById, joinMeetupRoom } = require("../src/services/read/meetup.service");
const { endMeetupRoom } = require("../src/services/update/meetup.service");
const { deleteMeetupRoom } = require("../src/services/delete/meetup.service");
const {
    generateMeetupParticipantToken,
    reserveSlot,
    resetReservations
} = require("../src/integrations/livekit/livekit");
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

async function runMeetupTests() {
    console.log("[Test] Starting Phase 4 Milestone 6 Meet-Up slice verification...");

    // Reset any test reservations
    resetReservations();

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
        // Test 1: GET /api/v1/meetup/rooms (public)
        const listRes = await request("/api/v1/meetup/rooms");
        assert.strictEqual(listRes.status, 200, "GET /api/v1/meetup/rooms must return 200 OK");
        assert.strictEqual(listRes.body.success, true);
        assert(Array.isArray(listRes.body.data.items), "Items must be an array");
        assert(listRes.body.data.pagination, "Pagination object must be present");
        console.log("✓ GET /api/v1/meetup/rooms returned 200 OK with paginated envelope.");

        // Test 2: POST /api/v1/meetup/rooms without auth -> 401
        const createUnauthRes = await request("/api/v1/meetup/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { name: "Unauthorized Meetup" }
        });
        assert.strictEqual(createUnauthRes.status, 401);
        assert.strictEqual(createUnauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/meetup/rooms without token rejected with 401 UNAUTHORIZED.");

        // Test 3: GET /api/v1/meetup/rooms/:roomId non-existent -> 404 ROOM_NOT_FOUND
        const notFoundRes = await request("/api/v1/meetup/rooms/mup_nonexistent_9999");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.error.code, "ROOM_NOT_FOUND");
        console.log("✓ GET /api/v1/meetup/rooms/:roomId with non-existent ID returned 404 ROOM_NOT_FOUND.");

        // Test 4: POST /api/v1/meetup/rooms/:roomId/join without token -> 401
        const joinUnauthRes = await request("/api/v1/meetup/rooms/mup_test/join", { method: "POST" });
        assert.strictEqual(joinUnauthRes.status, 401);
        console.log("✓ POST /api/v1/meetup/rooms/:roomId/join without token rejected with 401.");

        // Test 5: POST /api/v1/meetup/rooms/:roomId/end without token -> 401
        const endUnauthRes = await request("/api/v1/meetup/rooms/mup_test/end", { method: "POST" });
        assert.strictEqual(endUnauthRes.status, 401);
        console.log("✓ POST /api/v1/meetup/rooms/:roomId/end without token rejected with 401.");

        // Test 6: DELETE /api/v1/meetup/rooms/:roomId without token -> 401
        const deleteUnauthRes = await request("/api/v1/meetup/rooms/mup_test", { method: "DELETE" });
        assert.strictEqual(deleteUnauthRes.status, 401);
        console.log("✓ DELETE /api/v1/meetup/rooms/:roomId without token rejected with 401.");
    } finally {
        server.close();
    }

    console.log("\n[Test] Testing Meet-Up domain logic, Better Auth ownership, zero-PII, capacity & concurrency...");

    // Mock store for isolated domain testing
    const mockStore = new Map();
    meetupRepository.create = async (data) => {
        const item = { ...data, _id: data._id || data.id, id: data.id || data._id };
        mockStore.set(item.id, item);
        return item;
    };
    meetupRepository.findById = async (id) => mockStore.get(id) || null;
    meetupRepository.findPaginated = async ({ status }) => {
        const all = Array.from(mockStore.values());
        if (!status || status === "all") return all;
        return all.filter((r) => r.status === status);
    };
    meetupRepository.count = async ({ status }) => {
        const all = Array.from(mockStore.values());
        if (!status || status === "all") return all.length;
        return all.filter((r) => r.status === status).length;
    };
    meetupRepository.updateStatus = async (id, status, extra = {}) => {
        const item = mockStore.get(id);
        if (!item) return null;
        const updated = { ...item, status, ...extra };
        mockStore.set(id, updated);
        return updated;
    };
    meetupRepository.deleteById = async (id) => mockStore.delete(id);
    meetupRepository.enrichOwner = async (room) => ({
        ...room,
        id: room.id || room._id,
        owner: {
            id: room.ownerId,
            name: "Alex Rivers",
            handle: "alexrivers",
            avatarUrl: "https://example.com/avatar.webp"
        }
    });
    meetupRepository.enrichOwners = async (rooms) => rooms.map((r) => ({
        ...r,
        id: r.id || r._id,
        owner: {
            id: r.ownerId,
            name: "Alex Rivers",
            handle: "alexrivers",
            avatarUrl: "https://example.com/avatar.webp"
        }
    }));

    // Test 7: Owner identity derivation from Better Auth user ID
    const hostUser = {
        id: "usr_alex_123",
        name: "Alex Rivers",
        handle: "alexrivers",
        avatarUrl: "https://example.com/alex.jpg"
    };

    const createResult = await createMeetupRoom(hostUser, {
        name: "Frontend Architecture Jam",
        topic: "Next.js App Router & WebRTC",
        maxParticipants: 2
    });

    assert(createResult.room, "Created room must be returned");
    assert.strictEqual(createResult.room.ownerId, "usr_alex_123", "ownerId must match verified Better Auth req.user.id");
    assert.strictEqual(createResult.room.name, "Frontend Architecture Jam");
    assert.strictEqual(createResult.room.topic, "Next.js App Router & WebRTC");
    assert.strictEqual(createResult.room.maxParticipants, 2);
    assert.strictEqual(createResult.room.status, "active", "Newly created room must be active");
    assert(createResult.room.roomName.startsWith("meetup_"), "Room name must be prefixed with meetup_");
    console.log("✓ Meet-Up room created with verified Better Auth user ID ownership (ownerId: String).");

    // Test 8: LiveKit participant identity & minimized metadata (Zero-PII)
    assert(createResult.participantIdentity, "Participant identity must be returned");
    assert(
        /^participant_[0-9a-f-]{36}$/.test(createResult.participantIdentity),
        `Identity '${createResult.participantIdentity}' must match opaque participant_<uuid> format`
    );
    assert(!createResult.participantIdentity.includes("alex"), "Identity must contain zero user handle/name PII");
    assert(!createResult.participantIdentity.includes("usr_alex_123"), "Identity must contain zero user ID PII");

    const decodedHostToken = decodeJwtPayload(createResult.token);
    assert.strictEqual(decodedHostToken.sub, createResult.participantIdentity);
    assert(decodedHostToken.video.roomJoin === true);
    assert(decodedHostToken.video.canPublish === true);
    assert(decodedHostToken.video.canSubscribe === true);
    assert(decodedHostToken.video.canPublishData === true);
    assert.strictEqual(decodedHostToken.video.roomAdmin, false, "LiveKit roomAdmin must NEVER be granted");

    const parsedMetadata = JSON.parse(decodedHostToken.metadata);
    assert.strictEqual(parsedMetadata.name, "Alex Rivers");
    assert.strictEqual(parsedMetadata.handle, "alexrivers");
    assert.strictEqual(parsedMetadata.avatarUrl, "https://example.com/alex.jpg");
    assert.strictEqual(parsedMetadata._id, undefined, "Mongo internal _id must NOT be exposed in LiveKit metadata");
    assert.strictEqual(parsedMetadata.userId, undefined, "Raw user ID must NOT be exposed in LiveKit metadata");
    console.log("✓ LiveKit participant token validated: opaque identity, least privilege, and presentation snapshot metadata.");

    // Test 9: Participant 2 joins under capacity
    const participantUser = {
        id: "usr_bob_456",
        name: "Bob Builder",
        handle: "bobbuilder",
        avatarUrl: "https://example.com/bob.jpg"
    };

    const joinResult = await joinMeetupRoom(createResult.room.id, participantUser);
    assert(joinResult.token, "Join token must be generated");
    assert(/^participant_[0-9a-f-]{36}$/.test(joinResult.participantIdentity));
    const decodedJoinToken = decodeJwtPayload(joinResult.token);
    assert.strictEqual(decodedJoinToken.video.canPublish, true);
    assert.strictEqual(decodedJoinToken.video.canSubscribe, true);
    assert.strictEqual(decodedJoinToken.video.roomAdmin, false);
    console.log("✓ Second participant joined successfully at capacity (2/2).");

    // Test 10: Participant 3 joins when full -> 403 ROOM_FULL
    const participant3 = {
        id: "usr_carol_789",
        name: "Carol Danvers",
        handle: "carol",
        avatarUrl: null
    };

    try {
        await joinMeetupRoom(createResult.room.id, participant3);
        assert.fail("Joining full room must throw 403 ROOM_FULL");
    } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "ROOM_FULL");
        console.log("✓ Join over maxParticipants rejected with 403 ROOM_FULL.");
    }

    // Test 11: Concurrent join race condition simulation
    const concurrentRoom = await createMeetupRoom(hostUser, {
        name: "Concurrency Test Room",
        topic: "Race conditions",
        maxParticipants: 3
    });
    // 1 host slot is reserved, 2 slots remaining.
    // Fire 5 concurrent join requests simultaneously.
    const concurrentUsers = [
        { id: "usr_1", name: "User 1", handle: "u1" },
        { id: "usr_2", name: "User 2", handle: "u2" },
        { id: "usr_3", name: "User 3", handle: "u3" },
        { id: "usr_4", name: "User 4", handle: "u4" },
        { id: "usr_5", name: "User 5", handle: "u5" }
    ];

    const concurrentResults = await Promise.allSettled(
        concurrentUsers.map((u) => joinMeetupRoom(concurrentRoom.room.id, u))
    );

    const successfulJoins = concurrentResults.filter((r) => r.status === "fulfilled");
    const rejectedJoins = concurrentResults.filter((r) => r.status === "rejected");

    assert.strictEqual(successfulJoins.length, 2, "Exactly 2 joins must succeed to fill 3-person room (1 host + 2 peers)");
    assert.strictEqual(rejectedJoins.length, 3, "Exactly 3 joins must be rejected");
    rejectedJoins.forEach((rej) => {
        assert.strictEqual(rej.reason.statusCode, 403);
        assert.strictEqual(rej.reason.code, "ROOM_FULL");
    });
    console.log("✓ Concurrency race handled: 5 simultaneous joins against 2 slots permitted exactly 2 and rejected 3 with 403 ROOM_FULL.");

    // Test 12: Stale reservation expiration
    const expiryRoomName = `meetup_${require("crypto").randomUUID()}`;
    const slot1 = await reserveSlot(expiryRoomName, 2, 50); // 50ms TTL
    assert(slot1.success, "First reservation must succeed");
    const slot2 = await reserveSlot(expiryRoomName, 2, 50); // 50ms TTL
    assert(slot2.success, "Second reservation must succeed");
    const slot3Immediate = await reserveSlot(expiryRoomName, 2, 50);
    assert.strictEqual(slot3Immediate.success, false, "Immediate 3rd reservation on full room must fail");

    // Wait 70ms for reservations to expire
    await new Promise((r) => setTimeout(r, 70));
    const slotAfterExpiry = await reserveSlot(expiryRoomName, 2, 20000);
    assert.strictEqual(slotAfterExpiry.success, true, "Slot must be available after stale reservation expired");
    console.log("✓ Stale reservation automatically expired and released slot.");

    // Test 13: Active room cannot be deleted -> 403 ROOM_ACTIVE
    try {
        await deleteMeetupRoom(hostUser, createResult.room.id);
        assert.fail("Deleting active room must throw 403 ROOM_ACTIVE");
    } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "ROOM_ACTIVE");
        console.log("✓ DELETE on active room rejected with 403 ROOM_ACTIVE.");
    }

    // Test 14: Non-owner cannot end room -> 403 FORBIDDEN
    try {
        await endMeetupRoom(participantUser, createResult.room.id);
        assert.fail("Non-owner ending room must throw 403 FORBIDDEN");
    } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "FORBIDDEN");
        console.log("✓ Non-owner cannot end room (403 FORBIDDEN).");
    }

    // Test 15: Non-owner cannot delete room -> 403 FORBIDDEN
    try {
        await deleteMeetupRoom(participantUser, createResult.room.id);
        assert.fail("Non-owner deleting room must throw 403 FORBIDDEN");
    } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "FORBIDDEN");
        console.log("✓ Non-owner cannot delete room (403 FORBIDDEN).");
    }

    // Test 16: Owner ends room -> status 'ended', LiveKit session terminated
    const endResult = await endMeetupRoom(hostUser, createResult.room.id);
    assert.strictEqual(endResult.status, "ended");
    assert(endResult.endedAt instanceof Date);
    console.log("✓ Owner successfully ended room and terminated LiveKit session.");

    // Test 17: Join ended room -> 403 ROOM_ENDED
    try {
        await joinMeetupRoom(createResult.room.id, participantUser);
        assert.fail("Joining ended room must throw 403 ROOM_ENDED");
    } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "ROOM_ENDED");
        console.log("✓ Joining ended room rejected with 403 ROOM_ENDED.");
    }

    // Test 18: Owner deletes ended room -> 200 OK
    const deleteResult = await deleteMeetupRoom(hostUser, createResult.room.id);
    assert.strictEqual(deleteResult.id, createResult.room.id);
    assert.strictEqual(mockStore.has(createResult.room.id), false);
    console.log("✓ Owner successfully deleted ended room permanently.");

    // Test 19: Direct services (listMeetupRooms, getMeetupRoomById)
    const listResult = await listMeetupRooms({ page: 1, limit: 10, status: "all" });
    assert(Array.isArray(listResult.items));
    assert(listResult.pagination);

    const getRoomRes = await getMeetupRoomById(concurrentRoom.room.id);
    assert.strictEqual(getRoomRes.id, concurrentRoom.room.id);
    console.log("✓ Services: listMeetupRooms and getMeetupRoomById performed successfully.");

    // Test 20: Direct LiveKit helper function
    const directToken = await generateMeetupParticipantToken("meetup_direct_test", hostUser);
    assert(directToken.token);
    assert(directToken.participantIdentity);
    console.log("✓ Helpers: Direct generateMeetupParticipantToken generated valid token.");

    // Test 21: LIVEKIT_API_SECRET containment
    const secretValue = env.LIVEKIT_API_SECRET || "secret123456789012345678901234567890";
    if (secretValue) {
        const stringifiedCreate = JSON.stringify(createResult);
        assert(!stringifiedCreate.includes(secretValue), "LIVEKIT_API_SECRET must never appear in response");
    }
    console.log("✓ Verified LIVEKIT_API_SECRET is strictly contained on the backend.");

    console.log("\n[Test] ✓ All Phase 4 Milestone 6 Meet-Up backend assertions passed successfully!\n");
}

module.exports = {
    runMeetupTests
};

if (require.main === module) {
    runMeetupTests().catch((err) => {
        console.error("Meet-Up test failure:", err);
        process.exit(1);
    });
}
