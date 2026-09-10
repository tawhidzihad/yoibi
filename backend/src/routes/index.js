const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const tweetsRoutes = require("./tweets.routes");
const videosRoutes = require("./videos.routes");

const apiRouter = Router();

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

module.exports = apiRouter;

