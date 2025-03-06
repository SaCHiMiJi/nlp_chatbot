require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const request = require("request");
const axios = require("axios");

const app = express();
app.use(express.json()); // Ensure JSON parsing for webhook events

// Load environment variables
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message";
const CHATGPT_API = "https://api.openai.com/v1/chat/completions";

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
                await handleImageMessage(event);
            }
        }
    }
    res.sendStatus(200);
});


const postToDialogflow = (req) => {
    req.headers.host = "bots.dialogflow.com";
    return request.post({
        uri: `https://bots.dialogflow.com/line/${process.env.DIALOGFLOW_AGENT_ID}/webhook`,
        headers: req.headers,
        body: JSON.stringify(req.body)
    });
};

async function handleTextMessage(event) {
    // Wrap the event into a request-like object
    const req = {
        headers: { "Content-Type": "application/json" },
        body: { events: [event] } // Sending event as request body
    };

    // Send message to Dialogflow
    postToDialogflow(req);
}

async function analyzeImageWithChatGPT(base64Image) {
    const prompt = `Analyze this image and respond(name and suggestion in Thai) with ONLY JSON in the following format:

    If the image contains food or beverages:
    <JSON_START>
    {
        "data" : {
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
    }
    <JSON_END>

    If the image does NOT contain any food or beverages:
    <JSON_START>
    {
        "data" : {
            "containsFood": false,
            "items": []
        }
    }
    <JSON_END>

    Ensure you return ONLY valid JSON with no additional text. Round nutritional values to whole numbers.`;

    try {
        const payload = {
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text : prompt },
                            { 
                            "type": "image_url",
                            image_url: {url: `data:image/jpeg;base64,${base64Image}` } 
                            },
                    ],
                },
            ],
            max_tokens: 15000,
            temperature: 0.2,
        };

        const response = await axios.post(CHATGPT_API, payload, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        });
        const jsonMatch = response.data.choices[0].message.content.match(/<JSON_START>([\s\S]*?)<JSON_END>/);
        if (jsonMatch) {
            const jsonString = jsonMatch[1].trim();
            const nutritionData = JSON.parse(jsonString);
            console.log(nutritionData);
            return nutritionData.data;
          } else {
            console.error('No valid JSON detected in response.');
            return [];
          }
        
    } catch (error) {
        console.error("ChatGPT API Error:", error.response?.data || error.message);
        return { containsFood: false };
    }
}
// Create a Flex Message for nutrition data
function createNutritionFlexMessage(data, imageUrl) {
    // If no food detected, return simple text message
    if (!data.containsFood || data.items.length === 0) {
        return "I couldn't identify any food in this image. Please try with a clearer photo of your meal.";
    }

    // Create contents for each food item
    const foodItemContents = data.items.map(item => {
        return {
            "type": "box",
            "layout": "vertical",
            "margin": "lg",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": item.name,
                    "weight": "bold",
                    "size": "lg",
                    "color": "#555555"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "Calories",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": `${item.calories} kcal`,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 4
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "Protein",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": `${item.protein}g`,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 4
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "Carbs",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": `${item.carbs}g`,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 4
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "Fat",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": `${item.fat}g`,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 4
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    });

    // Create total nutrition section
    const totalNutritionContent = {
        "type": "box",
        "layout": "vertical",
        "margin": "xxl",
        "contents": [
            {
                "type": "text",
                "text": "Total Nutrition",
                "weight": "bold",
                "size": "lg",
                "color": "#555555"
            },
            {
                "type": "box",
                "layout": "vertical",
                "margin": "sm",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "box",
                        "layout": "baseline",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Calories",
                                "color": "#aaaaaa",
                                "size": "sm",
                                "flex": 2
                            },
                            {
                                "type": "text",
                                "text": `${data.totalCalories} kcal`,
                                "wrap": true,
                                "color": "#666666",
                                "size": "sm",
                                "flex": 4,
                                "weight": "bold"
                            }
                        ]
                    },
                    {
                        "type": "box",
                        "layout": "baseline",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Protein",
                                "color": "#aaaaaa",
                                "size": "sm",
                                "flex": 2
                            },
                            {
                                "type": "text",
                                "text": `${data.totalProtein}g`,
                                "wrap": true,
                                "color": "#666666",
                                "size": "sm",
                                "flex": 4,
                                "weight": "bold"
                            }
                        ]
                    },
                    {
                        "type": "box",
                        "layout": "baseline",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Carbs",
                                "color": "#aaaaaa",
                                "size": "sm",
                                "flex": 2
                            },
                            {
                                "type": "text",
                                "text": `${data.totalCarbs}g`,
                                "wrap": true,
                                "color": "#666666",
                                "size": "sm",
                                "flex": 4,
                                "weight": "bold"
                            }
                        ]
                    },
                    {
                        "type": "box",
                        "layout": "baseline",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Fat",
                                "color": "#aaaaaa",
                                "size": "sm",
                                "flex": 2
                            },
                            {
                                "type": "text",
                                "text": `${data.totalFat}g`,
                                "wrap": true,
                                "color": "#666666",
                                "size": "sm",
                                "flex": 4,
                                "weight": "bold"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    // Add healthier alternatives if available
    const healthierAlternativesContent = data.healthierAlternatives ? {
        "type": "box",
        "layout": "vertical",
        "margin": "xxl",
        "contents": [
            {
                "type": "text",
                "text": "Healthier Alternatives",
                "weight": "bold",
                "size": "lg",
                "color": "#555555"
            },
            {
                "type": "text",
                "text": data.healthierAlternatives,
                "margin": "md",
                "wrap": true,
                "color": "#666666",
                "size": "sm"
            }
        ]
    } : null;

    // Combine all sections into contents array
    const contents = [...foodItemContents, totalNutritionContent];
    
    // Add healthier alternatives section if it exists
    if (healthierAlternativesContent) {
        contents.push(healthierAlternativesContent);
    }

    // Construct the complete Flex Message
    const flexMessage = {
        "type": "flex",
        "altText": "Nutrition Analysis",
        "contents": {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": imageUrl,
                "size": "full",
                "aspectRatio": "20:13",
                "aspectMode": "cover"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Food Nutrition Analysis",
                        "weight": "bold",
                        "color": "#1DB446",
                        "size": "xl"
                    },
                    {
                        "type": "separator",
                        "margin": "xxl"
                    },
                    ...contents,
                    {
                        "type": "separator",
                        "margin": "xxl"
                    }
                ]
            },
            "styles": {
                "footer": {
                    "separator": true
                }
            }
        }
    };

    return flexMessage;
}

