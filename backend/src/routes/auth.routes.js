const { Router } = require("express");
const { getMe } = require("../controllers/read/auth.controller");
const { sendVerification, verifyVerification, resendVerification } = require("../controllers/auth/verification.controller");
const { verifyJwt } = require("../middleware/auth");
const { requireAuth } = require("../middleware/authorize");
const { authLimiter } = require("../middleware/rate-limiter");

const router = Router();

/**
 * Verification endpoints - skip email verification check to allow sending code to unverified users
 */
const verifyJwtSkipEmail = (req, res, next) => verifyJwt(req, res, next, { skipEmailCheck: true });

// Send verification code (allows unverified users to get their code)
router.post("/auth/verification/send", authLimiter, verifyJwtSkipEmail, requireAuth, sendVerification);
// Verify the code and mark email as verified
router.post("/auth/verification/verify", authLimiter, verifyJwtSkipEmail, requireAuth, verifyVerification);
// Resend verification code (with 60-second cooldown)
router.post("/auth/verification/resend", authLimiter, verifyJwtSkipEmail, requireAuth, resendVerification);

/**
 * Core auth endpoint
 */
router.get("/auth/me", authLimiter, verifyJwt, requireAuth, getMe);

module.exports = router;