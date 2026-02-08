import { policyChat } from './api';

// --- CHATBOT (MIRA) LOGIC ---

/**
 * Generates context-aware follow-up suggestions based on the conversation.
 * (Now handled by backend, this is just a type placeholder if needed)
 */
export const generateFollowUpQuestions = async (lastUserMessage: string, lastBotResponse: string): Promise<string[]> => {
  // Client-side generation is removed for security.
  // Suggestions now come directly from askPolicyQuestion response.
  return [];
};

export const askPolicyQuestion = async (question: string, currentContext: string, formData: any): Promise<{ text: string, suggestions: string[] }> => {
  try {
    const result = await policyChat(question, currentContext, formData);
    return {
        text: result.text || "I couldn't find that in the policy.",
        suggestions: result.suggestions || ["Explain 'Right to Work'", "Check blocked countries"]
    };
  } catch (e) {
    console.error("Policy Chat Error", e);
    return {
        text: "I'm having trouble connecting right now. Please try again later.",
        suggestions: ["Retry connection"]
    };
  }
};
