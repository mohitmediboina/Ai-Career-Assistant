import React, { useState, useContext } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MainContent from "./components/MainContent.jsx";
import { MyContext } from "./MyContext.jsx";

const ChatLayout = () => {
  const { convoIdsList, convoId, setCurrentTitle } = useContext(MyContext);
  const [currentSection, setCurrentSection] = useState("Chat");

  const handleSelectConvo = (id, title) => {
    setCurrentSection("Chat");
    setCurrentTitle(title || "Ai Career Assistant");
  };

  const navigateToHome = () => {
    setCurrentSection("Chat");
    setCurrentTitle("Ai Career Assistant");
  };

  return (
    <div className="flex w-full h-screen text-white overflow-hidden">
      <Sidebar
        convoIdsList={convoIdsList}
        convoId={convoId}
        handleSelectConvo={handleSelectConvo}
        navigateToHome={navigateToHome}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />
      <MainContent currentSection={currentSection} />
    </div>
  );
};

export default ChatLayout;
