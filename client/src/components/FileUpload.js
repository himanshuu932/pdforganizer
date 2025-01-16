import React, { useState } from "react";

const FileUpload = ({st}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null); // Clear previous error messages
      console.log("File selected:", file.name);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle file upload on button click
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload!");
      console.error("Upload failed: No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(0);

      console.log("Starting file upload...");

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
//alert(data.extractedText);
      st(data.extractedText);
      setUploadedFile(data.file);
      setUploadProgress(100); // Mark upload as complete
      console.log("File uploaded successfully:", data.file);
    } catch (err) {
      setErrorMessage(`Error uploading file: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload PDF Documents</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="file-input"
      />
      <button
        onClick={handleFileUpload}
        disabled={!selectedFile || isUploading} // Disable if no file or uploading
        className="upload-button"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </button>
      {uploadProgress > 0 && (
        <p>Upload Progress: {uploadProgress}%</p>
      )}
      {uploadedFile && (
        <p style={{ color: "green" }}>
          File uploaded successfully! <strong>{uploadedFile.name}</strong>
        </p>
      )}
      {errorMessage && (
        <p style={{ color: "red" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
