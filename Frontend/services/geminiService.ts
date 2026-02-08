import { GoogleGenAI, Chat } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import MsgReader from '@kenjiuno/msgreader';
// @ts-ignore
import { readEml } from 'eml-parse-js';

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

const POLICY_CONTEXT = `
MAERSK GLOBAL SHORT-TERM INTERNATIONAL REMOTE WORK (SIRW) POLICY (V3, effective 1 March 2026)

1. EFFECTIVE DATE
This policy is effective from 1 March 2026.

2. SCOPE
This policy sets out the Maersk approach to short-term international remote work (SIRW), which is separate to the Permanent International Remote Work (PIRW) policy first published on 1 October 2023. This document is an internal global policy for Maersk, subsequently referred to as 'the company'.

This policy does NOT cover:
- Colleagues on formal assignments (STA and LTA)
- Colleagues on business travel (training, site visits)
- Colleagues who commute regularly from country of residence to country of employment
- Colleagues who work away from the office in the same city/state of employment (see Global Flexible Working Practices)

3. PURPOSE/OBJECTIVE (PRINCIPLES)
This policy provides a framework in which certain colleagues can request to work for a limited period of time, in a country other than the country of their employment.

The purpose:
- To protect the company and colleague from tax, immigration and legal risks
- To standardise the approach to SIRW across all regions and functions
- To provide clarity and understanding of the company position
- To ensure talent retention for critical roles and skills

4. MAIN POLICY STATEMENT

4.1 Short-term International Remote Work (SIRW)
SIRW is short-term work in a country other than the employment country. Examples include working in connection with vacation abroad, working at homes in another country or working while taking care of family in another country. Permission must be sought by each colleague and granted by the Leader and by Global Mobility, before undertaking any sort of SIRW.

4.1.1 Eligibility
SIRW is NOT available to the following colleagues:
- Those in frontline, customer-facing roles
- Those with roles that must be performed on site (e.g. seafarers, repair and maintenance crew, warehouse, etc.)
- Those whose roles cannot be performed in another country for legal reasons (e.g. legal profession, countries with strict data security regulations, sanctioned countries)
- Those with roles that would create a permanent establishment (e.g. those negotiating and signing contracts of value on behalf of Maersk, such as commercial, sales and procurement roles or Senior Executive leadership roles)

All colleagues, other than those listed above, are entitled to request permission to undertake SIRW.

4.1.2 Duration Allowed
SIRW can be approved up to a strict maximum of 20 workdays in a calendar year. The 20 workdays cannot be taken as a single block of 20 continuous days, and it is the responsibility of the colleague to track the workdays.

Colleagues cannot exceed 20 days without prior approval and approval for extended SIRW (20+ days) will only be granted in the most exceptional cases. See section 5.

4.1.3 Requirements

Immigration:
For permission to be granted for SIRW, a colleague must have the right to work in the relevant country. The right to work is NOT the same as the right to visit a country. In case of any doubt, colleagues can request clarification from the Global Mobility Partners. The company will not provide support or contribute to the cost of any visas required for SIRW.

Income tax and social security:
If any period of SIRW creates a tax return or payroll reporting obligation for the company, the SIRW request will be declined. Any taxes or social security payable which did not generate a reporting obligation is entirely the colleague's responsibility.

Relevant countries:
SIRW cannot be performed in countries with no Maersk entity or a country in which EU, US or UN Sanctions are currently in place. See Appendix A.

Employment terms & contract:
This policy does not in any way change employment terms and/or the contract of employment. The colleague remains in the employment of, and subject to, the contract in the employment country.

4.1.4 Governance
Approval for any SIRW requests is at the discretion of the company. No colleague, irrespective of job level, has a legal right to SIRW. Initial approval of the Leader must be obtained in every case. Final approval must then be obtained from Global Mobility. In case of dispute or disagreement the position of the Head of Employee Wage Tax and Head of Global Mobility Policy is final.

4.1.5 Process
Once initial approval is given by the Leader, a request must be submitted using the SIRW tech platform. Users will be verified as Maersk employees via SSO and asked to create a one-time only profile. From that profile they will submit information about their requested trip. They (along with the Leader) will receive an email confirming or denying the request.

5. EXTENDED SIRW (EXCEPTIONAL)
If a colleague, due to exceptional circumstances, is likely to exceed 20 workdays in another country they must immediately inform their Leader, the PF and Global Mobility. Exceptional circumstances might be the birth of a child in a foreign country or serious illness / death of immediate family in another country. Global Mobility will then undertake a review (with specialist vendor input) to consider the immigration, tax, social security and employment law considerations. If that review highlights any risk, the extended SIRW will not be permitted, and the colleague must return to their employment country.

5.1 Governance (Extended SIRW)
In addition to approval by Leader and Global Mobility, all Extended SIRW requests must be approved by:
1. Functional Head
2. Relevant member of the PLT (if increased complexity/cost)
3. Relevant member of the ELT (if increased complexity/cost)

APPENDIX A — BLOCKED COUNTRIES

Sanctioned Countries (UN/EU Sanctions):
Asia Pacific: Afghanistan, North Korea, Islamic Republic of Iran, Iraq, Myanmar
Europe: Bosnia & Herzegovina, Russia, Turkey, Ukraine
India/Middle East/Africa: Central African Rep., Dem Rep. of Congo, Guinea, Libya, Somalia, South Sudan, Sudan, Syrian Arab Republic, Yemen, Zimbabwe
North America: Haiti, Nicaragua
Latin America: Bolivarian Rep. of Venezuela

No Maersk Entity Countries:
Asia Pacific: Brunei Darussalam, Bhutan, Fiji, Kiribati, Lao People's Dem. Rep., Maldives, Marshall Islands, Micronesia, Mongolia, Nauru, Nepal, Palau, Papua New Guinea, Samoa, Solomon Islands, Timor-Leste, Tonga, Turkmenistan, Tuvalu, Uzbekistan, Vanuatu
Europe: Albania, Andorra, Armenia, Azerbaijan, Cyprus, Iceland, Liechtenstein, Luxembourg, Malta, Monaco, Montenegro, North Macedonia, Rep. of Moldova, San Marino
India/Middle East/Africa: Burundi, Chad, Comoros, Equatorial Guinea, Eritrea, Guinea-Bissau, Kazakhstan, Kyrgyzstan, São Tomé and Príncipe, Seychelles, Tajikistan
North America: Antigua & Barbuda, Bahamas, Barbados, Cuba, Dominica, Grenada, Jamaica, Saint Kitts and Nevis, Saint Lucia, St Vincent & the Grenadines
Latin America: Belize, Guyana, Suriname
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
 */
export const askPolicyQuestion = async (question: string, currentContext: string, formData: any): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return "Policy assistant is unavailable because API access is not configured.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const userDataString = JSON.stringify(formData, null, 2);

  const systemPrompt = `
    You are a helpful HR Policy Assistant for Maersk.
    The user is currently on the "${currentContext}" step of the Remote Work request form.

    CURRENT FORM CONTEXT (non-personal details only):
    ${userDataString}

    POLICY SOURCE OF TRUTH:
    ${POLICY_CONTEXT}

    INSTRUCTIONS:
    1. Answer the user's question based strictly on the Policy text.
    2. PERSONALISE your answer using the FORM CONTEXT where relevant.
       - Example: If they ask "Can I go there?", check their 'destinationCountry'. If they selected 'India', mention India specifically.
       - Example: If they ask "Is my duration okay?", check their 'startDate' and 'endDate' to calculate workdays.
    3. You are a Q&A assistant ONLY:
       - NEVER ask the user for information (e.g. "Which entity do you work for?", "What is your home country?").
       - NEVER collect data or guide them through form fields. The form on the left handles that.
       - Do NOT offer to perform actions (e.g., "I can reset the form", "I can email your manager").
    4. Keep answers concise (under 60 words).
    5. Be friendly and professional.
    6. Always cite the relevant policy section number when answering (e.g., "Section 4.1.2").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't find an answer to that in the policy.";
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
    const parsed = readEml(text);

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
    // Fallback to raw text if parsing fails
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
    return { managerName: '', managerEmail: '' };
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