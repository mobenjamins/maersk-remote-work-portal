import React, { useState, useRef, useEffect } from 'react';
import { RequestFormData } from '../types';
import { askPolicyQuestion } from '../services/geminiService';
import { createChatSession, sendChatMessage } from '../services/api';

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
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#42b0d5] p-4 flex justify-between items-center text-white shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-inner">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">Policy Assistant</h3>
            <p className="text-[10px] text-blue-50 font-medium opacity-90">Ask questions about the SIRW policy</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="group p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm border border-white/10 shadow-sm flex items-center justify-center"
          aria-label="Close Assistant"
        >
          <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
