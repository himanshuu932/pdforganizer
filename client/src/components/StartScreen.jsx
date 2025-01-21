import React, { useState } from "react";
import attachIcon from "../icons/attach.png";
import chatIcon from "../icons/chat.png";
import "./styles/StartScreen.css";

const StartScreen = ({setActiveScreen}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload response:", data);
      alert("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="start-screen">
    
      {/* Main Content */}
      <div className="logo-section">
        <img src={chatIcon} alt="Chat Icon" className="icon-image" />
        <h1>Start New Conversation</h1>
        <p>
          Start by uploading a new PDF, accessing your previous uploads
        </p>
      </div>

      {/* Buttons */}
      <div className="button-section">
        <button className="action-button" onClick={()=>setActiveScreen(2)}>
          Documents
        </button>
        <label htmlFor="file-upload" className="action-button">
          {isUploading ? "Uploading..." : "Upload"}
          <input
            id="file-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            disabled={isUploading} // Disable during upload
          />
       
        </label>
        <button className="action-button" onClick={()=>setActiveScreen(3)}>
         Start Conversation
        </button>

      </div>
    </div>
  );
};

export default StartScreen;
