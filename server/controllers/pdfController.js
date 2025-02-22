/**
 * pdfController.js
 * Controller for handling PDF processing, text extraction, and query submission.
 */
const credentialsJson = process.env.JSON;
const credentials = JSON.parse(credentialsJson);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const { google } = require('googleapis');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
require('dotenv').config();

const EventEmitter = require('events');
const queueEmitter = new EventEmitter();

// Import your Mongoose models (adjust the paths as needed)
const { TextData, User } = require('../models/text');

// Removed global drive variable

/**
 * Create a new Google Drive client instance using OAuth2 credentials.
 * @param {Object} creds - An object containing OAuth2 credentials.
 * @returns {Object} - A new instance of the Google Drive client.
 */
const initializeDrive = (creds) => {
  // Create a new OAuth2 client instance for each request.
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CALLBACK_URL2,
  );
  oauth2Client.setCredentials(creds);
  return google.drive({ version: "v3", auth: oauth2Client });
};

/**
 * Fetch a file from Google Drive by file ID using the provided drive instance.
 * @param {Object} drive - The Google Drive client instance.
 * @param {string} fileId - Google Drive file ID.
 * @returns {Promise<string>} - Resolves with the local file path of the downloaded file.
 */
const fetchFile = async (drive, fileId) => {
  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
      (err, response) => {
        if (err) {
          console.error("Error downloading file:", err);
          return reject(`Error downloading file with ID ${fileId}: ${err.message}`);
        }
        const destPath = path.join(__dirname, `downloaded-${fileId}.pdf`);
        const dest = fs.createWriteStream(destPath);
        response.data.pipe(dest);
        dest.on("finish", () => {
          console.log("File downloaded successfully!");
          resolve(destPath);
        });
        dest.on("error", (err) => {
          console.error("Error writing file:", err);
          reject(err);
        });
      }
    );
  });
};

// ... (the rest of your functions remain unchanged) ...

/**
 * Split a PDF into smaller chunks.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number} maxPages - Maximum number of pages per chunk (default is 5).
 * @returns {Promise<string[]>} - Resolves with an array of chunk file paths.
 */
const splitPdf = async (pdfPath, maxPages = 5) => {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const chunks = [];

  for (let i = 0; i < totalPages; i += maxPages) {
    const chunkDoc = await PDFDocument.create();
    const endPage = Math.min(i + maxPages, totalPages);

    for (let j = i; j < endPage; j++) {
      const [copiedPage] = await chunkDoc.copyPages(pdfDoc, [j]);
      chunkDoc.addPage(copiedPage);
    }

    const chunkBytes = await chunkDoc.save();
    const chunkPath = path.join(__dirname, `chunk_${Math.floor(i / maxPages) + 1}.pdf`);
    fs.writeFileSync(chunkPath, chunkBytes);
    chunks.push(chunkPath);
  }

  return chunks;
};

/**
 * Process a PDF file with Google Document AI.
 * @param {string} pdfPath - Path to the PDF file.
 * @returns {Promise<string>} - Resolves with the extracted text.
 */
const processPdfWithDocumentAI = async (pdfPath) => {
  const projectId = "inspiring-dryad-448710-v9"; // Replace with your project ID
  const location = "us"; // Replace with the location of your processor
  const processorId = "d9da5bdc2f8e5f4d"; // Replace with your processor ID

  const fileName = path.isAbsolute(pdfPath) ? pdfPath : path.join(__dirname, pdfPath);
  const fileContent = fs.readFileSync(fileName);
  const fileExtension = path.extname(pdfPath).toLowerCase();
  const supportedFormats = [".jpeg", ".jpg", ".png", ".bmp", ".pdf", ".tiff", ".tif", ".gif"];

  if (!supportedFormats.includes(fileExtension)) {
    console.error(`Unsupported file format: ${fileExtension}`);
    return "";
  }

  // Map file extensions to MIME types
  const mimeTypeMap = {
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".bmp": "image/bmp",
    ".pdf": "application/pdf",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
  };
  const mimeType = mimeTypeMap[fileExtension];

  // Initialize the Document AI client (add credentials if necessary)
  const client = new DocumentProcessorServiceClient({
    credentials: credentials,
  });

  const request = {
    name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
    rawDocument: {
      content: fileContent.toString("base64"),
      mimeType: mimeType,
    },
  };

  try {
    const [result] = await client.processDocument(request);
    const { document } = result;
    if (document && document.text) {
      console.log("Extracted text from PDF:");
      console.log(document.text);
      return document.text;
    } else {
      console.log("No text was extracted from the document.");
      return "";
    }
  } catch (error) {
    console.error("Error during Document AI processing:", error);
    throw error;
  }
};

/**
 * Retrieve an array of extracted texts for the current user.
 * @param {string} userId - The current user's ID.
 * @returns {Promise<string[]>} - Resolves with an array of text strings.
 */
