const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createStreamSchema,
    listStreamsQuerySchema,
    streamIdParamSchema
} = require("../validators/streams.validator");

const { handleCreateStream } = require("../controllers/create/streams.controller");
const {
    handleListStreams,
    handleGetStreamById,
    handleJoinStream
} = require("../controllers/read/streams.controller");
const {
    handleStartStream,
    handleEndStream
} = require("../controllers/update/streams.controller");
const { handleDeleteStream } = require("../controllers/delete/streams.controller");
const { expensiveLimiter, writeLimiter } = require("../middleware/rate-limiter");

const router = Router();

// Stream Listing & Creation
router.get("/streams", optionalAuth, validate(listStreamsQuerySchema, "query"), handleListStreams);
router.post("/streams", expensiveLimiter, verifyJwt, validate(createStreamSchema, "body"), handleCreateStream);

// Stream Details
router.get("/streams/:id", optionalAuth, validate(streamIdParamSchema, "params"), handleGetStreamById);

// Stream Broadcasting Lifecycle (Start, Join, End)
router.post("/streams/:id/start", expensiveLimiter, verifyJwt, validate(streamIdParamSchema, "params"), handleStartStream);

// Stream Join Policy (MVP): Public stream viewing allowed for anonymous users.
// Uses optionalAuth so unauthenticated guests receive viewer-only tokens (canPublish: false).
router.post("/streams/:id/join", expensiveLimiter, optionalAuth, validate(streamIdParamSchema, "params"), handleJoinStream);

router.post("/streams/:id/end", writeLimiter, verifyJwt, validate(streamIdParamSchema, "params"), handleEndStream);

// Stream Deletion (Only ready or ended)
router.delete("/streams/:id", writeLimiter, verifyJwt, validate(streamIdParamSchema, "params"), handleDeleteStream);

module.exports = router;
