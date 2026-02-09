"""
Gemini AI service for compliance chat.
"""

import logging
from typing import Dict, List, Optional, Any

from django.conf import settings

logger = logging.getLogger(__name__)

# System prompt for the compliance assistant
SYSTEM_PROMPT = """You are a Maersk Remote Work Compliance Assistant. Your role is to help employees understand if their remote work requests comply with company policy.

## Policy Overview
- Employees can work remotely from abroad for up to 20 days per calendar year
- Must have the right to work in the destination country
- Sales roles with contract signing authority cannot work remotely abroad (Permanent Establishment risk)
- Requests must be approved by manager

## Your Tasks
1. Collect information about the employee's request:
   - Which Maersk entity they work for
   - Their home country (country of employment)
   - Destination country for remote work
   - Start and end dates
   - Whether they have right to work in the destination
   - Whether they have a sales role with contract signing authority

2. Based on the information, provide one of three outcomes:
   - APPROVE: All criteria met, request can proceed
   - REJECT: One or more blocking criteria not met (explain which)
   - ESCALATE: Complex case requiring human review

## Guidelines
- Be professional and helpful
- Ask one or two questions at a time
- Once you have all information, provide a clear decision
- If rejecting, explain why clearly
- If escalating, explain what additional review is needed

## Response Format
When you have enough information to make a decision, end your response with:
[DECISION: APPROVE/REJECT/ESCALATE]
[REASON: Brief explanation]
"""


class GeminiService:
    """
    Service for interacting with Google Gemini AI.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        self._chat_sessions: Dict[str, Any] = {}

    @property
    def client(self):
        """Lazy load the Gemini client."""
        if self._client is None:
            try:
                import google.generativeai as genai

                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=SYSTEM_PROMPT,
                )
            except ImportError:
                logger.error("google-generativeai package not installed")
                raise
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                raise
        return self._client

    def create_chat_session(self, session_id: str) -> None:
        """
        Create a new chat session.

        Args:
            session_id: Unique identifier for the session
        """
        if session_id not in self._chat_sessions:
            self._chat_sessions[session_id] = self.client.start_chat(history=[])
            logger.info(f"Created new chat session: {session_id}")

    def send_message(
        self,
        session_id: str,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Send a message to Gemini and get a response.

        Args:
            session_id: Chat session identifier
            message: User's message
            history: Optional conversation history

        Returns:
            Dict with response text and any extracted decision
        """
        try:
            # Create session if it doesn't exist
            if session_id not in self._chat_sessions:
                self.create_chat_session(session_id)

            chat = self._chat_sessions[session_id]

            # Send message
            response = chat.send_message(message)
            response_text = response.text

            # Parse for decision markers
            decision = self._extract_decision(response_text)

            logger.info(
                f"Session {session_id}: Sent message, got response "
                f"(decision: {decision.get('outcome', 'none')})"
            )

            return {
                "text": response_text,
                "decision": decision,
            }

        except Exception as e:
            logger.error(f"Error sending message to Gemini: {e}")
            return {
                "text": f"I apologize, but I encountered an error: {str(e)}. "
                f"Please try again or use the standard form instead.",
                "decision": None,
                "error": str(e),
            }

    def _extract_decision(self, response_text: str) -> Dict[str, str]:
        """
        Extract decision markers from response.

        Looks for patterns like:
        [DECISION: APPROVE]
        [REASON: All criteria met]
        """
        decision = {}

        # Look for decision marker
        if "[DECISION:" in response_text.upper():
            try:
                start = response_text.upper().index("[DECISION:")
                end = response_text.index("]", start)
                outcome = response_text[start + 10 : end].strip().lower()
                decision["outcome"] = outcome
            except (ValueError, IndexError):
                pass

        # Look for reason marker
        if "[REASON:" in response_text.upper():
            try:
                start = response_text.upper().index("[REASON:")
                end = response_text.index("]", start)
                reason = response_text[start + 8 : end].strip()
                decision["reason"] = reason
            except (ValueError, IndexError):
                pass

        return decision

    def clear_session(self, session_id: str) -> None:
        """
        Clear a chat session.

        Args:
            session_id: Session to clear
        """
        if session_id in self._chat_sessions:
            del self._chat_sessions[session_id]
            logger.info(f"Cleared chat session: {session_id}")


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get the singleton Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service


# --- Policy Q&A chatbot (stateless, single-turn) ---