// Update the handleImageMessage function to use Flex Messages
async function handleImageMessage(event) {
    try {
        // Get the content ID for later reference
        const contentId = event.message.id;
        const contentUrl = `${LINE_CONTENT_API}/${contentId}/content`;
        
        // Create a public image URL that can be displayed in Flex Message
        // LINE requires images in Flex Messages to be from https URLs
        // We'll use the LINE proxy to serve the image
        const publicImageUrl = `https://obs.line-apps.com/o/r/msg/${event.source.userId}/${contentId}`;

        // Fetch image as binary data for analysis
        const response = await axios.get(contentUrl, {
            headers: LINE_HEADER,
            responseType: "arraybuffer",
        });

        // Convert binary image to Base64
        const base64Image = Buffer.from(response.data).toString("base64");

        // Send image for nutrition analysis
        const nutritionData = await analyzeImageWithChatGPT(base64Image);
        
        // Create Flex Message from nutrition data and reply
        await replyMessage(event.replyToken, createNutritionFlexMessage(nutritionData, publicImageUrl));
    } catch (error) {
        console.error("Image Processing Error:", error);
        await replyMessage(event.replyToken, "Sorry, I couldn't process the image.");
    }
}

// Update replyMessage function to handle both text messages and Flex Messages
async function replyMessage(replyToken, message) {
    // Check if message is a string or an object
    let messages;
    
    if (typeof message === 'string') {
        // If it's a string, create a simple text message
        messages = [{ type: "text", text: message }];
    } else {
        // If it's an object, assume it's already properly formatted for LINE's API
        messages = [message];
    }
    
    // Send the message(s)
    await axios.post(
        LINE_MESSAGING_API,
        {
            replyToken: replyToken,
            messages: messages,
        },
        { headers: LINE_HEADER }
    );
}
// Send message back to user
/*async function replyMessage(replyToken, text) {
    await axios.post(
        LINE_MESSAGING_API,
        {
            replyToken: replyToken,
            messages: [{ type: "text", text: text }],
        },
        { headers: LINE_HEADER }
    );
}*/

// Deploy to Firebase
exports.lineBot = functions.https.onRequest(app);
