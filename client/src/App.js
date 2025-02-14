import React, { useState, useEffect } from "react";
import axios from "axios";
import Home1 from "./Home"; // Assuming Home1 is another component you have.
import "./App.css";
import logo from "./icons/google.jpg";
import l from "./icons/chat.png";

const App = () => {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    // Check URL for token and username query parameters.
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromURL = queryParams.get("token");
    const usernameFromURL = queryParams.get("username");

    if (tokenFromURL) {
      // Save the token to localStorage for subsequent API calls
      localStorage.setItem("token", tokenFromURL);
      // Optionally, you can save the username if needed
      localStorage.setItem("username", usernameFromURL);
      // Clean up the URL (remove query parameters)
      window.history.replaceState({}, document.title, "/");
    }

    // Fetch current user data using the stored JWT.
    fetchCurrentUser();
  }, []);

  const handleLogin = () => {
    console.log("🔄 Redirecting to Google Login...");
    window.location.href = "https://pdforganizer-vt1s.onrender.com/auth/google";
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("https://pdforganizer-vt1s.onrender.com/auth/current_user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      // Optionally, clear the token if it is invalid
      localStorage.removeItem("token");
    }
  };

  return (
    <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundImage: 'url("your-image-url.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "40px",
    }}
  >
    {!user ? (
      <div
        className="xyz"
        
      >
        <div className="logo">
        
          <img
            src={l}
            alt="Chat Logo"
            style={{
              width: "150px",
              height: "150px",
            }}
          />
          <div className="name">PeekPDF</div>
        
        </div>

        <button className="sign" onClick={handleLogin}>
          <img
            src={logo}
            alt="Google Logo"
            style={{
              width: "20px",
              height: "20px",
            }}
          />
          Sign in with Google
        </button>
      </div>
    ) : (
      <Home1 user={user} setUser={setUser} saved={saved} setSaved={setSaved} />
    )}
  </div>
  );
};

export default App;
