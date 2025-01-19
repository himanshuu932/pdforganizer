import React, { useState, useEffect } from 'react';
import "./App.css";
import chatIcon from "./icons/chat.png";
import filesIcon from "./icons/files.png";
import settingsIcon from "./icons/settings.png";
import toggleIcon from "./icons/toggle.png";
import attachIcon from "./icons/attach.png";
import sendIcon from "./icons/send.png";

function App() {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Fetch files from the backend
  useEffect(() => {
    fetch('http://localhost:5000/files')
      .then((res) => res.json())
      .then((data) => {
        console.log('Files fetched:', data); // Debug log
        setFiles(data);
      })
      .catch((err) => console.error('Error fetching files:', err));
  }, []);

  // Handle file click to open in a new tab
  const handleFileClick = (fileName) => {
    const fileUrl = `http://localhost:5000/files/${fileName}`;
    window.open(fileUrl, '_blank'); // Open file in a new browser tab
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px', marginBottom: '20px' }}>
        Files
      </h1>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {files.length > 0 ? (
          files.map((file, index) => (
            <li
              key={index}
              onClick={() => handleFileClick(file)}
              style={{
                cursor: 'pointer',
                width: '100px',
                padding: '10px 15px',
                margin: '5px 0',
               
                backgroundColor: 'transparent',
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                //transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9f9f9')}
            >
              {file}
            </li>
          ))
        ) : (
          <p>No files available.</p>
        )}
      </ul>
    </div>
  );
}

export default App;
