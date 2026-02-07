import React, { useState, useRef, useEffect } from 'react';
import { askPolicyQuestion } from '../services/geminiService';

interface PolicyChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  formData?: any; // Received from parent
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const PolicyChatbot: React.FC<PolicyChatbotProps> = ({ isOpen, onClose, context, formData }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Hi! I'm your Policy Assistant. I see you're using the ${context}. How can I help you today?` }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsThinking(true);

    // Pass the formData to the service
    const response = await askPolicyQuestion(textToSend, context, formData || {});
    
    setIsThinking(false);
    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
  };

  // Note: We removed the `if (!isOpen) return null` check because the parent component 
  // controls visibility via the 3D flip transform.
  
  // Suggested questions based on context
  const suggestions = context === "Smart Wizard" 
    ? ["Can I work from a coffee shop?", "What if my manager says no?", "Does this count as vacation?"]
    : ["What fields are mandatory?", "Explain 'Right to Work'", "List restricted roles"];

  return (
    <div className="w-full h-full flex flex-col bg-white">
      
      {/* Header */}
      <div className="bg-[#42b0d5] p-4 flex justify-between items-center text-white shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-inner">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
                <h3 className="font-bold text-sm tracking-wide">Policy Assistant</h3>
                <p className="text-[10px] text-blue-50 font-medium opacity-90">{context}</p>
            </div>
        </div>
        <button 
            onClick={onClose} 
            className="group p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm border border-white/10 shadow-sm flex items-center justify-center"
            aria-label="Close Assistant"
        >
          <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-[#42b0d5] text-white rounded-br-none shadow-md' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             </div>
          </div>
        )}
      </div>

      {/* Suggested Chips */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
        {suggestions.map((s) => (
            <button 
                key={s}
                onClick={() => handleSend(undefined, s)}
                className="whitespace-nowrap px-3 py-1 bg-white border border-[#42b0d5]/30 text-[#42b0d5] text-xs rounded-full hover:bg-blue-50 transition-colors flex-shrink-0"
            >
                {s}
            </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => handleSend(e)} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2 shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..." 
          className="flex-1 bg-gray-50 border-gray-200 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#42b0d5] focus:bg-white transition-all"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="p-2 bg-[#42b0d5] text-white rounded-full hover:bg-[#3aa3c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
           <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </form>

    </div>
  );
};