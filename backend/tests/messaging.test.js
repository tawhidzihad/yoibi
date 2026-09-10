const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const followsRepository = require("../src/repositories/follows.repository");
const messagesRepository = require("../src/repositories/messages.repository");
const { followUser } = require("../src/services/create/follows.service");
const { unfollowUser } = require("../src/services/delete/follows.service");
const messagesService = require("../src/services/messages.service");
const User = require("../src/models/user.model");

async function runMessagingTests() {
    console.log("[Test] Starting Phase 4 Milestone 7 Messaging & Follow slice verification...");

    // 1. In-process HTTP verification for unauthenticated & validation checks
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
        // Test 1: GET /api/v1/messages/conversations without auth -> 401
        const convListUnauth = await request("/api/v1/messages/conversations");
        assert.strictEqual(convListUnauth.status, 401);
        assert.strictEqual(convListUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ GET /api/v1/messages/conversations without token rejected with 401 UNAUTHORIZED.");

        // Test 2: GET /api/v1/messages/conversations/:id without auth -> 401
        const convHistUnauth = await request("/api/v1/messages/conversations/conv_123");
        assert.strictEqual(convHistUnauth.status, 401);
        assert.strictEqual(convHistUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ GET /api/v1/messages/conversations/:id without token rejected with 401 UNAUTHORIZED.");

        // Test 3: POST /api/v1/messages without auth -> 401
        const msgSendUnauth = await request("/api/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { recipientId: "usr_2", content: "Hi", clientMessageId: "uuid-1" }
        });
        assert.strictEqual(msgSendUnauth.status, 401);
        assert.strictEqual(msgSendUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/messages without token rejected with 401 UNAUTHORIZED.");

        // Test 4: PATCH /api/v1/messages/conversations/:id/read without auth -> 401
        const readUnauth = await request("/api/v1/messages/conversations/conv_123/read", {
            method: "PATCH"
        });
        assert.strictEqual(readUnauth.status, 401);
        assert.strictEqual(readUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ PATCH /api/v1/messages/conversations/:id/read without token rejected with 401 UNAUTHORIZED.");

        // Test 5: POST /api/v1/users/:id/follow without auth -> 401
        const followUnauth = await request("/api/v1/users/usr_target/follow", {
            method: "POST"
        });
        assert.strictEqual(followUnauth.status, 401);
        console.log("✓ POST /api/v1/users/:id/follow without token rejected with 401 UNAUTHORIZED.");

        // Test 6: DELETE /api/v1/users/:id/follow without auth -> 401
        const unfollowUnauth = await request("/api/v1/users/usr_target/follow", {
            method: "DELETE"
        });
        assert.strictEqual(unfollowUnauth.status, 401);
        console.log("✓ DELETE /api/v1/users/:id/follow without token rejected with 401 UNAUTHORIZED.");

    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    // 2. Unit & Integration Testing with in-memory stores
    console.log("\n[Test] Testing Follow and Direct Messaging business logic in isolation...");

    const inMemoryFollows = new Set();
    const inMemoryUsers = new Map([
        ["usr_alice", { _id: "usr_alice", handle: "alice", name: "Alice", followersCount: 0, followingCount: 0 }],
        ["usr_bob", { _id: "usr_bob", handle: "bob", name: "Bob", followersCount: 0, followingCount: 0 }],
        ["usr_charlie", { _id: "usr_charlie", handle: "charlie", name: "Charlie", followersCount: 0, followingCount: 0 }],
    ]);

    const inMemoryConversations = new Map();
    const inMemoryMessages = [];

    // Mock FollowsRepository
    followsRepository.createFollow = async (followerId, followingId) => {
        const key = `${followerId}:${followingId}`;
        if (inMemoryFollows.has(key)) {
            return { created: false };
        }
        inMemoryFollows.add(key);
        return { created: true };
    };

    followsRepository.deleteFollow = async (followerId, followingId) => {
        const key = `${followerId}:${followingId}`;
        const deleted = inMemoryFollows.delete(key);
        return { deleted };
    };

    followsRepository.isFollowing = async (followerId, followingId) => {
        return inMemoryFollows.has(`${followerId}:${followingId}`);
    };

    followsRepository.getFollowersCount = async (userId) => {
        let count = 0;
        for (const key of inMemoryFollows) {
            const [, fId] = key.split(":");
            if (fId === userId) count++;
        }
        return count;
    };

    followsRepository.getFollowingCount = async (userId) => {
        let count = 0;
        for (const key of inMemoryFollows) {
            const [fId] = key.split(":");
            if (fId === userId) count++;
        }
        return count;
    };

    // Mock User queries
    User.findById = (id) => ({
        lean: async () => inMemoryUsers.get(id) || null
    });

    User.find = ({ _id: { $in: ids } }) => ({
        lean: async () => ids.map((id) => inMemoryUsers.get(id)).filter(Boolean)
    });

    User.updateOne = async (query, update) => {
        const user = inMemoryUsers.get(query._id);
        if (!user) return { modifiedCount: 0 };
        if (update.$inc) {
            if (update.$inc.followersCount) user.followersCount = Math.max(0, user.followersCount + update.$inc.followersCount);
            if (update.$inc.followingCount) user.followingCount = Math.max(0, user.followingCount + update.$inc.followingCount);
        }
        return { modifiedCount: 1 };
    };

    // Mock MessagesRepository
    messagesRepository.findOrCreateConversation = async (userA, userB) => {
        const canonical = [userA, userB].sort();
        const convKey = canonical.join("__");
        let conv = inMemoryConversations.get(convKey);
        if (!conv) {
            conv = {
                _id: `conv_${convKey}`,
                participants: canonical,
                unreadCounts: { [userA]: 0, [userB]: 0 },
                lastMessage: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            inMemoryConversations.set(convKey, conv);
        }
        return conv;
    };

    messagesRepository.getConversationById = async (conversationId) => {
        for (const conv of inMemoryConversations.values()) {
            if (conv._id === conversationId) return conv;
        }
        return null;
    };

    messagesRepository.findMessageByIdempotency = async (senderId, clientMessageId) => {
        return inMemoryMessages.find((m) => m.senderId === senderId && m.clientMessageId === clientMessageId) || null;
    };

    messagesRepository.createMessage = async ({ conversationId, senderId, recipientId, content, clientMessageId }) => {
        const msg = {
            _id: `msg_${inMemoryMessages.length + 1}`,
            conversationId,
            senderId,
            recipientId,
            content,
            clientMessageId,
            readAt: null,
            createdAt: new Date(),
        };
        inMemoryMessages.push(msg);
        return msg;
    };

    messagesRepository.updateConversationSummary = async (conversationId, lastMessage, recipientId) => {
        const conv = await messagesRepository.getConversationById(conversationId);
        if (conv) {
            conv.lastMessage = {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                clientMessageId: lastMessage.clientMessageId,
                createdAt: lastMessage.createdAt,
            };
            conv.updatedAt = new Date();
            conv.unreadCounts[recipientId] = (conv.unreadCounts[recipientId] || 0) + 1;
        }
        return conv;
    };

    messagesRepository.listConversationsForUser = async (userId, { _page = 1, _limit = 20 } = {}) => {
        const items = Array.from(inMemoryConversations.values()).filter((c) => c.participants.includes(userId));
        return { items, totalItems: items.length };
    };

    messagesRepository.getMessagesByConversationId = async (conversationId, { _page = 1, _limit = 30 } = {}) => {
        const items = inMemoryMessages.filter((m) => m.conversationId === conversationId);
        return { items: [...items], totalItems: items.length };
    };

    messagesRepository.markConversationMessagesAsRead = async (conversationId, userId) => {
        let count = 0;
        inMemoryMessages.forEach((m) => {
            if (m.conversationId === conversationId && m.recipientId === userId && !m.readAt) {
                m.readAt = new Date();
                count++;
            }
        });
        const conv = await messagesRepository.getConversationById(conversationId);
        if (conv && conv.unreadCounts) {
            conv.unreadCounts[userId] = 0;
        }
        return count;
    };

    // ==========================================
    // SECTION A: FOLLOW SYSTEM TESTS
    // ==========================================
    console.log("\n--- Follow System Tests ---");

    // A1. Self-follow rejection
    await assert.rejects(
        async () => followUser("usr_alice", "usr_alice"),
        (err) => err.code === "INVALID_ACTION" && err.status === 400,
        "Self-follow must be rejected with INVALID_ACTION 400"
    );
    console.log("✓ Self-follow rejected with 400 INVALID_ACTION.");

    // A2. Follow user
    const followRes1 = await followUser("usr_alice", "usr_bob");
    assert.strictEqual(followRes1.followed, true);
    assert.strictEqual(followRes1.targetUserId, "usr_bob");
    assert.strictEqual(inMemoryUsers.get("usr_alice").followingCount, 1);
    assert.strictEqual(inMemoryUsers.get("usr_bob").followersCount, 1);
    assert.strictEqual(await followsRepository.isFollowing("usr_alice", "usr_bob"), true);
    console.log("✓ User A followed User B successfully with counter increments.");

    // A3. Duplicate follow is idempotent
    const followRes2 = await followUser("usr_alice", "usr_bob");
    assert.strictEqual(followRes2.followed, true);
    assert.strictEqual(inMemoryUsers.get("usr_alice").followingCount, 1, "Counter must not double increment");
    assert.strictEqual(inMemoryUsers.get("usr_bob").followersCount, 1, "Counter must not double increment");
    console.log("✓ Duplicate follow is idempotent and does not double-count.");

    // A4. Unfollow user
    const unfollowRes1 = await unfollowUser("usr_alice", "usr_bob");
    assert.strictEqual(unfollowRes1.unfollowed, true);
    assert.strictEqual(inMemoryUsers.get("usr_alice").followingCount, 0);
    assert.strictEqual(inMemoryUsers.get("usr_bob").followersCount, 0);
    assert.strictEqual(await followsRepository.isFollowing("usr_alice", "usr_bob"), false);
    console.log("✓ User A unfollowed User B successfully with counter decrements.");

    // A5. Repeated unfollow is idempotent (count not below 0)
    const unfollowRes2 = await unfollowUser("usr_alice", "usr_bob");
    assert.strictEqual(unfollowRes2.unfollowed, true);
    assert.strictEqual(inMemoryUsers.get("usr_alice").followingCount, 0, "Counter must stay at 0");
    assert.strictEqual(inMemoryUsers.get("usr_bob").followersCount, 0, "Counter must stay at 0");
    console.log("✓ Repeated unfollow is idempotent and does not decrement below 0.");

    // ==========================================
    // SECTION B: FOLLOW-GATED DIRECT MESSAGING
    // ==========================================
    console.log("\n--- Follow-Gated Direct Messaging Tests ---");

    // B1. Alice tries to message Bob without following -> rejected with 403 DM_FOLLOW_REQUIRED
    await assert.rejects(
        async () => messagesService.sendMessage({
            senderId: "usr_alice",
            recipientId: "usr_bob",
            content: "Hello Bob",
            clientMessageId: "uuid-msg-1"
        }),
        (err) => err.code === "DM_FOLLOW_REQUIRED" && err.status === 403,
        "Sending message without following must be rejected with DM_FOLLOW_REQUIRED 403"
    );
    console.log("✓ Message send rejected with 403 DM_FOLLOW_REQUIRED when sender does not follow recipient.");

    // B2. Alice follows Bob -> message send succeeds
    await followUser("usr_alice", "usr_bob");
    const sendRes1 = await messagesService.sendMessage({
        senderId: "usr_alice",
        recipientId: "usr_bob",
        content: "Hello Bob, I follow you now!",
        clientMessageId: "uuid-msg-1"
    });
    assert.strictEqual(sendRes1.isRetry, false);
    assert.strictEqual(sendRes1.message.content, "Hello Bob, I follow you now!");
    assert.strictEqual(sendRes1.message.senderId, "usr_alice");
    assert.strictEqual(sendRes1.message.recipientId, "usr_bob");
    assert.strictEqual(sendRes1.message.readAt, null);
    console.log("✓ Message send succeeded after User A followed User B.");

    // B3. Bob does NOT follow Alice -> Bob tries to message Alice -> rejected (directional rule verification)
    assert.strictEqual(await followsRepository.isFollowing("usr_bob", "usr_alice"), false);
    await assert.rejects(
        async () => messagesService.sendMessage({
            senderId: "usr_bob",
            recipientId: "usr_alice",
            content: "Hey Alice",
            clientMessageId: "uuid-msg-2"
        }),
        (err) => err.code === "DM_FOLLOW_REQUIRED" && err.status === 403,
        "Bob must be rejected when messaging Alice because Bob does not follow Alice"
    );
    console.log("✓ Directional follow enforced: Bob cannot message Alice without following Alice.");

    // B4. Bob follows Alice -> Bob can now reply
    await followUser("usr_bob", "usr_alice");
    const sendRes2 = await messagesService.sendMessage({
        senderId: "usr_bob",
        recipientId: "usr_alice",
        content: "Hey Alice, thanks for reaching out!",
        clientMessageId: "uuid-msg-2"
    });
    assert.strictEqual(sendRes2.isRetry, false);
    assert.strictEqual(sendRes2.conversationId, sendRes1.conversationId, "Must reuse canonical conversation");
    console.log("✓ Canonical conversation reused when Bob replies to Alice.");

    // B5. Alice unfollows Bob -> Alice tries to message Bob -> rejected; history remains
    await unfollowUser("usr_alice", "usr_bob");
    await assert.rejects(
        async () => messagesService.sendMessage({
            senderId: "usr_alice",
            recipientId: "usr_bob",
            content: "Another message after unfollow",
            clientMessageId: "uuid-msg-3"
        }),
        (err) => err.code === "DM_FOLLOW_REQUIRED" && err.status === 403
    );
    // Verify history still intact
    const historyAfterUnfollow = await messagesService.getConversationHistory(sendRes1.conversationId, "usr_alice", {});
    assert.strictEqual(historyAfterUnfollow.items.length, 2);
    console.log("✓ When Alice unfollows Bob, history is preserved but new messages are blocked.");

    // Re-follow Bob to continue tests
    await followUser("usr_alice", "usr_bob");

    // ==========================================
    // SECTION C: MESSAGE IDEMPOTENCY TESTS
    // ==========================================
    console.log("\n--- Message Idempotency Tests ---");

    const initialCount = inMemoryMessages.length;
    // C1. Retry with the same { senderId, clientMessageId }
    const retryRes = await messagesService.sendMessage({
        senderId: "usr_alice",
        recipientId: "usr_bob",
        content: "Hello Bob, I follow you now!",
        clientMessageId: "uuid-msg-1"
    });
    assert.strictEqual(retryRes.isRetry, true, "Must flag as retry");
    assert.strictEqual(retryRes.message.clientMessageId, "uuid-msg-1");
    assert.strictEqual(inMemoryMessages.length, initialCount, "Must NOT create duplicate record in DB");
    console.log("✓ Idempotent message retry returned existing message without creating duplicate.");

    // C2. Different clientMessageId creates fresh message
    const freshRes = await messagesService.sendMessage({
        senderId: "usr_alice",
        recipientId: "usr_bob",
        content: "A distinct new message",
        clientMessageId: "uuid-msg-4"
    });
    assert.strictEqual(freshRes.isRetry, false);
    assert.strictEqual(inMemoryMessages.length, initialCount + 1);
    console.log("✓ Distinct clientMessageId creates new message successfully.");

    // ==========================================
    // SECTION D: CONVERSATION MEMBERSHIP & SECURITY
    // ==========================================
    console.log("\n--- Conversation Authorization & Security Tests ---");

    // D1. Charlie (non-member) cannot access Alice & Bob's conversation history
    await assert.rejects(
        async () => messagesService.getConversationHistory(sendRes1.conversationId, "usr_charlie", {}),
        (err) => err.code === "FORBIDDEN" && err.status === 403,
        "Non-participant must be rejected with 403 FORBIDDEN"
    );
    console.log("✓ Non-participant access to conversation history rejected with 403 FORBIDDEN.");

    // D2. Charlie cannot mark Alice & Bob's conversation as read
    await assert.rejects(
        async () => messagesService.markAsRead(sendRes1.conversationId, "usr_charlie"),
        (err) => err.code === "FORBIDDEN" && err.status === 403
    );
    console.log("✓ Non-participant mark-read attempt rejected with 403 FORBIDDEN.");

    // D3. Self-messaging rejection
    await assert.rejects(
        async () => messagesService.sendMessage({
            senderId: "usr_alice",
            recipientId: "usr_alice",
            content: "Talking to myself",
            clientMessageId: "uuid-self"
        }),
        (err) => err.code === "CANNOT_MESSAGE_SELF" && err.status === 400
    );
    console.log("✓ Self-messaging rejected with 400 CANNOT_MESSAGE_SELF.");

    // ==========================================
    // SECTION E: PAGINATION & READ STATE TESTS
    // ==========================================
    console.log("\n--- Pagination & Read State Tests ---");

    // E1. List conversations pagination
    const convListRes = await messagesService.listConversations("usr_alice", { page: 1, limit: 10 });
    assert(Array.isArray(convListRes.items));
    assert.strictEqual(convListRes.pagination.page, 1);
    assert.strictEqual(convListRes.pagination.limit, 10);
    assert.strictEqual(convListRes.pagination.totalItems, 1);
    assert.strictEqual(convListRes.pagination.totalPages, 1);
    assert.strictEqual(convListRes.pagination.hasNextPage, false);
    console.log("✓ Conversations list returned standard page-based pagination envelope.");

    // E2. Conversation history pagination
    const historyRes = await messagesService.getConversationHistory(sendRes1.conversationId, "usr_alice", { page: 1, limit: 20 });
    assert(Array.isArray(historyRes.items));
    assert.strictEqual(historyRes.pagination.page, 1);
    assert.strictEqual(historyRes.pagination.limit, 20);
    assert.strictEqual(historyRes.items.length, 3);
    console.log("✓ Conversation history returned standard page-based pagination envelope.");

    // E3. Mark as read
    const readRes = await messagesService.markAsRead(sendRes1.conversationId, "usr_bob");
    assert.strictEqual(readRes.conversationId, sendRes1.conversationId);
    assert(readRes.updatedCount >= 1, "Must update unread received messages");

    // Verify Bob's received messages now have readAt set
    const updatedHistory = await messagesService.getConversationHistory(sendRes1.conversationId, "usr_bob", {});
    const bobReceived = updatedHistory.items.filter((m) => m.recipientId === "usr_bob");
    bobReceived.forEach((m) => {
        assert(m.readAt !== null, "Received messages must have readAt timestamp populated");
    });
    console.log("✓ Conversation marked as read and timestamps updated for recipient.");

    console.log("\n==================================================");
    console.log("   ALL MESSAGING & FOLLOW TESTS PASSED (100%)    ");
    console.log("==================================================");
}

module.exports = { runMessagingTests };

if (require.main === module) {
    runMessagingTests().catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
}
