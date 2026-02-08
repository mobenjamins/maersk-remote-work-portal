import { GoogleGenAI, Chat } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { policyChat } from './api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const getGeminiApiKey = (): string | null => {
  const env = (import.meta as any).env || {};
  const viteKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  const processKey = typeof process !== 'undefined'
    ? (process as any).env?.API_KEY || (process as any).env?.GEMINI_API_KEY
    : null;
  return viteKey || processKey || null;
};

const SYSTEM_INSTRUCTION = `
You are the Maersk International Remote Work Compliance Assistant.
`;

let chatInstance: Chat | null = null;

export const initializeChat = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatInstance = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return chatInstance;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatInstance) {
    try {
      initializeChat();
    } catch (error) {
      return "Policy assistant is unavailable because API access is not configured.";
    }
  }
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

// --- FILE EXTRACTION HELPERS ---

async function readPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function readMsgText(file: File): Promise<string> {
  try {
    // Dynamic import to avoid build issues
    const module = await import('@kenjiuno/msgreader');
    const MsgReader = module.default;
    
    const arrayBuffer = await file.arrayBuffer();
    const msgReader = new MsgReader(arrayBuffer);
    const fileData = msgReader.getFileData();
    if (!fileData.body) {
      throw new Error("No body found in MSG file");
    }
    // Also include headers if available to find sender
    const headers = fileData.headers ? JSON.stringify(fileData.headers) : '';
    return `Headers: ${headers}\n\nBody: ${fileData.body}`;
  } catch (error) {
    console.error('MSG extraction error:', error);
    throw new Error('Failed to extract text from MSG file');
  }
}

async function readEmlText(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Dynamic import for beta package
    const module = await import('eml-parse-js');
    const EmlParser = module.default;
    
    // Fallback if the module doesn't export a class directly as default
    if (typeof EmlParser !== 'function') {
        throw new Error('EmlParser library not loaded correctly');
    }

    const parser = new EmlParser(text);
    const parsed = parser.parse();
    
    // Construct a text representation including headers
    let result = '';
    if (parsed.headers) {
        result += `From: ${parsed.headers.From || ''}\n`;
        result += `To: ${parsed.headers.To || ''}\n`;
        result += `Subject: ${parsed.headers.Subject || ''}\n\n`;
    }
    result += parsed.text || parsed.html || text; // Fallback to raw text
    return result;
  } catch (error) {
    console.error('EML extraction error:', error);
    // Fallback to raw text if parsing fails (better than nothing for .eml)
    return await file.text();
  }
}

/**
 * Extracts manager data from an uploaded approval file.
 * Reads text content on client-side, then uses Gemini to identify entities.
 */
export const extractApprovalData = async (file: File): Promise<{ managerName: string; managerEmail: string }> => {
  const fileName = file.name.toLowerCase();
  let extractedText = '';

  try {
    if (fileName.endsWith('.pdf')) {
      extractedText = await readPdfText(file);
    } else if (fileName.endsWith('.msg')) {
      extractedText = await readMsgText(file);
    } else if (fileName.endsWith('.eml')) {
      extractedText = await readEmlText(file);
    } else if (fileName.endsWith('.txt')) {
      extractedText = await file.text();
    } else {
      console.warn('Unsupported file type for extraction');
      return { managerName: '', managerEmail: '' };
    }
  } catch (error) {
    console.error("Text extraction failed:", error);
    // Continue with empty text to allow fallback
  }

  // If text is too short or empty, abort
  if (!extractedText || extractedText.length < 10) {
    return { managerName: '', managerEmail: '' };
  }

  // Use Gemini to extract entities from the text
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    // Simple fallback regex if no API key
    const emailMatch = extractedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return { 
        managerName: '', 
        managerEmail: emailMatch ? emailMatch[1] : '' 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this email/document text and identify the SENDER (the manager who sent the approval).
              
              TEXT CONTENT:
              ${extractedText.substring(0, 10000)} // Limit context window
              
              INSTRUCTIONS:
              1. Extract the Sender's Full Name.
              2. Extract the Sender's Email Address.
              3. Return JSON ONLY: { "managerName": "...", "managerEmail": "..." }
              4. If not found, use empty strings.`
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return { 
        managerName: parsed.managerName || '', 
        managerEmail: parsed.managerEmail || '' 
      };
    }
  } catch (e) {
    console.error('Gemini entity extraction failed:', e);
  }

  return { managerName: '', managerEmail: '' };
};
