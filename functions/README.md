# Food Analysis LINE Bot - Firebase Functions

This project implements a LINE bot that analyzes food images using OpenAI's vision capabilities.

## Features

- Receive and process images from LINE
- Analyze food images using OpenAI's vision model
- Return detailed nutritional information in a visually appealing LINE Flex Message
- Integration with Dialogflow for handling text messages
- Upload images to Firebase Storage for auditing (optional)
- Clean, modular codebase with separation of concerns

## Project Structure

```
functions/
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Example environment variables
├── index.js                  # Main entry point
├── config/                   # Configuration files
├── controllers/              # Business logic
├── services/                 # External API integrations
├── routes/                   # API routes
├── utils/                    # Utility functions
└── middleware/               # Authentication and validation
```

## Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firebase Functions and Storage

2. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your credentials
   - Or set Firebase Functions config variables:
   ```bash
   firebase functions:config:set line.channel_access_token="YOUR_TOKEN" line.channel_secret="YOUR_SECRET" openai.api_key="YOUR_API_KEY"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Deploy to Firebase**
   ```bash
   firebase deploy --only functions
   ```

5. **Set up LINE webhook**
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Set the webhook URL to: `https://[YOUR_REGION]-[YOUR_PROJECT_ID].cloudfunctions.net/lineWebhook`
   - Enable webhooks and disable auto-reply messages

## Usage

- Send a photo of food to the LINE bot
- The bot will analyze the food and return nutritional information
- Users can also ask nutrition-related questions via text

## Development

- Run locally:
  ```bash
  npm run serve
  ```

- Test with LINE:
  - Use ngrok to expose your local server
  - Set LINE webhook to your ngrok URL

## Credits

- OpenAI for image analysis
- LINE Messaging API
- Firebase Functions and Storage
