import React, { useState, useEffect } from "react";
import axios from "axios";
import pdfIcon from "../icons/pdf-file.png"; // Ensure this path is correct
import "./Home.css";

const Home = ({ user, setUser }) => {
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [files, setFiles] = useState([]);
  const [folderLink, setFolderLink] = useState("");
  const [message, setMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Not Connected");
   const [filteredFiles, setFilteredFiles] = useState([]);
   const [selectedFiles, setSelectedFiles] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");
   
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
          file.toLowerCase().includes(query)
        );
        setFilteredFiles(filtered);
      } else {
        setFilteredFiles(files);
      }
    }, [searchQuery, files]);

 

  const handleShowFiles = () => {
    if (!folderLink) {
      setMessage("Please provide a valid folder link.");
      return;
    }

    setLoadingFiles(true);
    axios
      .get("http://localhost:5000/api/files", { params: { folderLink } })
      .then((response) => {
        setFiles(response.data.files || []);
        setMessage(response.data.message || "Files fetched successfully.");
        setLoadingFiles(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching files:", err);
        setMessage("Failed to fetch files. Please try again.");
        setLoadingFiles(false);
      });
  };

  return (
    <div className="home-container">
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter Google Drive folder link"
          value={folderLink}
          onChange={(e) => setFolderLink(e.target.value)}
          className="folder-link-input"
        />
        
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

      <div className="button-row">
        <button
          className="show-files-button"
          onClick={handleShowFiles}
          disabled={loadingFiles}
        >
          {loadingFiles ? "Loading Files..." : "Show Files"}
        </button>
      </div>

      <div className="status-row">
        <label className="connection-status-label">
          Status: <strong>{connectionStatus}</strong>
        </label>
      </div>

      {message && <div className="status-message">{message}</div>}

      {files.length > 0 && (
        <div className="files-grid">
          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <img
                src={pdfIcon}
                alt="PDF Icon"
                className="file-icon-img"
              />
              <a
                href={file.link}
                target="_blank"
                rel="noopener noreferrer"
                className="file-name-link"
              >
                {file.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