POLICY_CONTEXT = """
MAERSK GLOBAL SHORT-TERM INTERNATIONAL REMOTE WORK (SIRW) POLICY (V3, effective 1 March 2026)

1. EFFECTIVE DATE: 1 March 2026.

2. SCOPE:
Sets out Maersk's approach to SIRW, separate from Permanent International Remote Work (PIRW). 
Does NOT cover formal assignments (STA/LTA), business travel, or regular commuting.

3. PRINCIPLES:
Provides a framework to request work for a limited period in a country other than the employment country. 
Aims to manage tax/immigration risks, standardize the approach, and ensure talent retention.

4. MAIN POLICY STATEMENT:
SIRW includes working on vacation, at home abroad, or caretaking family abroad. 
Requires prior approval from both the Leader (manager) and Global Mobility.

4.1.1 ELIGIBILITY:
NOT available to:
- Frontline, customer-facing roles.
- On-site roles (seafarers, repair/maintenance, warehouse).
- Roles restricted for legal/sanction reasons or strict data security.
- Roles creating Permanent Establishment (PE) risk: Negotiating/signing contracts, Commercial/Sales/Procurement roles, or Senior Executive leadership.

4.1.2 DURATION ALLOWED:
- Maximum 20 workdays per calendar year.
- Cannot be taken as a single block of 20 continuous days.
- Colleagues must track their own workdays.
- Exceeding 20 days requires prior approval for Extended SIRW (exceptional cases only).

4.1.3 REQUIREMENTS:
- Immigration: Must have the right to work (not just visit) in the destination country. Maersk does not support visa costs.
- Tax: If SIRW creates a tax return or payroll reporting obligation, it will be declined.
- Relevant Countries: Cannot perform SIRW in countries with no Maersk entity or under EU/US/UN sanctions.

4.1.4 GOVERNANCE:
SIRW is at company discretion; no legal right. Leader approval is required first, followed by Global Mobility approval via the tech platform.

4.1.5 PROCESS:
Submit requests via the SIRW tech platform (SSO verified). A one-time profile creation is required.

5. EXTENDED SIRW (EXCEPTIONAL):
Requires immediate notification to Leader and Global Mobility for cases like birth of a child, serious illness, or death of immediate family. 
Must be approved by Functional Head, and potentially PLT/ELT members for complex cases.

7. APPENDIX A:
Sanctioned or No Maersk Entity countries include (but not limited to):
- Asia: Afghanistan, North Korea, Iran, Iraq, Myanmar, Brunei, Bhutan, Fiji, Maldives, Nepal, etc.
- IMEA: Central African Rep, Congo, Guinea, Libya, Somalia, Sudan, Syria, Yemen, Zimbabwe, etc.
- Europe: Russia, Ukraine, Bosnia & Herzegovina, Turkey, Albania, Iceland, etc.
- Americas: Haiti, Nicaragua, Venezuela, etc.
"""


def build_policy_system_prompt(current_context: str, form_data: dict) -> str:
    """Build the system prompt for the policy Q&A chatbot."""
    import json

    user_data_string = json.dumps(form_data, indent=2) if form_data else "{}"

    return f"""You are Mira, the Maersk HR Policy Assistant.
The user is currently on the "{current_context}" step of the Remote Work request form.

CURRENT FORM CONTEXT (non-personal details only):
{user_data_string}

POLICY SOURCE OF TRUTH:
MAERSK GLOBAL SHORT-TERM INTERNATIONAL REMOTE WORK (SIRW) POLICY (V3, effective 1 March 2026)
... (Policy Content) ...

INSTRUCTIONS:
1. Answer based strictly on the Policy text.
2. PERSONALISE using FORM CONTEXT where relevant.
3. Q&A only — NEVER ask the user for information, collect data, or offer to perform actions.
4. Keep answers concise (under 60 words). Use plain language.
5. Be friendly and casual — like a helpful colleague explaining things simply.
6. Do NOT cite policy section numbers in your answers.
7. When an answer has two distinct points, separate them with a blank line.
"""


def generate_suggestions(question: str, answer: str) -> List[str]:
    """Generate follow-up suggestions using Gemini (Few-Shot)."""
    try:
        import google.generativeai as genai
        import json

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

        prompt = f"""
        CONTEXT:
        User asked: "{question}"
        Mira answered: "{answer}"

        TASK:
        Generate 2 short, logical follow-up questions the user might want to ask next.
        - Max 6 words per question.
        - Must be directly relevant to the specific policy topic discussed in the answer.

        FEW-SHOT EXAMPLES:
        User: "Why are sales roles restricted?"
        Mira: "...Permanent Establishment risk..."
        Output: ["Explain 'Permanent Establishment'", "Does this apply to pre-sales?"]

        User: "Can I stay 25 days?"
        Mira: "...limit is 20 workdays..."
        Output: ["Request an exception", "What if I work weekends?"]

        OUTPUT FORMAT:
        Return ONLY a raw JSON array of strings. Example: ["Question 1", "Question 2"]
        """

        response = model.generate_content(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        if response.text:
            return json.loads(response.text)
            
    except Exception as e:
        logger.error(f"Suggestion generation failed: {e}")
    
    return ["Explain 'Right to Work'", "Check blocked countries"]


def ask_policy_question(question: str, current_context: str = "", form_data: dict = None) -> Dict[str, Any]:
    """
    Answer a policy question and generate suggestions.
    Returns: { "text": "...", "suggestions": [...] }
    """
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        system_prompt = build_policy_system_prompt(current_context, form_data or {})

        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_prompt,
        )
        response = model.generate_content(question)
        answer_text = response.text or "I couldn't find an answer to that in the policy."
        
        # Generate suggestions based on the Q&A pair
        suggestions = generate_suggestions(question, answer_text)

        return {
            "text": answer_text,
            "suggestions": suggestions
        }

    except Exception as e:
        logger.error(f"Policy chat error: {e}")
        return {
            "text": "I'm having trouble connecting right now.",
            "suggestions": ["Try again later"]
        }