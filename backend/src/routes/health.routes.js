const { Router } = require("express");
const { getHealth } = require("../controllers/read/health.controller");

const router = Router();

router.get("/health", getHealth);

module.exports = router;
