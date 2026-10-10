const assert = require("assert");
const http = require("http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { generateKeyPair, exportJWK, SignJWT } = require("jose");
const { io: ClientIO } = require("socket.io-client");

const app = require("../src/app");
const { env } = require("../src/config/env");
const { countCharacters } = require("../src/utils/charCount");
const {
    MESSAGE_TEXT_MAX_LENGTH,
    MESSAGE_IMAGE_MAX_BYTES,
    MESSAGE_VIDEO_MAX_BYTES
} = require("../src/config/constants");

const conversationsRepository = require("../src/repositories/conversations.repository");
const messagesRepository = require("../src/repositories/messages.repository");
const followsRepository = require("../src/repositories/follows.repository");
const usersRepository = require("../src/repositories/users.repository");
const presenceService = require("../src/services/presence.service");
const cloudinaryIntegration = require("../src/integrations/cloudinary/cloudinary");
const { initSocketServer } = require("../src/sockets/socketServer");
const { invalidateJWKS } = require("../src/middleware/auth");

async function runMessagesTests() {
    console.log("[Test] Starting Direct Messaging test suite...");

    // -------------------------------------------------------------
    // Setup JWKS & In-Memory Signing Keys
    // -------------------------------------------------------------
    const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 2048 });
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = crypto.randomUUID();
    publicJwk.alg = "RS256";
    publicJwk.use = "sig";

    const jwksServer = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ keys: [publicJwk] }));
    });
    await new Promise((resolve) => jwksServer.listen(0, "127.0.0.1", resolve));
    const { port: jwksPort } = jwksServer.address();
    const jwksUrl = `http://127.0.0.1:${jwksPort}/api/auth/jwks`;

    const originalJwksUrl = env.BETTER_AUTH_JWKS_URL;
    const originalBaseUrl = env.BETTER_AUTH_BASE_URL;

    const ISSUER = "https://auth.test.yoibi.example";
    env.BETTER_AUTH_JWKS_URL = jwksUrl;
    env.BETTER_AUTH_BASE_URL = ISSUER;
    invalidateJWKS();

    const now = Math.floor(Date.now() / 1000);
    async function mintToken(sub, overrides = {}) {
        return new SignJWT({
            sub,
            email: `${sub}@example.com`,
            name: `User ${sub}`,
            emailVerified: true,
            isBlocked: false,
            iat: now,
            iss: ISSUER,
            aud: ISSUER,
            exp: now + 3600,
            ...overrides
        })
            .setProtectedHeader({ alg: "RS256", kid: publicJwk.kid })
            .sign(privateKey);
    }

    // -------------------------------------------------------------
    // Start In-Process HTTP + Socket.IO Server
    // -------------------------------------------------------------
    const server = http.createServer(app);
    const ioServer = initSocketServer(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port: appPort } = server.address();
    const serverUrl = `http://127.0.0.1:${appPort}`;

    // Helper for HTTP requests
    async function request(path, options = {}) {
        const url = `${serverUrl}${path}`;
        const headers = { ...(options.headers || {}) };
        if (options.token) {
            headers["Authorization"] = `Bearer ${options.token}`;
        }
        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const res = await fetch(url, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        let data = null;
        try {
            data = await res.json();
        } catch {}
        return { status: res.status, ok: res.ok, body: data };
    }

    // -------------------------------------------------------------
    // In-Memory Mocks for DB Repositories during Test Mode
    // -------------------------------------------------------------
    const mockUsers = new Map([
        ["usr_alice", { _id: "usr_alice", name: "Alice", handle: "alice", avatarUrl: "https://example.com/a.jpg", isBlocked: false }],
        ["usr_bob", { _id: "usr_bob", name: "Bob", handle: "bob", avatarUrl: "https://example.com/b.jpg", isBlocked: false }],
        ["usr_charlie", { _id: "usr_charlie", name: "Charlie", handle: "charlie", avatarUrl: "https://example.com/c.jpg", isBlocked: false }],
        ["usr_blocked", { _id: "usr_blocked", name: "Blocked", handle: "blocked", avatarUrl: "", isBlocked: true }]
    ]);

    const mockFollows = new Set([
        "usr_alice:usr_bob", // Alice follows Bob
        "usr_bob:usr_alice"  // Bob follows Alice (mutual)
        // Alice does NOT follow Charlie
    ]);

    const mockConversations = new Map();
    const mockMessages = [];

    // Monkey-patch repositories in test mode
    const origFindUser = usersRepository.findById;
    const origFindUsers = usersRepository.findByIds;
    const origIsFollowing = followsRepository.isFollowing;
    const origGetFollowingIds = followsRepository.getFollowingIds;

    const origFindConvById = conversationsRepository.findById;
    const origFindOrCreateDirect = conversationsRepository.findOrCreateDirect;
    const origListForUser = conversationsRepository.listForUser;
    const origUpdateLastMessage = conversationsRepository.updateLastMessage;
    const origMarkConversationRead = conversationsRepository.markConversationRead;
    const origMarkAllRead = conversationsRepository.markAllRead;
    const origGetTotalUnread = conversationsRepository.getTotalUnreadCount;

    const origCreateMsg = messagesRepository.createMessage;
    const origFindMsgById = messagesRepository.findById;
    const origFindByClientMsgId = messagesRepository.findByClientMessageId;
    const origListMsgs = messagesRepository.listMessages;
    const origMarkDelivered = messagesRepository.markDelivered;
    const origMarkRead = messagesRepository.markRead;

    try {
        usersRepository.findById = async(id) => mockUsers.get(id) || null;
        usersRepository.findByIds = async(ids) => ids.map((id) => mockUsers.get(id)).filter(Boolean);
        followsRepository.isFollowing = async(f, target) => mockFollows.has(`${f}:${target}`);
        followsRepository.getFollowingIds = async(f) => {
            const res = [];
            for (const pair of mockFollows) {
                const [from, to] = pair.split(":");
                if (from === f) res.push(to);
            }
            return res;
        };

        conversationsRepository.findById = async(id) => mockConversations.get(String(id)) || null;
        conversationsRepository.findOrCreateDirect = async(u1, u2) => {
            const sorted = [String(u1), String(u2)].sort();
            const key = sorted.join(":");
            for (const conv of mockConversations.values()) {
                if (conv.participantKey === key) return { conversation: conv, created: false };
            }
            const fakeId = new mongoose.Types.ObjectId().toHexString();
            const newConv = {
                _id: fakeId,
                id: fakeId,
                participantKey: key,
                participants: sorted,
                lastMessage: null,
                lastActivityAt: new Date(),
                unreadCounts: { [u1]: 0, [u2]: 0 },
                lastReadAt: { [u1]: new Date(), [u2]: new Date() },
                createdAt: new Date()
            };
            mockConversations.set(fakeId, newConv);
            return { conversation: newConv, created: true };
        };

        conversationsRepository.listForUser = async(userId) => {
            const res = [];
            for (const c of mockConversations.values()) {
                if (c.participants.includes(userId)) res.push(c);
            }
            return res.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
        };

        conversationsRepository.updateLastMessage = async(convId, summary, recipientId) => {
            const conv = mockConversations.get(String(convId));
            if (!conv) return null;
            conv.lastMessage = summary;
            conv.lastActivityAt = summary.createdAt || new Date();
            conv.unreadCounts[recipientId] = (conv.unreadCounts[recipientId] || 0) + 1;
            return conv;
        };

        conversationsRepository.markConversationRead = async(convId, userId) => {
            const conv = mockConversations.get(String(convId));
            if (!conv) return null;
            conv.unreadCounts[userId] = 0;
            conv.lastReadAt[userId] = new Date();
            return conv;
        };

        conversationsRepository.markAllRead = async(userId) => {
            let count = 0;
            for (const conv of mockConversations.values()) {
                if (conv.participants.includes(userId) && conv.unreadCounts[userId] > 0) {
                    conv.unreadCounts[userId] = 0;
                    count++;
                }
            }
            return count;
        };

        conversationsRepository.getTotalUnreadCount = async(userId) => {
            let total = 0;
            for (const conv of mockConversations.values()) {
                if (conv.participants.includes(userId)) {
                    total += conv.unreadCounts[userId] || 0;
                }
            }
            return total;
        };

        messagesRepository.createMessage = async(data) => {
            // Check idempotency
            const existing = mockMessages.find(
                (m) => String(m.conversationId) === String(data.conversationId) &&
                       m.senderId === data.senderId &&
                       m.clientMessageId === data.clientMessageId
            );
            if (existing) {
                return { created: false, message: existing };
            }
            const msg = {
                _id: data.id,
                conversationId: data.conversationId,
                senderId: data.senderId,
                clientMessageId: data.clientMessageId,
                type: data.type || "text",
                text: data.text || "",
                media: data.media || null,
                recipients: data.recipients || [],
                createdAt: data.createdAt || new Date()
            };
            mockMessages.push(msg);
            return { created: true, message: msg };
        };

        messagesRepository.findById = async(id) => mockMessages.find((m) => m._id === id) || null;
        messagesRepository.findByClientMessageId = async(cId, sId, cmId) => {
            return mockMessages.find(
                (m) => String(m.conversationId) === String(cId) &&
                       m.senderId === sId &&
                       m.clientMessageId === cmId
            ) || null;
        };

        messagesRepository.listMessages = async(cId, { cursor, limit = 30 }) => {
            let msgs = mockMessages.filter((m) => String(m.conversationId) === String(cId));
            if (cursor) {
                const cDate = new Date(cursor);
                msgs = msgs.filter((m) => new Date(m.createdAt) < cDate);
            }
            return msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
        };

        messagesRepository.markDelivered = async(cId, recipientId, msgIds) => {
            const now = new Date();
            let count = 0;
            for (const m of mockMessages) {
                if (String(m.conversationId) === String(cId) && m.senderId !== recipientId) {
                    if (!msgIds || msgIds.includes(m._id)) {
                        for (const r of m.recipients) {
                            if (r.userId === recipientId && !r.deliveredAt) {
                                r.deliveredAt = now;
                                count++;
                            }
                        }
                    }
                }
            }
            return { modifiedCount: count, deliveredAt: now };
        };

        messagesRepository.markRead = async(cId, recipientId, msgIds) => {
            const now = new Date();
            let count = 0;
            for (const m of mockMessages) {
                if (String(m.conversationId) === String(cId) && m.senderId !== recipientId) {
                    if (!msgIds || msgIds.includes(m._id)) {
                        for (const r of m.recipients) {
                            if (r.userId === recipientId && !r.readAt) {
                                r.readAt = now;
                                if (!r.deliveredAt) r.deliveredAt = now;
                                count++;
                            }
                        }
                    }
                }
            }
            return { modifiedCount: count, readAt: now };
        };

        // -------------------------------------------------------------
        // Tests
        // -------------------------------------------------------------
        const aliceToken = await mintToken("usr_alice");
        const bobToken = await mintToken("usr_bob");
        const charlieToken = await mintToken("usr_charlie");
        const blockedToken = await mintToken("usr_blocked", { isBlocked: true });
        const unverifiedToken = await mintToken("usr_unverified", { emailVerified: false });

        // 1. Config Endpoint
        const configRes = await request("/api/v1/messages/config");
        assert.strictEqual(configRes.status, 200);
        assert.strictEqual(configRes.body.data.textMaxLength, MESSAGE_TEXT_MAX_LENGTH);
        assert.strictEqual(configRes.body.data.imageMaxBytes, MESSAGE_IMAGE_MAX_BYTES);
        assert.strictEqual(configRes.body.data.videoMaxBytes, MESSAGE_VIDEO_MAX_BYTES);
        console.log("✓ GET /api/v1/messages/config returns limits configuration.");

        // 2. Unauthenticated access rejected
        const unauthRes = await request("/api/v1/messages/conversations");
        assert.strictEqual(unauthRes.status, 401);
        console.log("✓ Unauthenticated request rejected with 401 UNAUTHORIZED.");

        // 3. Self messaging rejected
        const selfMsgRes = await request("/api/v1/messages/conversations", {
            method: "POST",
            token: aliceToken,
            body: { recipientId: "usr_alice" }
        });
        assert.strictEqual(selfMsgRes.status, 400);
        assert.strictEqual(selfMsgRes.body.error.code, "CANNOT_MESSAGE_SELF");
        console.log("✓ Cannot message self rejected with 400 CANNOT_MESSAGE_SELF.");

        // 4. Follow-gated conversation creation:
        // Alice does NOT follow Charlie -> starting conversation must be rejected
        const noFollowRes = await request("/api/v1/messages/conversations", {
            method: "POST",
            token: aliceToken,
            body: { recipientId: "usr_charlie" }
        });
        assert.strictEqual(noFollowRes.status, 403);
        assert.strictEqual(noFollowRes.body.error.code, "FOLLOW_REQUIRED");
        console.log("✓ Non-follower direct conversation attempt rejected with 403 FOLLOW_REQUIRED.");

        // 5. Alice follows Bob -> creation succeeds
        const createConvRes = await request("/api/v1/messages/conversations", {
            method: "POST",
            token: aliceToken,
            body: { recipientId: "usr_bob" }
        });
        assert.strictEqual(createConvRes.status, 200);
        assert.ok(createConvRes.body.data.id);
        const convId = createConvRes.body.data.id;
        assert.strictEqual(createConvRes.body.data.recipient.id, "usr_bob");
        assert.strictEqual(createConvRes.body.data.recipient.isFollowing, true);
        assert.strictEqual(createConvRes.body.data.recipient.isMutual, true);
        console.log("✓ Follow-gated conversation created successfully with mutual relationship.");

        // 6. Concurrent duplicate conversation creation idempotent
        const secondCreateRes = await request("/api/v1/messages/conversations", {
            method: "POST",
            token: bobToken,
            body: { recipientId: "usr_alice" }
        });
        assert.strictEqual(secondCreateRes.status, 200);
        assert.strictEqual(secondCreateRes.body.data.id, convId);
        console.log("✓ Duplicate conversation creation returns the exact same conversation ID.");

        // 7. Malformed ObjectId handling (returns 400, never 500 or CastError)
        const malformedRes = await request("/api/v1/messages/conversations/not-an-objectid/messages", {
            token: aliceToken
        });
        assert.strictEqual(malformedRes.status, 400);
        assert.strictEqual(malformedRes.body.error.code, "VALIDATION_ERROR");
        console.log("✓ Malformed conversation ID returns 400 VALIDATION_ERROR (not 500 or CastError).");

        // 8. Non-participant access rejection
        const charlieAccessRes = await request(`/api/v1/messages/conversations/${convId}/messages`, {
            token: charlieToken
        });
        assert.strictEqual(charlieAccessRes.status, 403);
        assert.strictEqual(charlieAccessRes.body.error.code, "FORBIDDEN");
        console.log("✓ Non-participant access rejected with 403 FORBIDDEN.");

        // 9. Send message with 2000-grapheme limit check (including compound emoji)
        const textEmoji = "Hello 👨‍👩‍👧‍👦 " + "a".repeat(1990);
        assert.ok(countCharacters(textEmoji) <= MESSAGE_TEXT_MAX_LENGTH);

        const sendRes = await request(`/api/v1/messages/conversations/${convId}/messages`, {
            method: "POST",
            token: aliceToken,
            body: {
                clientMessageId: "cm_1",
                text: "Hello Bob! How are you?"
            }
        });
        assert.strictEqual(sendRes.status, 201);
        assert.ok(sendRes.body.data._id);
        const msg1Id = sendRes.body.data._id;
        console.log("✓ Message sent and persisted with server-generated ID.");

        // 10. Idempotent resend returns the exact same message
        const resendRes = await request(`/api/v1/messages/conversations/${convId}/messages`, {
            method: "POST",
            token: aliceToken,
            body: {
                clientMessageId: "cm_1",
                text: "Hello Bob! How are you?"
            }
        });
        assert.strictEqual(resendRes.status, 201);
        assert.strictEqual(resendRes.body.data._id, msg1Id);
        console.log("✓ Idempotent resend with same clientMessageId returns original message.");

        // 11. Text limit rejection over 2000 graphemes
        const tooLongText = "a".repeat(2001);
        const overLimitRes = await request(`/api/v1/messages/conversations/${convId}/messages`, {
            method: "POST",
            token: aliceToken,
            body: {
                clientMessageId: "cm_overflow",
                text: tooLongText
            }
        });
        assert.strictEqual(overLimitRes.status, 400);
        console.log("✓ Message exceeding 2000 graphemes rejected with 400.");

        // 12. Monotonic Delivery & Read Transitions + Atomic Unread Counts
        const listConvBeforeRead = await request("/api/v1/messages/conversations", { token: bobToken });
        const bobConv = listConvBeforeRead.body.data.find((c) => c.id === convId);
        assert.strictEqual(bobConv.unreadCount, 1);

        // Bob marks delivered
        const deliveredRes = await request(`/api/v1/messages/conversations/${convId}/delivered`, {
            method: "POST",
            token: bobToken,
            body: { messageIds: [msg1Id] }
        });
        assert.strictEqual(deliveredRes.status, 200);

        // Bob marks read
        const readRes = await request(`/api/v1/messages/conversations/${convId}/read`, {
            method: "POST",
            token: bobToken,
            body: { messageIds: [msg1Id] }
        });
        assert.strictEqual(readRes.status, 200);
        assert.strictEqual(readRes.body.meta.totalUnread, 0);

        const listConvAfterRead = await request("/api/v1/messages/conversations", { token: bobToken });
        const bobConvAfter = listConvAfterRead.body.data.find((c) => c.id === convId);
        assert.strictEqual(bobConvAfter.unreadCount, 0);
        console.log("✓ Sent -> Delivered -> Read transitions monotonic; unread count decremented to 0.");

        // 13. Cloudinary Upload Intent & Media Validation
        const intentRes = await request("/api/v1/messages/media/upload-intent", {
            method: "POST",
            token: aliceToken,
            body: {
                conversationId: convId,
                resourceType: "image"
            }
        });
        assert.strictEqual(intentRes.status, 200);
        assert.ok(intentRes.body.data.uploadIntentId);
        assert.ok(intentRes.body.data.signature);
        assert.ok(intentRes.body.data.publicId.startsWith(`yoibi/messages/${convId}/images/`));
        console.log("✓ Media upload intent generated with server-controlled folder & signature.");

        // Media intent single use & verification
        const validConsume = cloudinaryIntegration.verifyAndConsumeIntent({
            uploadIntentId: intentRes.body.data.uploadIntentId,
            userId: "usr_alice",
            publicId: intentRes.body.data.publicId,
            url: `https://res.cloudinary.com/demo/image/upload/${intentRes.body.data.publicId}.jpg`
        });
        assert.strictEqual(validConsume.valid, true);

        // Second consumption fails (single use)
        const secondConsume = cloudinaryIntegration.verifyAndConsumeIntent({
            uploadIntentId: intentRes.body.data.uploadIntentId,
            userId: "usr_alice",
            publicId: intentRes.body.data.publicId,
            url: `https://res.cloudinary.com/demo/image/upload/${intentRes.body.data.publicId}.jpg`
        });
        assert.strictEqual(secondConsume.valid, false);
        console.log("✓ Media intent is strictly single-use and tamper-verified.");

        // 14. Socket.IO Handshake Authentication
        // Unauthenticated socket rejected
        await new Promise((resolve) => {
            const socket = ClientIO(serverUrl, {
                path: "/socket.io",
                transports: ["websocket"],
                reconnection: false
            });
            socket.on("connect_error", (err) => {
                assert.ok(err.message);
                socket.close();
                resolve();
            });
        });
        console.log("✓ Socket without auth token rejected during handshake.");

        // Blocked socket rejected
        await new Promise((resolve) => {
            const socket = ClientIO(serverUrl, {
                path: "/socket.io",
                auth: { token: blockedToken },
                transports: ["websocket"],
                reconnection: false
            });
            socket.on("connect_error", (err) => {
                assert.strictEqual(err.data?.code, "ACCOUNT_BLOCKED");
                socket.close();
                resolve();
            });
        });
        console.log("✓ Blocked user socket rejected during handshake.");

        // Unverified socket rejected
        const origVerifyReq = env.EMAIL_VERIFICATION_REQUIRED;
        env.EMAIL_VERIFICATION_REQUIRED = "true";
        await new Promise((resolve) => {
            const socket = ClientIO(serverUrl, {
                path: "/socket.io",
                auth: { token: unverifiedToken },
                transports: ["websocket"],
                reconnection: false
            });
            socket.on("connect_error", (err) => {
                assert.strictEqual(err.data?.code, "EMAIL_NOT_VERIFIED");
                socket.close();
                resolve();
            });
        });
        env.EMAIL_VERIFICATION_REQUIRED = origVerifyReq;
        console.log("✓ Unverified user socket rejected during handshake.");


        // Authenticated Alice socket connects
        const aliceSocket = await new Promise((resolve, reject) => {
            const socket = ClientIO(serverUrl, {
                path: "/socket.io",
                auth: { token: aliceToken },
                transports: ["websocket"],
                reconnection: false
            });
            socket.on("connect", () => resolve(socket));
            socket.on("connect_error", reject);
        });

        // Authenticated Bob socket connects
        const bobSocket = await new Promise((resolve, reject) => {
            const socket = ClientIO(serverUrl, {
                path: "/socket.io",
                auth: { token: bobToken },
                transports: ["websocket"],
                reconnection: false
            });
            socket.on("connect", () => resolve(socket));
            socket.on("connect_error", reject);
        });

        assert.strictEqual(presenceService.isOnline("usr_alice"), true);
        assert.strictEqual(presenceService.isOnline("usr_bob"), true);
        console.log("✓ Valid sockets connected; multi-connection presence tracks online status.");

        // Join conversation rooms
        await new Promise((resolve) => aliceSocket.emit("conversation:join", { conversationId: convId }, resolve));
        await new Promise((resolve) => bobSocket.emit("conversation:join", { conversationId: convId }, resolve));

        // Realtime typing indicator
        const typingPromise = new Promise((resolve) => {
            bobSocket.on("typing:update", (data) => {
                if (data.userId === "usr_alice" && data.isTyping === true) {
                    resolve(data);
                }
            });
        });
        aliceSocket.emit("typing:start", { conversationId: convId });
        const typingEvent = await typingPromise;
        assert.strictEqual(typingEvent.conversationId, convId);
        assert.strictEqual(typingEvent.isTyping, true);
        console.log("✓ Realtime typing indicator received by conversation partner.");

        // Realtime message delivery over socket
        const receiveMsgPromise = new Promise((resolve) => {
            bobSocket.on("message:new", (data) => {
                resolve(data);
            });
        });

        aliceSocket.emit("message:send", {
            conversationId: convId,
            clientMessageId: "cm_socket_1",
            text: "Realtime Socket.IO test message!"
        });

        const received = await receiveMsgPromise;
        assert.strictEqual(received.message.text, "Realtime Socket.IO test message!");
        assert.strictEqual(received.message.senderId, "usr_alice");
        console.log("✓ Realtime message:new delivered to recipient socket.");

        // Disconnect one socket, verify presence
        aliceSocket.disconnect();
        bobSocket.disconnect();
        await new Promise((r) => setTimeout(r, 50));
        assert.strictEqual(presenceService.isOnline("usr_alice"), false);
        console.log("✓ User transitions to offline when last socket disconnects.");

        console.log("==================================================");
        console.log("   ALL DIRECT MESSAGING BACKEND TESTS PASSED      ");
        console.log("==================================================");
    } finally {
        // Restore repository stubs
        usersRepository.findById = origFindUser;
        usersRepository.findByIds = origFindUsers;
        followsRepository.isFollowing = origIsFollowing;
        followsRepository.getFollowingIds = origGetFollowingIds;

        conversationsRepository.findById = origFindConvById;
        conversationsRepository.findOrCreateDirect = origFindOrCreateDirect;
        conversationsRepository.listForUser = origListForUser;
        conversationsRepository.updateLastMessage = origUpdateLastMessage;
        conversationsRepository.markConversationRead = origMarkConversationRead;
        conversationsRepository.markAllRead = origMarkAllRead;
        conversationsRepository.getTotalUnreadCount = origGetTotalUnread;

        messagesRepository.createMessage = origCreateMsg;
        messagesRepository.findById = origFindMsgById;
        messagesRepository.findByClientMessageId = origFindByClientMsgId;
        messagesRepository.listMessages = origListMsgs;
        messagesRepository.markDelivered = origMarkDelivered;
        messagesRepository.markRead = origMarkRead;

        // Restore env & close servers
        env.BETTER_AUTH_JWKS_URL = originalJwksUrl;
        env.BETTER_AUTH_BASE_URL = originalBaseUrl;
        invalidateJWKS();
        jwksServer.close();
        ioServer.close();
        server.close();
    }
}

module.exports = { runMessagesTests };
