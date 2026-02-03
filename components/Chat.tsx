import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  projectorMode?: boolean;
}

const Chat: React.FC<ChatProps> = ({ 
  messages,
  onSendMessage,
  isLoading,
  projectorMode,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  const formatMessage = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br />');
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)} 
            className={`absolute bottom-8 right-8 z-[100] bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-4 w-16 h-16 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center ${projectorMode ? 'scale-125' : 'scale-100'}`}
          >
              <i className="fa-solid fa-message text-2xl"></i>
          </button>
      );
  }

  return (
    <div 
        className={`absolute bottom-8 right-8 z-[100] w-[380px] h-[600px] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-sans transition-all duration-300 ${projectorMode ? 'scale-110 origin-bottom-right' : 'scale-100'}`} 
        dir="rtl"
    >
      {/* Header */}
      <div className="p-5 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <i className="fa-solid fa-robot text-xl"></i>
            </div>
            <div>
                <h2 className="font-bold text-gray-800 text-lg">SmartBoard AI</h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-gray-400 font-medium">Architect Online</span>
                </div>
            </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
            <i className="fa-solid fa-chevron-down"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
                <div 
                    className={`rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed relative ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}
                    dir="auto"
                >
                    {msg.role === 'model' ? (
                        <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                    ) : (
                        msg.text
                    )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.role === 'user' ? 'You' : 'AI'}
                </span>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-end w-full">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="اكتب طلبك هنا..." 
            className="flex-1 bg-transparent border-none focus:ring-0 p-3 max-h-32 text-sm resize-none text-gray-700 placeholder-gray-400" 
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            className="p-3 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
              <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;