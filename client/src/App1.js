import React, { useState, useEffect, act } from "react";
import Navbar from "./components/Navbar";
import StartScreen from "./components/StartScreen";
import DocumentModal from "./components/DocumentModal";
import ChatSection from "./components/ChatSection";
import "./App.css";
import FileUpload from "./components/FileUpload";
import AboutUs from "./components/AboutUs";

function App() {
  // Check localStorage for the saved activeScreen value or default to 1
  const savedScreen = localStorage.getItem("activeScreen");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState(savedScreen ? parseInt(savedScreen) : 1);

  // Save activeScreen to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeScreen", activeScreen);
    activeScreen==3? openChat():closeChat();
  }, [activeScreen]);
  const body = document.body;

  // Function to open the chat
  function openChat() {
    // Show the chat container
    body.classList.add('blurred');       // Add blur effect
  }
  
  // Function to close the chat
  function closeChat() {
   // chatContainer.style.display = 'none'; // Hide the chat container
    body.classList.remove('blurred');    // Remove blur effect
  }
  

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar setActiveScreen={setActiveScreen} />
      {/* Start Screen */}
      <div className="start-screen-section">
        {activeScreen === 1 && <StartScreen  setActiveScreen={setActiveScreen} />}
        {activeScreen === 2 && <DocumentModal setActiveScreen={setActiveScreen} />}
        {activeScreen === 4 && <FileUpload />}
        {activeScreen === 5 && <AboutUs />}

        {activeScreen === 3 && <ChatSection setActiveScreen={setActiveScreen} />}
      </div>
    </div>
  );
}

export default App;
