import React, { useState, useRef, useEffect } from 'react';
import { RequestFormData } from '../types';
import { askPolicyQuestion, generateFollowUpQuestions } from '../services/geminiService';
import { createChatSession, sendChatMessage } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LifeBuoy, Sparkles } from 'lucide-react';

interface PolicyChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: RequestFormData;
  currentStep?: number;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Default initial suggestions
const DEFAULT_SUGGESTIONS = ["Explain 'Right to Work'", "Can I work from Thailand?", "What is the annual limit?"];

// Strip PII from form data before passing to AI
const sanitiseFormData = (formData: RequestFormData): Record<string, any> => {
  return {
    homeCountry: formData.homeCountry || undefined,
    destinationCountry: formData.destinationCountry || undefined,
    startDate: formData.startDate || undefined,
    endDate: formData.endDate || undefined,
    rightToWork: formData.rightToWork,
    noRestrictedRoles: formData.noRestrictedRoles,
  };
};

export const PolicyChatbot: React.FC<PolicyChatbotProps> = ({ isOpen, onClose, formData, currentStep }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm Mira, your SIRW Policy guide. I can check compliance rules, explain restrictions, or clarify visa requirements for your destination."
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isThinking]);

  const handleSend = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsThinking(true);
    setSuggestions([]); // Clear suggestions while thinking

    // Build context string from sanitised form data
    const stepName = currentStep === 1 ? 'Profile & Approval' : currentStep === 2 ? 'Trip Details' : currentStep === 3 ? 'Compliance Check' : 'Unknown';
    const safeData = formData ? sanitiseFormData(formData) : {};

    let responseText = '';
    try {
      // Primary: Backend Gemini with full context
      const result = await askPolicyQuestion(textToSend, stepName, safeData);
      responseText = result.text;
      
      if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
      } else {
          setSuggestions(DEFAULT_SUGGESTIONS);
      }

    } catch (error) {
      console.warn("Gemini Chat Error, falling back to backend:", error);
      // Fallback logic preserved
      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const session = await createChatSession();
          activeSessionId = session.session_id;
          setSessionId(activeSessionId);
        }
        const response = await sendChatMessage(textToSend, activeSessionId);
        responseText = response.text || "I couldn't find an answer to that.";
        setSuggestions(DEFAULT_SUGGESTIONS);
      } catch (backendError) {
        responseText = "I'm having trouble connecting right now. Please try again later.";
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    }

    setIsThinking(false);
    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header - Mira Branding */}
      <div className="bg-[#0b1e3b] p-5 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1e3b] to-[#42b0d5] opacity-20"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#42b0d5] rounded-full blur-[50px] opacity-20"></div>
        
        <div className="relative z-10 flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(66,176,213,0.3)]">
            <Sparkles size={18} strokeWidth={1.5} className="text-[#42b0d5]" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                Mira <span className="text-[9px] font-normal opacity-70 bg-white/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
            </h3>
            <p className="text-[10px] text-gray-300 font-medium opacity-90 mt-0.5">Policy Intelligence Agent</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="relative z-10 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-5 overflow-y-auto bg-[#f8fafc] space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
            {messages.map((m, i) => (
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                m.role === 'user'
                    ? 'bg-[#0b1e3b] text-white rounded-br-sm border border-white/5'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                }`}>
                {m.text}
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
        
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex space-x-1.5 items-center">
              <span className="text-xs text-gray-400 font-medium mr-2">Mira is thinking</span>
              <div className="w-1.5 h-1.5 bg-[#42b0d5] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#42b0d5] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#42b0d5] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Dynamic Suggestions */}
      <div className="px-5 py-3 bg-[#f8fafc] flex gap-2 overflow-x-auto shrink-0 no-scrollbar items-center">
        {suggestions.map((s, i) => (
          <motion.button
            key={`${s}-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSend(undefined, s)}
            className="whitespace-nowrap px-4 py-1.5 bg-white border border-[#42b0d5]/20 text-[#42b0d5] text-[11px] font-bold uppercase tracking-wide rounded-full hover:bg-blue-50/50 hover:border-[#42b0d5]/50 transition-all shadow-sm flex-shrink-0"
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={(e) => handleSend(e)} className="flex items-center space-x-3 bg-gray-50 rounded-full px-2 py-2 border border-gray-200 focus-within:border-[#42b0d5] focus-within:ring-1 focus-within:ring-[#42b0d5]/20 transition-all">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mira about policies..."
            className="flex-1 bg-transparent text-sm px-3 focus:outline-none text-gray-700 placeholder-gray-400"
            />
            <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2 bg-[#42b0d5] text-white rounded-full hover:bg-[#3aa3c7] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm transform active:scale-95"
            >
            <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            </button>
        </form>
        <div className="text-center mt-2">
            <p className="text-[9px] text-gray-400">Mira can make mistakes. Verify critical info with Global Mobility.</p>
        </div>
      </div>
    </div>
  );
};