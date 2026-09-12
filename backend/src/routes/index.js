const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const tweetsRoutes = require("./tweets.routes");
const videosRoutes = require("./videos.routes");
const streamsRoutes = require("./streams.routes");
const meetupRoutes = require("./meetup.routes");
const reportsRoutes = require("./reports.routes");
const adminRoutes = require("./admin.routes");

const { globalLimiter } = require("../middleware/rate-limiter");

const apiRouter = Router();

// Apply global rate limiting across all API endpoints (300 req/min/IP)
apiRouter.use(globalLimiter);

// Mount system routes
apiRouter.use(healthRoutes);

// Mount authentication verification routes
apiRouter.use(authRoutes);

// Mount user profile routes
apiRouter.use(usersRoutes);

// Mount tweets and feed routes (Tweet = YOIBI social content; POST = HTTP method)
apiRouter.use(tweetsRoutes);

// Mount videos routes (Shorts & Longform community videos)
apiRouter.use(videosRoutes);

// Mount streams routes (LiveKit live realtime broadcasts)
apiRouter.use(streamsRoutes);

// Mount meetup routes (LiveKit collaborative multi-peer rooms)
apiRouter.use(meetupRoutes);

// Mount moderation reports routes
apiRouter.use(reportsRoutes);

// Mount admin dashboard and moderation routes
apiRouter.use(adminRoutes);

module.exports = apiRouter;

