import React, { useState, useEffect } from "react";

const SearchFiles = ({ isVisible, onFileClick }) => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/files");
      const data = await res.json();
      setFiles(data); // Set the full files list
      setFilteredFiles(data); // Initialize filteredFiles with the full list
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchFiles();
    }
  }, [isVisible]);

  useEffect(() => {
    // Show filtered files only if searchQuery has at least one character
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter((file) =>
        file.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles([]); // Clear the filtered list if no query
    }
  }, [searchQuery, files]); // Run when searchQuery or files change

  if (!isVisible) return null;

  return (
    <div className="file-search-container">
      <h2>Search Files</h2>
      <input
        type="text"
        className="file-search-input"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ul className="file-list">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file, index) => (
            <li
              key={index}
              onClick={() => onFileClick(file)}
              style={{
                cursor: "pointer",
                backgroundColor: "#89d0ce",
                fontSize: "14px",
              }}
            >
              {file}
            </li>
          ))
        ) : (
          <li>No files found.</li>
        )}
      </ul>
    </div>
  );
};

export default SearchFiles;
