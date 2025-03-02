// Utility to build LINE Flex Messages
const logger = require("./logger");

/**
 * Create a food analysis Flex Message from JSON data
 * @param { string } analysisJson - JSON string from OpenAI
 * @returns { object } - LINE Flex Message object
 */
const createFoodAnalysisFlex = (analysisJson) => { let foodData;
  
  try {
    // Try to parse the JSON
    foodData = typeof analysisJson === 'object' ? analysisJson : JSON.parse(analysisJson);
  } catch (error) { logger.error("Failed to parse food analysis JSON:", error);
    return createErrorFlexMessage(
      "Analysis Error", 
      "There was an error analyzing the food. Please try again with a clearer photo."
    );
  }
  
  // Check if error occurred during analysis
  if (foodData.error) { return createErrorFlexMessage(
      "Analysis Error", 
      foodData.message || "There was an error analyzing the food."
    );
  }
  
  // Check if no food was detected
  if (!foodData.containsFood) { return createErrorFlexMessage(
      "No Food Detected", 
      "The image you sent doesn't appear to contain any food items."
    );
  }
  
  // Build food analysis Flex Message
  return { type: "flex",
    altText: "Food Analysis Results",
    contents: { type: "bubble",
      header: { type: "box",
        layout: "vertical",
        contents: [
          { type: "text",
            text: "Food Analysis",
            weight: "bold",
            size: "xl",
            color: "#ffffff"
          }
        ],
        backgroundColor: "#27ACB2"
      },
      body: { type: "box",
        layout: "vertical",
        contents: [
          // Food Items section
          { type: "text",
            text: "Food Items",
            weight: "bold",
            color: "#1DB446",
            size: "md"
          },
          // Items list (dynamically generated)
          ...foodData.items.map(item => ({ type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "text",
                text: item.name,
                size: "sm",
                color: "#555555",
                flex: 5,
                wrap: true },
              { type: "text",
                text: `${ item.calories } cal`,
                size: "sm",
                color: "#111111",
                align: "end",
                flex: 2 }
            ]
          })),
          // Total calories
          { type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "text",
                text: "Total Calories:",
                size: "sm",
                color: "#555555",
                weight: "bold",
                flex: 5 },
              { type: "text",
                text: `${ foodData.totalCalories } cal`,
                size: "sm",
                color: "#111111",
                weight: "bold",
                align: "end",
                flex: 2 }
            ]
          },
          // Separator
          { type: "separator",
            margin: "xl"
          },
          // Nutrition section
          { type: "text",
            text: "Nutrition",
            weight: "bold",
            color: "#1DB446",
            size: "md",
            margin: "xl"
          },
          // Nutrition values
          { type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
              { type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text",
                    text: "Protein:",
                    size: "sm",
                    color: "#555555",
                    flex: 3 },
                  { type: "text",
                    text: `${ foodData.totalProtein }g`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 2 }
                ]
              },
              { type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  { type: "text",
                    text: "Carbs:",
                    size: "sm",
                    color: "#555555",
                    flex: 3 },
                  { type: "text",
                    text: `${ foodData.totalCarbs }g`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 2 }
                ]
              },
              { type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  { type: "text",
                    text: "Fat:",
                    size: "sm",
                    color: "#555555",
                    flex: 3 },
                  { type: "text",
                    text: `${ foodData.totalFat }g`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 2 }
                ]
              }
            ]
          }
        ]
      },
      footer: { type: "box",
        layout: "vertical",
        contents: [
          { type: "text",
            text: "Healthier Alternatives",
            weight: "bold",
            color: "#1DB446",
            size: "sm"
          },
          { type: "text",
            text: foodData.healthierAlternatives || "No specific alternatives provided",
            wrap: true,
            size: "xs",
            margin: "md"
          },
          { type: "button",
            action: { type: "message",
              label: "Analyze Another Food",
              text: "Analyze food"
            },
            style: "primary",
            margin: "md"
          }
        ]
      },
      styles: { footer: { separator: true }
      }
    }
  };
};

/**
 * Create a simple error Flex Message
 * @param { string } title - Error title
 * @param { string } message - Error message
 * @returns { object } - LINE Flex Message object
 */
const createErrorFlexMessage = (title, message) => { return { type: "flex",
    altText: title,
    contents: { type: "bubble",
      body: { type: "box",
        layout: "vertical",
        contents: [
          { type: "text",
            text: title,
            weight: "bold",
            size: "xl",
            color: "#ff0000"
          },
          { type: "text",
            text: message,
            wrap: true,
            margin: "md"
          }
        ]
      },
      footer: { type: "box",
        layout: "vertical",
        contents: [
          { type: "button",
            action: { type: "message",
              label: "Try Again",
              text: "Analyze food"
            },
            style: "primary"
          }
        ]
      }
    }
  };
};

/**
 * Create a simple text message
 * @param { string } text - Message text
 * @returns { object } - LINE message object
 */
const createTextMessage = (text) => { return { type: "text",
    text: text };
};

module.exports = { createFoodAnalysisFlex,
  createErrorFlexMessage,
  createTextMessage };
