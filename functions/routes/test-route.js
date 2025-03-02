// Simple test route to verify Express app is working
const express = require("express");
const router = express.Router();

// Simple test endpoint
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Test endpoint is working!" });
});

// Default route
router.get("/", (req, res) => {
  res.status(200).send("Service is running");
});

// POST handler for webhook
router.post("/webhook", (req, res) => {
  console.log("Received webhook request");
  res.status(200).send("OK");
});

// Export the router
module.exports = router;