const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb+srv://himanshuu932:88087408601@cluster0.lu2g8bw.mongodb.net/pdforganizer?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Define a schema for storing file metadata
const fileSchema = new mongoose.Schema({
  name: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
  extractedText: String,
});
const File = mongoose.model("File", fileSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Save files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Function to extract text from PDF
async function extractTextFromPDF(pdfPath) {
  try {
    // Read the PDF file as a buffer
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Parse the PDF and extract text
    const data = await pdfParse(pdfBuffer);
    console.log("Extracted Text: ", data.text); // Log extracted text for debugging
    return data.text; // The extracted text
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "Error extracting text."; // Return error message if extraction fails
  }
}

// Endpoint for file upload
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  // Extract text from the uploaded PDF
  const pdfPath = req.file.path;
  const extractedText = await extractTextFromPDF(pdfPath); // Extract text

  const file = new File({
    name: req.file.originalname,
    path: req.file.path,
    extractedText: extractedText, // Save extracted text to MongoDB
  });

  try {
    const savedFile = await file.save();
    console.log("File saved:", extractedText); // Log saved file details
    res.status(200).json({
      message: "File uploaded successfully",
      file: savedFile,
      extractedText: extractedText, // Return the extracted text
    });
  } catch (err) {
    console.error("Error saving file metadata:", err);
    res.status(500).send("Error saving file metadata.");
  }
});

// Fetch uploaded files (for reference)
app.get("/files", async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).send("Error retrieving files.");
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
