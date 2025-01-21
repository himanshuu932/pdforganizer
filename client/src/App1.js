import React, { useState } from "react";
import Navbar from "./components/Navbar";
import StartScreen from "./components/StartScreen";
import DocumentModal from "./components/DocumentModal";
import ChatSection from "./components/ChatSection";
import "./App.css";
import FileUpload from "./components/FileUpload";
import AboutUs from "./components/AboutUs";

function App() {
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const[activeScreen, setActiveScreen] = useState(1);
  

  const handlechat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar setActiveScreen={setActiveScreen}/>
      {/* Start Screen */}
      <div className="start-screen-section">
       {activeScreen==1 && <StartScreen onConversationClick={handlechat} setActiveScreen={setActiveScreen}/>}
        {activeScreen==2 && <DocumentModal setActiveScreen={setActiveScreen} />}
        {activeScreen==3 && <FileUpload />}
        {activeScreen==4 && <AboutUs/>}

        {isChatOpen && <ChatSection onConversationClick={handlechat} />}
      </div>
    </div>
  );
}

export default App;
