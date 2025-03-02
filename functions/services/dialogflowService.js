// Service for interacting with Dialogflow
const axios = require("axios");
const { DIALOGFLOW } = require("../config/constants");
const logger = require("../utils/logger");

/**
 * Format a response for Dialogflow
 * @param { string } text - Response text
 * @param { Array } [messages=[]] - Additional LINE platform-specific messages
 * @returns { object } - Formatted Dialogflow response
 */
const formatDialogflowResponse = (text, messages = []) => { const response = { fulfillmentMessages: [
      { platform: "PLATFORM_UNSPECIFIED",
        text: { text: [text]
        }
      }
    ]
  };
  
  // Add LINE-specific messages if provided
  if (messages.length > 0) { messages.forEach((message) => { response.fulfillmentMessages.push({ platform: "line",
        payload: { line: message }
      });
    });
  }
  
  return response;
};

/**
 * Handle a Dialogflow webhook request
 * @param { object } request - Dialogflow webhook request
 * @returns { object } - Dialogflow response
 */
const handleDialogflowWebhook = async (request) => { try { logger.info("Received Dialogflow webhook request", { intent: request.queryResult && request.queryResult.intent && request.queryResult.intent.displayName,
      action: request.queryResult && request.queryResult.action });
    
    // Parse query parameters from Dialogflow
    const queryText = request.queryResult && request.queryResult.queryText || "";
    const action = request.queryResult && request.queryResult.action || "";
    const parameters = request.queryResult && request.queryResult.parameters || {};
    const intent = request.queryResult && request.queryResult.intent && 
                   request.queryResult.intent.displayName || "";
    
    // Handle different intents
    switch (intent) { case "Default Welcome Intent":
        return formatDialogflowResponse(
          "Hello! I can analyze your food photos and provide nutritional information. " +
          "Send me a picture of your food or ask me about nutrition!"
        );
        
      case "food.analyze":
        return formatDialogflowResponse(
          "Please send me a photo of your food to analyze!"
        );
        
      case "nutrition.info":
        // Handle nutrition questions
        const foodItem = parameters.food_item || "";
        
        if (!foodItem) { return formatDialogflowResponse(
            "Which food item would you like nutritional information for?"
          );
        }
        
        // Here you could call another API to get nutritional info for the food item
        // For now, return a simple response
        return formatDialogflowResponse(
          `${ foodItem } is generally a nutritious option. For detailed nutritional information, ` +
          `send me a photo of your ${ foodItem } and I'll analyze it for you!`
        );
        
      default:
        return formatDialogflowResponse(
          "I'm here to help with food analysis and nutrition information. " +
          "Send me a food photo to analyze or ask me about specific foods!"
        );
    }
  } catch (error) { logger.error("Error handling Dialogflow webhook:", error);
    
    return formatDialogflowResponse(
      "I'm sorry, I encountered an error processing your request. Please try again later."
    );
  }
};

module.exports = { formatDialogflowResponse,
  handleDialogflowWebhook };
