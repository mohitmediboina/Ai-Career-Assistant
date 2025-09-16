import React, { useEffect, useRef, useState, useContext } from "react";
import { MyContext } from "./MyContext";
import {
  createConversation,
  getConversation,
  streamChat,
  listConversations,
  generateTitle,
} from "./services/api";
import { ScaleLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import remarkGfm from "remark-gfm";

export const UserChat = ({ message }) => {
  return (
    <div className="flex justify-end w-full">
      <div className="bg-[#303030] text-white p-3 rounded-2xl max-w-[85%] md:max-w-[70%] shadow-sm">
        <p className="text-sm md:text-base leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export const AiChat = ({ message }) => {
  return (
    <div className="flex w-full justify-start">
      <div className="rounded-2xl text-white p-4 w-full shadow-sm">
        <div className="prose prose-invert text-white max-w-none text-sm md:text-base leading-relaxed">
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const { convoId: routeConvoId } = useParams();
  const navigate = useNavigate();

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setIsSidebarOpen(JSON.parse(savedSidebarState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

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
    // Close sidebar on mobile after selecting a conversation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  async function loadConversation(id) {
    try {
      const res = await getConversation({ convoId: id, token });
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function listingconvoIds() {
    if (!userId) return;
    if (messages.length >= 2) {
      console.log("return from listing covo");
      return;
    }
    console.log("listingconvoIds");
    try {
      const res = await listConversations({ userId });
      setConvoIdList(res || []);

      console.log(res);
    } catch (error) {
      console.log("error from listingconvoids", error);
    }
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

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
        return;
      }
    }

    const userMessage = { role: "user", content: input };
    const assistantMessage = { role: "assistant", content: "" };

    if (messages.length === 0) {
        try {
          const titleResponse = generateTitle({
            messages: [userMessage],
            convoId: currentConvoId,
          });

          if (titleResponse.title) {
            setCurrentTitle(titleResponse.title);
            // Refresh conversation list
          }
        } catch (err) {
          console.error("Failed to generate title:", err);
        }
      }

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

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

            // Generate title if this is the first message
            loadConversation(currentConvoId);
            listingconvoIds()
          }
        },
      });

    } catch (err) {
      console.error("Streaming error:", err);
      setIsStreaming(false);
    }
  }

  const navigateToHome = () => {
    navigate("/");
    setMessages([]);
    setConvoId(null);
    setCurrentTitle("Ai Career Assistant");
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Add this with your other useEffect hooks
  useEffect(() => {
    document.title = currentTitle;
  }, [currentTitle]);

  return (
    <div className="flex h-dvh md:h-screen bg-[#212121] w-full text-white overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-auto
        bg-[#181818] w-80 md:w-72 h-full
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isSidebarOpen ? 'md:block hidden' : 'block'}
      `}>
        <div className="p-4 flex justify-between items-center md:justify-center border-b border-stone-700 md:border-none">
          <h1 className="font-medium text-base md:text-lg">AI Career Assistant</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-[#303030] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={navigateToHome}
            className="flex items-center gap-3 w-full p-3 hover:bg-[#303030] rounded-xl transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
            </svg>
            <span className="text-sm font-medium">New Chat</span>
          </button>

          <div className="mt-4">
            <h2 className="px-3 py-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
              Recent Chats
            </h2>
            <div className="space-y-1">
              {convoIdsList?.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => handleSelectConvo(convo.id, convo.title)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg transition-colors
                    hover:bg-[#303030] text-sm
                    ${convoId === convo.id ? 'bg-[#303030] text-white font-medium' : 'text-stone-300'}
                  `}
                >
                  <div className="truncate">
                    {convo.title || "New Chat"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-700">
          <p className="text-center text-xs text-stone-500">By Mohit</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-3 md:p-4 border-b border-stone-700 bg-[#212121]">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 hover:bg-[#303030] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base md:text-lg font-semibold truncate">
              {currentTitle || "AI Career Assistant"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="hidden md:block p-2 hover:bg-[#303030] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto">
          {!convoId ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Start a new conversation
                </h2>
                <p className="text-stone-400 text-sm md:text-base">
                  Ask me anything about your career goals!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 md:p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages?.map((chat, index) =>
                  chat.role === "assistant" ? (
                    <AiChat key={index} message={chat.content} />
                  ) : (
                    <UserChat key={index} message={chat.content} />
                  )
                )}
                
                {/* Typing indicator */}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 bg-[#303030] rounded-2xl">
                      <ScaleLoader color="#fff" height={12} width={2} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-3 md:p-4  bg-[#212121]">
          <div className="max-w-4xl mx-auto flex gap-2 md:gap-3">
            <textarea
              className="flex-1 bg-[#303030] text-white rounded-2xl px-4 py-3 text-sm md:text-base
                         resize-none outline-none 
                           transition-all
                         min-h-[48px] max-h-32"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:bg-stone-600 disabled:cursor-not-allowed
                         px-4 md:px-6 py-3 rounded-2xl text-sm font-medium transition-colors
                         flex items-center justify-center min-w-[60px] md:min-w-[80px]"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatWindow;