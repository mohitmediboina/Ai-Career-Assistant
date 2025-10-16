import React, { useEffect, useRef, useState, useContext } from "react";
import { MyContext } from "./MyContext";
import {
  createConversation,
  getConversation,
  streamChat,
  listConversations,
  generateTitle,
} from "./services/api";
import { ClimbingBoxLoader, ScaleLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import remarkGfm from "remark-gfm";
import Sidebar from "./Sidebar.jsx";

export const UserChat = ({ message }) => {
  return (
    <div className="flex justify-end w-full">
      <div className="userdiv bg-[#303030] text-white p-3 rounded-3xl max-w-[70%] shadow">
        <p className="text-sm md:text-base">{message}</p>
      </div>
    </div>
  );
};

export const AiChat = ({ message }) => {
  return (
    <div className="flex w-full justify-start">
      <div className="gpt-message rounded-2xl text-white p-4 w-full shadow">
        <div className="prose prose-invert text-white max-w-none text-[17px] leading-relaxed">
          <ReactMarkdown rehypePlugins={[remarkGfm, rehypeHighlight]}>
            {message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const {
    input,
    setInput,
    convoId,
    setConvoId,
    messages,
    setMessages,
    auth,
    setAuth,
    convoIdsList,
    setConvoIdList,
    currentTitle,
    setCurrentTitle,
  } = useContext(MyContext);

  const userId = auth.userId;
  const token = auth.token;
  console.log(userId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const { convoId: routeConvoId } = useParams();
  const navigate = useNavigate();
  const streamingRef = useRef(false);

  // ✅ Sync convoId from URL
  useEffect(() => {
    if (routeConvoId && routeConvoId !== convoId) {
      setConvoId(routeConvoId);
      loadConversation(routeConvoId);
    }
  }, [routeConvoId]);

  // ✅ Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    listingconvoIds();
  }, [userId]);

  const logout = () => {
    localStorage.clear();
    setAuth(null);
    navigate("/");
  };

  const handleSelectConvo = (id, title) => {
    navigate(`/chat/${id}`);
    setCurrentTitle(title);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  async function loadConversation(id) {
    try {
      const res = await getConversation({ convoId: id, token });
      console.log(res.messages);
     
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function listingconvoIds() {
    if (!userId) return;
    try {
      const res = await listConversations({ userId });
      setConvoIdList(res || []);
    } catch (error) {
      console.log("error from listingconvoids", error);
    }
  }

  async function handleSend() {
    // Prevent multiple sends
    if (!input.trim() || isStreaming || isSending || streamingRef.current) return;

    setIsSending(true);
    setIsStreaming(true);
    streamingRef.current = true;

    let currentConvoId = convoId;

    // ✅ If no convo yet → create one
    if (!currentConvoId) {
      try {
        const res = await createConversation({ userId });
        currentConvoId = res._id;
        setConvoId(currentConvoId);
        navigate(`/chat/${currentConvoId}`);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setIsSending(false);
        setIsStreaming(false);
        streamingRef.current = false;
        return;
      }
    }

    const userMessage = { role: "user", content: input };
    const assistantMessage = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsSending(false); // Re-enable input after message is added

    let acc = "";

    try {
      await streamChat({
        userId,
        convoId: currentConvoId,
        message: userMessage.content,
        token,
        onEvent: (ev) => {
          if (ev.type === "content") {
            acc += ev.content || "";
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: acc,
              };
              return updated;
            });
          } else if (ev.type === "end" || ev.done) {
            setIsStreaming(false);
            streamingRef.current = false;

            // Generate title if this is the first user message
            if (messages.length === 0) {
              generateTitle({
                messages: [userMessage],
                convoId: currentConvoId,
              })
                .then((titleResponse) => {
                  if (titleResponse.title) {
                    setCurrentTitle(titleResponse.title);
                  }
                })
                .catch((err) => {
                  console.error("Failed to generate title:", err);
                });
            }

            // Refresh conversation list
            listingconvoIds();
          }
        },
      });
    } catch (err) {
      console.error("Streaming error:", err);
      setIsStreaming(false);
      setIsSending(false);
      streamingRef.current = false;
    }
  }

  const navigateToHome = () => {
    navigate("/");
    setMessages([]);
    setConvoId(null);
    setCurrentTitle("Ai Career Assistant");
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    document.title = currentTitle;
  }, [currentTitle]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onNewChat={navigateToHome}
        onSelectConvo={handleSelectConvo}
        conversations={convoIdsList}
        currentConvoId={convoId}
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
            <h1 className="text-lg font-semibold">AI Career Assistant</h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-sm"
          >
            Logout
          </button>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-2">
          {!convoId ? (
            <div className="text-center text-2xl md:text-3xl flex items-center mx-auto h-full justify-center font-bold">
              Start a new chat
            </div>
          ) : (
            <div className="w-full flex flex-1 justify-center">
              <div className="w-full max-w-[700px] flex flex-col gap-3 mx-auto">
                {messages?.map((chat, index) =>{

                  
                  if (chat.role === "assistant"){
                      return <AiChat key={index} message={chat.content} />
                  }else if (chat.role === "user"){
                      return <UserChat key={index} message={chat.content} />
                  }else{
                      return ""
                  }

                }


                  // chat.role === "assistant" ? (
                  //   <AiChat key={index} message={chat.content} />
                  // ) : (
                  //   <UserChat key={index} message={chat.content} />
                  // )
                )}

                {/* Typing indicator - moved inside messages */}
                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2">
                      <ScaleLoader color="#fff" height={12} width={2} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <div className="w-full flex mx-auto items-center  justify-center px-4 p">
          <footer className="w-full max-w-[700px] flex gap-2">
            <textarea
              className="flex-1 rounded-4xl p-4 px-5 text-[16px] border border-stone-500 bg-[#303030] resize-none max-h-32 text-white outline-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || isSending || !input.trim()}
              className={`my-auto rounded-3xl h-[45px] w-[60px] text-sm transition ${
                isStreaming || isSending || !input.trim()
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {isStreaming ? "..." : "Send"}
            </button>
          </footer>
          
        </div>
        <div className="text-center m-2 mb-4 text-stone-500">career assistant can make mistakes rarely</div>
       
      </div>
    </div>
  );
};

export default ChatWindow;