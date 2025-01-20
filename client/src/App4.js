import React, { useState, useEffect } from "react";
import "./App.css";
import chatIcon from "./icons/chat.png";
import filesIcon from "./icons/files.png";
import settingsIcon from "./icons/settings.png";
import toggleIcon from "./icons/toggle.png";
import attachIcon from "./icons/attach.png";
import sendIcon from "./icons/send.png";

function App() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Fetch files when the dashboard opens
  useEffect(() => {
    if(!isDashboardOpen)
    {
      setIsFilesVisible(false);
    }
    if (isFilesVisible) {
      fetch("http://localhost:5000/files")
        .then((res) => res.json())
        .then((data) => setFiles(data))
        .catch((err) => console.error("Error fetching files:", err));
    }
  }, [isFilesVisible,isDashboardOpen]);

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };

  return (
    <div className="app">
      <div className={`dashboard ${isDashboardOpen ? "open" : ""}`}>
        <div
          className={`dashboard-toggle ${isDashboardOpen ? "rotated" : ""}`}
          onClick={toggleDashboard}
        >
          {isDashboardOpen && <span className="app-name">My App</span>}
          <img src={toggleIcon} alt="Toggle" className="toggle-image" />
        </div>
        <ul className="dashboard-options">
          <li onClick={() => handleOptionClick("chat")}>
            <img src={chatIcon} alt="Chat" className="icon-image" />
            {isDashboardOpen && <span>Chat with Bot</span>}
          </li>
          <li onClick={() => handleOptionClick("files")}>
            <img src={filesIcon} alt="Files" className="icon-image" />
            {isDashboardOpen && <span>Uploaded Files</span>}
          </li>
          {isFilesVisible && (
            <ul className="file-list">
              {files.length > 0 ? (
                files.map((file, index) => (
                  <li
                    key={index}
                      style={{
                      cursor: "pointer",
                      backgroundColor: "#89d0ce   ",
                      fontSize: "14px",
                      onHover: "background-color: #f0f0f0",
                    }}
                    
                    
                  >
                    {file}
                  </li>
                ))
              ) : (
                <li>No files available.</li>
              )}
            </ul>
          )}
          <li >
            <img src={settingsIcon} alt="Settings" className="icon-image" />
            {isDashboardOpen && <span>Settings</span>}
          </li>
        </ul>
      </div>
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-bubble ${
                msg.sender === "user" ? "user-bubble" : "bot-bubble"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <label htmlFor="file-upload" className="upload-icon">
                     <img src={attachIcon} alt="Attach" className="attach-image" />
                     <input
                       id="file-upload"
                       type="file"
                       style={{ display: "none" }}
                                         />
                   </label>

          <input
            type="text"
            placeholder="Type a message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            className="send-icon"
            disabled={isSending}
          >
            <img src={sendIcon} alt="Send" className="send-image" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
