import React, { useState, useEffect, useRef } from "react";
import './sf.css';

const SearchFiles = ({ isVisible, onFileClick }) => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);
  const searchRef = useRef(null); // Reference for the search container

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/files");
      const data = await res.json();
      setFiles(data);
      setFilteredFiles(data);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchFiles();
    }
  }, [isVisible]);

  useEffect(() => {
    // Filter the files based on the search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter((file) =>
        file.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles([]);
    }
  }, [searchQuery, files]);

  useEffect(() => {
    // Close the search dropdown if the click is outside the search component
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery(''); // Optional: Clear the search input
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div ref={searchRef} className="file-search-container">
      <input
        type="text"
        className="file-search-input"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery.trim().length > 0 && (
        <ul className="file-list">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <li
                key={index}
                onClick={() => onFileClick(file)}
                className="file-item"
              >
                {file}
              </li>
            ))
          ) : (
            <li className="file-item" style={{ color: "gray" }}>
              No files found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchFiles;
