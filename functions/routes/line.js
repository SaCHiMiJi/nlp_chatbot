// Express router for LINE webhook
const express = require("express");
const router = express.Router();
const lineController = require("../controllers/lineController");

// Handle LINE webhook
router.post("/webhook", lineController.handleWebhook);

module.exports = router;
