import React, { useState, useEffect } from "react";
import axios from "axios";
import Home1 from "./Home"; // Adjust path if needed
import logo from "./icons/google.jpg";
import l from "./icons/chat.png";

const App = () => {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(null);

  // Manual dark mode flag
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check URL for token and username query parameters.
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromURL = queryParams.get("token");
    const usernameFromURL = queryParams.get("username");

    if (tokenFromURL) {
      // Save the token to localStorage for subsequent API calls
      localStorage.setItem("token", tokenFromURL);
      // Optionally, save the username if needed
      localStorage.setItem("username", usernameFromURL || "");
      // Clean up the URL (remove query parameters)
      window.history.replaceState({}, document.title, "/");
    }

    fetchCurrentUser();
  }, []);

  const handleLogin = () => {
    console.log("🔄 Redirecting to Google Login...");
    // Update to your actual backend auth endpoint:
    window.location.href = " https://pdforganizer-vt1s.onrender.com/auth/google";
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(" https://pdforganizer-vt1s.onrender.com/auth/current_user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      // If invalid token, remove it
      localStorage.removeItem("token");
    }
  };

  return (
    <>
      {/* Inline CSS, defining both light mode and dark mode classes */}
      <style>{`
        /* ===== Light Mode (Default) ===== */
        .container_659 {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-image: url("./icons/43534.jpg");
          background-size: cover;
          background-position: center;
          padding: 40px;
          transition: background-color 0.3s ease-in-out;
        }

        .xyz_659 {
          background-color: rgba(255, 255, 255, 0.8);
          padding: 30px 50px;
          border-radius: 8px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .logo_659 {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .name_659 {
          font-size: 44px;
          font-weight: bold;
          margin-top: 10px;
        }

        .sign_659 {
          display: inline-flex;
          align-items: center;
          background-color: #4285f4;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
          text-decoration: none;
          transition: background-color 0.2s ease-in-out;
        }

        .sign_659:hover {
          background-color: #357ae8;
        }

        .sign_659 img {
          margin-right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }

        .logo_659 img {
          width: 200px;
          height: 200px;
        }

        /* ===== Dark Mode Overrides ===== */
        /* When isDarkMode === true, we add 'dark-mode_659' to .container_659 */
        .dark-mode_659 {
          background-color: #121212 !important;
          background-image: none !important;
          color: #fff !important;
        }

        .dark-mode_659 .xyz_659 {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }

        /* Invert images in dark mode */
        .dark-mode_659 .logo_659 img,
        .dark-mode_659 .sign_659 img {
          filter: invert(1);
        }
      `}</style>

      {/* Conditionally apply dark-mode_659 if isDarkMode is true */}
      <div className={`container_659 ${isDarkMode ? "dark-mode_659" : ""}`}>
        {!user ? (
          <div className="xyz_659">
            <div className="logo_659">
              <img src={l} alt="Chat Logo" />
              <div className="name_659">Peek-Pdf</div>
            </div>

            <button className="sign_659" onClick={handleLogin}>
              <img src={logo} alt="Google Logo" />
              Sign in with Google
            </button>
          </div>
        ) : (
          /* Pass dark mode state & setter to Home1 so it can be toggled from there */
          <Home1
            user={user}
            setUser={setUser}
            saved={saved}
            setSaved={setSaved}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
      </div>
    </>
  );
};

export default App;
