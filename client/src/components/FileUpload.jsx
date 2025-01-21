import React, { useState, useRef } from "react";
import axios from "axios";

const FileUpload = () => {
  const [files, setFiles] = useState([]); // Store selected files
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // Status message
  const fileInputRef = useRef(null); // Reference to the file input element

  // Handle file selection from input
  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]); // Add new files to the existing ones
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const uploadedFiles = Array.from(e.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]); // Add new files to the existing ones
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragging(false);
  };

  // Trigger file input click when drag area is clicked
  const handleDragAreaClick = () => {
    fileInputRef.current.click();
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (files.length === 0) {
      setUploadStatus("No files selected!");
      return;
    }

    try {
      setUploadStatus("Uploading...");
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        // Send the file to the backend
        const response = await axios.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log(response.data);
      }

      setUploadStatus(`Successfully uploaded ${files.length} files!`);
      setFiles([]); // Clear selected files
      fileInputRef.current.value = ""; // Clear file input value
    } catch (error) {
      console.error("File upload failed:", error);
      setUploadStatus("File upload failed. Please try again.");
    }
  };

  return (
    <section id="file-upload" style={styles.container}>
      <h2 style={styles.heading}>Upload Files</h2>

      {/* Drag-and-Drop Area */}
      <div
        style={dragging ? styles.dragAreaActive : styles.dragArea}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleDragAreaClick} // Trigger file input click
      >
        <p>
          {dragging
            ? "Release to upload files"
            : "Drag & Drop your files here or click to select"}
        </p>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef} // Attach the ref to the file input
        type="file"
        onChange={handleFileChange}
        style={styles.input}
        multiple // Allow multiple files selection
      />

      {/* Upload Button */}
      <button onClick={handleFileUpload} style={styles.button}>
        Upload
      </button>

      {/* Upload Status */}
      {uploadStatus && <p style={styles.status}>{uploadStatus}</p>}

      {/* Display selected file names */}
      {files.length > 0 && (
        <div style={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index} style={styles.fileItem}>
                {file.name}
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
  dragAreaActive: {
    width: "100%",
    height: "150px",
    border: "2px dashed #4CAF50",
    borderRadius: "8px",
    backgroundColor: "#e8f5e9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#4CAF50",
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
  status: {
    marginTop: "10px",
    color: "#333",
  },
  fileList: {
    marginTop: "20px",
    textAlign: "left",
  },
  fileItem: {
    fontSize: "1rem",
    color: "#333",
  },
};

export default FileUpload;
