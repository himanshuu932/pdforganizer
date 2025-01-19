const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  texts: [String], // Array of extracted texts from all files
});

const TextData = mongoose.model("TextData", textSchema);

module.exports = TextData;
