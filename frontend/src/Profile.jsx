import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MyContext } from "./MyContext.jsx";
import Sidebar from "./Sidebar.jsx";
import { getProfile, updateProfile } from "./services/api.js";

const Profile = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    convoIdsList,
    auth,
    setAuth,
    setMessages,
    setConvoId,
    setCurrentTitle,
  } = useContext(MyContext);

  const token = auth.token;

  const [profile, setProfile] = useState({ name: "", skills: [], resume: "" });

  useEffect(() => {
    getProfile(token).then((data) => setProfile(data.profile || {}));
  }, [token]);

  const handleSave = async () => {
    const updated = await updateProfile(token, profile);
    setProfile(updated.profile);
    alert("Profile Saved");
  };

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
        currentConvoId={null}
        conversations={convoIdsList}
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
            <h1 className="text-lg font-semibold">Projects</h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-sm"
          >
            Logout
          </button>
        </header>

        {/* Projects Content */}
        <main className="flex-1 overflow-y-auto p-10">
          <div className="flex flex-col gap-3 wrap ">
            <h2>My Profile</h2>
            <h3>Name</h3>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Name"
              className="border p-2"
            />
            <h3>Skills</h3>
            <input
              className="border p-2"
              value={profile.skills.join(", ")}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  skills: e.target.value.split(",").map((s) => s.trim()),
                })
              }
              placeholder="Skills (comma separated)"
            />
            <h3>User's Context(resume/academic data/employment)</h3>
            <textarea
              value={profile.resume}
              onChange={(e) =>
                setProfile({ ...profile, resume: e.target.value })
              }
              placeholder="Resume summary"
              className="border h-[200px] p-3"
            />
            <div className="flex items-center w-full justify-center">
              <button className="bg-green-500 w-[10%] rounded-4xl py-2 px-4 text-center " onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
