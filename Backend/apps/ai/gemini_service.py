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
