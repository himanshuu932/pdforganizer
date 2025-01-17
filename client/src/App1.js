import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import "./App.css";

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
         alert(`Query Result: ${data.answer}`);
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
       .filter(row => row.trim() !== '' && row.includes('|') && !/^(\|[-\s]*\|)+$/.test(row))
       .map(row => row.split('|').map(col => col.trim()));
 
     const headers = rows[0];
     const tableData = rows.slice(1).map(row => {
       if (row.length === headers.length) {
         return {
           description: formatBoldText(row[0]),
           fee: row[1],
           additionalFee: row[2] || '0.00',
           total: row[3],
         };
       } else {
         return null;
       }
     }).filter(row => row !== null);
 
     return { headers, tableData };
   };
 
   const formatBoldText = (text) => {
     return text.replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong>${p1}</strong>`);
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
               <td dangerouslySetInnerHTML={{ __html: row.description }}></td>
               <td>{row.fee}</td>
               <td>{row.additionalFee}</td>
               <td>{row.total}</td>
             </tr>
           ))}
         </tbody>
       </table>
     );
   };
 
   const renderNormalText = (data) => {
     return <pre className="normal-text">{data}</pre>;
   };

  return (
    <div className="app-container">
      <header>
        <h1>Smart PDF Search & Management</h1>
      </header>
      <main>
        <FileUpload  />
        <h1>Query</h1>
      <div className="sections-container">
        {/* File Upload Section */}
      

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
          {result.includes('|') ? renderTable(result) : renderNormalText(result)}
        </div>
      )}
      </main>
    </div>
  );
};

export default App;