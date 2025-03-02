// Logging utility
const functions = require("firebase-functions");

// Simple wrapper around Firebase Functions logger
const logger = { info: (message, data) => { if (data) { functions.logger.info(message, data);
    } else { functions.logger.info(message);
    }
  },
  
  error: (message, error) => { if (error) { functions.logger.error(message, error);
    } else { functions.logger.error(message);
    }
  },
  
  warn: (message, data) => { if (data) { functions.logger.warn(message, data);
    } else { functions.logger.warn(message);
    }
  },
  
  debug: (message, data) => { if (data) { functions.logger.debug(message, data);
    } else { functions.logger.debug(message);
    }
  }
};

module.exports = logger;
