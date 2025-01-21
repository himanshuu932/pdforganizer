import React from "react";
import "./DocumentModal.css";

const DocumentModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Documents</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-filters">
          <button>All Folders</button>
          <button>File type</button>
          <button>Date range</button>
          <input
            type="text"
            placeholder="Search for files"
            className="search-input"
          />
        </div>
        <div className="modal-body">
          <div className="empty-state">
            <img
              src="https://via.placeholder.com/100" // Replace with actual cloud image
              alt="Cloud icon"
              className="empty-icon"
            />
            <p>Oops! You haven’t uploaded any document</p>
            <button className="upload-button">Upload</button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="footer-button cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="footer-button start-button" disabled>
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
