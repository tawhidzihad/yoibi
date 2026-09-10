const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createTweetSchema,
    listTweetsQuerySchema,
    tweetIdParamSchema,
    createReplySchema
} = require("../validators/tweets.validator");

const { handleCreateTweet } = require("../controllers/create/tweets.controller");
const { handleListTweets, handleGetTweetById, handleGetReplies } = require("../controllers/read/tweets.controller");
const { handleLikeTweet, handleUnlikeTweet, handleRetweetTweet, handleUndoRetweet } = require("../controllers/update/tweets.controller");
const { handleDeleteTweet } = require("../controllers/delete/tweets.controller");

const router = Router();

// Feed & Tweet Listing
router.get("/tweets", optionalAuth, validate(listTweetsQuerySchema, "query"), handleListTweets);
router.post("/tweets", verifyJwt, validate(createTweetSchema, "body"), handleCreateTweet);

// Single Tweet Details & Deletion
router.get("/tweets/:id", optionalAuth, validate(tweetIdParamSchema, "params"), handleGetTweetById);
router.delete("/tweets/:id", verifyJwt, validate(tweetIdParamSchema, "params"), handleDeleteTweet);

// Likes / Reactions
router.post("/tweets/:id/like", verifyJwt, validate(tweetIdParamSchema, "params"), handleLikeTweet);
router.delete("/tweets/:id/like", verifyJwt, validate(tweetIdParamSchema, "params"), handleUnlikeTweet);

// Retweets
router.post("/tweets/:id/retweet", verifyJwt, validate(tweetIdParamSchema, "params"), handleRetweetTweet);
router.delete("/tweets/:id/retweet", verifyJwt, validate(tweetIdParamSchema, "params"), handleUndoRetweet);

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
    verifyJwt,
    validate(tweetIdParamSchema, "params"),
    validate(createReplySchema, "body"),
    async (req, res, next) => {
        // Inject replyToId from params into body before delegating to create handler
        req.body.replyToId = req.params.id;
        return handleCreateTweet(req, res, next);
    }
);

module.exports = router;
