import React, { useState } from "react";
import attachIcon from "../icons/attach.png";
import sendIcon from "../icons/send.png";
import './styles/Chat.css'
import chatIcon from "../icons/chat.png";
const ChatSection = ({setActiveScreen}) => {

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(true); // Manage chat visibility
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
  
  const handleCloseChat = () => {
    setActiveScreen(1); // Close the chat
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
    .replace(/filename-uploads\\/g, '').replace(/\*\*/g, ''); // Remove all instances of filename-uploads\

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
    console.log("afterLtkgya\n" + afterLtkgya);
  
    const ids = afterLtkgya.indexOf('Ids');
    const beforeids = afterLtkgya.slice(0, ids).trim(); // Text before /Ids
    const afterids = afterLtkgya.slice(ids + 'Ids'.length).trim(); // Skip '/Ids'
  
    console.log("beforeids\n" + beforeids);
    console.log("afterids\n" + afterids);
  
    const files = beforeids.split(',').map((file) => file.trim());
    const fileIds = afterids.split(',').map((id) => id.trim());
  
    // Ensure we only process valid PDF files and match them with their IDs
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));
  
    if (pdfFiles.length > 0 && pdfFiles.length === fileIds.length) {
      sourcesHtml += '<div className="sources-text">Sources:</div><ul>';
      pdfFiles.forEach((file, index) => {
        console.log(file);
        const fileId = fileIds[index]; // Match each file with its corresponding ID
        sourcesHtml += `
          <li><a href="https://drive.google.com/file/d/${fileId}/view" target="_blank">${file}</a></li>
        `;
      });
      sourcesHtml += '</ul>';
    } else {
      console.error('Mismatch between file names and file IDs or no valid PDF files found.');
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
        await new Promise(resolve => setTimeout(resolve, 1500));
  
        // Correct placement of credentials
        const response = await fetch("http://localhost:5000/api/pdf/submit-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensures cookies are sent with the request
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
         const text= `Something went wrong `;
         setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.isThinking ? { ...msg, text: text, isThinking: false } : msg
          )
        );
       
        }
      } catch (error) {
        const text= `Something went wrong `;
         setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.isThinking ? { ...msg, text: text, isThinking: false } : msg
          )
        );
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

 

  return (
    <div className={`chat-container `}>
    <div className="chat-header">
      <img src={chatIcon} alt="Chat Icon" className="icon-image" />
      
      <button className="close-btn" onClick={handleCloseChat}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
</svg></button>
    </div>
    <div className="messages" id="chatMessages">
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
  
  
  );
};

export default ChatSection;
