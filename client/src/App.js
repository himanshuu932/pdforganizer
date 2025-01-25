import React, { useState, useEffect } from "react";
import axios from "axios";
import Home1 from "./App1"; // Assuming Home1 is another component you have.
import "./App.css"; 

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/current_user", { withCredentials: true })
      .then((res) => {
        console.log("🔍 Current user:", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.error("❌ Error fetching user:", err);
        setUser(null);
      });
  }, []);

  const handleLogin = () => {
    console.log("🔄 Redirecting to Google Login...");
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div>
      {!user ? (
        <div
         className="xyz"
        >
          <h3 style={{ marginBottom: "16px" }}>Sign In</h3>
          <button
            onClick={handleLogin}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <Home1 user={user} setUser={setUser} />
      )}
    </div>
  );
};

export default App;
