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

// Global variable for Google Drive client
let drive = null;

// Setup OAuth2 client for Google APIs
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL2,
);

/**
 * Initialize the Google Drive client using OAuth2 credentials.
 * @param {Object} creds - An object containing OAuth2 credentials.
 */
const initializeDrive = (creds) => {
  oauth2Client.setCredentials(creds);
  drive = google.drive({ version: "v3", auth: oauth2Client });
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
  systemInstruction:
    "I am Peep, an AI assistant developed by team Bludgers for document-based queries. Follow these strict guidelines:\n\n1. **Always answer from the provided document context** and append relevant sources at the end in this format:\n   `/ltkgya-sources <filename>.pdf /Ids <fileId>`  \n   Do not include `filename-uploads/` in sources.\n   \n2. **Mix text and tables** in responses. Tables must be enclosed between `table-starts` and `table-ends`.  \n   **Do NOT include `|---|` in tables.**  \n   Example:  table-starts Column1 | Column2 Value1 | Value2 table-ends\n   \n3. Maintain **consistency** across queries. If a new query lacks context, infer it from previous conversations.\n\n4. **Language Adaptation**: Respond in the language the user queries in.\n\n5. **Avoid Unnecessary Randomness**: Use a structured, deterministic response style.\n\n6. **For time-related queries**, provide real-time values in the user's timezone.\n\n7. **For weather queries**, mention the latest weather conditions in the user's preferred location.\n\n8. **General replies should be polite and well-structured.** When asked 'Who are you?', respond:  \n\"You are Peep. An assistant developed by team Bludgers for queries of PDFs.\"\n\n9. **While sending links**, ensure they are clickable and properly formatted.",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

async function run(query, texts) {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [{ text: "hi\n" }],
      },
      {
        role: "model",
        parts: texts.map((text) => ({ text })),
      },
      {
        role: "model",
        parts: [
          {
            text: "The user said \"hi\". This is a greeting and doesn't require information from any document.\nAccording to instruction 8, I need to respond politely.\nA simple greeting in response is appropriate.",
          },
          { text: "Hello there! How can I help you today?" },
        ],
      },
      {
        role: "user",
        parts: [{ text: "list files\n" },
          {text:"Filename | File ID\nlearner.pdf | 10jZcAVrGDOahZLhAIQGjReXY9j-iFhts\n Contract of Employment.pdf.pdf | 16DqOQPh176FVsOnFzbE7Z4LuPldGqC4s\n Contract of Employment.pdf | 1v0TyYBEkaYY6eTIEL4uypzqlBj0vimNa\nadhar.pdf | 1RCAysJktr4tx1gHY6AyquqSTlbRVoEyN\nalice-in-wonderland.pdf | 1Qtw0oPr0quLABYZ3YrJr6T6hR6-WqpmE\nalice-in-wonderland.pdf | 1_bvkJBEcJXp-qx_MxCnLHQiVt4AoqnxP\nchunk_1.pdf | 1ySuVIQUSlTKNHSR1qEdX2a55vWLKEPjA\nContract of Employment.pdf | 1IHdTK_xfEq4hwT6tdgYyahT2bGStsvgS\nContract of Employment.pdf.pdf | 1NA49YDm4azUrAIRXNxMNcd6S-VOyGwmb"},

        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "The user is asking about my identity. I should respond according to the persona instructions, specifically guideline #8.  I need to state my name, purpose and developer team as Peep.",
          },
          { text: "I am Peep. An assistant developed by team Bludgers for queries of PDFs." },
        ],
      },
      {
        role: "user",
        parts: [{ text: "what do you do\n" }],
      },
      {
        role: "model",
        parts: [
          {
            text: "The user is asking about my capabilities. I should explain that I can answer questions based on provided documents. I should also mention that I can provide sources for my answers.",
          },
          {
            text: "I am designed to answer your questions based on the information within the documents you provide. I can help you find specific details, summarise content, and more, all while citing the source documents.",
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "give a sample table\n" }],
      },
      {
        role: "model",
        parts: [
          {
            text: "The user asked for a sample table. I need to create a simple table example and format it according to the given instructions.  The instructions specify that tables should be enclosed in `table-starts` and `table-ends`, columns separated by `|`, and rows separated by newlines. Also, `|---|` should not be included.\n\nPlan:\n1. Create a simple table with two columns and two rows.\n2. Format the table using `table-starts`, `table-ends`, and `|` as separators.\n3. Present the table as the response.",
          },
          {
            text: "table-starts\nColumn1 | Column2\nValue1 | Value2\nValue3 | Value4\ntable-ends",
          },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(query);
  return result.response.text();
}

/**
 * Fetch a file from Google Drive by file ID.
 * @param {string} fileId - Google Drive file ID.
 * @returns {Promise<string>} - Resolves with the local file path of the downloaded file.
 */
const fetchFile = async (fileId) => {
  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
      (err, response) => {
        if (err) {
          console.error("Error downloading file:", err);
          return reject(`Error downloading file with ID ${fileId}: ${err.message}`);
        }
        const destPath = path.join(__dirname, "downloaded-file.pdf");
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

/**
 * Split a PDF into smaller chunks.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number} maxPages - Maximum number of pages per chunk (default is 15).
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
    const { file, user } = processingQueue.shift();

    try {
      // Check if this file has already been processed.
      const existingTextData = await TextData.findOne({ fileId: file.id });
      if (existingTextData) {
        console.log(`File ${file.name} already processed. Skipping.`);
        continue; // Skip to the next file.
      }

      // Download the PDF file from Google Drive.
      const pdfPath = await fetchFile(file.id);

      // Split the PDF into chunks.
      const chunkPaths = await splitPdf(pdfPath);

      // Begin constructing the extracted text with a header.
      let extractedText = `filename-${file.name}\\nfileIdstarts-${file.id}-fileIdends\\n`;

      // Process each chunk with Document AI.
      for (const chunkPath of chunkPaths) {
        const chunkText = await processPdfWithDocumentAI(chunkPath);
        if (chunkText) {
          // Replace newlines with the literal "\n" before appending.
          extractedText += chunkText.replace(/\n/g, "\\n") + "\\n";
        }
        // Delete the chunk file after processing.
        fs.unlink(chunkPath, (err) => {
          if (err) {
            console.error(`Error deleting chunk file ${chunkPath}:`, err);
          } else {
            console.log(`Chunk file deleted: ${chunkPath}`);
          }
        });
      }

      // Final formatting of the extracted text.
      extractedText = extractedText.replace(/\n/g, "\\n") + "\n";

      // Save the extracted text to the database.
      const newTextData = new TextData({
        text: extractedText,
        filename: file.name,
        fileId: file.id,
        user: user.id,
      });
      await newTextData.save();

      console.log(`File ${file.name} processed successfully.`);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Optionally, record the error in a log or database.
    }
  }
  const downloadedFilePath = path.join(__dirname, "downloaded-file.pdf");
  fs.unlink(downloadedFilePath, (err) => {
    if (err) {
      console.error(`Error deleting downloaded file:`, err);
    } else {
      console.log(`Downloaded file deleted: ${downloadedFilePath}`);
    }
  });
  // Processing is done; update the flag and emit an event.
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
 * Each task is an object of the form { file, user }.
 */
function addTasks(tasks) {
  tasks.forEach((task) => processingQueue.push(task));
  processQueue(); // Start processing if it isn’t already running.
}

// ----- ROUTE DEFINITION ----- //

/**
 * POST /process-pdfs
 *
 * Expects a JSON body with an array of file objects under the property "files".
 * Each file should have at least "id" and "name".
 *
 * The route adds the files to the global queue and waits until all are processed.
 * After processing, it calls store(user.id) and returns a 200 response.
 */
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
  initializeDrive({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  // Validate the incoming files.
  const files = req.body.files;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "No files provided." });
  }

  // Map each file to a task including the user context.
  const tasks = files.map((file) => ({ file, user }));

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
    res.json({ ok:true,answer: dt });
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
