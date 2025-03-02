// Service for interacting with OpenAI API
const { OpenAI } = require("openai");
const { OPENAI } = require("../config/constants");
const logger = require("../utils/logger");

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI.API_KEY });

/**
 * Analyze a food image using OpenAI's vision model
 * @param { string } base64Image - Base64 encoded image
 * @returns { Promise<string>} - JSON response string from OpenAI
 */
const analyzeFoodImage = async (base64Image) => { try { logger.info("Analyzing food image with OpenAI");
    
    // Use a structured JSON prompt for food analysis
    const promptText = `
Analyze this image and respond with ONLY JSON in the following format:

If the image contains food or beverages:
{
  "containsFood": true,
  "items": [
    {
      "name": "Item name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "healthierAlternatives": "Suggestions for healthier options"
}

If the image does NOT contain any food or beverages:
{
  "containsFood": false }

Ensure you return ONLY valid JSON with no additional text. Round nutritional values to whole numbers.
`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({ model: OPENAI.MODEL,
      messages: [
        { role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${ base64Image }` }
            }
          ]
        }
      ],
      max_tokens: 1000 });
    
    // Return the content
    if (response.choices && response.choices.length > 0) { const content = response.choices[0].message.content;
      
      logger.info(`OpenAI response received (first 100 chars): ${ content.substring(0, 100)}...`);
      
      // Validate JSON
      JSON.parse(content); // This will throw an error if not valid JSON
      
      return content;
    } else { logger.error("Invalid response structure from OpenAI");
      return JSON.stringify({ error: "Failed to analyze the image" });
    }
  } catch (error) { logger.error("Error analyzing food image with OpenAI:", error);
    return JSON.stringify({ error: "Technical error during image analysis",
      message: error.message });
  }
};

module.exports = { analyzeFoodImage };
