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

// Import your Mongoose models (adjust the paths as needed)
const {TextData,User} = require('../models/text');
// Global variable for Google Drive client
let drive = null;
let tt;
// Setup OAuth2 client for Google APIs
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
);

/**
 * Initialize the Google Drive client using OAuth2 credentials from the session.
 * @param {Object} credentials - OAuth2 credentials (from req.session.oauth2Credentials).
 */
const initializeDrive = (credentials) => {
  oauth2Client.setCredentials(credentials);
  drive = google.drive({ version: "v3", auth: oauth2Client });
};






const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
  systemInstruction: "I am Peep, an AI assistant developed by team Bludgers for document-based queries. Follow these strict guidelines:\n\n1. **Always answer from the provided document context** and append relevant sources at the end in this format:\n   `/ltkgya-sources <filename>.pdf /Ids <fileId>`  \n   Do not include `filename-uploads/` in sources.\n   \n2. **Mix text and tables** in responses. Tables must be enclosed between `table-starts` and `table-ends`.  \n   **Do NOT include `|---|` in tables.**  \n   Example:  table-starts Column1 | Column2 Value1 | Value2 table-ends\n   \n3. Maintain **consistency** across queries. If a new query lacks context, infer it from previous conversations.\n\n4. **Language Adaptation**: Respond in the language the user queries in.\n\n5. **Avoid Unnecessary Randomness**: Use a structured, deterministic response style.\n\n6. **For time-related queries**, provide real-time values in the user's timezone.\n\n7. **For weather queries**, mention the latest weather conditions in the user's preferred location.\n\n8. **General replies should be polite and well-structured.** When asked 'Who are you?', respond:  \n\"You are Peep. An assistant developed by team Bludgers for queries of PDFs.\"\n\n9. **While sending links**, ensure they are clickable and properly formatted.",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

async function run(query,texts) {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {text: "hi\n"},
        ],
      },
      {
        role: "model",
        parts: texts.map((text) => ({text})),
      },
      {
        role: "model",
        parts: [
          {text: "The user said \"hi\". This is a greeting and doesn't require information from any document.\nAccording to instruction 8, I need to respond politely.\nA simple greeting in response is appropriate."},
          {text: "Hello there! How can I help you today?"},
        ],
      },
      {
        role: "user",
        parts: [
          {text: "who are you\n"},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "The user is asking about my identity. I should respond according to the persona instructions, specifically guideline #8.  I need to state my name, purpose and developer team as Peep."},
          {text: "I am Peep. An assistant developed by team Bludgers for queries of PDFs."},
        ],
      },
      {
        role: "user",
        parts: [
          {text: "what do you do\n"},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "The user is asking about my capabilities. I should explain that I can answer questions based on provided documents. I should also mention that I can provide sources for my answers."},
          {text: "I am designed to answer your questions based on the information within the documents you provide. I can help you find specific details, summarise content, and more, all while citing the source documents."},
        ],
      },
      {
        role: "user",
        parts: [
          {text: "give a sample table\n"},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "The user asked for a sample table. I need to create a simple table example and format it according to the given instructions.  The instructions specify that tables should be enclosed in `table-starts` and `table-ends`, columns separated by `|`, and rows separated by newlines. Also, `|---|` should not be included.\n\nPlan:\n1. Create a simple table with two columns and two rows.\n2. Format the table using `table-starts`, `table-ends`, and `|` as separators.\n3. Present the table as the response."},
          {text: "table-starts\nColumn1 | Column2\nValue1 | Value2\nValue3 | Value4\ntable-ends"},
        ],
      },
    ],
  });


  const result = await chatSession.sendMessage(query);
  return(result.response.text());
}



/**
 * Fetch a file from Google Drive by file ID.
 * @param {string} fileId - Google Drive file ID.
 * @returns {Promise<string>} - Resolves with the local file path of the downloaded file.
 */
