// services/localStorageService.js
const fs = require('fs');
const path = require('path');

/**
 * Saves a PDF buffer to a local folder.
 * @param {Buffer} pdfBuffer - The PDF file buffer.
 * @param {string} filename - The filename to use (e.g., 'bill_<saleId>.pdf').
 * @param {string} folder - The folder where the file will be saved (default: './billing').
 * @returns {Promise<string>} - Resolves with the full file path.
 */
async function savePdfLocally(pdfBuffer, filename, folder = './billing') {
  // Ensure the folder exists; if not, create it
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const filePath = path.join(folder, filename);
  await fs.promises.writeFile(filePath, pdfBuffer);
  return filePath;
}

module.exports=  savePdfLocally ;
