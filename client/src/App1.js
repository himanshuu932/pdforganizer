import React, { useState, useEffect } from "react";
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
  }, [activeScreen]);

  const handlechat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar setActiveScreen={setActiveScreen} />
      {/* Start Screen */}
      <div className="start-screen-section">
        {activeScreen === 1 && <StartScreen onConversationClick={handlechat} setActiveScreen={setActiveScreen} />}
        {activeScreen === 2 && <DocumentModal setActiveScreen={setActiveScreen} />}
        {activeScreen === 3 && <FileUpload />}
        {activeScreen === 4 && <AboutUs />}

        {isChatOpen && <ChatSection onConversationClick={handlechat} />}
      </div>
    </div>
  );
}

export default App;
