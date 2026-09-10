const { Router } = require("express");
const { getMe } = require("../controllers/read/auth.controller");
const { verifyJwt } = require("../middleware/auth");
const { requireAuth } = require("../middleware/authorize");

const router = Router();

router.get("/auth/me", verifyJwt, requireAuth, getMe);

module.exports = router;
