import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import "./App.css";
import Main from "./components/Main";

const App = () => {
  const [filePath, setFilePath] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'file_path') {
      setFilePath(value);
    } else if (name === 'query') {
      setQuery(value);
    }
  };

  const handleQuerySubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/submit-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.answer);
      } else {
        alert('Error: Unable to get query response from backend');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: Something went wrong with the query request');
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
          {beforeTable && <pre className="normal-text">{beforeTable}</pre>}
          {renderTable(tableContent)}
          {afterTable && <pre className="normal-text">{afterTable}</pre>}
        </div>
      );
    }

    // No table structure, display as plain text
    return <pre className="normal-text">{data}</pre>;
  };

  return (
    <div className="app-container">
      <header>
        <h1>Smart PDF Search & Management</h1>
      </header>
      <main>
        <FileUpload />
        <h1>Query</h1>
        <div className="sections-container">
          {/* Query Section */}
          <div className="query-section">
            <h2>Query</h2>
            <input
              type="text"
              name="query"
              value={query}
              onChange={handleInputChange}
              placeholder="Enter query"
            />
            <button onClick={handleQuerySubmit}>Send Query</button>
          </div>
        </div>

        {result && (
          <div>
            <h3>Backend Output:</h3>
            {checkAndRenderResult(result)}
          </div>
        )}
      </main>
    </div>
  );

};

export default App;
