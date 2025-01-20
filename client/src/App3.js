import React, { useState, useEffect } from "react";
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
  
    if (file) {
      // Check if the file is a PDF
      if (file.type !== "application/pdf") {
        //alert("Please upload a valid PDF file.");
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `Only PDF files are allowed.`, sender: "bot" },
        ]);
        return;
      }
  
      setSelectedFile(file);
      //alert(`Selected file: ${file.name}`);
  
      const formData = new FormData();
      formData.append("file", file);
  
      try {
       // alert("Starting file upload...");
  
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
  
        //alert("File uploaded successfully");
  
        // Handle additional logic with the response here
        const data = await response.json();
        console.log("Upload response:", data);
  
        // Send a success message from the bot
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `File "${file.name}" uploaded successfully.`, sender: "bot" },
        ]);
      } catch (err) {
        console.error("Upload error:", err);
        //alert(`Error uploading file: ${err.message}`);
  
        // Send a failure message from the bot
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `Failed to upload file "${file.name}".`, sender: "bot" },
        ]);
      }
    } else {
      alert("Please select a file to upload");
    }
  };
  

  const parseTableData = (data) => {
    const rows = data.split('\n')
      .filter(row => row.trim() !== '' && row.includes('|'))
      .map(row => row.split('|').map(col => col.trim()));

    const headers = rows[0];
    const tableData = rows.slice(1);

    return { headers, tableData };
  };

  const renderTable = (data) => {
    const { headers, tableData } = parseTableData(data);
    return (
      <table className="fee-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
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

// Main function to handle overall rendering
const checkAndRenderResult = (data) => {
  // Split the content into two parts using the /ltkgya- marker
  const ltkgyaIndex = data.indexOf('/ltkgya-');
  let beforeLtkgya = '';
  let afterLtkgya = '';

  if (ltkgyaIndex !== -1) {
    beforeLtkgya = data.slice(0, ltkgyaIndex).trim(); // Text before /ltkgya-
    afterLtkgya = data.slice(ltkgyaIndex + '/ltkgya-'.length).trim(); // Text after /ltkgya-
  } else {
    beforeLtkgya = data.trim(); // If no marker is found, treat all as beforeLtkgya
  }

  // Remove 'sources-' from afterLtkgya if it exists
  if (afterLtkgya.startsWith('sources-')) {
    afterLtkgya = afterLtkgya.slice('sources-'.length).trim();
  }

  // Remove symbols /, \, *, and filename-uploads\ from afterLtkgya
  afterLtkgya = afterLtkgya.replace(/sources/g,'')
    .replace(/[\/\\\*]/g, '') // Remove /, \, *
    .replace(/filename-uploads\\/g, ''); // Remove all instances of filename-uploads\

  // Process the content before /ltkgya- for table handling
  const tableData = handleTable(beforeLtkgya);

  let tableSection = null;
  if (tableData.hasTable) {
    const { beforeTable, tableContent, afterTable } = tableData;
    tableSection = (
      <div>
        {beforeTable && <div className="normal-text">{beforeTable}</div>}
        {renderTable(tableContent)}
        {afterTable && <div className="normal-text">{afterTable}</div>}
      </div>
    );
  } else {
    tableSection = <div className="normal-text">{beforeLtkgya}</div>;
  }

  // Process the content after /ltkgya- for sources
  let sourcesHtml = '';
  if (afterLtkgya) {
    const files = afterLtkgya.split(',').map((file) => file.trim());
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));

    if (pdfFiles.length > 0) {
      sourcesHtml += '<div class="sources-text">Sources:</div><ul>';
      pdfFiles.forEach((file) => {
        sourcesHtml += `
          <li><a href="http://localhost:5000/files/${file}">${file}</a></li>
        `;
      });
      sourcesHtml += '</ul>';
    }
  }

  // Render the final structure
  return (
    <div>
      {tableSection}
      <div dangerouslySetInnerHTML={{ __html: sourcesHtml }} />
    </div>
  );
};


  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "") {
      // Add the user message to the chat
      setMessages([...messages, { text: inputMessage, sender: "user" }]);
      setInputMessage("");
      setIsSending(true); // Disable sending while waiting for bot response
      setIsBotThinking(true); // Show the bot's thinking message

      // Simulate a "thinking..." message from the bot before making the request
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Bot is thinking...", sender: "bot", isThinking: true },
      ]);

      try {
        // Simulate a delay to show the bot is thinking
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for "thinking" effect

        // Call the backend API
        const response = await fetch("http://localhost:5000/submit-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: inputMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = checkAndRenderResult(data.answer); // Pass the bot's answer here

          // Add the bot's actual response to the chat
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.isThinking ? { ...msg, text: result, isThinking: false } : msg
            )
          );
        } else {
          alert("Error: Unable to get query response from backend");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error: Something went wrong with the query request");
      } finally {
        setIsSending(false); // Re-enable sending after response
        setIsBotThinking(false); // Hide "thinking" message
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isSending) {
      handleSendMessage();
    }
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
      {!isWindowMaximized && (
        <div className="chat-window">
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
                // Handle file upload if needed
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
