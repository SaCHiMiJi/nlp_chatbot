require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");
const logger = require("./utils/logger");
const request = require("request-promise");

const app = express();
app.use(express.json()); // Ensure JSON parsing for webhook events

// Load environment variables
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message";

const LINE_HEADER = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
};

// Webhook route
app.post("/webhook", async (req, res) => {
    const events = req.body.events;
    for (const event of events) {
        if (event.type === "message") {
            if (event.message.type === "text") {
                await handleTextMessage(event);
            } else if (event.message.type === "image") {
                await replyMessage(event.replyToken, "โปรดรอสักกครู่");
                await handleImageMessage(event);
            }
        }
    }
    res.sendStatus(200);
});
const postToDialogflow = (req) => {
    req.headers.host = "bots.dialogflow.com";
    return axios.post(
      `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/d5bd37fa-b1b3-4f88-b265-8b49ca6015ea`,
      JSON.stringify(req.body),
      {
        headers: req.headers
      }
    );
  };
// Handle text messages with Dialogflow
async function handleTextMessage(event) {
    // Wrap the event into a request-like object
    const req = {
        headers: { "Content-Type": "application/json" },
        body: { events: [event] } // Sending event as request body
    };

    // Send message to Dialogflow
    postToDialogflow(req);
}

// Handle image messages with ChatGPT-4o-mini
async function handleImageMessage(event) {
    try {
        const imageUrl = `${LINE_CONTENT_API}/${event.message.id}/content`;

        // Fetch image as binary data
        const response = await axios.get(imageUrl, {
            headers: LINE_HEADER,
            responseType: "arraybuffer",
        });

        // Convert binary image to Base64
        const base64Image = Buffer.from(response.data).toString("base64");

        // Send image for nutrition analysis
        const chatGptResponse = await analyzeImageWithChatGPT(base64Image);
        
        // Inside handleImageMessage function, make sure you pass both the analysis and the image URL
await replyMessage(event.replyToken, createFoodAnalysisFlex(chatGptResponse, imageUrl));
    } catch (error) {
        console.error("Image Processing Error:", error);
        await replyMessage(event.replyToken, "Sorry, I couldn't process the image.");
    }
}
async function analyzeImageWithChatGPT(base64Image) {
    const prompt = `Analyze this image and respond with ONLY JSON in the following format:

    If the image contains food or beverages:
    {
      "containsFood": true,
      "items": [
        {
          "name": "Item name",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number 
        }
      ],
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFat": number,
      "healthierAlternatives": "Suggestions for healthier options"
    }

    If the image does NOT contain any food or beverages:
    {
      "containsFood": false ,
      "items": []
    }

    Ensure you return ONLY valid JSON with no additional text. Round nutritional values to whole numbers.`;

    try {
        const payload = {
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                    ],
                },
            ],
            max_tokens: 15000,
            temperature: 0.2,
        };

        const response = await axios.post(process.env.CHATGPT_API, payload, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const nutritionData = response.data.choices[0].message.content;
        
        return JSON.parse(nutritionData); // Ensure valid JSON is returned
    } catch (error) {
        console.error("ChatGPT API Error:", error.response?.data || error.message);
        return { containsFood: false };
    }
}

