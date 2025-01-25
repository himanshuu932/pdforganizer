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
    setShowConfirmation(false); // Close the modal after confirming
    // Proceed with the delete logic here
    try {
      const res = await axios.delete("http://localhost:5000/delete", {
        data: {
          fileIds: selectedFiles,
          folderLink,
        },
      });
  
      if (res.status === 200) {
        const remainingFiles = files.filter((file) => !selectedFiles.includes(file.id));
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
  
  
  const handleFileUpload = (event) => {
    const fileList = event.target.files;
    uploadFiles(fileList);
  };

  const uploadFiles = async (fileList) => {
    if (!folderLink) {
      setMessage("Please provide a valid folder link.");
      return;
    }
  
    const uploadedFiles = Array.from(fileList);
    const newFiles = [...files]; // Make sure to start with the existing files in the state
  
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderLink", folderLink); // Add folderLink to the form data
  
      // Create a progress dialog for the file upload
      const progressDialog = document.createElement('div');
      progressDialog.style.position = 'fixed';
      progressDialog.style.top = '50%';
      progressDialog.style.left = '50%';
      progressDialog.style.transform = 'translate(-50%, -50%)';
      progressDialog.style.backgroundColor = '#fff';
      progressDialog.style.padding = '20px';
      progressDialog.style.borderRadius = '8px';
      progressDialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      progressDialog.innerHTML = `
        <h3>Uploading ${file.name}...</h3>
        <progress value="0" max="100" id="progress-bar"></progress>
        <span id="progress-percent">0%</span>
      `;
      document.body.appendChild(progressDialog);
  
      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const progressBar = document.getElementById('progress-bar');
            const progressPercent = document.getElementById('progress-percent');
            progressBar.value = percentCompleted;
            progressPercent.textContent = `${percentCompleted}%`;
          }
        });
  
        if (res.status === 200) {
          // Check if file data exists in the response
          const { file: uploadedFile } = res.data; // Destructure the 'file' from response
  
          if (uploadedFile && uploadedFile.name) {
            // Update the dialog with a success message
            progressDialog.innerHTML = `
              <h3>Upload Complete!</h3>
              <p>File "${uploadedFile.name}" uploaded successfully.</p>
              <a href="${uploadedFile.link}" target="_blank">View File</a>
            `;
            
            // Add the uploaded file to the newFiles array
            newFiles.push({ name: uploadedFile.name, id: uploadedFile.id, link: uploadedFile.link });
          } else {
            console.error("No file data in response.");
          }
        } else {
          console.error("Failed to upload file.");
          // Update the dialog with an error message if upload fails
          progressDialog.innerHTML = `
            <h3>Upload Failed</h3>
            <p>There was an error uploading the file. Please try again.</p>
          `;
        }
      } catch (err) {
        console.error("Error uploading file:", err);
        // Update the dialog with an error message if an exception occurs
        progressDialog.innerHTML = `
          <h3>Upload Failed</h3>
          <p>There was an error uploading the file. Please try again.</p>
        `;
      } finally {
        // Remove the progress dialog after some time to allow user to see the success message
        setTimeout(() => {
          document.body.removeChild(progressDialog);
        }, 500); // The dialog will be removed after 3 seconds
      }
    }
  
    if (newFiles.length > 0) {
      // Update the state with the new files
      setFiles(newFiles); // This will trigger a re-render
      setFilteredFiles(newFiles); // Update the filtered files state if needed
      setMessage("Files uploaded successfully.");
    }
  };
  
  
 const handleDeleteFiles = async () => {
  if (!folderLink) {
    setMessage("Please provide a valid folder link.");
    return;
  }

  try {
    const res = await axios.delete("http://localhost:5000/delete", {
      data: {
        fileIds: selectedFiles,
        folderLink, // Include folderLink in the request payload
      },
    });

    if (res.status === 200) {
      const remainingFiles = files.filter((file) => !selectedFiles.includes(file.id));
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
