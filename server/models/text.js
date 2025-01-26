const mongoose = require("mongoose");

// User schema with Google Drive access fields and folder links
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true }, // Ensure unique Google IDs
  name: { type: String, required: true },
  accessToken: { type: String }, // Store the access token for Google Drive
  refreshToken: { type: String }, // Store the refresh token for refreshing access
  hasDrivePermissions: { type: Boolean, default: false }, // Flag for Drive permissions
  folderLinks: [{ type: String }], // Array of folder links
});

const User = mongoose.model("User", userSchema);

// TextData schema with a reference to the User
const textDataSchema = new mongoose.Schema({
  text: { type: String, required: true },
  fileId: { type: String, required: true },
  filename: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to User schema
});

const TextData = mongoose.model("TextData", textDataSchema);

module.exports = {
  User,
  TextData,
};
