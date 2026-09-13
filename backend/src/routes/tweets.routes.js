const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createTweetSchema,
    listTweetsQuerySchema,
    tweetIdParamSchema,
    createReplySchema
} = require("../validators/tweets.validator");

const { handleCreateTweet, handleGetTweetImageSignature } = require("../controllers/create/tweets.controller");
const { handleListTweets, handleGetTweetById, handleGetReplies } = require("../controllers/read/tweets.controller");
const { handleLikeTweet, handleUnlikeTweet, handleRetweetTweet, handleUndoRetweet } = require("../controllers/update/tweets.controller");
const { handleDeleteTweet } = require("../controllers/delete/tweets.controller");
const { writeLimiter, expensiveLimiter } = require("../middleware/rate-limiter");

const router = Router();

// Tweet image upload authorization (ONE image) — server-issued Cloudinary
// signature bound to the authenticated user (folder yoibi/tweets/{userId}).
// Clients request one signature per selected image, upload directly to
// Cloudinary with it, then register the tweet with the verified media items.
router.post("/tweets/media-signature", expensiveLimiter, verifyJwt, handleGetTweetImageSignature);

// Feed & Tweet Listing
router.get("/tweets", optionalAuth, validate(listTweetsQuerySchema, "query"), handleListTweets);
router.post("/tweets", writeLimiter, verifyJwt, validate(createTweetSchema, "body"), handleCreateTweet);

// Single Tweet Details & Deletion
router.get("/tweets/:id", optionalAuth, validate(tweetIdParamSchema, "params"), handleGetTweetById);
router.delete("/tweets/:id", writeLimiter, verifyJwt, validate(tweetIdParamSchema, "params"), handleDeleteTweet);

// Likes / Reactions
router.post("/tweets/:id/like", writeLimiter, verifyJwt, validate(tweetIdParamSchema, "params"), handleLikeTweet);
router.delete("/tweets/:id/like", writeLimiter, verifyJwt, validate(tweetIdParamSchema, "params"), handleUnlikeTweet);

// Retweets
router.post("/tweets/:id/retweet", writeLimiter, verifyJwt, validate(tweetIdParamSchema, "params"), handleRetweetTweet);
router.delete("/tweets/:id/retweet", writeLimiter, verifyJwt, validate(tweetIdParamSchema, "params"), handleUndoRetweet);

// Replies (replies are tweets with replyToId set — create via main POST /tweets with replyToId)
router.get(
    "/tweets/:id/replies",
    optionalAuth,
    validate(tweetIdParamSchema, "params"),
    handleGetReplies
);

// Create a reply (convenience alias — uses main create schema with replyToId)
router.post(
    "/tweets/:id/replies",
    writeLimiter,
    verifyJwt,
    validate(tweetIdParamSchema, "params"),
    (req, res, next) => {
        // Server-authoritative: replyToId comes ONLY from the URL param and is
        // injected BEFORE body validation. The validated body must carry the
        // parent relationship — if validation ran first (previous bug), the
        // injected replyToId was shadowed by req.validatedBody and every
        // reply was stored as a standalone top-level tweet.
        req.body.replyToId = req.params.id;
        next();
    },
    validate(createReplySchema, "body"),
    async (req, res, next) => {
        return handleCreateTweet(req, res, next);
    }
);

module.exports = router;
