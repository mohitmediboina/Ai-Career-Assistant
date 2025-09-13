import React, { useEffect, useState } from "react";
import ChatWindow from "./ChatWindow.jsx";
import "./index.css";
import { MyContext } from "./MyContext.jsx";
import AuthPage from "./AuthPage.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
    setConvoIdList
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
        </Routes>
      </BrowserRouter>
    </MyContext.Provider>
  );
};

export default App;
