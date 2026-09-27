const { Router } = require("express");
const { getMe } = require("../controllers/read/auth.controller");
const { sendVerification, verifyVerification, resendVerification } = require("../controllers/auth/verification.controller");
const { verifyJwt } = require("../middleware/auth");
const { requireAuth } = require("../middleware/authorize");
const { authLimiter } = require("../middleware/rate-limiter");

const router = Router();

/**
 * Email verification endpoints
 */
router.post("/auth/verification/send", authLimiter, verifyJwt, requireAuth, sendVerification);
router.post("/auth/verification/verify", authLimiter, verifyJwt, requireAuth, verifyVerification);
router.post("/auth/verification/resend", authLimiter, verifyJwt, requireAuth, resendVerification);

/**
 * Core auth endpoint
 */
router.get("/auth/me", authLimiter, verifyJwt, requireAuth, getMe);

module.exports = router;