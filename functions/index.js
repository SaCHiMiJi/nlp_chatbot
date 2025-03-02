require('dotenv').config();
const { initializeApp } = require("firebase-admin/app");
const functions = require("firebase-functions/v2");
const express = require("express");
const logger = require("./utils/logger");

// Initialize Firebase Admin
initializeApp();

// Create a LINE webhook Express app
const app = express();
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  logger.info("Health check accessed");
  res.status(200).send('Service is running');
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  try {
    // Simple handler for webhook verification
    logger.info("Received webhook request");
    res.status(200).send('OK');
  } catch (error) {
    logger.error("Error in webhook handler:", error);
    // Still return 200 for LINE verification
    res.status(200).send('OK');
  }
});

// Export the function - use the proper Firebase Functions v2 syntax
exports.lineWebhook = functions.https.onRequest(app);