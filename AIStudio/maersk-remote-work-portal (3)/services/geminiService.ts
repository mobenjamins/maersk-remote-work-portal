import { GoogleGenAI, Chat, GenerativeModel, SchemaType } from "@google/genai";

// We keep the chat for legacy/fallback, but primarily use extraction now
const SYSTEM_INSTRUCTION = `
You are the Maersk International Remote Work Compliance Assistant.
`;

// The source of truth for the chatbot
const POLICY_CONTEXT = `
MAERSK GLOBAL REMOTE WORK POLICY (v2.1):
1. Duration: Maximum 20 working days per calendar year.
2. Eligibility: Must have valid citizenship or work visa for the destination.
3. Restrictions: Sales, Signatory, and Executive roles are restricted due to Permanent Establishment (PE) risk.
4. Approval: Line Manager approval required via email (.msg or .pdf) before initiating.
5. Process: Users must upload manager approval, confirm details, and pass compliance checks.
`;

let chatInstance: Chat | null = null;
let modelInstance: GenerativeModel | null = null;

export const initializeChat = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash-preview', // High speed for extraction
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  
  return chatInstance;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatInstance) initializeChat();
  if (!chatInstance) throw new Error("Failed to initialize chat");

  try {
    const response = await chatInstance.sendMessage({ message });
    return response.text || "Error processing.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Error.";
  }
};

/**
 * Handles Policy Q&A requests from the "Got Questions?" widget.
 */
export const askPolicyQuestion = async (question: string, currentContext: string, formData: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userDataString = JSON.stringify(formData, null, 2);

  const systemPrompt = `
    You are a helpful HR Policy Assistant for Maersk.
    The user is currently on the "${currentContext}" page of the Remote Work Portal.
    
    CURRENT USER DATA (What they have typed so far):
    ${userDataString}
    
    POLICY SOURCE OF TRUTH:
    ${POLICY_CONTEXT}
    
    INSTRUCTIONS:
    1. Answer the user's question based strictly on the Policy text.
    2. PERSONALIZE your answer using the CURRENT USER DATA. 
       - Example: If they ask "Can I go there?", check their 'destinationCountry' in the data. If they selected 'India', mention India specifically.
       - Example: If they ask "Is my duration okay?", check their 'startDate' and 'endDate' to calculate days.
    3. STRICTLY INFORMATIONAL ONLY: You are a read-only assistant. 
       - Do NOT offer to perform actions (e.g., "I can reset the form", "I can email your manager"). 
       - If asked to perform an action, politely explain you are here to provide policy guidance only.
    4. Keep answers concise (under 60 words).
    5. Be friendly and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    
    return response.text || "I couldn't find an answer to that in the policy.";
  } catch (e) {
    console.error("Policy Chat Error", e);
    return "I'm having trouble connecting to the policy database right now.";
  }
};

/**
 * Simulates extracting data from a file. 
 * In a real app, we would parse the PDF/EML bytes. 
 * Here, we send a prompt to Gemini to simulate the extraction logic based on the filename/mock context.
 */
export const extractApprovalData = async (fileName: string): Promise<{managerName: string, managerEmail: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // prompt to simulate extraction
  const prompt = `
    I have an approval email file named "${fileName}".
    Act as a data extractor.
    Generate a JSON response with a realistic "managerName" (Scandinavian name) and "managerEmail" (@maersk.com) that might be found in this approval file.
    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) return { managerName: '', managerEmail: '' };
    return JSON.parse(text);
  } catch (e) {
    console.error("Extraction failed", e);
    // Fallback if API fails
    return { managerName: 'Lars Sorensen', managerEmail: 'lars.sorensen@maersk.com' };
  }
};