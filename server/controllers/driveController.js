const { google } = require("googleapis");
const { PDFDocument } = require("pdf-lib");
const { Readable } = require("stream");
const { TextData } = require("../models/text");
let drive='';
const driveController = {
  // Function to list files from Google Drive
  getFiles: async (req, res) => {
    // Check if JWT authentication populated req.user
    if (req.user) {
      try {
        // Create a new OAuth2 client and set credentials from req.user
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.CALLBACK_URL2,
        );
        oauth2Client.setCredentials({
          access_token: req.user.accessToken,
          refresh_token: req.user.refreshToken,
        });
  
        // Create drive instance
        const drive = google.drive({ version: "v3", auth: oauth2Client });
  
        const folderLink = req.query.folderLink;
        const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
  
        if (!folderId) {
          return res.status(400).json({ message: "Invalid folder link." });
        }
  
        try {
          // List files within the folder
          const response = await drive.files.list({
            q: `'${folderId}' in parents`,
            pageSize: 100,
            fields:
              "files(id, name, webViewLink, webContentLink, createdTime, modifiedTime, size, parents)",
          });
  
          let folderName = "";
          
          // Map the response and also send size (parsed as a number if available)
          const files = response.data.files.map((file) => ({
            id: file.id,
            name: file.name,
            link: file.webViewLink,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            size: file.size ? parseInt(file.size, 10) : null,
          }));
  
          res.json({
            folderName,
            files,
            message: "Files fetched successfully.",
          });
        } catch (error) {
          console.error(
            "Error fetching folder data from Google Drive:",
            error.message
          );
          res
            .status(500)
            .json({ message: "Failed to fetch folder data from Google Drive." });
        }
      } catch (error) {
        console.error("❌ Error listing files:", error);
        res.status(500).json({ message: "Error listing files", error });
      }
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  },
  

  // Function to upload a file to Google Drive
  uploadFile: async (req, res) => {
    console.log("📤 Uploading file to Google Drive...");
  
    if (!req.user) {
      console.error("❌ User not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
  
    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).send("No file uploaded");
    }
  
    const { folderLink } = req.body;
    console.log("📂 Folder Link received:", folderLink);
  
    if (!folderLink) {
      console.error("❌ Folder link not provided");
      return res.status(400).send("Folder link not provided");
    }
  
    const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
    console.log("🆔 Extracted Folder ID:", folderId);
  
    if (!folderId) {
      console.error("❌ Invalid folder link");
      return res.status(400).send("Invalid folder link");
    }
  
    try {
     
      
  
      const { originalname, mimetype, buffer } = req.file;
      console.log("📄 File Details - Name:", originalname, "| Type:", mimetype);
  
      const fileMetadata = { name: originalname, parents: [folderId] };
      const media = { mimeType: mimetype, body: Readable.from(buffer) };
  
      console.log("⏳ Uploading file to Google Drive...");
      const file = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, webViewLink",
      });
  
      console.log("✅ File uploaded successfully:", file.data);
  
      res.status(200).json({
        message: "File uploaded successfully",
        file: { id: file.data.id, name: file.data.name, link: file.data.webViewLink },
      });
    } catch (error) {
      console.error("❌ Error uploading file:", error.stack);
      res.status(500).send("Error uploading file");
    }
  },
  
  

  // Function to get a specific file from Google Drive
  getFile: async (req, res) => {
    if (req.user) {
      try {
        const fileId = req.params.fileId;

        // Create a new OAuth2 client and set credentials from req.user
   
        // Get the file metadata
        const file = await drive.files.get({
          fileId: fileId,
          fields: "id, name, mimeType",
        });

        res.json({ file: file.data });
      } catch (error) {
        console.error("❌ Error retrieving file:", error);
        res.status(500).json({ message: "Error retrieving file", error });
      }
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  },

  // Function to delete a file from Google Drive
  deleteFile: async (req, res) => {
    if (req.user) {
    
     

      const { fileIds, folderLink } = req.body; // Expecting file IDs and folder link in the request body

      if (!folderLink) return res.status(400).send("Folder link not provided");

      // Extract the folder ID from the folder link
      const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
      if (!folderId) return res.status(400).send("Invalid folder link");

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res
          .status(400)
          .json({ message: "No file IDs provided or invalid format" });
      }

      try {
        const deletionResults = await Promise.all(
          fileIds.map(async (fileId) => {
            try {
              // Optionally, verify the file's parent matches the folder ID
              const file = await drive.files.get({
                fileId,
                fields: "parents",
              });
              if (!file.data.parents.includes(folderId)) {
                return {
                  fileId,
                  status: "error",
                  message: "File not in specified folder",
                };
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
        res
          .status(500)
          .send("Error deleting files from Google Drive and MongoDB");
      }
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  },
};

module.exports = driveController;
