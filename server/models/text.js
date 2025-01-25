const mongoose = require("mongoose");

// User schema
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
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
