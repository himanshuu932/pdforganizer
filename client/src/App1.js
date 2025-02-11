import React, { useState, useEffect, act } from "react";
import Navbar from "./components/Navbar";
import StartScreen from "./components/StartScreen";
import DocumentModal from "./components/DocumentModal";
import ChatSection from "./components/ChatSection";
import "./App.css";
import AboutUs from "./components/AboutUs";

function Home1({ user, setUser,saved,setSaved }) {
  // Check localStorage for the saved activeScreen value or default to 1
  const savedScreen = localStorage.getItem("activeScreen");
  const [activeScreen, setActiveScreen] = useState(savedScreen?parseInt(savedScreen):1);
  const [savedFolderLink, setSavedFolderLink] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(true);
  
  useEffect(() => {
    localStorage.setItem("activeScreen", activeScreen);
    activeScreen==3? openChat():closeChat();
  }, [activeScreen]);
  const body = document.body;

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
      <Navbar setActiveScreen={setActiveScreen} user={user} setUser={setUser} 
      connectionStatus={connectionStatus} 
      />
      {/* Start Screen */}
      <div className="start-screen-section">
        {activeScreen === 1 && <StartScreen  setActiveScreen={setActiveScreen} />}
        {activeScreen === 2 && 
        <DocumentModal activeScreen={activeScreen} 
         savedFolderLink={savedFolderLink} 
         setSavedFolderLink={setSavedFolderLink}
         connectionStatus={connectionStatus}
         setConnectionStatus={setConnectionStatus}
         />}
        
        {activeScreen === 4 && <AboutUs />}
        {activeScreen === 3 && <ChatSection setActiveScreen={setActiveScreen}   messages={messages} setMessages={setMessages} />}
      </ div>
    </div>
  );
}

export default Home1;