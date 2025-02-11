import React, { useState, useEffect } from "react";
import axios from "axios";
import Home1 from "./Home"; // Assuming Home1 is another component you have.
import "./App.css";
import logo from "./icons/google.jpg";

const App = () => {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    // Check if the username exists in the URL query string
    const queryParams = new URLSearchParams(window.location.search);
    const usernameFromURL = queryParams.get("username");

   
      fetchCurrentUser(); // Fetch user data when no username is found in the URL
    
  }, []);

  const handleLogin = () => {
    console.log("🔄 Redirecting to Google Login...");
    window.location.href = "http://localhost:5000/auth/google";
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/auth/current_user', {
        withCredentials: true,  // ✅ Required for cookies/session
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      return null;
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
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly transparent white background
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
            width: "300px", // Fixed width for consistency
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "16px" }}>Sign In</h3>
          <button
            onClick={handleLogin}
            style={{
              padding: "7.5px 20px",
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
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
