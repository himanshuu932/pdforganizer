// Chat.js
import React from 'react';

const Chat = ({ chat, isProcessing, query, handleInputChange, handleQuerySubmit }) => {
  // Function to parse and render the table from the backend response
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

  // Function to check if the response contains a table and render accordingly
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
    <div className="chat-container">
      <div className="chat-box">
        {chat.map((message, index) => (
          <div key={index} className={`chat-message ${message.type}`}>
            <div className="message-bubble">{message.message}</div>
            {message.type === 'backend' && message.message.includes('table-starts') && (
              <div className="table-content">
                {checkAndRenderResult(message.message)}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="chat-message processing">
            <div className="message-bubble">Processing...</div>
          </div>
        )}
      </div>
      <div className="input-section">
        <input
          type="text"
          name="query"
          value={query}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button className="send-button" onClick={handleQuerySubmit}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
