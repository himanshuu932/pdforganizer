const mongoose = require("mongoose");

const textDataSchema = new mongoose.Schema({
  text: { type: String, required: true },
  filename: { type: String, required: true },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("TextData", textDataSchema);
