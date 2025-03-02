// Controller for handling LINE webhook events
const lineService = require("../services/lineService");
const flexBuilder = require("../utils/flexBuilder");
const logger = require("../utils/logger");
const imageController = require("./imageController");

/**
 * Handle LINE webhook events
 * @param {object} event - LINE webhook event object
 * @returns {Promise<void>}
 */
const handleWebhook = async (event) => {
  try {
    const { type, replyToken, source, message } = event;
    
    logger.info(`Processing ${type} event from ${source.type} ${source.userId || "unknown"}`);
    
    // Handle message events
    if (type === "message") {
      await handleMessageEvent(message, replyToken, source);
    }
    // You can add more event handlers here (e.g., follow, unfollow, postback)
  } catch (error) {
    logger.error("Error in handleWebhook:", error);
  }
};

/**
 * Handle LINE message events
 * @param {object} message - LINE message object
 * @param {string} replyToken - LINE reply token
 * @param {object} source - LINE source object
 * @returns {Promise<void>}
 */
const handleMessageEvent = async (message, replyToken, source) => {
  try {
    const { type, id: messageId, text } = message;
    
    switch (type) {
      case "text":
        await handleTextMessage(text, replyToken);
        break;
        
      case "image":
        await handleImageMessage(messageId, replyToken, source.userId);
        break;
        
      default:
        await lineService.reply(replyToken, flexBuilder.createTextMessage(
          "I can analyze food photos or answer nutrition questions. Please send me a photo or ask a question."
        ));
        break;
    }
  } catch (error) {
    logger.error("Error handling message event:", error);
  }
};

/**
 * Handle text messages
 * @param {string} text - Message text
 * @param {string} replyToken - LINE reply token
 * @returns {Promise<void>}
 */
const handleTextMessage = async (text, replyToken) => {
  try {
    // Simple keyword detection
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("analyze") && lowerText.includes("food")) {
      // Instruction for food analysis
      await lineService.reply(replyToken, flexBuilder.createTextMessage(
        "Please send me a photo of your food, and I'll analyze it for you!"
      ));
    } else {
      // Forward to Dialogflow for natural language processing
      await lineService.forwardToDialogflow({ body: { events: [{ replyToken, message: { text } }] } });
    }
  } catch (error) {
    logger.error("Error handling text message:", error);
  }
};

/**
 * Handle image messages
 * @param {string} messageId - LINE message ID
 * @param {string} replyToken - LINE reply token
 * @param {string} userId - LINE user ID
 * @returns {Promise<void>}
 */
const handleImageMessage = async (messageId, replyToken, userId) => {
  try {
    // Process the image with the imageController
    const result = await imageController.processLineImage(messageId, userId);
    
    if (result.success) {
      await lineService.reply(replyToken, result.message);
    } else {
      await lineService.reply(replyToken, result.message || flexBuilder.createErrorFlexMessage(
        "Analysis Error",
        "I encountered a problem analyzing your food. Please try again."
      ));
    }
  } catch (error) {
    logger.error("Error handling image message:", error);
    
    await lineService.reply(replyToken, flexBuilder.createErrorFlexMessage(
      "Processing Error", 
      "I encountered an error while analyzing your food. Please try again later."
    ));
  }
};

module.exports = {
  handleWebhook
};