import React, { useState, useEffect } from "react";
import pdfIcon from "./icons/pdf.png";
import chatIcon from "./icons/chat.png";

function UploadSection(){
    const [isWindowMaximized, setIsWindowMaximized] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [viewingFile, setViewingFile] = useState(null);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [files, setFiles] = useState([]);

    const toggleFilesAndChat = () => {
        setIsWindowMaximized(!isWindowMaximized);  // Toggle files section
        setIsChatVisible(!isChatVisible);  // Toggle chat section
      };
      const handleSelectAll = () => {
        setSelectedFiles(files);
        setIsSelectionMode(true);
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

      return (
        <div className="upload">
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
      );

}

export default UploadSection;