const fetchFile = async (fileId) => {
  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' },
      (err, response) => {
        if (err) {
          console.error('Error downloading file:', err);
          return reject(`Error downloading file with ID ${fileId}: ${err.message}`);
        }
        const destPath = path.join(__dirname, 'downloaded-file.pdf');
        const dest = fs.createWriteStream(destPath);
        response.data.pipe(dest);
        dest.on('finish', () => {
          console.log('File downloaded successfully!');
          resolve(destPath);
        });
        dest.on('error', (err) => {
          console.error('Error writing file:', err);
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
const splitPdf = async (pdfPath, maxPages = 15) => {
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
  const projectId = 'inspiring-dryad-448710-v9'; // Replace with your project ID
  const location = 'us'; // Replace with the location of your processor
  const processorId = 'd9da5bdc2f8e5f4d'; // Replace with your processor ID

  const fileName = path.isAbsolute(pdfPath) ? pdfPath : path.join(__dirname, pdfPath);
  const fileContent = fs.readFileSync(fileName);
  const fileExtension = path.extname(pdfPath).toLowerCase();
  const supportedFormats = ['.jpeg', '.jpg', '.png', '.bmp', '.pdf', '.tiff', '.tif', '.gif'];

  if (!supportedFormats.includes(fileExtension)) {
    console.error(`Unsupported file format: ${fileExtension}`);
    return '';
  }

  // Map file extensions to MIME types
  const mimeTypeMap = {
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.bmp': 'image/bmp',
    '.pdf': 'application/pdf',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.gif': 'image/gif',
  };
  const mimeType = mimeTypeMap[fileExtension];

  // Initialize the Document AI client (add credentials if necessary)

  const client = new DocumentProcessorServiceClient({
        credentials: credentials,
    });

  const request = {
    name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
    rawDocument: {
      content: fileContent.toString('base64'),
      mimeType: mimeType,
    },
  };

  try {
    const [result] = await client.processDocument(request);
    const { document } = result;
    if (document && document.text) {
      console.log('Extracted text from PDF:');
      console.log(document.text);
      return document.text;
    } else {
      console.log('No text was extracted from the document.');
      return '';
    }
  } catch (error) {
    console.error('Error during Document AI processing:', error);
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
      throw new Error('No documents found for this user.');
    }
    return textDataDocs.map(doc => doc.text.trim());
  } catch (error) {
    console.error('Error retrieving text array:', error);
    throw new Error(`Error retrieving text array: ${error.message}`);
  }
};

/**
 * Send the extracted texts to an external service.
 * @param {string} userId - The current user's ID.
 */
const store = async (userId) => {
  try {
  texts = await findtext(userId);
  return texts;
  } catch (error) {
    console.error("Error during store operation:", error);
  }
};
router.get('/process-pdf', async (req, res) => {
  const { fileId, filename } = req.query;
  
  // Ensure OAuth2 credentials are available in the session.
  if (!req.session || !req.session.oauth2Credentials) {
    return res.status(401).json({ message: 'OAuth2 credentials not found in session.' });
  }
  // Initialize the Drive client.
  initializeDrive(req.session.oauth2Credentials);

  // Ensure the user is authenticated.
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }
  const user = req.user;

  if (!fileId) {
    return res.status(400).json({ message: 'File ID is required.' });
  }

  try {
    // Check if this file has already been processed.
    const existingTextData = await TextData.findOne({ fileId });
    if (existingTextData) {
      return res.json({
        message: 'PDF has already been processed and text extracted previously.',
        text: existingTextData.text,
      });
    }

    // Download the PDF file from Google Drive.
    const pdfPath = await fetchFile(fileId);

    // Split the PDF into chunks.
    const chunkPaths = await splitPdf(pdfPath);

    let extractedText = `filename-${filename}\\nfileIdstarts-${fileId}-fileIdends\\n`;

    // Process each chunk with Document AI.
    for (const chunkPath of chunkPaths) {
      const chunkText = await processPdfWithDocumentAI(chunkPath);
      if (chunkText) {
        extractedText += chunkText.replace(/\n/g, '\\n') + '\\n';
      }
      // Delete the chunk file after processing.
      fs.unlink(chunkPath, (err) => {
        if (err) {
          console.error(`Error deleting chunk file: ${chunkPath}`, err);
        } else {
          console.log(`Chunk file deleted: ${chunkPath}`);
        }
      });
    }

    extractedText = extractedText.replace(/\n/g, '\\n') + '\n';

    // Save the extracted text data.
    const newTextData = new TextData({
      text: extractedText,
      filename: filename,
      fileId: fileId,
      user: user._id,
    });
    await newTextData.save();

    store(user._id);

    res.json({
      message: 'PDF processed and text extracted successfully.',
      text: extractedText,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ message: `Error processing PDF: ${error}` });
  }
  finally{
    store(user._id);
  }
});

router.post('/submit-query', async (req, res) => {
  const { query } = req.body;
  
  
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }
  const user = req.user;
  try {
    
    const texts=await store(user._id);
    const dt=await run(query,texts);
    res.json({ answer:dt  });
    console.log('Response answer:', dt);
   } catch (error) {
     console.error('Error during query submission:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
