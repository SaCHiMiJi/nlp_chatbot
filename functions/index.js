// Main entry point for all Firebase Functions
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

// Import controllers
const lineController = require("./controllers/lineController");
const dialogflowRoutes = require("./routes/dialogflow");
const foodRoutes = require("./routes/food");

// Export functions - Line webhook
exports.lineWebhook = functions.https.onRequest(lineController.handleWebhook);

// Export functions - Dialogflow webhook
exports.dialogflowWebhook = functions.https.onRequest(require("./routes/dialogflow"));

// Export functions - Food analysis API
exports.foodAnalysis = functions.https.onRequest(require("./routes/food"));
