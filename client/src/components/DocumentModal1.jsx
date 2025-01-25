import React, { useEffect, useState } from "react";
import "./styles/DocumentModal.css";
import pdfIcon from "../icons/pdf-file.png";
import plusIcon from "../icons/add.png";

const DocumentModal = ({ setActiveScreen }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setFilteredFiles(data);
      })
      .catch((err) => console.error("Error fetching files:", err));
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

  const toggleSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const selectAll = () => setSelectedFiles(filteredFiles);
  const deselectAll = () => setSelectedFiles([]);

  const deleteSelected = () => {
    const promises = selectedFiles.map((file) =>
      fetch(`http://localhost:5000/files/${file}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to delete ${file}`);
          }
        })
        .catch((err) => {
          console.error(`Error deleting file ${file}:`, err);
          return null;
        })
    );

    Promise.all(promises)
      .then(() => {
        const updatedFiles = files.filter((file) => !selectedFiles.includes(file));
        setFiles(updatedFiles);
        setFilteredFiles(updatedFiles);
        setSelectedFiles([]);
      })
      .catch((err) => console.error("Error during bulk deletion:", err));
  };

  const handleFileDoubleClick = (fileName) => {
    const fileUrl = `http://localhost:5000/files/${fileName}`;
    window.open(fileUrl, "_blank");
  };

  const uploadFiles = async (fileList) => {
    const uploadedFiles = Array.from(fileList);
    const newFiles = [];

    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const { textData } = await res.json();
          newFiles.push(textData.filename);
        } else {
          console.error(`Failed to upload file: ${file.name}`);
        }
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err);
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...newFiles, ...files];
      setFiles(updatedFiles);
      setFilteredFiles(updatedFiles);
    }
  };

  const handleFileUpload = (event) => {
    const fileList = event.target.files;
    uploadFiles(fileList);
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Documents</h2>
          {selectedFiles.length > 0 && (
          <div className="selection-options">
            <button onClick={selectAll}>Select All</button>
            <button onClick={deselectAll}>Deselect All</button>
            <button onClick={deleteSelected}>Delete</button>
          </div>
        )}
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
                    key={file}
                    className={`file-card ${
                      selectedFiles.includes(file) ? "selected" : ""
                    }`}
                    onClick={() => toggleSelection(file)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                  >
                    <img src={pdfIcon} alt="PDF Icon" className="file-icon-i" />
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
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
