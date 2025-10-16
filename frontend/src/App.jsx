import React, { useEffect, useState } from "react";
import ChatWindow from "./ChatWindow.jsx";
import "./index.css";
import { MyContext } from "./MyContext.jsx";
import AuthPage from "./AuthPage.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./Profile.jsx";
import Resources from "./Resources.jsx";

const Chat = () => {
  return (
    <div className="flex w-full h-dvh text-white overflow-hidden">
      
      <ChatWindow />
    </div>
  );
};

const App = () => {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  const [convoId, setConvoId] = useState(null);
  const [convoIdsList,setConvoIdList] = useState(null);
  const [currentTitle,setCurrentTitle] = useState("Ai Career Assistant");

  const [auth, setAuth] = useState(() => {
    const storedAuth = localStorage.getItem("userDetails");
    return storedAuth ? JSON.parse(storedAuth) : null;
  });

  const providerValues = {
    input,
    setInput,
    reply,
    setReply,
    convoId,
    setConvoId,
    messages,
    setMessages,
    auth,
    setAuth,
    email,
    setEmail,
    password,
    setPassword,
    convoIdsList,
    setConvoIdList,
    currentTitle,
    setCurrentTitle
  };

  useEffect(() => {
    if (auth) {
      localStorage.setItem("userDetails", JSON.stringify(auth));
    } else {
      localStorage.removeItem("userDetails");
    }
  }, [auth]);

  if (!auth) {
    return (
      <MyContext.Provider value={providerValues}>
        <AuthPage />
      </MyContext.Provider>
    );
  }

  return (
    <MyContext.Provider value={providerValues}>
      <BrowserRouter>
        <Routes>
          {/* No convoId yet */}
          <Route path="/" element={<Chat />} />

          {/* Existing convoId */}
          <Route path="/chat/:convoId" element={<Chat />} />

          {/* New routes for features */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </BrowserRouter>
    </MyContext.Provider>
  );
};

export default App;