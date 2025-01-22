import React, { useState, useRef } from "react";
import axios from "axios";
import "./styles/FileUpload.css";

const FileUpload = () => {
  const [files, setFiles] = useState([]); // Store files with status and progress
  const [currentFile, setCurrentFile] = useState(null); // File currently being uploaded
  const [progress, setProgress] = useState(0); // Overall progress
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      status: "pending", // Status: 'pending', 'uploading', 'success', 'failed'
      progress: 0, // Individual progress (for display)
    }));
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragAreaClick = () => fileInputRef.current.click();
  const handleDragOver = (e) => e.preventDefault();
  const handleDragLeave = () => {};

  const handleFileUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        setCurrentFile(files[i].file.name);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", files[i].file);

        try {
          await axios.post("http://localhost:5000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percentage);
              setFiles((prevFiles) =>
                prevFiles.map((f, idx) =>
                  idx === i ? { ...f, progress: percentage } : f
                )
              );
            },
          });

          files[i].status = "success";
        } catch (error) {
          console.error("Upload failed:", error);
          files[i].status = "failed";
        }

        setFiles([...files]); // Update state
        setProgress(0); // Reset progress bar for the next file
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
        onClick={handleDragAreaClick}
        style={styles.dragArea}
      >
        <p>Drag & Drop your files here or click to select</p>
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

      {currentFile && (
        <div style={styles.progressContainer}>
          <p>
            Uploading: <strong>{currentFile}</strong>
          </p>
          <div style={styles.progressBarContainer}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }}></div>
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {files.length > 0 && (
        <div style={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((fileObj, index) => (
              <li key={index} style={styles.fileItem}>
                <div>
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
                      : fileObj.status === "uploading"
                      ? `${fileObj.progress}%`
                      : fileObj.status === "failed"
                      ? "Failed"
                      : "Pending"}
                  </span>
                </div>
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
  dragArea: {
    width: "100%",
    height: "150px",
    border: "2px dashed #bbb",
    borderRadius: "8px",
    backgroundColor: "#f4f4f4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#888",
    cursor: "pointer",
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
  progressContainer: {
    marginTop: "20px",
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#ddd",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "10px",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
    transition: "width 0.3s ease",
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
