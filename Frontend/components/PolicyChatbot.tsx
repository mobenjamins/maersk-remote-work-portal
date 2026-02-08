import React, { useState, useRef, useEffect } from 'react';
import { RequestFormData } from '../types';
import { askPolicyQuestion } from '../services/geminiService';
import { createChatSession, sendChatMessage } from '../services/api';
import { motion } from 'framer-motion';
import { X, LifeBuoy } from 'lucide-react';

interface PolicyChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: RequestFormData;
  currentStep?: number; // 1 = Profile & Approval, 2 = Trip Details, 3 = Compliance Check
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Quick-action chips that change based on the current wizard step
const STEP_SUGGESTIONS: Record<number, string[]> = {
  1: ["What documents do I need?", "Who can approve my request?"],
  2: ["Which countries are blocked?", "How many days can I take?"],
  3: ["Explain 'Right to Work'", "Why are these roles restricted?"],
};

const DEFAULT_SUGGESTIONS = ["Explain 'Right to Work'", "How many days can I take?"];

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
      text: "Hi! I'm your Policy Assistant. Ask me anything about Maersk's remote work policy. Note: this policy takes effect on 1 March 2026."
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
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

    // Build context string from sanitised form data
    const stepName = currentStep === 1 ? 'Profile & Approval' : currentStep === 2 ? 'Trip Details' : currentStep === 3 ? 'Compliance Check' : 'Unknown';
    const safeData = formData ? sanitiseFormData(formData) : {};

    let responseText = '';
    try {
      // Primary: Gemini with full policy context and form data (no PII)
      responseText = await askPolicyQuestion(textToSend, stepName, safeData);
    } catch (error) {
      // Fallback: backend chat endpoint
      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const session = await createChatSession();
          activeSessionId = session.session_id;
          setSessionId(activeSessionId);
        }
        const response = await sendChatMessage(textToSend, activeSessionId);
        responseText = response.text || "I couldn't find an answer to that in the policy.";
      } catch (backendError) {
        responseText = "I'm having trouble connecting right now. The key points are: max 20 days/year, you need valid work rights, and manager approval is required.";
      }
    }

    setIsThinking(false);
    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
  };

  const suggestions = STEP_SUGGESTIONS[currentStep || 0] || DEFAULT_SUGGESTIONS;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#0b1e3b] p-5 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1e3b] to-[#42b0d5] opacity-20"></div>
        <div className="relative z-10 flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-sm backdrop-blur-md border border-white/10">
            <LifeBuoy size={18} strokeWidth={1.5} className="text-[#42b0d5]" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Policy Assistant</h3>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Global SIRW Support</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="relative z-10 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto bg-[#f8fafc] space-y-6" ref={scrollRef}>
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-sm p-4 text-sm leading-relaxed shadow-sm ${
              m.role === 'user'
                ? 'bg-[#0b1e3b] text-white border border-white/5'
                : 'bg-white border border-gray-100 text-gray-700'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none shadow-sm flex space-x-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips — change per step */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto shrink-0">
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
          className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#42b0d5] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-[#42b0d5] text-white rounded-full hover:bg-[#3aa3c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};
