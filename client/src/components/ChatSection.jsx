import React, { useState, useRef, useEffect } from "react";
import attachIcon from "../icons/attach.png";
import sendIcon from "../icons/send.png";
import "./styles/Chat.css";
import chatIcon from "../icons/chat.png";

const ChatSection = ({ setActiveScreen, messages, setMessages }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(true); // Manage chat visibility
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCloseChat = () => {
    setActiveScreen(1); // Close the chat
  };

  const parseTableData = (data) => {
    const rows = data
      .split("\n")
      .filter((row) => row.trim() !== "" && row.includes("|"))
      .map((row) => row.split("|").map((col) => col.trim()));

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
    const tableStartIndex = data.indexOf("table-starts");
    const tableEndIndex = data.indexOf("table-ends");

    if (tableStartIndex !== -1 && tableEndIndex !== -1) {
      const beforeTable = data.slice(0, tableStartIndex).trim();
      const tableContent = data
        .slice(tableStartIndex + "table-starts".length, tableEndIndex)
        .trim();
      const afterTable = data.slice(tableEndIndex + "table-ends".length).trim();

      return { hasTable: true, beforeTable, tableContent, afterTable };
    }

    return { hasTable: false }; // No table found
  };

  // Main function to handle overall rendering
  const checkAndRenderResult = (data) => {
    // Split the content into two parts using the /ltkgya- marker
    const ltkgyaIndex = data.indexOf("/ltkgya-");
    let beforeLtkgya = "";
    let afterLtkgya = "";

    if (ltkgyaIndex !== -1) {
      beforeLtkgya = data.slice(0, ltkgyaIndex).trim(); // Text before /ltkgya-
      afterLtkgya = data.slice(ltkgyaIndex + "/ltkgya-".length).trim(); // Text after /ltkgya-
    } else {
      beforeLtkgya = data.trim(); // If no marker is found, treat all as beforeLtkgya
    }

    // Remove 'sources-' from afterLtkgya if it exists
    if (afterLtkgya.startsWith("sources-")) {
      afterLtkgya = afterLtkgya.slice("sources-".length).trim();
    }

    // Remove symbols /, \, *, and filename-uploads\ from afterLtkgya
    afterLtkgya = afterLtkgya
      .replace(/sources/g, "")
      .replace(/[\/\\\*]/g, "") // Remove /, \, *
      .replace(/filename-uploads\\/g, "")
      .replace(/\*\*/g, ""); // Remove all instances of filename-uploads\

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
    let sourcesHtml = "";
    if (afterLtkgya) {
      console.log("afterLtkgya\n" + afterLtkgya);

      const ids = afterLtkgya.indexOf("Ids");
      const beforeids = afterLtkgya.slice(0, ids).trim(); // Text before /Ids
      const afterids = afterLtkgya.slice(ids + "Ids".length).trim(); // Skip '/Ids'

      console.log("beforeids\n" + beforeids);
      console.log("afterids\n" + afterids);

      const files = beforeids.split(",").map((file) => file.trim());
      const fileIds = afterids.split(",").map((id) => id.trim());

      // Ensure we only process valid PDF files and match them with their IDs
      const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

      if (pdfFiles.length > 0 && pdfFiles.length === fileIds.length) {
        sourcesHtml +=
          '<div className="sources-text">Sources:</div><ul>';
        pdfFiles.forEach((file, index) => {
          console.log(file);
          const fileId = fileIds[index]; // Match each file with its corresponding ID
          sourcesHtml += `
            <li><a href="https://drive.google.com/file/d/${fileId}/view" target="_blank">${file}</a></li>
          `;
        });
        sourcesHtml += "</ul>";
      } else {
        console.error(
          "Mismatch between file names and file IDs or no valid PDF files found."
        );
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

  // Updated function to handle sending the message with JWT in the header
  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "") {
      // Add the user message to the chat
      setMessages([...messages, { text: inputMessage, sender: "user" }]);
      setInputMessage("");
      setIsSending(true);
      setIsBotThinking(true);

      // Simulate a "thinking..." message from the bot before making the request
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Bot is thinking...", sender: "bot", isThinking: true },
      ]);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Retrieve JWT from localStorage
        const token = localStorage.getItem("token");

        // Make API call with JWT in the Authorization header
        const response = await fetch("https://pdforganizer-vt1s.onrender.com/api/pdf/submit-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ query: inputMessage }),
        });
         const data=await response.json();
        
        if (data.ok) {
      
          const result =await  checkAndRenderResult(data.answer); // Process the bot's answer
             
          // Update the bot's "thinking" message with the actual result
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.isThinking ? { ...msg, text: result, isThinking: false } : msg
            )
          );
        } else {
          const text = "Something went wrong";
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.isThinking ? { ...msg, text: text, isThinking: false } : msg
            )
          );
        }
      } catch (error) {
        const text = "Something went wrong";
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.isThinking ? { ...msg, text: text, isThinking: false } : msg
          )
        );
      } finally {
        setIsSending(false);
        setIsBotThinking(false);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isSending) {
      handleSendMessage();
    }
  };

  return (
    <div className={`chat-container`}>
      <div className="chat-header">
        <img src={chatIcon} alt="Chat Icon" className="icon-image" />
        <div>
          <button className="clear-btn" onClick={() => setMessages([])}>
            Clear
          </button>
          <button className="close-btn" onClick={handleCloseChat}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="25"
              fill="currentColor"
              className="bi bi-x-square"
              viewBox="0 0 16 16"
            >
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
          </button>
        </div>
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
        <div ref={messagesEndRef} />
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
