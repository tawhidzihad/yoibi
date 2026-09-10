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

const router = Router();

// Stream Listing & Creation
router.get("/streams", optionalAuth, validate(listStreamsQuerySchema, "query"), handleListStreams);
router.post("/streams", verifyJwt, validate(createStreamSchema, "body"), handleCreateStream);

// Stream Details
router.get("/streams/:id", optionalAuth, validate(streamIdParamSchema, "params"), handleGetStreamById);

// Stream Broadcasting Lifecycle (Start, Join, End)
router.post("/streams/:id/start", verifyJwt, validate(streamIdParamSchema, "params"), handleStartStream);
router.post("/streams/:id/join", optionalAuth, validate(streamIdParamSchema, "params"), handleJoinStream);
router.post("/streams/:id/end", verifyJwt, validate(streamIdParamSchema, "params"), handleEndStream);

// Stream Deletion (Only ready or ended)
router.delete("/streams/:id", verifyJwt, validate(streamIdParamSchema, "params"), handleDeleteStream);

module.exports = router;
