import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import "./App.css";

const App = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [extractedText, setExtractedText] = useState(""); // Initialize state for extracted text

  const handleSearch = (query) => {
    // Simulate API call to fetch search results
    const results = [
      { id: 1, title: "Document 1", snippet: "This is content from document 1." },
      { id: 2, title: "Document 2", snippet: "This snippet is from document 2." },
    ];
    setSearchResults(results); // Update results with mock data
  };

  // Function to handle file upload and display extracted text
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedText(data.extractedText); // Update state with extracted text
        console.log("Extracted text:", data.extractedText); // Log to confirm correct response
      } else {
        console.error("Error uploading file:", data.message);
      }
    } catch (error) {
      console.error("Error in file upload:", error);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Smart PDF Search & Management</h1>
      </header>
      <main>
        <FileUpload  st={setExtractedText}/>
        <SearchBar onSearch={handleSearch} />
        <SearchResults results={searchResults} />

        {/* Display extracted text */}
        <div>
          <h2>Extracted Text</h2>
          <pre>{extractedText}</pre> {/* Display extracted text inside preformatted text */}
        </div>
      </main>
    </div>
  );
};

export default App;
