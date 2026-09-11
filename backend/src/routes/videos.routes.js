const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createVideoSchema,
    listVideosQuerySchema,
    videoIdParamSchema
} = require("../validators/videos.validator");

const {
    handleGetUploadSignature,
    handleCreateVideo
} = require("../controllers/create/videos.controller");
const {
    handleListVideos,
    handleGetVideoById
} = require("../controllers/read/videos.controller");
const {
    handleRecordVideoView,
    handleLikeVideo,
    handleUnlikeVideo
} = require("../controllers/update/videos.controller");
const {
    handleDeleteVideo
} = require("../controllers/delete/videos.controller");
const { expensiveLimiter, writeLimiter } = require("../middleware/rate-limiter");

const router = Router();

// Upload Authorization
router.post("/videos/upload-signature", expensiveLimiter, verifyJwt, handleGetUploadSignature);

// Video Listing & Registration
router.get("/videos", optionalAuth, validate(listVideosQuerySchema, "query"), handleListVideos);
router.post("/videos", writeLimiter, verifyJwt, validate(createVideoSchema, "body"), handleCreateVideo);

// Video Details (Read-only; does NOT increment view count)
router.get("/videos/:id", optionalAuth, validate(videoIdParamSchema, "params"), handleGetVideoById);

// Playback View Recording (Increments view count)
router.post("/videos/:id/view", optionalAuth, validate(videoIdParamSchema, "params"), handleRecordVideoView);

// Deletion
router.delete("/videos/:id", writeLimiter, verifyJwt, validate(videoIdParamSchema, "params"), handleDeleteVideo);

// Likes / Reactions
router.post("/videos/:id/like", writeLimiter, verifyJwt, validate(videoIdParamSchema, "params"), handleLikeVideo);
router.delete("/videos/:id/like", writeLimiter, verifyJwt, validate(videoIdParamSchema, "params"), handleUnlikeVideo);

module.exports = router;
