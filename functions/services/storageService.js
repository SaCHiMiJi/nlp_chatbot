// Service for interacting with Firebase Storage
const admin = require("firebase-admin");
const UUID = require("uuid-v4");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { STORAGE } = require("../config/constants");
const logger = require("../utils/logger");

/**
 * Save image data to a temporary file and upload to Firebase Storage
 * @param { Buffer } imageBuffer - Image data as a Buffer
 * @param { string } userId - LINE user ID (used for filename)
 * @param { string } [extension=jpg] - File extension
 * @returns { Promise<string>} - Public URL of the uploaded file
 */
const uploadImage = async (imageBuffer, userId, extension = "jpg") => {
  try {
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), `${userId}_${Date.now()}.${extension}`);
    fs.writeFileSync(tempFilePath, imageBuffer);
    
    logger.info(`Temporary file created at: ${tempFilePath}`);
    
    // Get the default bucket or specified bucket
    const bucket = admin.storage().bucket(STORAGE.BUCKET_NAME);
    const fileName = `${userId}.${extension}`;
    
    // Upload file to Firebase Storage
    await bucket.upload(tempFilePath, {
      destination: fileName,
      metadata: {
        contentType: `image/${extension}`,
        metadata: {
          firebaseStorageDownloadTokens: UUID()
        }
      }
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    logger.info(`Image uploaded to Firebase Storage: ${fileName}`);
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    return publicUrl;
  } catch (error) {
    logger.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
};

/**
 * Get a file from Firebase Storage
 * @param { string } filePath - Path to the file in the bucket
 * @returns { Promise<Buffer>} - File data as a Buffer
 */
const getFile = async (filePath) => {
  try {
    const bucket = admin.storage().bucket(STORAGE.BUCKET_NAME);
    const [file] = await bucket.file(filePath).download();
    
    logger.info(`File downloaded from Firebase Storage: ${filePath}`);
    
    return file;
  } catch (error) {
    logger.error(`Error retrieving file from Firebase Storage: ${filePath}`, error);
    throw error;
  }
};

module.exports = { 
  uploadImage,
  getFile 
};