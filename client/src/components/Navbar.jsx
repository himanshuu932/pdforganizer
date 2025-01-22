import React, { useState } from "react";
import "./styles/Navbar.css";
import SearchFiles from "./SearchFiles";
import darkmode from '../icons/dark.png';
import lightmode from '../icons/light.png';

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
        PeeP
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
          <a className="nav-link" onClick={()=>setActiveScreen(3)}>Chat</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(4)}>Upload</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(5)}>About Us</a>
        </li>
      </ul>

      {/* Mode Toggle Button and Search Section */}
      <div className="search-form">
      <img
  src={isDarkMode ? lightmode : darkmode}
  alt={isDarkMode ? "Light Mode" : "Dark Mode"}
  className="mode-toggle icon-image"
  onClick={toggleTheme}
/>


        {/* Search Input Section */}
       
      </div>
    </nav>
  );
}

export default Navbar;
