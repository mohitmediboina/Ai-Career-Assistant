import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search, ExternalLink, Briefcase, TrendingUp, Target, Users } from 'lucide-react';

const AICareerCoach = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      content: "👋 Welcome! I'm your AI Career Coach. I'm here to help you with career guidance, job search strategies, skill development, interview preparation, and more. What would you like to discuss today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [checkpointId, setCheckpointId] = useState(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUrls, setSearchUrls] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');
    setSearchQuery('');
    setSearchUrls([]);

    try {
      const url = checkpointId 
        ? `http://localhost:8000/chat_stream/${encodeURIComponent(messageToSend)}?checkpoint_id=${checkpointId}`
        : `http://localhost:8000/chat_stream/${encodeURIComponent(messageToSend)}`;

      const response = await fetch(url);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let aiMessageId = Date.now().toString() + '_ai';
      let accumulatedContent = '';
      let currentSearchQuery = '';
      let currentSearchUrls = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: ') {
            const jsonString = line.slice(6).trim();
            if (jsonString) {
              try {
                const data = JSON.parse(jsonString);
                
                if (data.type === 'checkpoint') {
                  setCheckpointId(data.checkpoint_id);
                } else if (data.type === 'content') {
                  accumulatedContent += data.content;
                  setCurrentStreamingMessage(accumulatedContent);
                } else if (data.type === 'search_start') {
                  currentSearchQuery = data.query;
                  setSearchQuery(data.query);
                } else if (data.type === 'search_results') {
                  currentSearchUrls = data.urls || [];
                  setSearchUrls(data.urls || []);
                } else if (data.type === 'end') {
                  // Use the accumulated content instead of relying on state
                  setMessages(prev => [...prev, {
                    id: aiMessageId,
                    type: 'ai',
                    content: accumulatedContent,
                    timestamp: new Date(),
                    searchQuery: currentSearchQuery,
                    searchUrls: currentSearchUrls
                  }]);
                  setCurrentStreamingMessage('');
                  setSearchQuery('');
                  setSearchUrls([]);
                  setIsStreaming(false);
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error, 'Raw line:', line);
                // Continue processing other lines instead of breaking
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }]);
      setIsStreaming(false);
      setCurrentStreamingMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const careerTopics = [
    { icon: Briefcase, text: "Job search strategies", color: "bg-blue-500" },
    { icon: TrendingUp, text: "Skill development", color: "bg-green-500" },
    { icon: Target, text: "Career transitions", color: "bg-purple-500" },
    { icon: Users, text: "Interview preparation", color: "bg-orange-500" }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI Career Coach</h1>
            <p className="text-sm text-gray-500">Your personal career development assistant</p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {messages.length === 1 && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">How can I help with your career today?</h2>
                <p className="text-gray-600">Choose a topic below or ask me anything about your career journey</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {careerTopics.map((topic, index) => {
                  const IconComponent = topic.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setInputValue(`Tell me about ${topic.text.toLowerCase()}`)}
                      className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
                    >
                      <div className={`w-10 h-10 ${topic.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">{topic.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500 ml-3' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 mr-3'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className={`p-4 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    
                    {message.searchQuery && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <Search className="w-4 h-4" />
                          <span>Searched: {message.searchQuery}</span>
                        </div>
                        {message.searchUrls && message.searchUrls.length > 0 && (
                          <div className="space-y-1">
                            {message.searchUrls.slice(0, 3).map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="truncate">{new URL(url).hostname}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Message */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] flex-row items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 mr-3">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-800">
                    <div className="whitespace-pre-wrap break-words">
                      {currentStreamingMessage}
                      <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                    </div>
                    
                    {searchQuery && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Search className="w-4 h-4 animate-spin" />
                          <span>Searching: {searchQuery}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-50 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about your career goals, job search, skills, or interview prep..."
                  className="w-full px-4 py-3 pr-12 border border-gray-400 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[48px] max-h-[120px] bg-gray-50 placeholder-gray-500"
                  disabled={isStreaming}
                  rows="1"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isStreaming}
                  className="absolute right-2 bottom-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICareerCoach;