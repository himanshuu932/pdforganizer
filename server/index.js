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

const folderPath = path.join(__dirname, 'uploads'); // Path to the folder containing files

app.use(cors()); // Enable CORS

// Ensure the uploads folder exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

// Endpoint to get a list of files
app.get('/files', (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Unable to fetch files');
    }
    res.json(files);
  });
});

// Serve static files with custom headers
app.get('/files/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(folderPath, fileName); // Resolve the full file path
  console.log('Request for file:', fileName); // Debugging log

  if (fs.existsSync(filePath)) {
    const fileExtension = path.extname(fileName).toLowerCase();

    // Check file type and set headers accordingly
    if (fileExtension === '.pdf') {
      res.sendFile(filePath); // Serve PDFs inline
    } else {
      // For non-PDF files, suggest opening in a new tab
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.sendFile(filePath);
    }
  } else {
    console.log('File not found:', filePath); // Debugging log
    res.status(404).send('File not found');
  }
});

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
  console.log(req.file.path);

  try {
    // Send request to Flask API to extract text from the file
    const response = await axios.post("http://127.0.0.1:5000/extract", {
      file_path: req.file.path,
    });

    // Get the extracted text from the response
    const extractedText = response.data.text;
    //const md = response.data.md;

    // Create a new TextData document for each upload
    const newTextData = new TextData({
      text: extractedText,
      filename: req.file.originalname,
      date: new Date(), // Add the current date and time
    });

   console.log(extractedText);
    //console.log(md);

    // Save the new TextData document
    await newTextData.save();

    res.status(200).json({
      message: "File uploaded and text extracted successfully",
      textData: newTextData,
    });
  } catch (error) {
    console.error("Error during file upload or text extraction:", error);
    res.status(500).send("Error uploading file or extracting text.");
  }
});

// Route to delete a file
app.delete('/files/:fileName', async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(folderPath, fileName); // Path to the file in storage

  try {
    // Check if the file exists in the storage folder
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found in storage" });
    }

    // Delete the file from the storage folder
    fs.unlinkSync(filePath);

    // Delete the corresponding document from the MongoDB collection
    const deletedDocument = await TextData.findOneAndDelete({ filename: fileName });

    if (!deletedDocument) {
      return res.status(404).json({ message: "File metadata not found in the database" });
    }

    res.status(200).json({ message: "File and metadata deleted successfully" });
  } catch (error) {
    console.error("Error during file deletion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

<<<<<<< HEAD
// Route to submit file and query
=======
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
        message: 'PDF processed and text extracted successfully.',
        text: extractedText,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      res.status(500).json({ message: `Error processing PDF: ${error}` });
    }
  });
  


>>>>>>> parent of 7765a70b (not full but document ai extracting texts)
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
