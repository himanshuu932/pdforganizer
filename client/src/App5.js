import React, { useState } from "react";
import StartScreen from "./components/StartScreen";
import DocumentModal from "./components/DocumentModal";
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="app">
     

      {/* Start Screen */}
      <div className="start-screen-section">
      {!isModalOpen && <StartScreen onDocumentClick={openModal} />}
        {isModalOpen && <DocumentModal onClose={closeModal} />}
      </div>
    </div>
  );
}

export default App;
