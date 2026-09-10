const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const notificationsRepository = require("../src/repositories/notifications.repository");
const notificationsService = require("../src/services/notifications.service");
const { initNotificationSocket } = require("../src/sockets/notifications.socket");
const tweetsRepository = require("../src/repositories/tweets.repository");
const videosRepository = require("../src/repositories/videos.repository");
const followsRepository = require("../src/repositories/follows.repository");
const { likeTweet, unlikeTweet, retweetTweet, undoRetweet } = require("../src/services/update/tweets.service");
const { createTweet } = require("../src/services/create/tweets.service");
const { followUser } = require("../src/services/create/follows.service");
const { unfollowUser } = require("../src/services/delete/follows.service");
const { likeVideo, unlikeVideo } = require("../src/services/update/videos.service");
const User = require("../src/models/user.model");

async function runNotificationsTests() {
    console.log("[Test] Starting Phase 4 Milestone 8 Notifications slice verification...");

    // =========================================================================
    // 1. In-process HTTP Verification (Unauthenticated & Validation rejection)
    // =========================================================================
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
        // Test 1: GET /api/v1/notifications without auth -> 401
        const listUnauth = await request("/api/v1/notifications");
        assert.strictEqual(listUnauth.status, 401);
        assert.strictEqual(listUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ GET /api/v1/notifications without token rejected with 401 UNAUTHORIZED.");

        // Test 2: GET /api/v1/notifications/unread-count without auth -> 401
        const unreadUnauth = await request("/api/v1/notifications/unread-count");
        assert.strictEqual(unreadUnauth.status, 401);
        assert.strictEqual(unreadUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ GET /api/v1/notifications/unread-count without token rejected with 401 UNAUTHORIZED.");

        // Test 3: PATCH /api/v1/notifications/:id/read without auth -> 401
        const markReadUnauth = await request("/api/v1/notifications/notif_123/read", { method: "PATCH" });
        assert.strictEqual(markReadUnauth.status, 401);
        assert.strictEqual(markReadUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ PATCH /api/v1/notifications/:id/read without token rejected with 401 UNAUTHORIZED.");

        // Test 4: PATCH /api/v1/notifications/read-all without auth -> 401
        const readAllUnauth = await request("/api/v1/notifications/read-all", { method: "PATCH" });
        assert.strictEqual(readAllUnauth.status, 401);
        assert.strictEqual(readAllUnauth.body.error.code, "UNAUTHORIZED");
        console.log("✓ PATCH /api/v1/notifications/read-all without token rejected with 401 UNAUTHORIZED.");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    // =========================================================================
    // 2. In-Memory Store & Isolation Testing
    // =========================================================================
    console.log("\n[Test] Setting up mock repository environment for domain tests...");

    const inMemoryUsers = new Map([
        ["usr_alice", { _id: "usr_alice", handle: "alice", name: "Alice", avatarUrl: "https://example.com/alice.jpg" }],
        ["usr_bob", { _id: "usr_bob", handle: "bob", name: "Bob", avatarUrl: "https://example.com/bob.jpg" }],
        ["usr_charlie", { _id: "usr_charlie", handle: "charlie", name: "Charlie", avatarUrl: null }]
    ]);

    const inMemoryNotifications = [];
    const inMemoryTweets = new Map();
    const inMemoryVideos = new Map();
    const inMemoryFollows = new Set();
    const socketEmissions = [];

    // Setup mock Socket.IO instance
    const mockIO = {
        to: (room) => ({
            emit: (event, payload) => {
                socketEmissions.push({ room, event, payload });
            }
        })
    };
    initNotificationSocket(mockIO);

    // Patch User.find / findById
    User.find = (query) => ({
        lean: async () => {
            const inIds = query._id?.$in || [];
            return inIds.map((id) => inMemoryUsers.get(id)).filter(Boolean);
        }
    });
    User.findById = (id) => ({
        lean: async () => inMemoryUsers.get(id) || null
    });
    User.updateOne = async () => ({ modifiedCount: 1 });

    // Patch notificationsRepository
    notificationsRepository.create = async (data) => {
        // Compound unique constraint check
        const exists = inMemoryNotifications.some(
            (n) => n.actorId === data.actorId && n.type === data.type && n.targetId === data.targetId
        );
        if (exists) return null;

        const doc = {
            _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            ...data,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        inMemoryNotifications.push(doc);
        return doc;
    };

    notificationsRepository.findById = async (id) => {
        const found = inMemoryNotifications.find((n) => n._id === id || n.id === id);
        return found || null;
    };

    notificationsRepository.findPaginated = async ({ recipientId, read, page = 1, limit = 20 }) => {
        let filtered = inMemoryNotifications.filter((n) => n.recipientId === recipientId);
        if (typeof read === "boolean") {
            filtered = filtered.filter((n) => n.read === read);
        }
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / limit) || (totalItems === 0 ? 0 : 1);
        const start = (page - 1) * limit;
        const rawItems = filtered.slice(start, start + limit);
        const enrichedItems = await notificationsRepository.attachActors(rawItems);

        return {
            items: enrichedItems,
            totalItems,
            totalPages,
            page,
            limit,
            hasNextPage: page < totalPages
        };
    };

    notificationsRepository.countUnread = async (recipientId) => {
        return inMemoryNotifications.filter((n) => n.recipientId === recipientId && !n.read).length;
    };

    notificationsRepository.markAsRead = async (id, recipientId) => {
        const notif = inMemoryNotifications.find((n) => (n._id === id || n.id === id) && n.recipientId === recipientId);
        if (notif) {
            notif.read = true;
            return notif;
        }
        return null;
    };

    notificationsRepository.markAllAsRead = async (recipientId) => {
        let count = 0;
        inMemoryNotifications.forEach((n) => {
            if (n.recipientId === recipientId && !n.read) {
                n.read = true;
                count++;
            }
        });
        return count;
    };

    notificationsRepository.deleteNotification = async ({ actorId, type, targetId }) => {
        const idx = inMemoryNotifications.findIndex(
            (n) => n.actorId === actorId && n.type === type && n.targetId === targetId
        );
        if (idx !== -1) {
            inMemoryNotifications.splice(idx, 1);
            return true;
        }
        return false;
    };

    notificationsRepository.attachActors = async (notifications) => {
        const isArray = Array.isArray(notifications);
        const list = isArray ? notifications : [notifications];
        const enriched = list.map((n) => {
            const u = inMemoryUsers.get(n.actorId);
            const rawHandle = u?.handle || "";
            const handle = rawHandle ? (rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`) : null;
            const actor = u ? {
                id: u._id,
                name: u.name || "",
                handle,
                avatarUrl: u.avatarUrl || null
            } : {
                id: n.actorId,
                name: "Unknown user",
                handle: null,
                avatarUrl: null
            };
            return {
                id: n._id ? n._id.toString() : (n.id || ""),
                type: n.type,
                actor,
                targetId: n.targetId,
                targetType: n.targetType,
                read: Boolean(n.read),
                createdAt: n.createdAt
            };
        });
        return isArray ? enriched : enriched[0];
    };

    // Patch tweetsRepository
    tweetsRepository.findById = async (id) => inMemoryTweets.get(id) || null;
    tweetsRepository.create = async (doc) => {
        inMemoryTweets.set(doc._id, doc);
        return doc;
    };
    tweetsRepository.incrementRepliesCount = async (id) => {
        const t = inMemoryTweets.get(id);
        if (t) t.repliesCount = (t.repliesCount || 0) + 1;
        return t;
    };
    tweetsRepository.addLike = async (id, userId) => {
        const t = inMemoryTweets.get(id);
        if (!t) return null;
        if (!t.likes.includes(userId)) {
            t.likes.push(userId);
            t.likesCount = t.likes.length;
        }
        return t;
    };
    tweetsRepository.removeLike = async (id, userId) => {
        const t = inMemoryTweets.get(id);
        if (!t) return null;
        t.likes = t.likes.filter((u) => u !== userId);
        t.likesCount = t.likes.length;
        return t;
    };
    tweetsRepository.addRetweet = async (id, userId) => {
        const t = inMemoryTweets.get(id);
        if (!t) return null;
        if (!t.retweets.includes(userId)) {
            t.retweets.push(userId);
            t.retweetCount = t.retweets.length;
        }
        return t;
    };
    tweetsRepository.removeRetweet = async (id, userId) => {
        const t = inMemoryTweets.get(id);
        if (!t) return null;
        t.retweets = t.retweets.filter((u) => u !== userId);
        t.retweetCount = t.retweets.length;
        return t;
    };
    tweetsRepository.attachAuthors = async (tweets) => {
        const isArr = Array.isArray(tweets);
        const list = isArr ? tweets : [tweets];
        const res = list.map((t) => ({ ...t, author: { id: t.authorId, name: t.authorId, handle: t.authorId, avatarUrl: null } }));
        return isArr ? res : res[0];
    };

    // Patch videosRepository
    videosRepository.findById = async (id) => inMemoryVideos.get(id) || null;
    videosRepository.addLike = async (id, userId) => {
        const v = inMemoryVideos.get(id);
        if (!v) return null;
        if (!v.likes.includes(userId)) {
            v.likes.push(userId);
            v.likesCount = v.likes.length;
            return v;
        }
        return null; // $ne returned null on duplicate
    };
    videosRepository.removeLike = async (id, userId) => {
        const v = inMemoryVideos.get(id);
        if (!v) return null;
        if (v.likes.includes(userId)) {
            v.likes = v.likes.filter((u) => u !== userId);
            v.likesCount = v.likes.length;
            return v;
        }
        return null;
    };

    // Patch followsRepository
    followsRepository.createFollow = async (followerId, followingId) => {
        const key = `${followerId}:${followingId}`;
        if (inMemoryFollows.has(key)) return { created: false };
        inMemoryFollows.add(key);
        return { created: true };
    };
    followsRepository.deleteFollow = async (followerId, followingId) => {
        const key = `${followerId}:${followingId}`;
        if (!inMemoryFollows.has(key)) return { deleted: false };
        inMemoryFollows.delete(key);
        return { deleted: true };
    };

    const tick = () => new Promise((resolve) => setImmediate(resolve));

    // =========================================================================
    // Category 1: Trigger Matrix & Duplicate Prevention
    // =========================================================================
    console.log("\n[Test] Category 1: Trigger Matrix & Duplicate Prevention...");

    // Seed a tweet by Alice
    const tweet1 = {
        _id: "tweet_1",
        authorId: "usr_alice",
        content: "Hello world!",
        likes: [],
        likesCount: 0,
        retweets: [],
        retweetCount: 0,
        repliesCount: 0
    };
    inMemoryTweets.set("tweet_1", tweet1);

    // 1.1 Bob likes Alice's tweet -> 1 notification
    socketEmissions.length = 0;
    const like1 = await likeTweet({ tweetId: "tweet_1", user: { id: "usr_bob" } });
    await tick();
    assert.strictEqual(like1.liked, true);
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(inMemoryNotifications[0].type, "like_tweet");
    assert.strictEqual(inMemoryNotifications[0].actorId, "usr_bob");
    assert.strictEqual(inMemoryNotifications[0].recipientId, "usr_alice");
    assert.strictEqual(inMemoryNotifications[0].targetId, "tweet_1");
    assert.strictEqual(inMemoryNotifications[0].targetType, "tweet");
    assert.strictEqual(socketEmissions.length, 1);
    assert.strictEqual(socketEmissions[0].room, "user:usr_alice");
    assert.strictEqual(socketEmissions[0].event, "notification:new");
    console.log("✓ First like on tweet creates exactly 1 notification and emits realtime event.");

    // 1.2 Bob retries like on Alice's tweet -> duplicate ignored
    socketEmissions.length = 0;
    const likeDup = await likeTweet({ tweetId: "tweet_1", user: { id: "usr_bob" } });
    await tick();
    assert.strictEqual(likeDup.liked, true);
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(socketEmissions.length, 0);
    console.log("✓ Duplicate like request does not create another notification.");

    // 1.3 Bob unlikes Alice's tweet -> notification cleaned up
    const unlike1 = await unlikeTweet({ tweetId: "tweet_1", user: { id: "usr_bob" } });
    await tick();
    assert.strictEqual(unlike1.liked, false);
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Unlike tweet cleans up active notification (undo).");

    // 1.4 Bob re-likes Alice's tweet -> fresh notification created
    await likeTweet({ tweetId: "tweet_1", user: { id: "usr_bob" } });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    console.log("✓ Re-like after unlike creates a fresh notification.");

    // Clean up notifications for next subtest
    inMemoryNotifications.length = 0;

    // 1.5 Charlie retweets Alice's tweet -> 1 notification
    await retweetTweet({ tweetId: "tweet_1", user: { id: "usr_charlie" } });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(inMemoryNotifications[0].type, "retweet");
    assert.strictEqual(inMemoryNotifications[0].actorId, "usr_charlie");
    assert.strictEqual(inMemoryNotifications[0].recipientId, "usr_alice");
    console.log("✓ Retweet creates exactly 1 notification.");

    // 1.6 Duplicate retweet -> no new notification
    await retweetTweet({ tweetId: "tweet_1", user: { id: "usr_charlie" } });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    console.log("✓ Duplicate retweet does not create duplicate notification.");

    // 1.7 Undo retweet -> notification deleted
    await undoRetweet({ tweetId: "tweet_1", user: { id: "usr_charlie" } });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Undo retweet cleans up notification.");

    // 1.8 Reply to Alice's tweet by Bob -> 1 notification
    const reply1 = await createTweet({
        user: { id: "usr_bob" },
        content: "Nice tweet Alice!",
        replyToId: "tweet_1"
    });
    await tick();
    assert.strictEqual(reply1.replyToId, "tweet_1");
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(inMemoryNotifications[0].type, "reply");
    assert.strictEqual(inMemoryNotifications[0].actorId, "usr_bob");
    assert.strictEqual(inMemoryNotifications[0].recipientId, "usr_alice");
    assert.strictEqual(inMemoryNotifications[0].targetId, "tweet_1");
    assert.strictEqual(inMemoryNotifications[0].targetType, "tweet");
    console.log("✓ Reply creates notification targeting parent tweet author.");

    // Clean up
    inMemoryNotifications.length = 0;

    // 1.9 Bob follows Alice -> 1 notification
    await followUser("usr_bob", "usr_alice");
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(inMemoryNotifications[0].type, "follow");
    assert.strictEqual(inMemoryNotifications[0].actorId, "usr_bob");
    assert.strictEqual(inMemoryNotifications[0].recipientId, "usr_alice");
    assert.strictEqual(inMemoryNotifications[0].targetId, "usr_alice");
    assert.strictEqual(inMemoryNotifications[0].targetType, "user");
    console.log("✓ Follow creates notification for target user.");

    // 1.10 Duplicate follow -> no duplicate notification
    await followUser("usr_bob", "usr_alice");
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    console.log("✓ Duplicate follow does not duplicate notification.");

    // 1.11 Unfollow Alice -> notification deleted
    await unfollowUser("usr_bob", "usr_alice");
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Unfollow cleans up notification.");

    // 1.12 Video like / unlike
    const video1 = {
        _id: "vid_1",
        authorId: "usr_alice",
        title: "Coding stream",
        likes: [],
        likesCount: 0
    };
    inMemoryVideos.set("vid_1", video1);

    // Bob likes Alice's video -> 1 notification
    await likeVideo("vid_1", { id: "usr_bob" });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    assert.strictEqual(inMemoryNotifications[0].type, "like_video");
    assert.strictEqual(inMemoryNotifications[0].actorId, "usr_bob");
    assert.strictEqual(inMemoryNotifications[0].recipientId, "usr_alice");
    assert.strictEqual(inMemoryNotifications[0].targetId, "vid_1");
    assert.strictEqual(inMemoryNotifications[0].targetType, "video");
    console.log("✓ Video like creates notification for video author.");

    // Duplicate video like -> no duplicate
    await likeVideo("vid_1", { id: "usr_bob" });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 1);
    console.log("✓ Duplicate video like does not duplicate notification.");

    // Video unlike -> cleanup
    await unlikeVideo("vid_1", { id: "usr_bob" });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Video unlike cleans up notification.");

    // =========================================================================
    // Category 2: Self-Notification Suppression
    // =========================================================================
    console.log("\n[Test] Category 2: Self-Notification Suppression...");

    // Alice likes her own tweet
    await likeTweet({ tweetId: "tweet_1", user: { id: "usr_alice" } });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Alice liking own tweet creates 0 notifications.");

    // Alice replies to her own tweet
    await createTweet({ user: { id: "usr_alice" }, content: "Self reply", replyToId: "tweet_1" });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Alice replying to own tweet creates 0 notifications.");

    // Alice likes her own video
    await likeVideo("vid_1", { id: "usr_alice" });
    await tick();
    assert.strictEqual(inMemoryNotifications.length, 0);
    console.log("✓ Alice liking own video creates 0 notifications.");

    // =========================================================================
    // Category 3: Primary Action Independence (Failure Semantics)
    // =========================================================================
    console.log("\n[Test] Category 3: Primary Action Independence (Guarded Side Effects)...");

    // Temporarily break notification repository creation to simulate persistence failure
    const originalCreate = notificationsRepository.create;
    notificationsRepository.create = async () => {
        throw new Error("MongoDB write connection timeout");
    };

    // Charlie likes Alice's tweet -> primary action must succeed (200, liked: true)
    const primaryLike = await likeTweet({ tweetId: "tweet_1", user: { id: "usr_charlie" } });
    await tick();
    assert.strictEqual(primaryLike.liked, true);
    assert.strictEqual(primaryLike.likesCount > 0, true);
    console.log("✓ Like tweet succeeds independently even when notification persistence throws.");

    // Charlie follows Alice -> primary action must succeed
    const primaryFollow = await followUser("usr_charlie", "usr_alice");
    await tick();
    assert.strictEqual(primaryFollow.followed, true);
    console.log("✓ Follow succeeds independently even when notification persistence throws.");

    // Restore create
    notificationsRepository.create = originalCreate;

    // Simulate Socket.IO failure
    mockIO.to = () => ({
        emit: () => {
            throw new Error("Socket.IO client disconnected abruptly");
        }
    });

    // Bob likes video -> primary action must succeed and notification is persisted
    const videoLikeRes = await likeVideo("vid_1", { id: "usr_bob" });
    await tick();
    assert.strictEqual(videoLikeRes.liked, true);
    assert.strictEqual(inMemoryNotifications.length, 1);
    console.log("✓ Video like succeeds and notification is persisted even when Socket.IO emit fails.");

    // Restore mockIO
    mockIO.to = (room) => ({
        emit: (event, payload) => {
            socketEmissions.push({ room, event, payload });
        }
    });
    inMemoryNotifications.length = 0;

    // =========================================================================
    // Category 4: Actor Resolution & Missing Actor Handling
    // =========================================================================
    console.log("\n[Test] Category 4: Actor Resolution & Fallbacks...");

    // Insert notification from existing user Alice
    await notificationsService.createNotification({
        actorId: "usr_alice",
        recipientId: "usr_bob",
        type: "like_tweet",
        targetId: "tweet_1",
        targetType: "tweet"
    });

    // Insert notification from deleted user "usr_ghost"
    await notificationsService.createNotification({
        actorId: "usr_ghost",
        recipientId: "usr_bob",
        type: "follow",
        targetId: "usr_bob",
        targetType: "user"
    });

    const bobFeed = await notificationsService.getNotifications({ recipientId: "usr_bob" });
    assert.strictEqual(bobFeed.items.length, 2);

    const aliceNotif = bobFeed.items.find((n) => n.actor.id === "usr_alice");
    assert.strictEqual(aliceNotif.actor.name, "Alice");
    assert.strictEqual(aliceNotif.actor.handle, "@alice");
    assert.strictEqual(aliceNotif.actor.avatarUrl, "https://example.com/alice.jpg");
    console.log("✓ Existing actor resolved with current name, handle, and avatarUrl.");

    const ghostNotif = bobFeed.items.find((n) => n.actor.id === "usr_ghost");
    assert.strictEqual(ghostNotif.actor.name, "Unknown user");
    assert.strictEqual(ghostNotif.actor.handle, null);
    assert.strictEqual(ghostNotif.actor.avatarUrl, null);
    console.log("✓ Deleted / missing actor falls back safely to 'Unknown user' without crashing.");

    // =========================================================================
    // Category 5: REST Service Security, Unread Count & Read State
    // =========================================================================
    console.log("\n[Test] Category 5: REST Service Operations & Security...");

    // 5.1 Unread count
    const unread = await notificationsService.getUnreadCount("usr_bob");
    assert.strictEqual(unread.unreadCount, 2);
    console.log("✓ Unread count accurately returns 2 unread notifications.");

    // 5.2 Mark single notification read
    const notifToRead = bobFeed.items[0];
    const markRes = await notificationsService.markAsRead(notifToRead.id, "usr_bob");
    assert.strictEqual(markRes.read, true);

    const unreadAfterOne = await notificationsService.getUnreadCount("usr_bob");
    assert.strictEqual(unreadAfterOne.unreadCount, 1);
    console.log("✓ Mark single notification as read updates state and decrements unread count.");

    // 5.3 Filter by read state
    const unreadOnly = await notificationsService.getNotifications({ recipientId: "usr_bob", read: false });
    assert.strictEqual(unreadOnly.items.length, 1);
    const readOnly = await notificationsService.getNotifications({ recipientId: "usr_bob", read: true });
    assert.strictEqual(readOnly.items.length, 1);
    console.log("✓ Filtering by read=true / read=false returns precise subsets.");

    // 5.4 Ownership security: Alice attempts to mark Bob's notification read -> FORBIDDEN
    let forbiddenCaught = false;
    try {
        await notificationsService.markAsRead(notifToRead.id, "usr_alice");
    } catch (err) {
        forbiddenCaught = true;
        assert.strictEqual(err.code, "FORBIDDEN");
        assert.strictEqual(err.status, 403);
    }
    assert.strictEqual(forbiddenCaught, true);
    console.log("✓ Cross-user modification rejected with 403 FORBIDDEN.");

    // 5.5 Non-existent notification -> NOT_FOUND
    let notFoundCaught = false;
    try {
        await notificationsService.markAsRead("notif_nonexistent", "usr_bob");
    } catch (err) {
        notFoundCaught = true;
        assert.strictEqual(err.code, "NOT_FOUND");
        assert.strictEqual(err.status, 404);
    }
    assert.strictEqual(notFoundCaught, true);
    console.log("✓ Non-existent notification mark-read rejected with 404 NOT_FOUND.");

    // 5.6 Mark all read
    const markAllRes = await notificationsService.markAllAsRead("usr_bob");
    assert.strictEqual(markAllRes.updatedCount, 1);
    const unreadAfterAll = await notificationsService.getUnreadCount("usr_bob");
    assert.strictEqual(unreadAfterAll.unreadCount, 0);
    console.log("✓ Mark all read clears remaining unread notifications.");

    console.log("\n[Test] All Notifications slice tests passed successfully!");
}

module.exports = { runNotificationsTests };
