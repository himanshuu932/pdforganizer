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
    axios
      .get("http://localhost:5000/api/logout", { withCredentials: true })
      .then((response) => {
        if (response.data.message === "OK") {
          setUser(null);
          localStorage.removeItem("userData");
          sessionStorage.clear();
          window.location.href = "/";
        }
      })
      .catch((err) => {
        console.error("❌ Error logging out:", err);
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