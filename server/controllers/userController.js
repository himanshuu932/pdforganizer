const { TextData } = require("../models/text");
const { User } = require("../models/text"); // Adjust the model as per your project structure

const userController = {
  // Fetch user-specific texts
  getUserTexts: async (req, res) => {
    try {
      // Use the user ID from the JWT payload (assuming it's stored as id)
      const userId = req.user.id;
      const texts = await TextData.find({ user: userId });
      res.json({ texts });
    } catch (error) {
      console.error("❌ Error fetching user texts:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Get folder links for the logged-in user
  getUserFolderLinks: async (req, res) => {
    console.log("Loading folder links");
    try {
      const userId = req.user.id;
      
      // console.log("Loading folder links for user:", userId);
      const user = await User.findById(userId).select("folderLinks");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ folderLinks: user.folderLinks });
    } catch (error) {
      console.error("❌ Error fetching user folder links:", error);
      res.status(500).json({ message: "Failed to fetch folder links" });
    }
  },

  // Save folder link for the logged-in user
  saveFolderLink: async (req, res) => {
    console.log("Saving folder link");
    try {
      const userId = req.user.id;
      const { folderLink } = req.body;

      if (!folderLink) {
        return res.status(400).json({ message: "Folder link is required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.folderLinks.includes(folderLink)) {
        user.folderLinks.push(folderLink);
        await user.save();
        return res.json({ message: "Folder link saved successfully." });
      }

      return res.status(400).json({ message: "Folder link already exists." });
    } catch (error) {
      console.error("❌ Error saving folder link:", error);
      res.status(500).json({ message: "Failed to save folder link" });
    }
  },

  // Delete folder link for the logged-in user
  deleteFolderLink: async (req, res) => {
    try {
      console.log("delete folder link");
      const userId = req.user.id;
      const { folderLink } = req.body;

      if (!folderLink) {
        return res.status(400).json({ message: "Folder link is required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.folderLinks.includes(folderLink)) {
        user.folderLinks.pull(folderLink);
        await user.save();
        return res.json({ message: "Folder link deleted successfully." });
      }

      return res.status(400).json({ message: "Folder link does not exist." });
    } catch (error) {
      console.error("❌ Error deleting folder link:", error);
      res.status(500).json({ message: "Failed to delete folder link" });
    }
  },
};

module.exports = userController;
