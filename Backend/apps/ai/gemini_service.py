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
India/Middle East/Africa: Burundi, Chad, Comoros, Equatorial Guinea, Eritrea, Guinea-Bissau, Kazakhstan, Kyrgyzstan, Sao Tome and Principe, Seychelles, Tajikistan
North America: Antigua & Barbuda, Bahamas, Barbados, Cuba, Dominica, Grenada, Jamaica, Saint Kitts and Nevis, Saint Lucia, St Vincent & the Grenadines
Latin America: Belize, Guyana, Suriname
"""


def build_policy_system_prompt(current_context: str, form_data: dict) -> str:
    """Build the system prompt for the policy Q&A chatbot."""
    import json

    user_data_string = json.dumps(form_data, indent=2) if form_data else "{}"

    return f"""You are a helpful HR Policy Assistant for Maersk.
The user is currently on the "{current_context}" step of the Remote Work request form.

CURRENT FORM CONTEXT (non-personal details only):
{user_data_string}

POLICY SOURCE OF TRUTH:
{POLICY_CONTEXT}

INSTRUCTIONS:
1. Answer based strictly on the Policy text.
2. PERSONALISE using FORM CONTEXT where relevant.
3. Q&A only — NEVER ask the user for information, collect data, or offer to perform actions.
4. Keep answers concise (under 60 words). Use plain language.
5. Be friendly and casual — like a helpful colleague explaining things simply.
6. Do NOT cite policy section numbers in your answers.
7. When an answer has two distinct points, separate them with a blank line.

EXAMPLE ANSWERS (match this tone and length):

Q: "What documents do I need?"
A: "You just need an approval email from your line manager. Upload it here and the system will pull out their name and email automatically. Most email applications let you save or export emails as a file — just drag it in."

Q: "Who can approve my request?"
A: "Your line manager approves first, then Global Mobility gives the final sign-off. If you're requesting more than 20 days (exceptional cases only), your Functional Head and possibly PLT/ELT members need to approve too."

Q: "Which countries are blocked?"
A: "Two types are blocked: sanctioned countries (e.g. Russia, Iran, North Korea) and countries with no Maersk entity (e.g. Iceland, Cuba, Nepal). The full list is in Appendix A of the policy."

Q: "How many days can I take?"
A: "Up to 20 workdays per calendar year. You can split them across multiple trips, but you can't take all 20 as one continuous block. It's your responsibility to track your days."

Q: "Explain 'Right to Work'"
A: "Right to Work means you must be legally allowed to work in the destination country — not just visit it. A tourist visa doesn't count. If you're unsure, check with the Global Mobility Partners.

Maersk won't cover visa costs for remote work trips."

Q: "Why are these roles restricted?"
A: "Roles that involve negotiating or signing contracts (like sales, procurement, or senior exec roles) can create 'Permanent Establishment' risk — basically, it could make Maersk liable for taxes in that country.

Customer-facing and on-site roles are also excluded."
"""


def ask_policy_question(question: str, current_context: str = "", form_data: dict = None) -> str:
    """
    Answer a policy question using Gemini (stateless, single-turn).
    Called by the policy_chat view — keeps the API key server-side.
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

        return response.text or "I couldn't find an answer to that in the policy."

    except Exception as e:
        logger.error(f"Policy chat error: {e}")
        return (
            "I'm having trouble connecting right now. The key points are: "
            "max 20 days/year, you need valid work rights, and manager "
            "approval is required via email upload."
        )
