import React, { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = () => {
    if (file) {
      alert(`File uploaded: ${file.name}`);
    } else {
      alert('No file selected!');
    }
  };

  return (
    <section id="file-upload" style={styles.container}>
      <h2 style={styles.heading}>Upload File</h2>
      <input
        type="file"
        onChange={handleFileChange}
        style={styles.input}
      />
      <button onClick={handleFileUpload} style={styles.button}>
        Upload
      </button>
    </section>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#e9e9e9',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    marginTop: '20px',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  input: {
    marginBottom: '10px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default FileUpload;
