const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");

const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRoutes);

// Mount authentication verification routes
apiRouter.use(authRoutes);

// Mount user profile routes
apiRouter.use(usersRoutes);

module.exports = apiRouter;
