// cloudinaryService.js
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'your_cloud_name', // replace with your cloud name
  api_key: 'your_api_key',       // replace with your API key
  api_secret: 'your_api_secret', // replace with your API secret
});

/**
 * Upload an image file to Cloudinary.
 * @param {object} file - The file object from multer (in-memory storage).
 * @returns {Promise<object>} - Resolves with the Cloudinary upload result.
 */
const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'your_folder' }, // optional: set folder in Cloudinary
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = { uploadImage };
