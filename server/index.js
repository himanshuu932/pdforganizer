const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const multer = require("multer");
const {TextData,User} = require('./models/text');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { google } = require("googleapis");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const allowedOrigins = [
  "https://iridescent-raindrop-1c2f36.netlify.app/",
  "http://localhost:3000", // Include local development origins if needed
 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, 
  })
);

const credentialsJson = process.env.JSON;
const credentials = JSON.parse(credentialsJson);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Enable JSON parsingy
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: 'your-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'None', // Allow cross-origin cookies
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
// User Schema

let Usergoogleid='';
// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://pdforganizer.vercel.app/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔄 Google Profile Received:", profile.displayName);
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      Usergoogleid=existingUser.googleId;
      console.log("✅ User found:", existingUser.name);
      store();
      return done(null, existingUser);
    }
    const newUser = await User.create({ googleId: profile.id, name: profile.displayName });
    Usergoogleid=profile.id;
    store();
    console.log("✅ New User Created:", newUser.name);
    done(null, newUser);
  } catch (error) {
    console.error("❌ Error in Google Strategy:", error);
    done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id).then(user => done(null, user)).catch(err => done(err, null));
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "https://www.googleapis.com/auth/drive.file"] }));

app.get( "/auth/google/callback",passport.authenticate("google", { failureRedirect: "/" }),(req, res) => {
    if (req.user) {
      console.log("✅ Login Successful:", req.user.name);

      // Encode the username to include it in the redirect URL
      const encodedUsername = encodeURIComponent(req.user.name);

      // Redirect to the frontend with the encoded username in the query string
      res.redirect(`https://iridescent-raindrop-1c2f36.netlify.app/?username=${encodedUsername}`);
    } else {
      console.error("❌ Authentication failed");
      res.redirect("/");
    }
  }
);

// Google Drive File Upload Route
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,"https://pdforganizer.vercel.app/oauth2callback");

app.get("/connect-drive", (req, res) => {
  const redirectUri = req.query.redirectUri;
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: encodeURIComponent(redirectUri), // Include the redirectUri in the state
  });
  console.log("🔗 Auth URL:", authUrl);
  res.redirect(authUrl);
});
let drive
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const redirectUri = decodeURIComponent(req.query.state); // Extract the redirectUri from the state
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    drive = google.drive({ version: "v3", auth: oauth2Client });
    res.redirect(`${redirectUri}&status=success&message=Connected to Google Drive successfully.`);
  } catch (error) {
    console.error("Error during OAuth callback:", error.message);
    res.redirect(`${redirectUri}&status=failure&message=Failed to connect to Google Drive.`);
  }
});

// User Routes
app.get("/api/current_user", (req, res) => {
  res.json(req.user || null);
});

app.get("/api/logout", (req, res) => {
  // First, send the success response to the client
  res.json({ message: "OK" });

  // Then, destroy the session after the response is sent
 
});




// Endpoint to get a list of files
app.get("/api/files", async (req, res) => {
  const folderLink = req.query.folderLink;
  const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];

  if (!folderId) {
    return res.status(400).json({ message: "Invalid folder link." });
  }

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      pageSize: 100,
      fields: "files(id, name, webViewLink, webContentLink)",
    });
    console.log(response.data.files[0]?.webContentLink);
    console.log(response.data.files[0]?.webViewLink);
    const files = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      link: file.webViewLink,

    }));

    res.json({ files, message: "Files fetched successfully." });
  } catch (error) {
    console.error("Error listing files from Google Drive:", error.message);
    res.status(500).json({ message: "Failed to fetch files from Google Drive." });
  }
});
const { Readable } = require('stream'); // Import Readable

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const { folderLink } = req.body; // Retrieve the folder link from the request body
  if (!folderLink) return res.status(400).send("Folder link not provided");

  // Extract the folder ID from the folder link
  const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
  if (!folderId) return res.status(400).send("Invalid folder link");

  try {
    const { originalname, mimetype, buffer } = req.file;

    const fileMetadata = {
      name: originalname,
      parents: [folderId], // Set the folder ID as the parent
    };

    // Convert the buffer to a readable stream
    const media = {
      mimeType: mimetype,
      body: Readable.from(buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink',
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: { id: file.data.id, name: file.data.name, link: file.data.webViewLink },
    });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).send("Error uploading file to Google Drive");
  }
});

