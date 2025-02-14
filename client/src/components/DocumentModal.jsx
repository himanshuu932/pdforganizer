import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/DocumentModal.css";
import pdfIcon from "../icons/pdf-file.png";
import plusIcon from "../icons/add.png";
import Links from "./Links";

const DocumentModal = ({
  savedFolderLink,
  setSavedFolderLink,
  activeScreen,
  isProcessing,
  setIsProcessing,
  setConnectionStatus,
}) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderLink, setFolderLink] = useState("");
  const [message, setMessage] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Read status and message from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const msg = params.get("message");

    if (status === "success") {
      setConnectionStatus(true);
      setMessage(msg || "Connected to Google Drive successfully.");
    } else if (status === "failure") {
      setConnectionStatus(false);
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

  // Automatically process files when files change
  useEffect(() => {
    setMessage("Processing please wait...");
    pp();
  }, [files]);

  // Updated handleShowFiles: now using JWT in Authorization header
  const handleShowFiles = async (folderLink) => {
    if (!folderLink) {
      setMessage("Please provide a valid folder link.");
      return;
    }
    setSavedFolderLink(folderLink);
    setLoadingFiles(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/drive/files", {
        params: { folderLink },
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const fetchedFiles = response.data.files || [];
      setFiles(fetchedFiles);
      setFilteredFiles(fetchedFiles);
      fetchedFiles.forEach((file) => {
        console.log(`File: ${file.name}`);
        console.log("Created Time:", file.createdTime);
        console.log("Modified Time:", file.modifiedTime);
      });
      setMessage(response.data.message || "Files fetched successfully.");
      setMessage("Processing please wait...");
    } catch (err) {
      console.error("❌ Error fetching files:", err);
      setMessage("Failed to fetch files. Please try again.");
    } finally {
      setLoadingFiles(false);
    }
  };
  const sortFiles = (property, orderFlag) => {
    const sortedFiles = [...files].sort((a, b) => {
      // For date fields, convert to Date objects
      if (property === "createdTime" || property === "modifiedTime") {
        return orderFlag * (new Date(a[property]) - new Date(b[property]));
      }
      // For alphabetical sort (using the file name)
      if (property === "name") {
        return orderFlag * a[property].localeCompare(b[property]);
      }
      // For numeric sorting (e.g., file size)
      if (property === "size") {
        return orderFlag * (a[property] - b[property]);
      }
      return 0;
    });
    setFiles(sortedFiles);
    setFilteredFiles(sortedFiles);
  };
  
  
  const handleConfirmDelete = () => {
    setShowConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  // Updated deleteFolderLink using JWT
  const handleConfirmDeleteFiles = async () => {
    setShowConfirmation(false);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete("http://localhost:5000/api/drive/delete", {
        data: {
          fileIds: selectedFiles,
          folderLink,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 200) {
        const remainingFiles = files.filter(
          (file) => !selectedFiles.includes(file.id)
        );
        setFiles(remainingFiles);
        setFilteredFiles(remainingFiles);
        setSelectedFiles([]);
        setMessage("Selected files deleted successfully.");
      } else {
        setMessage("Failed to delete files. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting files:", err);
      setMessage("Failed to delete files. Please try again.");
    }
  };

  // pp: Process PDF files with updated JWT usage
  const pp = async () => {
    const pdfFiles = files.filter((file) => file.name.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      setMessage("No PDF files found.");
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/pdf/process-pdfs",
        {
          files: pdfFiles,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.status === 200) {
        console.log("All files processed", response.data.message);
        setMessage("PDF files processed successfully.");
      }
      setIsProcessing(false);
    } catch (err) {
      console.error("Error processing PDFs: ", err);
      setMessage("Error processing PDF files.");
    }
  };

  const handleSelectAll = () => {
    const allFileIds = filteredFiles.map((file) => file.id);
    setSelectedFiles(allFileIds);
  };

  const handleDeselectAll = () => {
    setSelectedFiles([]);
  };

  const handleFileUpload = (event) => {
    const fileList = event.target.files;
    uploadFiles(fileList);
  };

  // Updated uploadFiles using JWT in axios request
  const uploadFiles = async (fileList) => {
    if (!folderLink) {
      setMessage("Please provide a valid folder link.");
      return;
    }

    const uploadedFiles = Array.from(fileList);
    const newFiles = [...files];

    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderLink", folderLink);

      // Create a progress dialog for the file upload
      const progressDialog = document.createElement("div");
      progressDialog.style.position = "fixed";
      progressDialog.style.top = "50%";
      progressDialog.style.left = "50%";
      progressDialog.style.transform = "translate(-50%, -50%)";
      progressDialog.style.backgroundColor = "#fff";
      progressDialog.style.padding = "20px";
      progressDialog.style.borderRadius = "8px";
      progressDialog.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
      progressDialog.innerHTML = `
        <h3>Uploading ${file.name}...</h3>
        <progress value="0" max="100" id="progress-bar"></progress>
        <span id="progress-percent">0%</span>
      `;
      document.body.appendChild(progressDialog);
      console.log([...formData.entries()]);

      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:5000/api/drive/upload",
          formData,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              const progressBar = document.getElementById("progress-bar");
              const progressPercent = document.getElementById("progress-percent");
              if (progressBar && progressPercent) {
                progressBar.value = percentCompleted;
                progressPercent.textContent = `${percentCompleted}%`;
              }
            },
          }
        );

        if (res.status === 200) {
          const { file: uploadedFile } = res.data;
          if (uploadedFile && uploadedFile.name) {
            progressDialog.innerHTML = `
              <h3>Upload Complete!</h3>
              <p>File "${uploadedFile.name}" uploaded successfully.</p>
              <a href="${uploadedFile.link}" target="_blank">View File</a>
            `;
            newFiles.push({
              name: uploadedFile.name,
              id: uploadedFile.id,
              link: uploadedFile.link,
            });
          } else {
            console.error("No file data in response.");
          }
        } else {
          console.error("Failed to upload file.");
          progressDialog.innerHTML = `
            <h3>Upload Failed</h3>
            <p>There was an error uploading the file. Please try again.</p>
          `;
        }
      } catch (err) {
        console.error("Error uploading file:", err);
        progressDialog.innerHTML = `
          <h3>Upload Failed</h3>
          <p>There was an error uploading the file. Please try again.</p>
        `;
      } finally {
        setTimeout(() => {
          document.body.removeChild(progressDialog);
        }, 500);
      }
    }

    if (newFiles.length > 0) {
      setFiles(newFiles);
      setFilteredFiles(newFiles);
      setMessage("Files uploaded successfully.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const fileList = e.dataTransfer.files;
    uploadFiles(fileList);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prevSelected) => {
      if (prevSelected.includes(fileId)) {
        return prevSelected.filter((id) => id !== fileId);
      } else {
        return [...prevSelected, fileId];
      }
    });
  };

  const handleFileDoubleClick = (fileLink) => {
    window.open(fileLink, "_blank");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="input-row">
            <Links
              folderLink={folderLink}
              setFolderLink={setFolderLink}
              handleShowFiles={handleShowFiles}
              activeScreen={activeScreen}
              savedFolderLink={savedFolderLink}
              setSavedFolderLink={setSavedFolderLink}
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="button-row">
            <button
              className="delete-files-button"
              onClick={handleConfirmDelete}
              disabled={selectedFiles.length === 0}
            >
              Delete
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
        )}
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
                    className={`file-card ${
                      selectedFiles.includes(file.id) ? "selected" : ""
                    }`}
                    onClick={() => handleFileSelect(file.id)}
                    onDoubleClick={() => handleFileDoubleClick(file.link)}
                  >
                    <img src={pdfIcon} alt="PDF Icon" className="file-icon-i" />
                    <span className="file-name-link">{file.name}</span>
                  </div>
                ))
              ) : (
                <p>No files found.</p>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
  <h3>Sort Files</h3>
  
  <div>
    <h4>Sort by Created Time</h4>
    <button onClick={() => sortFiles("createdTime", 1)}>
      Ascending
    </button>
    <button onClick={() => sortFiles("createdTime", -1)}>
      Descending
    </button>
  </div>
  
  <div>
    <h4>Sort by Modified Time</h4>
    <button onClick={() => sortFiles("modifiedTime", 1)}>
      Ascending
    </button>
    <button onClick={() => sortFiles("modifiedTime", -1)}>
      Descending
    </button>
  </div>
  
  <div>
    <h4>Sort Alphabetically (Name)</h4>
    <button onClick={() => sortFiles("name", 1)}>
      Ascending (A-Z)
    </button>
    <button onClick={() => sortFiles("name", -1)}>
      Descending (Z-A)
    </button>
  </div>
  
  <div>
    <h4>Sort by Size</h4>
    <button onClick={() => sortFiles("size", 1)}>
      Ascending
    </button>
    <button onClick={() => sortFiles("size", -1)}>
      Descending
    </button>
  </div>
</div>


        {message && <div className="status-message">{message}</div>}
        {showConfirmation && (
          <div className="confirmation-modal">
            <div className="modal-content1">
              <p>
                Are you sure you want to delete the selected files? This action
                cannot be undone.
              </p>
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
