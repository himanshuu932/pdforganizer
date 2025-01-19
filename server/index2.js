const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");

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
});
const File = mongoose.model("File", fileSchema);

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

  const file = new File({
    name: req.file.originalname,
    path: req.file.path,
  });

  try {
    const savedFile = await file.save();
    res.status(200).json({
      message: "File uploaded successfully",
      file: savedFile,
    });
    console.log("File saved:", savedFile.path);
  } catch (err) {
    console.error("Error saving file metadata:", err);
    res.status(500).send("Error saving file metadata.");
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
