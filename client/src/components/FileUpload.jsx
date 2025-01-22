import React, { useState, useRef } from "react";
import "./styles/FileUpload.css";

const FileUpload = () => {
  const [files, setFiles] = useState([]); // Store files with status and progress
  const [currentFile, setCurrentFile] = useState(null); // File currently being uploaded
  const [progress, setProgress] = useState(0); // Progress for single progress bar
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      status: "pending", // Status can be 'pending', 'uploading', 'success'
    }));
    setFiles((prev) => [...prev, ...selectedFiles]); // Append new files to the list
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragAreaClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const uploadFile = (file) => {
    return new Promise((resolve) => {
      setCurrentFile(file);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200); // Simulates upload time
    });
  };

  const handleFileUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        const file = files[i];
        // Set file to uploading
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i ? { ...f, status: "uploading" } : f
          )
        );

        // Simulate upload
        await uploadFile(file.file);

        // Set file to success
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i ? { ...f, status: "success" } : f
          )
        );
        setProgress(0); // Reset progress for next file
      }
    }
    setCurrentFile(null);
    alert("All files uploaded!");
  };

  return (
    <section id="file-upload" className="container">
      <h2 style={styles.heading}>Upload Files</h2>

      <div
        className="drag-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleDragAreaClick}
        style={dragging ? styles.dragAreaActive : styles.dragArea}
      >
        <p>
          {dragging
            ? "Release to upload files"
            : "Drag & Drop your files here or click to select"}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={styles.input}
        multiple
      />

      <button onClick={handleFileUpload} style={styles.button}>
        Upload
      </button>

      {/* Single progress bar */}
      {currentFile && (
        <div style={styles.uploadStatus}>
          <p style={styles.currentFile}>
            Uploading: <strong>{currentFile.name}</strong>
          </p>
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`,
              }}
            ></div>
          </div>
          <p style={styles.progressText}>{progress}%</p>
        </div>
      )}

      {/* List of selected files with their status */}
      {files.length > 0 && (
        <div style={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((fileObj, index) => (
              <li key={index} style={styles.fileItem}>
                {fileObj.file.name} -{" "}
                <span
                  style={{
                    color:
                      fileObj.status === "success"
                        ? "#4CAF50"
                        : fileObj.status === "uploading"
                        ? "#2196F3"
                        : "#888",
                  }}
                >
                  {fileObj.status === "success"
                    ? "Uploaded"
                    : fileObj.status === "uploading"
                    ? "Uploading"
                    : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#e9e9e9",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    marginTop: "20px",
    textAlign: "center",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "20px",
  },
  dragAreaActive: {
    border: "2px dashed #4CAF50",
    backgroundColor: "#e8f5e9",
    color: "#4CAF50",
  },
  input: {
    display: "none",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  uploadStatus: {
    marginTop: "20px",
  },
  currentFile: {
    marginBottom: "10px",
    fontSize: "1rem",
  },
  progressBarContainer: {
    width: "100%",
    height: "10px",
    backgroundColor: "#ddd",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: "4px",
    transition: "width 0.2s ease",
  },
  progressText: {
    marginTop: "5px",
    fontSize: "0.9rem",
    color: "#888",
  },
  fileList: {
    marginTop: "20px",
    textAlign: "left",
  },
  fileItem: {
    marginBottom: "10px",
  },
};

export default FileUpload;
