import React, { useState } from "react";
import attachIcon from "../icons/attach.png";
import chatIcon from "../icons/chat.png";
import "./styles/StartScreen.css";

const StartScreen = ({setActiveScreen}) => {
  const [isUploading, setIsUploading] = useState(false);

  

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
        
        <button className="action-button" onClick={()=>setActiveScreen(3)}>
         Start Chat
        </button>

      </div>
    </div>
  );
};

export default StartScreen;
