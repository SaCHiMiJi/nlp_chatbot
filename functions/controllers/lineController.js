// Controller for handling image processing
const lineService = require("../services/lineService");
const openaiService = require("../services/openaiService");
const storageService = require("../services/storageService");
const flexBuilder = require("../utils/flexBuilder");
const logger = require("../utils/logger");

/**
 * Process an image from LINE
 * @param { string } messageId - LINE message ID for the image
 * @param { string } userId - LINE user ID
 * @returns { Promise<object>} - Result object with success flag and message
 */
const processLineImage = async (messageId, userId) => { try {
    // 1. Get the image from LINE
    logger.info(`Processing LINE image with messageId: ${ messageId }`);
    const imageBuffer = await lineService.getImage(messageId);
    
    if (!imageBuffer) { logger.error("Failed to retrieve image from LINE");
      return { success: false,
        message: flexBuilder.createErrorFlexMessage(
          "Image Error", 
          "I couldn't retrieve your image. Please try again."
        )
      };
    }
    
    // 2. Upload to Firebase Storage (optional, but good for auditing)
    try { await storageService.uploadImage(imageBuffer, userId);
    } catch (error) {
      // Log but continue even if storage fails
      logger.warn("Failed to upload image to Firebase Storage:", error);
    }
    
    // 3. Convert buffer to base64 for OpenAI
    const base64Image = imageBuffer.toString('base64');
    
    // 4. Analyze with OpenAI
    const analysisJson = await openaiService.analyzeFoodImage(base64Image);
    
    // 5. Create Flex Message
    const flexMessage = flexBuilder.createFoodAnalysisFlex(analysisJson);
    
    return { success: true,
      message: flexMessage };
  } catch (error) { logger.error("Error processing image:", error);
    return { success: false,
      message: flexBuilder.createErrorFlexMessage(
        "Processing Error", 
        "I encountered an error while analyzing your food. Please try again later."
      )
    };
  }
};

/**
 * Process an image from a direct upload
 * @param { Buffer } imageBuffer - Image data as Buffer
 * @returns { Promise<object>} - Analysis result
 */
const processDirectImage = async (imageBuffer) => { try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Analyze with OpenAI
    const analysisJson = await openaiService.analyzeFoodImage(base64Image);
    
    // Parse the result
    const result = typeof analysisJson === 'string' ? JSON.parse(analysisJson) : analysisJson;
    
    return { success: true,
      analysis: result,
      flexMessage: flexBuilder.createFoodAnalysisFlex(result)
    };
  } catch (error) { logger.error("Error processing direct image:", error);
    return { success: false,
      error: error.message,
      flexMessage: flexBuilder.createErrorFlexMessage(
        "Processing Error", 
        "I encountered an error while analyzing the food image."
      )
    };
  }
};

module.exports = { processLineImage,
  processDirectImage };
