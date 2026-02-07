import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface PolicyChatbotProps {
  onClose: () => void;
  context: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

export const PolicyChatbot: React.FC<PolicyChatbotProps> = ({ onClose, context }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your Global Mobility Assistant. I can help answer questions about the SIRW policy while you fill out your request. What can I clarify for you?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let responseText = "I understand. Please consult the Global Mobility team for that specific edge case.";
      
      if (inputValue.toLowerCase().includes('duration') || inputValue.toLowerCase().includes('how long')) {
        responseText = "The maximum duration for Short-Term International Remote Work is 20 working days per calendar year. This cannot be carried over.";
      } else if (inputValue.toLowerCase().includes('sales') || inputValue.toLowerCase().includes('contract')) {
        responseText = "Employees with sales contract signing authority create a Permanent Establishment risk and are generally not eligible for SIRW.";
      } else if (inputValue.toLowerCase().includes('visa') || inputValue.toLowerCase().includes('work')) {
        responseText = "You must hold a valid right to work (citizenship or work visa) for the destination. Tourist visas are typically not sufficient for remote work.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white text-gray-800">
      {/* Header */}
      <div className="p-4 bg-maersk-dark text-white flex justify-between items-center border-b border-gray-100/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-maersk-blue">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Policy Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-gray-300 uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
              msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-maersk-blue/10 text-maersk-blue'
            }`}>
              {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            
            <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-maersk-blue text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 ml-9">
            <Loader2 size={10} className="animate-spin" />
            <span>Analyzing policy...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about the policy..."
            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-maersk-blue focus:ring-1 focus:ring-maersk-blue transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="absolute right-1.5 p-1.5 bg-maersk-blue text-white rounded-full hover:bg-maersk-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-gray-400">
           <span>Context: {context}</span>
        </div>
      </div>
    </div>
  );
};
