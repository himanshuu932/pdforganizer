import React, { useState } from "react";
import "./styles/Navbar.css";
import SearchFiles from "./SearchFiles";
import darkmode from '../icons/dark.png';
import lightmode from '../icons/light2.png';

function Navbar({setActiveScreen}) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  

  return (
    <nav className={`navbar ${isDarkMode ? "dark" : "light"}`}>
      {/* Brand Section */}
      <div className="navbar-brand">
        My App
      </div>

      {/* Center Links Section */}
      <ul className="navbar-links">
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(1)}>Home</a>
        </li>
        <li className="nav-item">
          <a className="nav-link"onClick={()=>setActiveScreen(2)}>Documents</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(3)}>Upload</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(4)}>About Us</a>
        </li>
      </ul>

      {/* Mode Toggle Button and Search Section */}
      <div className="search-form">
        <button className="mode-toggle" onClick={toggleTheme}>
          {isDarkMode ? (
            <img src={lightmode} alt="Light Mode" className="icon-image" />
          ) : (
            <img src={darkmode} alt="Dark Mode" className="icon-image" />
          )}
        </button>

        {/* Search Input Section */}
       
      </div>
    </nav>
  );
}

export default Navbar;
