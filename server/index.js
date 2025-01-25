const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const multer = require("multer");
const TextData = require('./models/text');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { google } = require("googleapis");
const cookieParser = require("cookie-parser");
const vision = require('@google-cloud/vision');
const pdfToPng = require('pdf-to-png-converter');

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Enable JSON parsing
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
// User Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
});
const User = mongoose.model("User", userSchema);

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔄 Google Profile Received:", profile.displayName);
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      console.log("✅ User found:", existingUser.name);
      return done(null, existingUser);
    }
    const newUser = await User.create({ googleId: profile.id, name: profile.displayName });
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

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  if (req.user) {
    console.log("✅ Login Successful:", req.user.name);
    res.redirect("http://localhost:3000");
  } else {
    console.error("❌ Authentication failed");
    res.redirect("/");
  }
});

// Google Drive File Upload Route
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.CALLBACK_URL);

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
    res.redirect(`${redirectUri}?status=success&message=Connected to Google Drive successfully.`);
  } catch (error) {
    console.error("Error during OAuth callback:", error.message);
    res.redirect(`${redirectUri}?status=failure&message=Failed to connect to Google Drive.`);
  }
});

// User Routes
app.get("/api/current_user", (req, res) => {
  res.json(req.user || null);
});

app.get("/api/logout", (req, res) => {
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout Error" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destroy error" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "OK" });
      });
    });
  } else {
    res.status(400).json({ message: "No user logged in" });
  }
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

          await drive.files.delete({ fileId });
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
    res.status(500).send("Error deleting files from Google Drive");
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "https://www.googleapis.com/auth/drive.file"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  if (req.user) {
    res.redirect("http://localhost:3000");
  } else {
    res.redirect("/");
  }
});

// Download file from Google Drive

const auth = new google.auth.GoogleAuth({
    keyFile: './okk.json',  // Use the path to your credentials
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
  
  // Use Vision API to analyze PDF and extract text
  const {DocumentProcessorServiceClient} = require('@google-cloud/documentai');

  
  // Create a client
  const client = new DocumentProcessorServiceClient({
    keyFilename: 'ok.json',
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
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required.' });
    }
  
    try {
      // Fetch the PDF file from Google Drive
      const pdfPath = await fetchFile(fileId);
  
      // Analyze the PDF with Vision API
      const extractedText = await processPdfWithDocumentAI('./downloaded-file.pdf');
  
      // Send response
      res.json({
        message: 'PDF processed and text extracted successfully.ok',
        text: extractedText,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      res.status(500).json({ message: `Error processing PDF: ${error}` });
    }
  });
  


app.post('/submit-query', async (req, res) => {
  const { query } = req.body;
  console.log(query);

  try {
    // Fetch all objects (documents) in the TextData collection
    const textDataArray = await TextData.find(); // Retrieve all documents

    if (textDataArray.length === 0) {
      return res.json({ answer: "No files in the storage" });
    }

    // Extract the text field from each document in the collection
    const texts = textDataArray.map((doc) => doc.text);
  
    // Send request to Flask API with the query and texts array
    const response = await axios.post('http://127.0.0.1:5000/pdf-query', {
      query: query,
      texts: texts,
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