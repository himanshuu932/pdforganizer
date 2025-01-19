import React, { useState } from "react";
import "./Main.css";
import chatIcon from "./icons/chat.png";
import filesIcon from "./icons/files.png";
import settingsIcon from "./icons/settings.png";
import toggleIcon from "./icons/toggle.png";
import attachIcon from "./icons/attach.png";
import sendIcon from "./icons/send.png";

function Main() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() !== "") {
      setMessages([...messages, { text: inputMessage, sender: "user" }]);
      setInputMessage("");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMessages([...messages, { text: `Uploaded: ${file.name}`, sender: "user" }]);
    }
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
          <li>
            <img src={chatIcon} alt="Chat" className="icon-image" />
            {isDashboardOpen && <span>Chat with Bot</span>}
          </li>
          <li>
            <img src={filesIcon} alt="Files" className="icon-image" />
            {isDashboardOpen && <span>Uploaded Files</span>}
          </li>
          <li>
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
              className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button onClick={handleSendMessage} className="send-icon">
            <img src={sendIcon} alt="Send" className="send-image" />
          </button>
          <label htmlFor="file-upload" className="upload-icon">
            <img src={attachIcon} alt="Attach" className="attach-image" />
            <input
              id="file-upload"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default Main;