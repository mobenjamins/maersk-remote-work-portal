import * as pdfjsLib from 'pdfjs-dist';
import { extractApprovalFromText, policyChat } from './api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

// --- FILE EXTRACTION HELPERS (Robust Client-Side) ---

async function readPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('PDF extraction failed');
  }
}

async function readMsgText(file: File): Promise<string> {
  try {
    const { default: MsgReader } = await import('@kenjiuno/msgreader');
    const arrayBuffer = await file.arrayBuffer();
    const msgReader = new MsgReader(arrayBuffer);
    const fileData = msgReader.getFileData();
    if (!fileData.body) throw new Error("No body in MSG");
    const headers = fileData.headers ? JSON.stringify(fileData.headers) : '';
    return `Headers: ${headers}\n\nBody: ${fileData.body}`;
  } catch (error) {
    console.error('MSG extraction error:', error);
    throw new Error('MSG extraction failed');
  }
}

async function readEmlText(file: File): Promise<string> {
  try {
    const text = await file.text();
    const { default: EmlParser } = await import('eml-parse-js');
    // @ts-ignore
    const parser = new EmlParser(text);
    const parsed = parser.parse();
    let result = '';
    if (parsed.headers) {
        result += `From: ${parsed.headers.From || ''}\n`;
        result += `To: ${parsed.headers.To || ''}\n`;
        result += `Subject: ${parsed.headers.Subject || ''}\n\n`;
    }
    result += parsed.text || parsed.html || text;
    return result;
  } catch (error) {
    return await file.text();
  }
}

export const extractApprovalData = async (file: File): Promise<{ 
  managerName: string; 
  managerEmail: string;
  employeeName?: string;
  homeCountry?: string;
}> => {
  const fileName = file.name.toLowerCase();
  let extractedText = '';

  try {
    if (fileName.endsWith('.pdf')) extractedText = await readPdfText(file);
    else if (fileName.endsWith('.msg')) extractedText = await readMsgText(file);
    else if (fileName.endsWith('.eml')) extractedText = await readEmlText(file);
    else if (fileName.endsWith('.txt')) extractedText = await file.text();
    else return { managerName: '', managerEmail: '' };
  } catch (error) {
    console.error("Text extraction failed:", error);
    return { managerName: '', managerEmail: '' };
  }

  if (!extractedText || extractedText.length < 10) return { managerName: '', managerEmail: '' };

  // Securely send extracted text to backend for Entity Extraction
  try {
      return await extractApprovalFromText(extractedText);
  } catch (e) {
      console.error("Backend extraction failed:", e);
      return { managerName: '', managerEmail: '' };
  }
};
