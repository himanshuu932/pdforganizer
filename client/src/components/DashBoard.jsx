import React, { useState, useEffect } from "react";
import chatIcon from "../icons/chat.png";
import filesIcon from "../icons/files.png";
import settingsIcon from "../icons/settings.png";
import toggleIcon from "../icons/toggle.png";

const DashBoard = () => {

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [files, setFiles] = useState([]);

  // Fetch files when the dashboard opens
  useEffect(() => {
    if(!isDashboardOpen)
    {
      setIsFilesVisible(false);
    }
    if (isFilesVisible) {
      fetch("https://pdforganizer.vercel.app/files")
        .then((res) => res.json())
        .then((data) => setFiles(data))
        .catch((err) => console.error("Error fetching files:", err));
    }
  }, [isFilesVisible,isDashboardOpen]);

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };

  const handleOptionClick = (option) => {
    if (option === "files") {
      setIsFilesVisible(!isFilesVisible);
    }
    setIsDashboardOpen(true);
  };
  const handleFileClick = (fileName) => {
    const fileUrl = `https://pdforganizer.vercel.app/files/${fileName}`;
    window.open(fileUrl, "_blank");
  };
  return (
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
                    onClick={() => handleFileClick(file)}
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
          <li onClick={() => handleOptionClick("settings")}>
            <img src={settingsIcon} alt="Settings" className="icon-image" />
            {isDashboardOpen && <span>Settings</span>}
          </li>
        </ul>
      </div>
  );
};

export default DashBoard;