app.delete('/delete', async (req, res) => {
  const { fileIds, folderLink } = req.body; // Expecting file IDs and folder link in the request body

  if (!folderLink) return res.status(400).send("Folder link not provided");

  // Extract the folder ID from the folder link
  const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
  if (!folderId) return res.status(400).send("Invalid folder link");

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: "No file IDs provided or invalid format" });
  }

  try {
    const deletionResults = await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          // Optionally, you can verify the file's parent matches the folder ID
          const file = await drive.files.get({ fileId, fields: 'parents' });
          if (!file.data.parents.includes(folderId)) {
            return { fileId, status: "error", message: "File not in specified folder" };
          }

          // Delete the file from Google Drive
          await drive.files.delete({ fileId });

          // Delete the corresponding TextData entry from MongoDB
          await TextData.deleteOne({ fileId });

          return { fileId, status: "success" };
        } catch (err) {
          console.error(`Error deleting file with ID ${fileId}:`, err.message);
          return { fileId, status: "error", message: err.message };
        }
      })
    );

    res.status(200).json({
      message: "Deletion process completed",
      results: deletionResults,
    });
  } catch (err) {
    console.error("Error during bulk deletion:", err.message);
    res.status(500).send("Error deleting files from Google Drive and MongoDB");
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "https://www.googleapis.com/auth/drive.file"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  if (req.user) {
    res.redirect("https://iridescent-raindrop-1c2f36.netlify.app/");
  } else {
    res.redirect("/");
  }
});

// Download file from Google Drive

