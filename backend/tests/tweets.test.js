const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const tweetsRepository = require("../src/repositories/tweets.repository");
const { createTweet } = require("../src/services/create/tweets.service");
const { listTweets, getTweetById, getReplies } = require("../src/services/read/tweets.service");
const { likeTweet, unlikeTweet, retweetTweet, undoRetweet } = require("../src/services/update/tweets.service");
const { deleteTweet } = require("../src/services/delete/tweets.service");

async function runTweetsTests() {
    console.log("[Test] Starting Phase 4 Milestone 3 Tweet / Feed slice verification...");

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
        // Test 1: GET /api/v1/tweets — public feed (no auth required)
        const feedRes = await request("/api/v1/tweets");
        assert.strictEqual(feedRes.status, 200, "GET /api/v1/tweets must return 200");
        assert.strictEqual(feedRes.body.success, true);
        assert(Array.isArray(feedRes.body.data.items), "Items must be an array");
        assert(feedRes.body.data.pagination, "Pagination object must be present");
        console.log("✓ GET /api/v1/tweets returned 200 OK with paginated envelope.");

        // Test 2: POST /api/v1/tweets without auth → 401
        const createUnauthRes = await request("/api/v1/tweets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { content: "Hello Yoibi!" }
        });
        assert.strictEqual(createUnauthRes.status, 401);
        assert.strictEqual(createUnauthRes.body.success, false);
        assert.strictEqual(createUnauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/tweets without token rejected with 401 UNAUTHORIZED.");

        // Test 3: POST /api/v1/tweets/:id/like without auth → 401
        const likeUnauthRes = await request("/api/v1/tweets/tweet_nonexistent/like", {
            method: "POST"
        });
        assert.strictEqual(likeUnauthRes.status, 401);
        console.log("✓ POST /api/v1/tweets/:id/like without token rejected with 401.");

        // Test 4: POST /api/v1/tweets/:id/retweet without auth → 401
        const retweetUnauthRes = await request("/api/v1/tweets/tweet_nonexistent/retweet", {
            method: "POST"
        });
        assert.strictEqual(retweetUnauthRes.status, 401);
        console.log("✓ POST /api/v1/tweets/:id/retweet without token rejected with 401.");

        // Test 5: POST /api/v1/tweets/:id/replies without auth → 401
        const replyUnauthRes = await request("/api/v1/tweets/tweet_nonexistent/replies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { content: "Nice tweet!" }
        });
        assert.strictEqual(replyUnauthRes.status, 401);
        console.log("✓ POST /api/v1/tweets/:id/replies without token rejected with 401.");

        // Test 6: DELETE /api/v1/tweets/:id without auth → 401
        const deleteUnauthRes = await request("/api/v1/tweets/tweet_nonexistent", {
            method: "DELETE"
        });
        assert.strictEqual(deleteUnauthRes.status, 401);
        console.log("✓ DELETE /api/v1/tweets/:id without token rejected with 401.");

        // Test 7: GET /api/v1/tweets/nonexistent → 404
        const notFoundRes = await request("/api/v1/tweets/tweet_nonexistent_9999");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.error.code, "NOT_FOUND");
        console.log("✓ GET /api/v1/tweets/:id with non-existent ID returned 404 NOT_FOUND.");

    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    // 2. Service-layer unit tests with mocked repository
    console.log("\n[Test] Testing Tweet business logic in isolation (mocked repository)...");

    const inMemoryTweets = new Map();

    const originalCreate = tweetsRepository.create;
    const originalFindById = tweetsRepository.findById;
    const originalFindPaginated = tweetsRepository.findPaginated;
    const originalCount = tweetsRepository.count;
    const originalDeleteById = tweetsRepository.deleteById;
    const originalAddLike = tweetsRepository.addLike;
    const originalRemoveLike = tweetsRepository.removeLike;
    const originalAddRetweet = tweetsRepository.addRetweet;
    const originalRemoveRetweet = tweetsRepository.removeRetweet;
    const originalIncrementRepliesCount = tweetsRepository.incrementRepliesCount;
    const originalDecrementRepliesCount = tweetsRepository.decrementRepliesCount;
    const originalFindReplies = tweetsRepository.findReplies;
    const originalAttachAuthors = tweetsRepository.attachAuthors;

    tweetsRepository.create = async (doc) => {
        inMemoryTweets.set(doc._id, { ...doc });
        return doc;
    };
    tweetsRepository.findById = async (id) => {
        return inMemoryTweets.get(id) || null;
    };
    tweetsRepository.findPaginated = async () => {
        return Array.from(inMemoryTweets.values()).filter((t) => !t.replyToId);
    };
    tweetsRepository.count = async () => {
        return Array.from(inMemoryTweets.values()).filter((t) => !t.replyToId).length;
    };
    tweetsRepository.deleteById = async (id) => {
        const item = inMemoryTweets.get(id);
        inMemoryTweets.delete(id);
        return item || null;
    };
    tweetsRepository.addLike = async (tweetId, userId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.likes = tweet.likes || [];
        if (!tweet.likes.includes(userId)) tweet.likes.push(userId);
        tweet.likesCount = tweet.likes.length;
        return tweet;
    };
    tweetsRepository.removeLike = async (tweetId, userId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.likes = (tweet.likes || []).filter((id) => id !== userId);
        tweet.likesCount = tweet.likes.length;
        return tweet;
    };
    tweetsRepository.addRetweet = async (tweetId, userId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.retweets = tweet.retweets || [];
        if (!tweet.retweets.includes(userId)) tweet.retweets.push(userId);
        tweet.retweetCount = tweet.retweets.length;
        return tweet;
    };
    tweetsRepository.removeRetweet = async (tweetId, userId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.retweets = (tweet.retweets || []).filter((id) => id !== userId);
        tweet.retweetCount = tweet.retweets.length;
        return tweet;
    };
    tweetsRepository.incrementRepliesCount = async (tweetId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.repliesCount = (tweet.repliesCount || 0) + 1;
        return tweet;
    };
    tweetsRepository.decrementRepliesCount = async (tweetId) => {
        const tweet = inMemoryTweets.get(tweetId);
        if (!tweet) return null;
        tweet.repliesCount = Math.max(0, (tweet.repliesCount || 0) - 1);
        return tweet;
    };
    tweetsRepository.findReplies = async (tweetId) => {
        return Array.from(inMemoryTweets.values()).filter((t) => t.replyToId === tweetId);
    };
    tweetsRepository.attachAuthors = async (tweets) => {
        const isArray = Array.isArray(tweets);
        const list = isArray ? tweets : [tweets];
        const enriched = list.map((t) => ({
            ...t,
            id: t._id,
            author: { id: t.authorId, name: "Test Author", handle: "testauthor", avatarUrl: null }
        }));
        return isArray ? enriched : enriched[0];
    };

    try {
        const userA = { id: "usr_alice", role: "user" };
        const userB = { id: "usr_bob", role: "user" };
        const admin = { id: "usr_admin", role: "admin" };

        // Test A: Empty tweet rejected
        let emptyTweetFailed = false;
        try {
            await createTweet({ user: userA, content: "   " });
        } catch {
            emptyTweetFailed = true;
        }
        assert.strictEqual(emptyTweetFailed, true, "Empty tweet should be rejected");
        console.log("✓ Empty tweet validation enforced by service & schema (1 char min after trim).");

        // Test B: Create Tweet
        const createdTweet = await createTweet({
            user: userA,
            content: "Hello from the Yoibi tweet test suite! 🐦",
            mediaUrls: []
        });
        assert.strictEqual(createdTweet.authorId, "usr_alice");
        assert.strictEqual(createdTweet.content, "Hello from the Yoibi tweet test suite! 🐦");
        assert.strictEqual(createdTweet.likesCount, 0);
        assert.strictEqual(createdTweet.retweetCount, 0);
        assert.strictEqual(createdTweet.repliesCount, 0);
        assert.strictEqual(createdTweet.liked, false);
        assert.strictEqual(createdTweet.retweeted, false);
        assert.strictEqual(createdTweet.replyToId, null);
        console.log("✓ Service: createTweet created and enriched tweet correctly.");

        // Test C: List tweets with pagination
        const listResult = await listTweets({ page: 1, limit: 10, currentUserId: userA.id });
        assert.strictEqual(listResult.items.length, 1);
        assert.strictEqual(listResult.pagination.totalItems, 1);
        assert.strictEqual(listResult.items[0].liked, false);
        assert.strictEqual(listResult.items[0].retweeted, false);
        console.log("✓ Service: listTweets returned enriched list with pagination.");

        // Test D: Like and unlike
        const likedResult = await likeTweet({ tweetId: createdTweet.id, user: userA });
        assert.strictEqual(likedResult.liked, true);
        assert.strictEqual(likedResult.likesCount, 1);
        console.log("✓ Service: likeTweet incremented likesCount.");

        const singleAfterLike = await getTweetById({ id: createdTweet.id, currentUserId: userA.id });
        assert.strictEqual(singleAfterLike.liked, true);
        assert.strictEqual(singleAfterLike.likesCount, 1);
        console.log("✓ Service: getTweetById reported tweet as liked by userA.");

        const unlikedResult = await unlikeTweet({ tweetId: createdTweet.id, user: userA });
        assert.strictEqual(unlikedResult.liked, false);
        assert.strictEqual(unlikedResult.likesCount, 0);
        console.log("✓ Service: unlikeTweet decremented likesCount.");

        // Test E: Retweet and undo retweet
        const retweetResult = await retweetTweet({ tweetId: createdTweet.id, user: userB });
        assert.strictEqual(retweetResult.retweeted, true);
        assert.strictEqual(retweetResult.retweetCount, 1);
        console.log("✓ Service: retweetTweet incremented retweetCount.");

        const undoRetweetResult = await undoRetweet({ tweetId: createdTweet.id, user: userB });
        assert.strictEqual(undoRetweetResult.retweeted, false);
        assert.strictEqual(undoRetweetResult.retweetCount, 0);
        console.log("✓ Service: undoRetweet decremented retweetCount.");

        // Test F: Create reply
        const reply = await createTweet({
            user: userB,
            content: "Great tweet, Alice! 🙌",
            replyToId: createdTweet.id
        });
        assert.strictEqual(reply.replyToId, createdTweet.id);
        assert.strictEqual(reply.authorId, "usr_bob");
        console.log("✓ Service: createTweet with replyToId created a reply tweet.");

        // Parent should have incremented repliesCount
        const parentAfterReply = inMemoryTweets.get(createdTweet.id);
        assert.strictEqual(parentAfterReply.repliesCount, 1);
        console.log("✓ Service: parent tweet repliesCount incremented to 1 after reply.");

        // Test G: Get replies list
        const repliesResult = await getReplies({ tweetId: createdTweet.id, currentUserId: null });
        assert.strictEqual(repliesResult.items.length, 1);
        assert.strictEqual(repliesResult.items[0].id, reply.id);
        console.log("✓ Service: getReplies returned the reply tweet.");

        // Test H: Delete tweet authorization
        let unauthorizedDeleteFailed = false;
        try {
            await deleteTweet({ tweetId: createdTweet.id, user: userB });
        } catch (err) {
            unauthorizedDeleteFailed = (err.statusCode === 403);
        }
        assert.strictEqual(unauthorizedDeleteFailed, true, "Non-author cannot delete tweet");
        console.log("✓ Service: deleteTweet blocked non-author with 403 FORBIDDEN.");

        // Author can delete their own tweet
        const deletedTweetRes = await deleteTweet({ tweetId: createdTweet.id, user: userA });
        assert.strictEqual(deletedTweetRes.deletedId, createdTweet.id);
        console.log("✓ Service: deleteTweet allowed tweet author to delete their tweet.");

        // Test I: Unauthenticated create attempt
        let unauthCreateFailed = false;
        try {
            await createTweet({ user: null, content: "Sneaky unauthenticated tweet" });
        } catch (err) {
            unauthCreateFailed = (err.statusCode === 401);
        }
        assert.strictEqual(unauthCreateFailed, true);
        console.log("✓ Service: createTweet rejected unauthenticated user with 401.");

        // Test J: Like non-existent tweet → 404
        let likeNotFoundFailed = false;
        try {
            await likeTweet({ tweetId: "tweet_does_not_exist", user: userA });
        } catch (err) {
            likeNotFoundFailed = (err.statusCode === 404);
        }
        assert.strictEqual(likeNotFoundFailed, true);
        console.log("✓ Service: likeTweet returned 404 for non-existent tweet.");

        // Test K: Admin can delete any tweet
        const tweetForAdmin = await createTweet({
            user: userA,
            content: "Tweet to be deleted by admin"
        });
        const adminDeleteRes = await deleteTweet({ tweetId: tweetForAdmin.id, user: admin });
        assert.strictEqual(adminDeleteRes.deletedId, tweetForAdmin.id);
        console.log("✓ Service: deleteTweet allowed admin to delete any tweet.");

    } finally {
        // Restore repository methods
        tweetsRepository.create = originalCreate;
        tweetsRepository.findById = originalFindById;
        tweetsRepository.findPaginated = originalFindPaginated;
        tweetsRepository.count = originalCount;
        tweetsRepository.deleteById = originalDeleteById;
        tweetsRepository.addLike = originalAddLike;
        tweetsRepository.removeLike = originalRemoveLike;
        tweetsRepository.addRetweet = originalAddRetweet;
        tweetsRepository.removeRetweet = originalRemoveRetweet;
        tweetsRepository.incrementRepliesCount = originalIncrementRepliesCount;
        tweetsRepository.decrementRepliesCount = originalDecrementRepliesCount;
        tweetsRepository.findReplies = originalFindReplies;
        tweetsRepository.attachAuthors = originalAttachAuthors;
    }

    console.log("\nAll Phase 4 Milestone 3 Tweet / Feed tests passed successfully!");
}

module.exports = { runTweetsTests };

if (require.main === module) {
    runTweetsTests().catch((err) => {
        console.error("Tweet test failed:", err);
        process.exit(1);
    });
}
