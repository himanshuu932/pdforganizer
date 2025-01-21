import React, { useState, useEffect } from "react";
import "./App.css";
import chatIcon from "./icons/chat.png";
import filesIcon from "./icons/files.png";
import settingsIcon from "./icons/settings.png";
import toggleIcon from "./icons/toggle.png";
import attachIcon from "./icons/attach.png";
import sendIcon from "./icons/send.png";
import maximizeIcon from "./icons/maximize.png";
import pdfIcon from "./icons/pdf.png";
import ChatSection from "./components/ChatSection";
function App() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(true);
  // Fetch files when the dashboard opens
  const toggleFilesAndChat = () => {
    setIsWindowMaximized(!isWindowMaximized);  // Toggle files section
    setIsChatVisible(!isChatVisible);  // Toggle chat section
  };
  const toggleSelection = (fileName) => {
    setSelectedFiles((prevSelected) => {
      if (prevSelected.includes(fileName)) {
        const updatedSelection = prevSelected.filter((file) => file !== fileName);
        if (updatedSelection.length === 0) {
          setIsSelectionMode(false);
        }
        return updatedSelection;
      } else {
        setIsSelectionMode(true);
        return [...prevSelected, fileName];
      }
    });
  };

  // Handle Select All
  const handleSelectAll = () => {
    setSelectedFiles(files);
    setIsSelectionMode(true);
  };

  // Handle Deselect All
  const handleDeselectAll = () => {
    setSelectedFiles([]);
    setIsSelectionMode(false);
  };

  // Handle Delete
  const handleDelete = () => {
    const remainingFiles = files.filter((file) => !selectedFiles.includes(file));
    setFiles(remainingFiles);
    setSelectedFiles([]);
    setIsSelectionMode(false);
  };
  const handleMaximizeClick = () => {
    setIsWindowMaximized(!isWindowMaximized); // Toggle window maximization
  };
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

  const handleOptionClick = (option) => {
    if (option === "files") {
      setIsFilesVisible(!isFilesVisible);
    }
    setIsDashboardOpen(true);
  };

  

  // Function to handle table-related logic
const handleTable = (data) => {
  const tableStartIndex = data.indexOf('table-starts');
  const tableEndIndex = data.indexOf('table-ends');

  if (tableStartIndex !== -1 && tableEndIndex !== -1) {
    const beforeTable = data.slice(0, tableStartIndex).trim();
    const tableContent = data
      .slice(tableStartIndex + 'table-starts'.length, tableEndIndex)
      .trim();
    const afterTable = data.slice(tableEndIndex + 'table-ends'.length).trim();

    return { hasTable: true, beforeTable, tableContent, afterTable };
  }

  return { hasTable: false }; // No table found
};



  const handleFileClick = (fileName) => {
    const fileUrl = `http://localhost:5000/files/${fileName}`;
    window.open(fileUrl, "_blank");
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
          {isDashboardOpen && (
            <span>
              Uploaded Files
              <img
                src={maximizeIcon}
                alt="Maximize"
                className="maximize-icon"
                onClick={handleMaximizeClick} // Attach the click handler to maximize icon
              />
            </span>
          )}
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
      <div className="chat-container">
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">Navbar</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Link</a>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Dropdown
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#">Action</a></li>
                <li><a className="dropdown-item" href="#">Another action</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Something else here</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a className="nav-link disabled" aria-disabled="true">Disabled</a>
            </li>
          </ul>
          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">Search</button>
          </form>
        </div>
      </div>
    </nav>
      {!isWindowMaximized && (
        <div className="chat-window">
          <ChatSection/>
           </div>
      )}
      {isWindowMaximized && (
  <div style={{ position: 'relative', padding: '20px' }}>
    <h1>PDF Files</h1>

    {isSelectionMode && (
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button onClick={handleSelectAll}>Select All</button>
        <button onClick={handleDeselectAll}>Deselect All</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    )}

    {viewingFile && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 1000,
          borderLeft: '2px solid black',
          padding: '10px',
        }}
      >
        <button
          onClick={() => setViewingFile(null)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          &#10005;
        </button>
        <iframe
          src={`http://localhost:3001/files/${viewingFile}`}
          width="100%"
          height="90%"
          style={{ border: 'none' }}
          title="PDF Viewer"
        />
      </div>
    )}

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      {files.length > 0 ? (
        files.map((file, index) => (
          <div
            key={index}
            className={`card ${selectedFiles.includes(file) ? 'selected' : ''}`}
            onClick={() => {
              if (isSelectionMode) {
                toggleSelection(file);
              } else {
                setViewingFile(file);
              }
            }}
          >
            <img
              src={pdfIcon}  // Add the path to your PNG image here
              alt="Thumbnail"
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
            />
            <div className="card-header" style={{ marginTop: '10px' }}>
              {file}
            </div>
            <div className="card-footer">
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedFiles.includes(file)}
                onChange={() => toggleSelection(file)}
                onClick={(e) => e.stopPropagation()} // Prevent card click when toggling checkbox
              />
            </div>
          </div>
        ))
      ) : (
        <p>No PDF files available.</p>
      )}
      {isWindowMaximized && (
        <div
          onClick={toggleFilesAndChat}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: `url(${chatIcon}) no-repeat center/contain`,
            cursor: 'pointer',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        />
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );

}

export default App;