const auth = new google.auth.GoogleAuth({
     credentials: credentials,  // Use the path to your credentials
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

 
  // Function to fetch file from Google Drive
const fetchFile = async (fileId) => {
    const drive1 = google.drive({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      drive1.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' },
        (err, res) => {
          if (err) {
            console.error('Error downloading file:', err); // More detailed error logging
            return reject(`Error downloading file with ID ${fileId}: ${err.message}`);
          }
  
          const dest = fs.createWriteStream(path.join(__dirname, 'downloaded-file.pdf'));
          res.data.pipe(dest);
          dest.on('finish', () => {
            console.log('File downloaded successfully!');
            resolve(path.join(__dirname, 'downloaded-file.pdf')); // Resolve with the file path
          });
          dest.on('error', (err) => {
            console.error('Error writing file:', err); // Log error if file writing fails
            reject(err);
          });
        }
      );
    });
  };
  
const { PDFDocument } = require('pdf-lib');


const splitPdf = async (pdfPath, maxPages = 15) => {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const totalPages = pdfDoc.getPageCount();
  const chunks = [];

  for (let i = 0; i < totalPages; i += maxPages) {
    const chunk = await PDFDocument.create();
    const endPage = Math.min(i + maxPages, totalPages);

    for (let j = i; j < endPage; j++) {
      const [copiedPage] = await chunk.copyPages(pdfDoc, [j]);
      chunk.addPage(copiedPage);
    }

    const chunkBytes = await chunk.save();

    // Fix the file path by using the correct path without duplication
    const chunkPath = path.join( `./chunk_${Math.floor(i / maxPages) + 1}.pdf`);
    fs.writeFileSync(chunkPath, chunkBytes);
    chunks.push(chunkPath);
  }

  return chunks;
};


// Usage

// Use Vision API to analyze PDF and extract text
  const {DocumentProcessorServiceClient} = require('@google-cloud/documentai');

  
  // Create a client
  const client = new DocumentProcessorServiceClient({
    credentials: credentials,
  });
  
  const processPdfWithDocumentAI = async (pdfPath) => {
    const projectId = 'inspiring-dryad-448710-v9'; // Replace with your project ID
    const location = 'us'; // Replace with the location of your processor
    const processorId = 'd9da5bdc2f8e5f4d'; // Replace with your processor ID
  
    const fileName = path.join(__dirname, pdfPath);
    const fileContent = fs.readFileSync(fileName);
 //   const fileName = path.join(__dirname, filePath);
  const fileExtension = path.extname(pdfPath).toLowerCase(); 
    const supportedFormats = ['.jpeg', '.jpg', '.png', '.bmp', '.pdf', '.tiff', '.tif', '.gif'];

  if (!supportedFormats.includes(fileExtension)) {
    console.error(`Unsupported file format: ${fileExtension}`);
    return;
  }

  //const fileContent = fs.readFileSync(fileName);

  // Determine MIME type based on file extension
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

  const request = {
    name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
    rawDocument: {
      content: fileContent.toString('base64'), // Convert file content to base64
      mimeType: mimeType,
    },
  };
  
    try {
      const [result] = await client.processDocument(request);
      const {document} = result;
  
      if (document && document.text) {
        console.log('Extracted text from PDF:');
        console.log(document.text);
        return(document.text);

      } else {
        console.log('No text was extracted from the document.');
      }
    } catch (error) {
      console.error('Error during Document AI processing:', error);
    }
  };
  
  // Route to handle PDF processing and text extraction
  app.get('/process-pdf', async (req, res) => {
    const { fileId, filename } = req.query;
  
    if (!fileId) {
      return res.status(400).json({ message: 'File ID and User Google ID are required.' });
    }
  
    try {
      // Check if the user exists in the database
      const user = await User.findOne({ googleId: Usergoogleid });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Check if the TextData with the same fileId already exists in the database
      const existingTextData = await TextData.findOne({ fileId });
  
      if (existingTextData) {
        // If the fileId already exists, return a message without extracting
        return res.json({
          message: 'PDF has already been processed and text extracted previously.',
          text: existingTextData.text,
        });
      }
  
      // Fetch the PDF file from Google Drive
      const pdfPath = await fetchFile(fileId);
  
      // Split the PDF into smaller chunks (15 pages or fewer)
      const chunkPaths = await splitPdf('./downloaded-file.pdf');
  
      let extractedText = `filename-${filename}\\nfileIdstarts-${fileId}-fileIdends\\n`;
  
      for (let chunkPath of chunkPaths) {
        // Analyze the chunk with Document AI
        const chunkText = await processPdfWithDocumentAI(chunkPath);
        extractedText += chunkText.replace(/\n/g, '\\n') + '\\n';
  
        // Delete the chunk file after processing it
        fs.unlink(chunkPath, (err) => {
          if (err) {
            console.error(`Error deleting chunk file: ${chunkPath}`, err);
          } else {
            console.log(`Chunk file deleted: ${chunkPath}`);
          }
        });
      }
  
      // Final processed text (with proper newlines replaced)
      extractedText = extractedText.replace(/\n/g, '\\n') + '\n';
  
      // Create new TextData document with a reference to the user
      const newTextData = new TextData({
        text: extractedText,
        filename: req.query.filename, // Use the filename from query params
        fileId: fileId,
        user: user._id, // Reference the user
      });
  
      // Save the new TextData document
      await newTextData.save();
  
      // Send the response with the combined extracted text
      res.json({
        message: 'PDF processed and text extracted successfully.',
        text: extractedText,
      });
  
    } catch (error) {
      console.error('Error processing PDF:', error);
      res.status(500).json({ message: `Error processing PDF: ${error}` });
    }
    finally{
      store();
    }
  });


// Function to extract and return an array of text from all documents
async function findtext() {
  try {
      // Find the user by Google ID
      const user = await User.findOne({ googleId: Usergoogleid });

      if (!user) {
          throw new Error('User not found.');
      }

      // Retrieve all TextData documents where the user field matches the user's ID
      const textDataDocs = await TextData.find({ user: user._id });

      if (textDataDocs.length === 0) {
          throw new Error('No documents found for this user.');
      }

      // Map over the documents to extract and return the text as an array
      const textArray = textDataDocs.map(doc => doc.text.trim()); // Trim any extra spaces or newlines

      return textArray; // Return the array of strings

  } catch (error) {
      console.error('Error retrieving text array:', error);
      throw new Error(`Error retrieving text array: ${error.message}`);
  }
}

  




const store = async () => {
  try {
    const textDataArray = await TextData.find();
    if (textDataArray.length === 0) {
      console.log("No files in the storage");
      return;
    }

    const texts =await  findtext();
   
    axios.post('http://pythonpdf.vercel.app/store-texts', {
      texts: texts,
  }, {
      headers: {
          'Content-Type': 'application/json'
      }
  });
  
    
  } catch (error) {
    console.error("Error during store operation:", error);
  }
};

app.post('/submit-query', async (req, res) => {
  const { query } = req.body;
  console.log(query);
  store();
  try {
    
    const response = await axios.post('http://pythonpdf.vercel.app/pdf-query', {
      query: query,
      
    });

    // Return the response from the Flask API to the client
    res.json({ answer: response.data.answer });
    console.log(response.data.answer);
  } catch (error) {
    console.error('Error during API call or text retrieval:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  


app.listen(port, () => {
  console.log(`Node.js server running at http://localhost:${port}`);
 
});
