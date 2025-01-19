const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Import cors
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const multer = require("multer");
const TextData = require('./models/text');


// Enable CORS for all routes
app.use(cors());  // This will allow cross-origin requests from any domain

// Enable JSON parsing
app.use(express.json());
// MongoDB connection
mongoose.connect("mongodb+srv://himanshuu932:88087408601@cluster0.lu2g8bw.mongodb.net/pdforganizer?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Define a schema for storing file metadata

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Save files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});
const upload = multer({ storage });

// Endpoint for file upload
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  try {
    // Send request to Flask API to extract text from the file
    const response = await axios.post('http://127.0.0.1:5000/extract', {
      file_path: req.file.path
    });

    // Get the extracted text from the response
    const extractedText = response.data.text;

    // Check if TextData document exists; if not, create a new one
    let textData = await TextData.findOne();
    if (!textData) {
      textData = new TextData({ texts: [] }); // Create new document if none exists
    }

    // Add the extracted text to the array
    textData.texts.push(extractedText);

    // Save the updated TextData document
    await textData.save();

    res.status(200).json({
      message: "File uploaded and text extracted successfully",
      textData: textData,
    });
  } catch (error) {
    console.error("Error during file upload or text extraction:", error);
    res.status(500).send("Error uploading file or extracting text.");
  }
});


// Route to submit file and query

app.post('/submit-query', async (req, res) => {
  const { query } = req.body;
   console.log(query)
;  try {
    // Fetch the global array of texts
    const textData = await TextData.findOne();
    if (!textData) {
      return res.status(404).send("No text data found.");
    }

    // Extract the texts array from the global collection
    const texts = textData.texts;
    //console.log(texts)
    // Send request to Flask API with the query and texts array
    const response = await axios.post('http://127.0.0.1:5000/pdf-query', {
      query: query,
      texts: texts
    });

    // Return the response from the Flask API to the client
    res.json({ answer: response.data.answer });
    console.log(response.data.answer)
  } catch (error) {
    console.error('Error during API call or text retrieval:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Node.js server running at http://localhost:${port}`);
});
