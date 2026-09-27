const express = require("express");
const router = express.Router();

// Global rate limiter: 300 requests per minute per IP
const { globalLimiter } = require("../middleware/rate-limiter");
router.use(globalLimiter);

// System routes
const healthRoutes = require("./health.routes");
router.use(healthRoutes);

// Authentication routes (Better Auth proxy + email verification extensions)
const authRoutes = require("./auth.routes");
router.use(authRoutes);

// User profile routes
const usersRoutes = require("./users.routes");
router.use(usersRoutes);

// Tweets and feed routes (Tweet = YOIBI social content; POST = HTTP method)
const tweetsRoutes = require("./tweets.routes");
router.use(tweetsRoutes);

// Videos routes (Shorts & Longform community videos)
const videosRoutes = require("./videos.routes");
router.use(videosRoutes);

// Streams routes (LiveKit live realtime broadcasts)
const streamsRoutes = require("./streams.routes");
router.use(streamsRoutes);

// Meet-up routes (LiveKit collaborative multi-peer rooms)
const meetupRoutes = require("./meetup.routes");
router.use(meetupRoutes);

// Moderation reports routes
const reportsRoutes = require("./reports.routes");
router.use(reportsRoutes);

// Admin dashboard and moderation routes
const adminRoutes = require("./admin.routes");
router.use(adminRoutes);

module.exports = router;