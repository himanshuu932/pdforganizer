import React, { useState, useEffect } from "react";
import "./styles/Navbar.css";
import darkmode from "../icons/dark.png";
import lightmode from "../icons/light.png";

function Navbar({ setActiveScreen, user, setUser, connectionStatus, isProcessing,isDarkMode,setIsDarkMode }) {
 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Determine if viewport is mobile (less than 768px)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  // For JWT, logout is handled by removing the token from storage and clearing user state.
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    console.log("Logout successful. Token removed from localStorage.");
  };

  // Extract the first name from the user's full name.
  const fullFirstName = user?.name?.split(" ")[0] || "User";
  // In mobile mode, display only the first letter; otherwise, display the full first name.
  const displayName = isMobile ? fullFirstName.charAt(0) : fullFirstName;

  // When a nav item is clicked on mobile, change screen and close the menu.
  const handleNavClick = (screen) => {
    setActiveScreen(screen);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isDarkMode ? "dark" : "light"}`}>
      {/* Left Section: Hamburger (mobile) and Brand */}
      <div className="navbar-left">
        <div
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg width="30" height="30" viewBox="0 0 100 80" fill="currentColor">
            <rect width="100" height="10"></rect>
            <rect y="30" width="100" height="10"></rect>
            <rect y="60" width="100" height="10"></rect>
          </svg>
        </div>
        <div className="navbar-brand">Peek-Pdf</div>
      </div>

      {/* Desktop Center Navigation Links */}
      <ul className="navbar-links">
        <li className="nav-item">
          <a className="nav-link" onClick={() => setActiveScreen(1)}>
            Home
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={() => setActiveScreen(2)}>
            Documents
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={() => setActiveScreen(3)}>
            Chat
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" onClick={() => setActiveScreen(4)}>
            About Us
          </a>
        </li>
      </ul>

      {/* Right Section: Status Dot, Mode Toggle, Username, and Logout */}
      <div className="navbar-right">
        {isProcessing && (
         <svg
         xmlns="http://www.w3.org/2000/svg"
         width="30"
         height="30"
         fill="currentColor"
         className="bi bi-arrow-repeat"
         viewBox="0 0 16 16"
       >
         <g>
           <animateTransform
             attributeName="transform"
             attributeType="XML"
             type="rotate"
             from="0 8 8"
             to="360 8 8"
             dur="2s"
             repeatCount="indefinite"
           />
           <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9"/>
           <path
             fillRule="evenodd"
             d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
           />
         </g>
       </svg>
       
          
        )}
        <span className="status-dot">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            fill={!connectionStatus ? "red" : "green"}
            className="bi bi-dot"
            viewBox="0 0 16 16"
          >
            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
          </svg>
        </span>
        <img
          src={isDarkMode ? lightmode : darkmode}
          alt={isDarkMode ? "Light Mode" : "Dark Mode"}
          className="mode-toggle icon-image"
          onClick={toggleTheme}
        />
        <div className="user-name-display">{displayName}</div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Mobile Menu Dropdown: Navigation Links */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <ul>
            <li>
              <a onClick={() => handleNavClick(1)}>Home</a>
            </li>
            <li>
              <a onClick={() => handleNavClick(2)}>Documents</a>
            </li>
            <li>
              <a onClick={() => handleNavClick(3)}>Chat</a>
            </li>
            <li>
              <a onClick={() => handleNavClick(4)}>About Us</a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
