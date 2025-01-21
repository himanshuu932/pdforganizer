import React, { useEffect, useState } from "react";
import "./DocumentModal.css";
import pdfIcon from "../icons/pdf-file.png";

import SearchFiles from "./SearchFiles";
const DocumentModal = ({ onClose }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch files when the component mounts
  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setFilteredFiles(data); // Initialize filtered files with the full list
      })
      .catch((err) => console.error("Error fetching files:", err));
  }, []);

  // Filter files based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter((file) =>
        file.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files); // Reset to the full list if no query
    }
  }, [searchQuery, files]);

  const toggleSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const selectAll = () => setSelectedFiles(files);
  const deselectAll = () => setSelectedFiles([]);
  const deleteSelected = () => {
    setFiles(files.filter((file) => !selectedFiles.includes(file)));
    setSelectedFiles([]);
  };

  const handleFileDoubleClick = (fileName) => {
    const fileUrl = `http://localhost:5000/files/${fileName}`;
    window.open(fileUrl, "_blank"); // Open the PDF in a new tab
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Documents</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="file-grid">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div
                  key={file}
                  className={`file-card ${selectedFiles.includes(file) ? "selected" : ""}`}
                  onClick={() => toggleSelection(file)} // Toggle selection on single-click
                  onDoubleClick={() => handleFileDoubleClick(file)} // Open the PDF on double-click
                >
                  <img src={pdfIcon} alt="PDF Icon" className="file-icon" />
                  <div className="file-name">
                    <span>{file}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No files found.</p>
            )}
          </div>
        </div>
        {selectedFiles.length > 0 && (
          <div className="selection-options">
            <button onClick={selectAll}>Select All</button>
            <button onClick={deselectAll}>Deselect All</button>
            <button onClick={deleteSelected}>Delete</button>
          </div>
        )}
        <div className="modal-footer">
          <button className="footer-button cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
