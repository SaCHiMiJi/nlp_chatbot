// Configuration constants and environment variables
const functions = require("firebase-functions");

// You can access your Firebase config values using functions.config()
// Example: functions.config().line.channel_access_token
// Set these using: firebase functions:config:set line.channel_access_token="YOUR_TOKEN"

module.exports = { LINE: { CHANNEL_ACCESS_TOKEN: functions.config().line && functions.config().line.channel_access_token || process.env.LINE_CHANNEL_ACCESS_TOKEN,
    CHANNEL_SECRET: functions.config().line && functions.config().line.channel_secret || process.env.LINE_CHANNEL_SECRET,
    MESSAGING_API: "https://api.line.me/v2/bot/message",
    CONTENT_API: "https://api-data.line.me/v2/bot/message"
  },
  DIALOGFLOW: { AGENT_ID: functions.config().dialogflow && functions.config().dialogflow.agent_id || process.env.DIALOGFLOW_AGENT_ID,
    WEBHOOK_URL: (agentId) => `https://bots.dialogflow.com/line/${ agentId }/webhook`
  },
  OPENAI: { API_KEY: functions.config().openai && functions.config().openai.api_key || process.env.OPENAI_API_KEY,
    MODEL: functions.config().openai && functions.config().openai.model || "gpt-4o-mini"
  },
  STORAGE: { BUCKET_NAME: functions.config().storage && functions.config().storage.bucket || process.env.FIREBASE_STORAGE_BUCKET }
};
