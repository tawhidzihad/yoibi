const { Router } = require("express");
const {
    sendVerification,
    verifyVerification,
    resendVerification,
} = require("../controllers/auth/verification.controller");
const { verifyJwt } = require("../middleware/auth");
const { requireAuth } = require("../middleware/authorize");

const router = Router();

/**
 * Verification endpoints for email verification flow.
 *
 * All endpoints require authentication (Bearer JWT verified).
 * Rate limiting is applied via middleware and per-user cooldown.
 */

// Send a new verification code
router.post("/verification/send", verifyJwt, requireAuth, sendVerification);

// Verify a submitted code
router.post("/verification/verify", verifyJwt, requireAuth, verifyVerification);

// Resend a new verification code (with cooldown)
router.post("/verification/resend", verifyJwt, requireAuth, resendVerification);

module.exports = router;