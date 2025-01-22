import React, { useState, useRef } from "react";
import axios from "axios";
import "./styles/FileUpload.css";

const FileUpload = () => {
  const [files, setFiles] = useState([]); // Store files with status
  const [overallProgress, setOverallProgress] = useState(0); // Track overall progress
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      status: "pending", // Status: 'pending', 'uploading', 'success'
    }));
    setFiles((prev) => [...prev, ...selectedFiles]); // Append new files
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

  const handleDragAreaClick = () => fileInputRef.current.click();
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);

  const handleFileUpload = async () => {
    if (files.length === 0) {
      alert("No files selected!");
      return;
    }

    let totalUploaded = 0;
    const totalFiles = files.length;
    const updatedFiles = [...files];

    for (let i = 0; i < totalFiles; i++) {
      if (updatedFiles[i].status === "pending") {
        updatedFiles[i].status = "uploading";
        setFiles([...updatedFiles]);

        const formData = new FormData();
        formData.append("file", updatedFiles[i].file);

        try {
          await axios.post("http://localhost:5000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const overallProgress = Math.round(
                ((totalUploaded + fileProgress / 100) / totalFiles) * 100
              );
              setOverallProgress(overallProgress);
            },
          });

          updatedFiles[i].status = "success";
          totalUploaded++;
        } catch (error) {
          console.error("Error uploading file:", error);
          updatedFiles[i].status = "failed";
        }

        setFiles([...updatedFiles]);
      }
    }

    if (totalUploaded === totalFiles) {
      setOverallProgress(100);
      alert("All files uploaded successfully!");
    } else {
      alert("Some files failed to upload.");
    }
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

      {files.length > 0 && (
        <div style={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((fileObj, index) => (
              <li key={index} style={styles.fileItem}>
                <strong>{fileObj.file.name}</strong> -{" "}
                <span
                  style={{
                    color:
                      fileObj.status === "success"
                        ? "#4CAF50"
                        : fileObj.status === "uploading"
                        ? "#2196F3"
                        : fileObj.status === "failed"
                        ? "#FF0000"
                        : "#888",
                  }}
                >
                  {fileObj.status === "success"
                    ? "Uploaded"
                    : fileObj.status === "failed"
                    ? "Failed"
                    : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div style={styles.progressBarContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${overallProgress}%`,
            }}
          ></div>
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
  fileList: {
    marginTop: "20px",
    textAlign: "left",
  },
  fileItem: {
    marginBottom: "15px",
  },
  progressBarContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#ddd",
    borderRadius: "4px",
    marginTop: "20px",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: "4px",
    transition: "width 0.2s ease",
  },
};

export default FileUpload;
