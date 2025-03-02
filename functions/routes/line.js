// Express router for LINE webhook
const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// Handle LINE webhook
router.post("/webhook", async (req, res) => {
  try {
    logger.info("Received LINE webhook request");
    
    // For now, just acknowledge the request
    return res.status(200).send("OK");
  } catch (error) {
    logger.error("Error handling LINE webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;