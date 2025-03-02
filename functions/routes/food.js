// Express router for food analysis API
const express = require("express");
const router = express.Router();
const multer = require("multer");
const os = require("os");
const imageController = require("../controllers/imageController");
const logger = require("../utils/logger");

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Analyze food from a direct file upload
router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    logger.info("Received request to analyze food from uploaded image");
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided"
      });
    }
    
    // Process the uploaded image
    const imageBuffer = req.file.buffer 
      ? req.file.buffer 
      : require("fs").readFileSync(req.file.path);
    
    const result = await imageController.processDirectImage(imageBuffer);
    
    // Clean up the temp file if it exists
    if (req.file.path) {
      require("fs").unlinkSync(req.file.path);
    }
    
    return res.json(result);
  } catch (error) {
    logger.error("Error analyzing uploaded food image:", error);
    
    return res.status(500).json({
      success: false,
      error: "Failed to analyze food image",
      message: error.message
    });
  }
});

// Analyze food from a LINE message ID
router.post("/analyze-line", async (req, res) => {
  try {
    logger.info("Received request to analyze food from LINE message ID");
    
    const { messageId, userId } = req.body;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: "No message ID provided"
      });
    }
    
    // Process the LINE message
    const result = await imageController.processLineImage(messageId, userId);
    
    return res.json(result);
  } catch (error) {
    logger.error("Error analyzing LINE food image:", error);
    
    return res.status(500).json({
      success: false,
      error: "Failed to analyze LINE food image",
      message: error.message
    });
  }
});

module.exports = router;