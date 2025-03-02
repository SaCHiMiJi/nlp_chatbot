require('dotenv').config();
const { initializeApp } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");

// Initialize Firebase Admin
initializeApp();

// Import routes
const dialogflowRoutes = require("./routes/dialogflow");
const foodRoutes = require("./routes/food");
const lineRoutes = require("./routes/line");

// Export functions using v2 syntax
exports.lineWebhook = onRequest((req, res) => {
  lineRoutes(req, res);
});

exports.dialogflowWebhook = onRequest((req, res) => {
  dialogflowRoutes(req, res);
});

exports.foodAnalysis = onRequest((req, res) => {
  foodRoutes(req, res);
});