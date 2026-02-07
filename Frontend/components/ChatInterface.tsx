import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { initializeChat, sendMessageToGemini } from '../services/geminiService';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat with Greeting
  useEffect(() => {
    initializeChat();
    // Simulate initial bot greeting
    setTimeout(() => {
        setMessages([{
            id: 'init-1',
            role: 'model',
            text: 'Good day. I am the Maersk Remote Work Compliance Assistant. To initiate your Short-term Remote Work request (Standard 20-day policy), please provide the line manager approval document.',
            timestamp: new Date()
        }]);
    }, 500);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !fileUploaded) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileUploaded(file);
      
      // System acknowledges file
      const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: `Document "${file.name}" received. I will now proceed with the compliance assessment. First question: Which Maersk legal entity employs you currently?`,
          timestamp: new Date()
      };
      setMessages(prev => [...prev, sysMsg]);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-sm shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#42b0d5] text-white rounded-sm flex items-center justify-center">
                {/* Premium Icon: Sparkles/Star */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 leading-tight">Compliance Assistant</h3>
                <p className="text-xs text-gray-500 font-medium">Automated Policy Check</p>
            </div>
        </div>
        <div className="flex space-x-2">
             <button className="p-2 text-gray-400 hover:text-[#42b0d5] hover:bg-gray-50 rounded-sm transition-colors" title="Reset">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
             </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8fafc]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Name Label */}
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-1">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
                
                <div 
                  className={`px-6 py-4 rounded-sm text-sm leading-relaxed shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-white border-gray-200 text-gray-800' 
                      : 'bg-[#42b0d5] border-[#42b0d5] text-white'
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start">
                 <div className="bg-[#42b0d5] px-6 py-4 rounded-sm shadow-sm flex space-x-2 items-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-200">
        {!fileUploaded && messages.length > 0 && (
             <div className="mb-6 p-6 bg-gray-50 border border-dashed border-gray-300 rounded-sm text-sm text-gray-600 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-3 text-gray-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="mb-1 font-semibold text-gray-800">Upload Approval Document</p>
                <p className="text-xs text-gray-500 mb-4">Required: Line Manager Approval (.eml, .pdf)</p>
                <label className="cursor-pointer bg-white text-gray-700 border border-gray-300 hover:border-[#42b0d5] hover:text-[#42b0d5] px-5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wide transition-all">
                    Select File
                    <input type="file" className="hidden" accept=".eml,.msg,.pdf,.png,.jpg" onChange={handleFileUpload} />
                </label>
             </div>
        )}

        <div className="relative">
             <input
                type="text"
                disabled={!fileUploaded || isLoading}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={fileUploaded ? "Type your response..." : "Upload file to begin..."}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-sm pl-4 pr-12 py-4 focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] focus:bg-white outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all font-light"
              />
              <button
                onClick={handleSendMessage}
                disabled={!fileUploaded || isLoading || !inputValue.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#42b0d5] text-white rounded-sm hover:bg-[#3999ba] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-3 text-center uppercase tracking-widest">
             Maersk Confidential
        </div>
      </div>
    </div>
  );
};
