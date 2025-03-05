require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");
const request = require("request-promise");

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
                await replyMessage(event.replyToken, "โปรดรอสักกครู่");
                await handleImageMessage(event);
            }
        }
    }
    res.sendStatus(200);
});
const postToDialogflow = (req) => {
    req.headers.host = "bots.dialogflow.com";
    return request.post({
        uri: `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/d5bd37fa-b1b3-4f88-b265-8b49ca6015ea`,
        headers: req.headers,
        body: JSON.stringify(req.body)
    });
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
        
        // Reply with nutrition info
        await replyMessage(event.replyToken, createFlexMessage(chatGptResponse, imageUrl));
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
// Function to create a Flex Message JSON
function createFlexMessage(nutritionText, imageUrl) {
    return {
        type: "flex",
        altText: "Nutrition Analysis",
        contents: {
            type: "bubble",
            hero: {
                type: "image",
                url: imageUrl,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover"
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "Nutrition Analysis", weight: "bold", size: "lg" },
                    { type: "text", text: nutritionText, wrap: true, size: "sm", color: "#666666" }
                ]
            }
        }
    };
}

// Deploy to Firebase
exports.lineBot = functions.https.onRequest(app);
