import { policyChat } from './api';

/**
 * Handles Policy Q&A requests from the Policy Assistant chatbot.
 * Calls the backend endpoint to keep the Gemini API key server-side.
 */
export const askPolicyQuestion = async (question: string, currentContext: string, formData: any): Promise<string> => {
  try {
    return await policyChat(question, currentContext, formData);
  } catch (e) {
    console.error("Policy Chat Error", e);
    return "I'm having trouble connecting right now. The key points are: max 20 days/year, you need valid work rights, and manager approval is required via email upload.";
  }
};
