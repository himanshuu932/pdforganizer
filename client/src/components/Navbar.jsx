import React, { useState } from "react";
import "./styles/Navbar.css";
import SearchFiles from "./SearchFiles";
import darkmode from '../icons/dark.png';
import lightmode from '../icons/light.png';
import axios from "axios";
function Navbar({setActiveScreen,user, setUser }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const handleLogout = () => {
    fetch("http://localhost:5000/auth/logout", {
      method: "GET",
      credentials: "include", // Include cookies for session tracking
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === "OK") {
          setUser(null);
          console.log("Logout successful");
        } else {
          console.log("Logout failed", data);
        }
      });
  
  };

  const getFirstName = () => {
    return user?.name?.split(" ")[0] || "User";
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
       {/* <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(4)}>Upload</a>
        </li>*/}
        <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(5)}>About Us</a>
        </li>
       {/*   <li className="nav-item">
          <a className="nav-link" onClick={()=>setActiveScreen(6)}>drive</a>
        </li>*/}
      </ul>

      {/* Mode Toggle Button and Search Section */}
      <div className="search-form">
      <span className="user-name">{getFirstName()}</span>
      <img
  src={isDarkMode ? lightmode : darkmode}
  alt={isDarkMode ? "Light Mode" : "Dark Mode"}
  className="mode-toggle icon-image"
  onClick={toggleTheme}
/><button className="logout-button" onClick={handleLogout}>
            Logout
          </button>


        {/* Search Input Section */}
       
      </div>
    </nav>
  );
}

export default Navbar;