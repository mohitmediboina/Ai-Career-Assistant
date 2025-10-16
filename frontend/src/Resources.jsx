import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MyContext } from "./MyContext";
import Sidebar from "./Sidebar.jsx";
import ResumeAnalysisPage from "./ResumeAnalysisPage.jsx";

const Resources = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { convoIdsList, setAuth, setMessages, setConvoId, setCurrentTitle } = useContext(MyContext);

  const handleNewChat = () => {
    setMessages([]);
    setConvoId(null);
    setCurrentTitle("Ai Career Assistant");
    navigate("/");
    setIsSidebarOpen(false);
  };

  const handleSelectConvo = (id, title) => {
    navigate(`/chat/${id}`);
    setCurrentTitle(title);
    setIsSidebarOpen(false);
  };

  const logout = () => {
    localStorage.clear();
    setAuth(null);
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onNewChat={handleNewChat}
        onSelectConvo={handleSelectConvo}
        conversations={convoIdsList}
        currentConvoId={null}
      />

      {/* Main Content */}
      <div className="h-screen flex flex-col bg-[#212121] text-white flex-1">
        {/* Header */}
        <header className="p-3 border-b border-stone-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-white hover:bg-[#303030] rounded p-2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Resources</h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-sm"
          >
            Logout
          </button>
        </header>

        {/* Resources Content */}
        <main className="flex-1 overflow-y-auto p-2">
          <ResumeAnalysisPage/>
        </main>
      </div>
    </div>
  );
};

export default Resources;