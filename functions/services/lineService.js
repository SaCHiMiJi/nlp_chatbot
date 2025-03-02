// Service for interacting with LINE API
const axios = require("axios");
const { LINE } = require("../config/constants");
const logger = require("../utils/logger");

// LINE Headers for API requests
const LINE_HEADER = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${ LINE.CHANNEL_ACCESS_TOKEN }`
};

/**
 * Reply to a user with one or more messages
 * @param { string } replyToken - LINE reply token
 * @param { object|array } messages - Single message object or array of message objects
 * @returns { Promise } - Promise from the API call
 */
const reply = async (replyToken, messages) => { try { const messageArray = Array.isArray(messages) ? messages : [messages];
    
    logger.info(`Sending ${ messageArray.length } messages to replyToken: ${ replyToken }`);
    
    return await axios.post(
      `${ LINE.MESSAGING_API }/reply`,
      { replyToken: replyToken,
        messages: messageArray },
      { headers: LINE_HEADER }
    );
  } catch (error) { logger.error("Error replying to LINE message:", error);
    throw error;
  }
};

/**
 * Push a message to a user
 * @param { string } userId - LINE user ID
 * @param { object|array } messages - Single message object or array of message objects
 * @returns { Promise } - Promise from the API call
 */
const push = async (userId, messages) => { try { const messageArray = Array.isArray(messages) ? messages : [messages];
    
    logger.info(`Pushing ${ messageArray.length } messages to userId: ${ userId }`);
    
    return await axios.post(
      `${ LINE.MESSAGING_API }/push`,
      { to: userId,
        messages: messageArray },
      { headers: LINE_HEADER }
    );
  } catch (error) { logger.error("Error pushing LINE message:", error);
    throw error;
  }
};

/**
 * Get image content from LINE's Content API
 * @param { string } messageId - Message ID of the image
 * @returns { Promise<Buffer|null>} - Image data as a Buffer or null if error
 */
const getImage = async (messageId) => { try { logger.info(`Retrieving image with messageId: ${ messageId }`);
    
    const response = await axios.get(
      `${ LINE.CONTENT_API }/${ messageId }/content`,
      { headers: LINE_HEADER,
        responseType: "arraybuffer"
      }
    );
    
    if (response.status === 200) { logger.info(`Successfully retrieved image - Size: ${ response.data.length } bytes`);
      return response.data;
    } else { logger.error(`Failed to get image. Status: ${ response.status }`);
      return null;
    }
  } catch (error) { logger.error("Error retrieving LINE image:", error);
    return null;
  }
};

/**
 * Forward a request to Dialogflow
 * @param { object } req - Express request object
 * @returns { Promise } - Promise from the API call
 */
const forwardToDialogflow = async (req) => { try { const { AGENT_ID, WEBHOOK_URL } = require("../config/constants").DIALOGFLOW;
    
    // Copy headers but change host
    const headers = {
      ...req.headers,
      host: "bots.dialogflow.com"
    };
    
    logger.info(`Forwarding to Dialogflow agent: ${ AGENT_ID }`);
    
    return await axios.post(
      WEBHOOK_URL(AGENT_ID),
      req.body,
      { headers }
    );
  } catch (error) { logger.error("Error forwarding to Dialogflow:", error);
    throw error;
  }
};

module.exports = { reply,
  push,
  getImage,
  forwardToDialogflow };