const findtext = async (userId) => {
  try {
    const textDataDocs = await TextData.find({ user: userId });
    if (textDataDocs.length === 0) {
      throw new Error("No documents found for this user.");
    }
    return textDataDocs.map((doc) => doc.text.trim());
  } catch (error) {
    console.error("Error retrieving text array:", error);
    throw new Error(`Error retrieving text array: ${error.message}`);
  }
};

/**
 * Send the extracted texts to an external service.
 * @param {string} userId - The current user's ID.
 */
const store = async (userId) => {
  try {
    const texts = await findtext(userId);
    return texts;
  } catch (error) {
    console.error("Error during store operation:", error);
  }
};

// Global processing queue for PDF tasks
const processingQueue = []; // Array to hold tasks
let isProcessing = false; // Flag to indicate if processing is active

/**
 * Processes tasks in the queue one at a time.
 * If new tasks are added while processing, they are handled as well.
 */
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (processingQueue.length > 0) {
    // Each task now includes a drive instance.
    const { file, user, drive } = processingQueue.shift();

    try {
      // Check if this file has already been processed.
      const existingTextData = await TextData.findOne({ fileId: file.id });
      if (existingTextData) {
        console.log(`File ${file.name} already processed. Skipping.`);
        continue; // Skip to the next file.
      }

      // Download the PDF file from Google Drive using the provided drive instance.
      const pdfPath = await fetchFile(drive, file.id);

      // Split the PDF into chunks of max 5 pages.
      const chunkPaths = await splitPdf(pdfPath, 5);

      // Build header for the extracted text.
      const header = `filename-${file.name}\\nfileIdstarts-${file.id}-fileIdends\\n`;

      // Process each chunk concurrently.
      const chunkPromises = chunkPaths.map(async (chunkPath) => {
        try {
          const chunkText = await processPdfWithDocumentAI(chunkPath);
          // Delete the chunk file after processing.
          fs.unlink(chunkPath, (err) => {
            if (err) {
              console.error(`Error deleting chunk file ${chunkPath}:`, err);
            } else {
              console.log(`Chunk file deleted: ${chunkPath}`);
            }
          });
          return chunkText ? chunkText.replace(/\n/g, "\\n") + "\\n" : "";
        } catch (error) {
          console.error(`Error processing chunk ${chunkPath}:`, error);
          return "";
        }
      });

      // Wait for all chunk processing to complete concurrently.
      const chunkResults = await Promise.all(chunkPromises);
      const extractedText = header + chunkResults.join("") + "\n";

      // Save the extracted text to the database.
      const newTextData = new TextData({
        text: extractedText,
        filename: file.name,
        fileId: file.id,
        user: user.id,
      });
      await newTextData.save();

      console.log(`File ${file.name} processed successfully.`);
      
      // Delete the downloaded PDF file after processing.
      fs.unlink(pdfPath, (err) => {
        if (err) {
          console.error(`Error deleting downloaded file ${pdfPath}:`, err);
        } else {
          console.log(`Downloaded file deleted: ${pdfPath}`);
        }
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Optionally record the error in a log or database.
    }
  }

  isProcessing = false;
  queueEmitter.emit("empty");
}

function waitForQueueEmpty() {
  if (processingQueue.length === 0 && !isProcessing) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    queueEmitter.once("empty", () => {
      resolve();
    });
  });
}

/**
 * Adds an array of tasks to the global queue and triggers processing.
 * Each task is an object of the form { file, user, drive }.
 */
function addTasks(tasks) {
  tasks.forEach((task) => processingQueue.push(task));
  processQueue(); // Start processing if it isn’t already running.
}

router.post("/process-pdfs", async (req, res) => {
  // Ensure the user is authenticated via JWT.
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  const user = req.user;

  // Instead of reading credentials from the session, initialize using req.user tokens.
  if (!user.accessToken || !user.refreshToken) {
    return res.status(401).json({ message: "OAuth2 credentials not found in user token." });
  }
  // Create a drive instance specifically for this user.
  const driveInstance = initializeDrive({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  // Validate the incoming files.
  const files = req.body.files;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "No files provided." });
  }

  // Map each file to a task including the user context and drive instance.
  const tasks = files.map((file) => ({ file, user, drive: driveInstance }));

  // Add tasks to the global queue.
  addTasks(tasks);

  // Wait until the global queue becomes empty (i.e. all files are processed).
  await waitForQueueEmpty();

  // Optionally, update or retrieve stored texts.
  await store(user.id);

  // Send a response back to the client indicating success.
  res.json({
    status: 200,
    message: "PDF processed and text extracted successfully.",
  });
});

router.post("/submit-query", async (req, res) => {
  const { query } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  const user = req.user;
  try {
    const texts = await store(user.id);
    const dt = await run(query, texts);
    res.json({ ok: true, answer: dt });
    console.log("Response answer:", dt);
  } catch (error) {
    console.error("Error during query submission:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const pdfController = {
  initializeDrive,
  fetchFile,
  splitPdf,
  processPdfWithDocumentAI,
  findtext,
  store,
  router,
};

module.exports = pdfController;
