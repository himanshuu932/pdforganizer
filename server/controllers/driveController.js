const { google } = require("googleapis");
const { PDFDocument } = require("pdf-lib");
const { Readable } = require("stream");
const { TextData } = require("../models/text");

// Helper function to create a new Drive instance with token refresh logic.
const getDriveInstance = async (req) => {
  if (!req.user) {
    throw new Error("User not authenticated");
  }
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CALLBACK_URL2
  );
  oauth2Client.setCredentials({
    access_token: req.user.accessToken,
    refresh_token: req.user.refreshToken,
  });
  try {
    // Force a token refresh if needed.
    const { token } = await oauth2Client.getAccessToken();
    console.log("Refreshed access token:", token);
  } catch (err) {
    console.error("Error refreshing access token:", err);
  }
  return google.drive({ version: "v3", auth: oauth2Client });
};

const driveController = {
  // Function to list files from Google Drive
  getFiles: async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const drive = await getDriveInstance(req);
      const folderLink = req.query.folderLink;
      const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];

      if (!folderId) {
        return res.status(400).json({ message: "Invalid folder link." });
      }

      // List files within the folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents`,
        pageSize: 100,
        fields:
          "files(id, name, webViewLink, webContentLink, createdTime, modifiedTime, size, parents)",
      });

      let folderName = "";
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
      console.error("Error listing files:", error.message);
      res.status(500).json({ message: "Error listing files", error });
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
      const drive = await getDriveInstance(req);
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
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const drive = await getDriveInstance(req);
      const fileId = req.params.fileId;
      const file = await drive.files.get({
        fileId: fileId,
        fields: "id, name, mimeType",
      });
      res.json({ file: file.data });
    } catch (error) {
      console.error("❌ Error retrieving file:", error);
      res.status(500).json({ message: "Error retrieving file", error });
    }
  },

  // Function to delete a file from Google Drive
  deleteFile: async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { fileIds, folderLink } = req.body;
    if (!folderLink) return res.status(400).send("Folder link not provided");

    const folderId = folderLink?.split("/folders/")[1]?.split("?")[0];
    if (!folderId) return res.status(400).send("Invalid folder link");

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No file IDs provided or invalid format" });
    }

    try {
      const drive = await getDriveInstance(req);
      const deletionResults = await Promise.all(
        fileIds.map(async (fileId) => {
          try {
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

            await drive.files.delete({ fileId });
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
  },
};

module.exports = driveController;
