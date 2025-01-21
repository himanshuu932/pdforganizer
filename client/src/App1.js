import React, { useState } from "react";
import Navbar from "./components/Navbar";
import StartScreen from "./components/StartScreen";
import DocumentModal from "./components/DocumentModal";
import ChatSection from "./components/ChatSection";
import "./App.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const[activeScreen, setActiveScreen] = useState(1);
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handlechat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar/>
      {/* Start Screen */}
      <div className="start-screen-section">
       { activeScreen==1 && <StartScreen onDocumentClick={openModal} onConversationClick={handlechat} setActiveScreen={setActiveScreen}/>}
        {activeScreen==2 && <DocumentModal onClose={closeModal} />}
        {isChatOpen && <ChatSection onConversationClick={handlechat} />}
      </div>
    </div>
  );
}

export default App;
