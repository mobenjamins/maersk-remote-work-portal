import { GoogleGenAI, Chat, GenerativeModel, SchemaType } from "@google/genai";

// We keep the chat for legacy/fallback, but primarily use extraction now
const SYSTEM_INSTRUCTION = `
You are the Maersk International Remote Work Compliance Assistant.
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
