import React from "react";

const SearchResults = ({ results }) => {
  return (
    <div className="search-results-container">
      <h2>Search Results</h2>
      {results.length > 0 ? (
        results.map((result) => (
          <div key={result.id} className="result-item">
            <h3>{result.title}</h3>
            <p>{result.snippet}</p>
          </div>
        ))
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
};

export default SearchResults;
