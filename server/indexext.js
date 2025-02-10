const fetchFile = async (fileId) => {
    
    return new Promise((resolve, reject) => {
      drive.files.get(
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

const {DocumentProcessorServiceClient} = require('@google-cloud/documentai');
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
