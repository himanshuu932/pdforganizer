const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const folderPath = path.join(__dirname, 'uploads'); // Path to the folder containing files

app.use(cors()); // Enable CORS

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

// Start the server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
