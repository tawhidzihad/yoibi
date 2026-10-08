const assert = require("assert");
const tweetsRepository = require("../src/repositories/tweets.repository");
const User = require("../src/models/user.model");
const { listTweets } = require("../src/services/read/tweets.service");
const { selectDiscoveryForPage } = require("../src/utils/prng");

async function runFeedDiscoveryTests({ request } = {}) {
    console.log("\n[Test] Starting Feed Discovery & Own-Post Pinning verification...");

    // 1. HTTP Endpoint & Validation Tests (if HTTP request helper provided)
    if (request) {
        // Test H1: Non-feed request without mode returns chronological without feedSeed
        const standardRes = await request("/api/v1/tweets");
        assert.strictEqual(standardRes.status, 200);
        assert.strictEqual(standardRes.body.success, true);
        assert.strictEqual(standardRes.body.data.feedSeed, undefined, "Standard /tweets must NOT have feedSeed");
        console.log("✓ HTTP: GET /api/v1/tweets without mode returns standard response without feedSeed.");

        // Test H2: GET /api/v1/tweets?mode=feed returns 200 with feedSeed
        const feedRes = await request("/api/v1/tweets?mode=feed");
        assert.strictEqual(feedRes.status, 200);
        assert.strictEqual(feedRes.body.success, true);
        assert(Number.isInteger(feedRes.body.data.feedSeed), "Feed response must include integer feedSeed");
        console.log("✓ HTTP: GET /api/v1/tweets?mode=feed returns 200 with generated feedSeed.");

        // Test H3: Malformed seed returns 400 VALIDATION_ERROR
        const badSeedRes = await request("/api/v1/tweets?seed=not_a_number");
        assert.strictEqual(badSeedRes.status, 400);
        assert.strictEqual(badSeedRes.body.error.code, "VALIDATION_ERROR");
        console.log("✓ HTTP: GET /api/v1/tweets?seed=not_a_number rejected with 400 VALIDATION_ERROR.");

        // Test H4: Negative seed returns 400 VALIDATION_ERROR
        const negSeedRes = await request("/api/v1/tweets?seed=-5");
        assert.strictEqual(negSeedRes.status, 400);
        assert.strictEqual(negSeedRes.body.error.code, "VALIDATION_ERROR");
        console.log("✓ HTTP: GET /api/v1/tweets?seed=-5 rejected with 400 VALIDATION_ERROR.");

        // Test H5: Malformed cursor returns 400 VALIDATION_ERROR
        const badCursorRes = await request("/api/v1/tweets?cursor=@@malformed_cursor!!");
        assert.strictEqual(badCursorRes.status, 400);
        assert.strictEqual(badCursorRes.body.error.code, "VALIDATION_ERROR");
        console.log("✓ HTTP: GET /api/v1/tweets with invalid cursor rejected with 400 VALIDATION_ERROR.");

        // Test H6: Invalid mode returns 400 VALIDATION_ERROR
        const badModeRes = await request("/api/v1/tweets?mode=unsupported_mode");
        assert.strictEqual(badModeRes.status, 400);
        assert.strictEqual(badModeRes.body.error.code, "VALIDATION_ERROR");
        console.log("✓ HTTP: GET /api/v1/tweets?mode=unsupported_mode rejected with 400 VALIDATION_ERROR.");
    }

    // 2. Pure PRNG Determinism & Weighting Unit Tests
    console.log("\n[Test] Testing PRNG determinism & weighted recency selection...");
    const samplePool = Array.from({ length: 30 }, (_, i) => ({
        id: `pool_tweet_${i}`,
        authorId: `author_${i}`,
        createdAt: new Date(Date.now() - i * 3600 * 1000) // 0 to 29 hours old
    }));

    // Same seed → identical picks
    const picks1 = selectDiscoveryForPage(samplePool, 5, 12345, 0, 1000000);
    const picks2 = selectDiscoveryForPage(samplePool, 5, 12345, 0, 1000000);
    assert.deepStrictEqual(picks1.map((p) => p.id), picks2.map((p) => p.id), "Same seed + same page must be identical");
    console.log("✓ PRNG: same seed + same page produces identical discovery picks.");

    // Different seed → different picks
    const picksDiffSeed = selectDiscoveryForPage(samplePool, 5, 99999, 0, 1000000);
    assert.notDeepStrictEqual(picks1.map((p) => p.id), picksDiffSeed.map((p) => p.id), "Different seeds should differ");
    console.log("✓ PRNG: different seeds produce different discovery picks.");

    // Consecutive pages with same seed have NO duplicates
    const page0Picks = selectDiscoveryForPage(samplePool, 5, 12345, 0, 1000000);
    const page1Picks = selectDiscoveryForPage(samplePool, 5, 12345, 1, 1000000);
    const page0Ids = new Set(page0Picks.map((p) => p.id));
    for (const p of page1Picks) {
        assert(!page0Ids.has(p.id), `Page 1 item ${p.id} must not appear on Page 0`);
    }
    console.log("✓ PRNG: consecutive pages with same seed have zero duplicate items.");

    // 3. Service-Layer Mocked Verification for listTweets
    console.log("\n[Test] Testing Feed Discovery service business logic...");

    const origFindPaginated = tweetsRepository.findPaginated;
    const origCount = tweetsRepository.count;
    const origFindDiscoveryCandidates = tweetsRepository.findDiscoveryCandidates;
    const origFindPinnedTweets = tweetsRepository.findPinnedTweets;
    const origAttachAuthors = tweetsRepository.attachAuthors;
    const origUserFind = User.find;

    try {
        // Setup mock environment
        const now = Date.now();
        const baseTweets = Array.from({ length: 40 }, (_, i) => ({
            _id: `base_tweet_${i}`,
            id: `base_tweet_${i}`,
            content: `Base tweet ${i}`,
            authorId: `author_base_${i}`,
            replyToId: null,
            likes: [],
            retweets: [],
            createdAt: new Date(now - (i + 1) * 60000)
        }));

        const discoveryCandidates = Array.from({ length: 50 }, (_, i) => ({
            _id: `disc_tweet_${i}`,
            id: `disc_tweet_${i}`,
            content: `Discovery tweet ${i}`,
            authorId: `author_disc_${i}`,
            replyToId: null,
            likes: [],
            retweets: [],
            createdAt: new Date(now - (i + 10) * 3600000)
        }));

        tweetsRepository.findPaginated = async ({ skip = 0, limit = 20 }) => {
            return baseTweets.slice(skip, skip + limit);
        };
        tweetsRepository.count = async () => baseTweets.length;
        tweetsRepository.findDiscoveryCandidates = async () => [...discoveryCandidates];
        tweetsRepository.findPinnedTweets = async () => [];
        tweetsRepository.attachAuthors = async (tweets) => {
            return tweets.map((t) => ({
                ...t,
                id: t._id || t.id,
                author: { id: t.authorId, name: `User ${t.authorId}`, handle: `@${t.authorId}`, avatarUrl: null }
            }));
        };
        User.find = (filter) => {
            if (filter && filter.isBlocked) {
                return { lean: async () => [{ _id: "author_disc_blocked" }] };
            }
            if (filter && filter._id && filter._id.$in) {
                const ids = filter._id.$in.filter((id) => id !== "author_disc_deleted");
                return { lean: async () => ids.map((id) => ({ _id: id })) };
            }
            return { lean: async () => [] };
        };

        // Test S1: Unchanged behavior without mode="feed" (strictly chronological)
        const unoptedResult = await listTweets({ page: 1, limit: 20 });
        assert.strictEqual(unoptedResult.feedSeed, undefined);
        assert.strictEqual(unoptedResult.items.length, 20);
        assert.strictEqual(unoptedResult.items[0].id, "base_tweet_0");
        assert.strictEqual(unoptedResult.items[4].id, "base_tweet_4"); // Not replaced by discovery
        console.log("✓ Service: listTweets without mode='feed' is strictly chronological base items only.");

        // Test S2: Mode="feed" interleaves 1 discovery tweet after every 4 base tweets
        const feedResultP1 = await listTweets({ page: 1, limit: 20, mode: "feed", seed: 77777 });
        assert(Number.isInteger(feedResultP1.feedSeed));
        assert.strictEqual(feedResultP1.items[0].id, "base_tweet_0");
        assert.strictEqual(feedResultP1.items[1].id, "base_tweet_1");
        assert.strictEqual(feedResultP1.items[2].id, "base_tweet_2");
        assert.strictEqual(feedResultP1.items[3].id, "base_tweet_3");
        // Index 4 must be a discovery tweet!
        assert(
            feedResultP1.items[4].id.startsWith("disc_tweet_"),
            `Index 4 must be a discovery tweet, got ${feedResultP1.items[4].id}`
        );
        assert.strictEqual(feedResultP1.items[5].id, "base_tweet_4");
        // Index 9 must be second discovery tweet!
        assert(
            feedResultP1.items[9].id.startsWith("disc_tweet_"),
            `Index 9 must be a discovery tweet, got ${feedResultP1.items[9].id}`
        );
        console.log("✓ Service: exactly 1 discovery tweet is interleaved after every 4 base tweets.");

        // Test S3: Multi-page stability and NO duplicates across consecutive pages
        const feedResultP2 = await listTweets({ page: 2, limit: 20, mode: "feed", seed: 77777 });
        const allPage1And2Ids = [...feedResultP1.items.map((t) => t.id), ...feedResultP2.items.map((t) => t.id)];
        const uniqueSet = new Set(allPage1And2Ids);
        assert.strictEqual(
            uniqueSet.size,
            allPage1And2Ids.length,
            "Across Page 1 and Page 2 with same seed, there must be ZERO duplicate IDs"
        );
        console.log("✓ Service: loading consecutive pages with same seed produces zero duplicate tweets.");

        // Test S4: Discovery excludes replies, own tweets, blocked authors, deleted authors
        discoveryCandidates.push({
            _id: "disc_tweet_reply",
            id: "disc_tweet_reply",
            authorId: "author_other",
            replyToId: "some_parent",
            createdAt: new Date()
        });
        discoveryCandidates.push({
            _id: "disc_tweet_own",
            id: "disc_tweet_own",
            authorId: "viewer_user_id",
            replyToId: null,
            createdAt: new Date()
        });
        discoveryCandidates.push({
            _id: "disc_tweet_blocked_author",
            id: "disc_tweet_blocked_author",
            authorId: "author_disc_blocked",
            replyToId: null,
            createdAt: new Date()
        });
        discoveryCandidates.push({
            _id: "disc_tweet_deleted_author",
            id: "disc_tweet_deleted_author",
            authorId: "author_disc_deleted",
            replyToId: null,
            createdAt: new Date()
        });

        const filterTestResult = await listTweets({
            page: 1,
            limit: 20,
            mode: "feed",
            seed: 54321,
            currentUserId: "viewer_user_id"
        });
        const returnedIds = new Set(filterTestResult.items.map((t) => t.id));
        assert(!returnedIds.has("disc_tweet_reply"), "Replies must be excluded from discovery");
        assert(!returnedIds.has("disc_tweet_own"), "Viewer's own tweets must be excluded from discovery");
        assert(!returnedIds.has("disc_tweet_blocked_author"), "Blocked authors must be excluded from discovery");
        assert(!returnedIds.has("disc_tweet_deleted_author"), "Deleted/banned authors must be excluded from discovery");
        console.log("✓ Service: discovery candidates exclude replies, own tweets, blocked authors, and deleted authors.");

        // Test S5: Own-post pinning on page 1 only
        const pinnedTweetDoc = {
            _id: "viewer_recent_tweet",
            id: "viewer_recent_tweet",
            content: "Just posted 2 minutes ago",
            authorId: "viewer_user_id",
            replyToId: null,
            likes: [],
            retweets: [],
            createdAt: new Date(now - 2 * 60000)
        };
        tweetsRepository.findPinnedTweets = async ({ authorId }) => {
            if (authorId === "viewer_user_id") return [pinnedTweetDoc];
            return [];
        };

        const page1WithPin = await listTweets({
            page: 1,
            limit: 20,
            mode: "feed",
            seed: 11111,
            currentUserId: "viewer_user_id"
        });
        assert.strictEqual(page1WithPin.items[0].id, "viewer_recent_tweet", "Pinned tweet must be at index 0 on page 1");
        const pinOccurrences = page1WithPin.items.filter((t) => t.id === "viewer_recent_tweet").length;
        assert.strictEqual(pinOccurrences, 1, "Pinned tweet must never repeat in the rest of page 1");

        // Page 2 must NOT pin
        const page2WithPin = await listTweets({
            page: 2,
            limit: 20,
            mode: "feed",
            seed: 11111,
            currentUserId: "viewer_user_id"
        });
        const page2Pinned = page2WithPin.items.find((t) => t.id === "viewer_recent_tweet");
        assert(!page2Pinned, "Pinned tweet must NOT appear on page 2");
        console.log("✓ Service: own top-level tweets from last 10 minutes pinned on page 1 only and never repeated.");

        // Test S6: Graceful degradation when candidate pool is smaller than slots
        tweetsRepository.findDiscoveryCandidates = async () => [
            {
                _id: "solo_candidate",
                id: "solo_candidate",
                authorId: "solo_author",
                replyToId: null,
                likes: [],
                retweets: [],
                createdAt: new Date()
            }
        ];
        const smallPoolResult = await listTweets({ page: 1, limit: 20, mode: "feed", seed: 99999 });
        assert(smallPoolResult.items.length >= 20, "Must return base items safely without erroring");
        const soloCount = smallPoolResult.items.filter((t) => t.id === "solo_candidate").length;
        assert.strictEqual(soloCount, 1, "Solo candidate used at most once, never duplicated");

        // Pool empty
        tweetsRepository.findDiscoveryCandidates = async () => [];
        const emptyPoolResult = await listTweets({ page: 1, limit: 20, mode: "feed", seed: 99999 });
        assert.strictEqual(emptyPoolResult.items.length, 20, "Empty pool returns base items cleanly without error");
        console.log("✓ Service: pool with fewer candidates than slots degrades gracefully without error or repetition.");

    } finally {
        tweetsRepository.findPaginated = origFindPaginated;
        tweetsRepository.count = origCount;
        tweetsRepository.findDiscoveryCandidates = origFindDiscoveryCandidates;
        tweetsRepository.findPinnedTweets = origFindPinnedTweets;
        tweetsRepository.attachAuthors = origAttachAuthors;
        User.find = origUserFind;
    }

    console.log("\nAll Feed Discovery & Own-Post Pinning tests passed successfully!");
}

module.exports = { runFeedDiscoveryTests };

if (require.main === module) {
    runFeedDiscoveryTests().catch((err) => {
        console.error("Feed discovery test failed:", err);
        process.exit(1);
    });
}
