import React, { useState } from "react";
import "./App.css";
import chatIcon from "./icons/chat.png";
import filesIcon from "./icons/files.png";
import settingsIcon from "./icons/settings.png";
import toggleIcon from "./icons/toggle.png";
import attachIcon from "./icons/attach.png";
import sendIcon from "./icons/send.png";
import FileUpload from "./components/FileUpload";
function App() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // Track if the message is being sent
  const [isBotThinking, setIsBotThinking] = useState(false); // Track if bot is thinking
  const [selectedFile, setSelectedFile] = useState(null);

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
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

  const checkAndRenderResult = (data) => {
    const tableStartIndex = data.indexOf('table-starts');
    const tableEndIndex = data.indexOf('table-ends');
    
    if (tableStartIndex !== -1 && tableEndIndex !== -1) {
      const beforeTable = data.slice(0, tableStartIndex).trim();
      const tableContent = data
        .slice(tableStartIndex + 'table-starts'.length, tableEndIndex)
        .trim();
      const afterTable = data.slice(tableEndIndex + 'table-ends'.length).trim();

      return (
        <div>
          {beforeTable && <div className="normal-text">{beforeTable}</div>}
          {renderTable(tableContent)}
          {afterTable && <div className="normal-text">{afterTable}</div>}
        </div>
      );
    }

    // No table structure, display as plain text
    return <div className="normal-text">{data}</div>;
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
  
    // Simple check to ensure it's an image file
    if (file ) {
      alert(` ${file.name}`);
      setSelectedFile(file);
      // You can further handle the file here (e.g., previewing or uploading)
      const formData = new FormData();
      formData.append("file", selectedFile);
  
      try {
  
       alert("Starting file upload...");
  
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        alert("File uploaded successfully");
        const data = await response.json();
        alert(data.textData);
        alert(data.messages);
       //  st(data.extractedText);
       // setUploadedFile(data.file);
       // setUploadProgress(100); // Mark upload as complete
       //console.log("File uploaded successfully:", data.file);
      } catch (err) {
       // setErrorMessage(`Error uploading file: ${err.message}`);
        console.error("Upload error:", err);
      } 
    } else {
      alert("Please upload a valid file");
    }
  };
  


  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isSending) {
      handleSendMessage();
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
          <li>
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
        <label htmlFor="file-upload" className="upload-icon">
            <img src={attachIcon} alt="Attach" className="attach-image" />
            <input
              id="file-upload"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
          <FileUpload selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
          <input
            type="text"
            placeholder="Type a message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown} // Add this event handler
            disabled={isSending} // Disable input while waiting for the response
          />
          <button
            onClick={handleSendMessage}
            className="send-icon"
            disabled={isSending} // Disable button while waiting for the response
          >
            <img src={sendIcon} alt="Send" className="send-image" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
