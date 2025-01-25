import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/DocumentModal.css";
import pdfIcon from "../icons/pdf-file.png";
import plusIcon from "../icons/add.png";

const DocumentModal = ({ setActiveScreen }) => {
  
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderLink, setFolderLink] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Not Connected");
  const [message, setMessage] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConfirmDelete = () => {
    setShowConfirmation(true);
  };
  
  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };
  
  const handleConfirmDeleteFiles = async () => {
  //
  };
  
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const msg = params.get("message");

    if (status === "success") {
      setConnectionStatus("Connected");
      setMessage(msg || "Connected to Google Drive successfully.");
    } else if (status === "failure") {
      setMessage(msg || "Failed to connect to Google Drive.");
    }
  }, []);
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter((file) =>
        file.name.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);
  useEffect(() => {
   pp();
  }, [files]);

const pp= async ()=>{

  const pdfFiles = files.filter((file) => file.name.endsWith('.pdf'));
  
      if (pdfFiles.length === 0) {
        setMessage("No PDF files found.");
      } else {
        // Process PDFs sequentially
        for (const file of pdfFiles) {
          try {
            const response = await axios.get("http://localhost:5000/process-pdf", {
              params: { fileId: file.id, filename: file.name }
            });
            
            // Log the extracted text for the current file
            console.log(`Extracted text for file ${file.name}:`, response.data.text);
          } catch (err) {
            console.error(`Error processing PDF for file ${file.name}:`, err);
          }
        }
      
        setMessage("PDF files processed successfully.");
      }
}

 const handleSelectAll = () => {
    const allFileIds = filteredFiles.map((file) => file.id);
    setSelectedFiles(allFileIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedFiles([]);
  };
  
  const handleConnectDrive = () => {
    const currentUrl = window.location.href;
    const connectUrl = `http://localhost:5000/connect-drive?redirectUri=${encodeURIComponent(
      currentUrl
    )}`;
    window.location.href = connectUrl;
  };

  const handleShowFiles = async () => {
    if (!folderLink) {
      setMessage("Please provide a valid folder link.");
      return;
    }
  
    setLoadingFiles(true);
  
    try {
      // Fetch files from the folder link
      const response = await axios.get("http://localhost:5000/api/files", { params: { folderLink } });
      const fetchedFiles = response.data.files || [];
      setFiles(fetchedFiles);
      setFilteredFiles(fetchedFiles);
      setMessage(response.data.message || "Files fetched successfully.");
  
      // Filter PDF files
      
      
    } catch (err) {
      console.error("❌ Error fetching files:", err);
      setMessage("Failed to fetch files. Please try again.");
    } finally {
      setLoadingFiles(false); // Ensure loading state is reset
    }
  };
 
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Documents</h2>
          <div className="input-row">
            <input
              type="text"
              placeholder="Enter Google Drive folder link"
              value={folderLink}
              onChange={(e) => setFolderLink(e.target.value)}
              className="folder-link-input"
            />
            <button
              className="connect-drive-button"
              onClick={handleConnectDrive}
            >
              Connect to Google Drive
            </button>
          </div>
          <div className="button-row">
  <button
    className="show-files-button"
    onClick={handleShowFiles}
    disabled={loadingFiles}
  >
    {loadingFiles ? "Loading Files..." : "Show Files"}
  </button>
  <button
    className="delete-files-button"
    onClick={handleConfirmDelete}
    disabled={selectedFiles.length === 0}
  >
    Delete Selected Files
  </button>
  <button
    className="select-all-button"
    onClick={handleSelectAll}
    disabled={filteredFiles.length === 0}
  >
    Select All
  </button>
  <button
    className="deselect-all-button"
    onClick={handleDeselectAll}
    disabled={selectedFiles.length === 0}
  >
    Deselect All
  </button>
</div>

          <div className="status-row">
            <label className="connection-status-label">
              Status: <strong>{connectionStatus}</strong>
            </label>
          </div>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="modal-body">
            <div className="file-grid">
              <div className="file-card upload-card">
                <label htmlFor="file-upload" className="upload-label">
                  <img src={plusIcon} alt="Upload Icon" className="file-icon" />
                  <div className="file-name">Upload</div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`file-card ${selectedFiles.includes(file.id) ? "selected" : ""}`}
                    onClick={() => handleFileSelect(file.id)}
                    onDoubleClick={() => handleFileDoubleClick(file.link)}
                  >
                    <img
                      src={pdfIcon}
                      alt="PDF Icon"
                      className="file-icon-i"
                    />
                    <span className="file-name-link">
                      {file.name}
                    </span>
                  </div>
                ))
              ) : (
                <p>No files found.</p>
              )}
            </div>
          </div>
        </div>

        {message && <div className="status-message">{message}</div>}
        {showConfirmation && (
  <div className="confirmation-modal">
    <div className="modal-content1">
      <p>Are you sure you want to delete the selected files? This action cannot be undone.</p>
      <div className="button-row">
        <button className="confirm-button" onClick={handleConfirmDeleteFiles}>
          Yes, Delete
        </button>
        <button className="cancel-button" onClick={handleCancelDelete}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default DocumentModal;
