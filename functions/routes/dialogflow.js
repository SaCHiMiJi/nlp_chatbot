// Express router for Dialogflow webhook
const express = require("express");
const router = express.Router();
const dialogflowService = require("../services/dialogflowService");
const logger = require("../utils/logger");

// Handle Dialogflow webhook
router.post("/webhook", async (req, res) => { try { logger.info("Received Dialogflow webhook request");
    
    const response = await dialogflowService.handleDialogflowWebhook(req.body);
    
    return res.json(response);
  } catch (error) { logger.error("Error in Dialogflow webhook:", error);
    
    return res.json({ fulfillmentText: "I'm sorry, I encountered an error. Please try again later."
    });
  }
});

module.exports = router;