// Send message back to user
async function replyMessage(replyToken, text) {
    await axios.post(
        LINE_MESSAGING_API,
        {
            replyToken: replyToken,
            messages: [{ type: "text", text: text }],
        },
        { headers: LINE_HEADER }
    );
}
// Function to create a food analysis Flex Message with image
const createFoodAnalysisFlex = (analysisJson, imageUrl) => { 
    let foodData;
    
    try {
      // Try to parse the JSON
      foodData = typeof analysisJson === 'object' ? analysisJson : JSON.parse(analysisJson);
    } catch (error) { 
      logger.error("Failed to parse food analysis JSON:", error);
      return createErrorFlexMessage(
        "Analysis Error", 
        "There was an error analyzing the food. Please try again with a clearer photo."
      );
    }
    
    // Check if error occurred during analysis
    if (foodData.error) { 
      return createErrorFlexMessage(
        "Analysis Error", 
        foodData.message || "There was an error analyzing the food."
      );
    }
    
    // Check if no food was detected
    if (!foodData.containsFood) { 
      return createErrorFlexMessage(
        "No Food Detected", 
        "The image you sent doesn't appear to contain any food items."
      );
    }
    
    // Build food analysis Flex Message
    return { 
      type: "flex",
      altText: "Food Analysis Results",
      contents: { 
        type: "bubble",
        // Add hero image at the top
        hero: {
          type: "image",
          url: imageUrl,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover"
        },
        header: { 
          type: "box",
          layout: "vertical",
          contents: [
            { 
              type: "text",
              text: "Food Analysis",
              weight: "bold",
              size: "xl",
              color: "#ffffff"
            }
          ],
          backgroundColor: "#27ACB2"
        },
        body: { 
          type: "box",
          layout: "vertical",
          contents: [
            // Food Items section
            { 
              type: "text",
              text: "Food Items",
              weight: "bold",
              color: "#1DB446",
              size: "md"
            },
            // Items list (dynamically generated)
            ...foodData.items.map(item => ({ 
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                { 
                  type: "text",
                  text: item.name,
                  size: "sm",
                  color: "#555555",
                  flex: 5,
                  wrap: true 
                },
                { 
                  type: "text",
                  text: `${ item.calories } cal`,
                  size: "sm",
                  color: "#111111",
                  align: "end",
                  flex: 2 
                }
              ]
            })),
            // Total calories
            { 
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                { 
                  type: "text",
                  text: "Total Calories:",
                  size: "sm",
                  color: "#555555",
                  weight: "bold",
                  flex: 5 
                },
                { 
                  type: "text",
                  text: `${ foodData.totalCalories } cal`,
                  size: "sm",
                  color: "#111111",
                  weight: "bold",
                  align: "end",
                  flex: 2 
                }
              ]
            },
            // Separator
            { 
              type: "separator",
              margin: "xl"
            },
            // Nutrition section
            { 
              type: "text",
              text: "Nutrition",
              weight: "bold",
              color: "#1DB446",
              size: "md",
              margin: "xl"
            },
            // Nutrition values
            { 
              type: "box",
              layout: "vertical",
              margin: "md",
              contents: [
                { 
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { 
                      type: "text",
                      text: "Protein:",
                      size: "sm",
                      color: "#555555",
                      flex: 3 
                    },
                    { 
                      type: "text",
                      text: `${ foodData.totalProtein }g`,
                      size: "sm",
                      color: "#111111",
                      align: "end",
                      flex: 2 
                    }
                  ]
                },
                { 
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    { 
                      type: "text",
                      text: "Carbs:",
                      size: "sm",
                      color: "#555555",
                      flex: 3 
                    },
                    { 
                      type: "text",
                      text: `${ foodData.totalCarbs }g`,
                      size: "sm",
                      color: "#111111",
                      align: "end",
                      flex: 2 
                    }
                  ]
                },
                { 
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    { 
                      type: "text",
                      text: "Fat:",
                      size: "sm",
                      color: "#555555",
                      flex: 3 
                    },
                    { 
                      type: "text",
                      text: `${ foodData.totalFat }g`,
                      size: "sm",
                      color: "#111111",
                      align: "end",
                      flex: 2 
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: { 
          type: "box",
          layout: "vertical",
          contents: [
            { 
              type: "text",
              text: "Healthier Alternatives",
              weight: "bold",
              color: "#1DB446",
              size: "sm"
            },
            { 
              type: "text",
              text: foodData.healthierAlternatives || "No specific alternatives provided",
              wrap: true,
              size: "xs",
              margin: "md"
            },
            { 
              type: "button",
              action: { 
                type: "message",
                label: "Analyze Another Food",
                text: "Analyze food"
              },
              style: "primary",
              margin: "md"
            }
          ]
        },
        styles: { 
          footer: { 
            separator: true 
          }
        }
      }
    };
  };

  // Add image parameter to createErrorFlexMessage function (with a default value for when no image is provided)
const createErrorFlexMessage = (title, message, imageUrl = null) => { 
    const contents = {
      type: "bubble",
      body: { 
        type: "box",
        layout: "vertical",
        contents: [
          { 
            type: "text",
            text: title,
            weight: "bold",
            size: "xl",
            color: "#ff0000"
          },
          { 
            type: "text",
            text: message,
            wrap: true,
            margin: "md"
          }
        ]
      },
      footer: { 
        type: "box",
        layout: "vertical",
        contents: [
          { 
            type: "button",
            action: { 
              type: "message",
              label: "Try Again",
              text: "Analyze food"
            },
            style: "primary"
          }
        ]
      }
    };
  
    // Add the hero image if imageUrl is provided
    if (imageUrl) {
      contents.hero = {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover"
      };
    }
  
    return { 
      type: "flex",
      altText: title,
      contents: contents
    };
  };

// Deploy to Firebase
exports.lineBot = functions.https.onRequest(app);
