"""
Views for AI chat endpoints.
"""

import logging
import uuid
import email
import re
from email import policy as email_policy

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from django.conf import settings

from .gemini_service import get_gemini_service, ask_policy_question
from .serializers import (
    ChatMessageRequestSerializer,
    ChatMessageResponseSerializer,
    CreateChatSessionSerializer,
    PolicyChatRequestSerializer,
)
from apps.requests.models import ChatSession, ChatMessage

logger = logging.getLogger(__name__)


@extend_schema(
    request=CreateChatSessionSerializer,
    responses={
        201: {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "format": "uuid"},
            },
        }
    },
    tags=["AI Chat"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    Create a new AI chat session.

    Optionally link it to an existing request.
    """
    serializer = CreateChatSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Create database record
    session = ChatSession.objects.create(
        user=request.user,
        request_id=serializer.validated_data.get("request_id"),
    )

    # Initialize Gemini session
    gemini = get_gemini_service()
    gemini.create_chat_session(str(session.id))

    logger.info(f"Created chat session {session.id} for user {request.user.email}")

    return Response({"session_id": str(session.id)}, status=status.HTTP_201_CREATED)


@extend_schema(
    request=ChatMessageRequestSerializer,
    responses={200: ChatMessageResponseSerializer},
    tags=["AI Chat"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Send a message to the AI assistant and get a response.

    If no session_id is provided, a new session is created automatically.
    """
    serializer = ChatMessageRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    message = serializer.validated_data["message"]
    session_id = serializer.validated_data.get("session_id")

    # Get or create session
    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND
            )
    else:
        session = ChatSession.objects.create(user=request.user)
        session_id = session.id

    # Save user message
    ChatMessage.objects.create(
        session=session,
        role="user",
        text=message,
    )

    # Send to Gemini
    gemini = get_gemini_service()
    result = gemini.send_message(str(session_id), message)

    # Save AI response
    ChatMessage.objects.create(
        session=session,
        role="model",
        text=result["text"],
    )

    # Update session outcome if decision was made
    if result.get("decision") and result["decision"].get("outcome"):
        outcome = result["decision"]["outcome"]
        if outcome in ["approve", "approved"]:
            session.outcome = "approved"
        elif outcome in ["reject", "rejected"]:
            session.outcome = "rejected"
        elif outcome in ["escalate", "escalated"]:
            session.outcome = "escalated"
        session.save()

    return Response(
        {
            "session_id": str(session_id),
            "text": result["text"],
            "decision": result.get("decision"),
        }
    )


@extend_schema(
    responses={
        200: {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "format": "uuid"},
                "messages": {"type": "array"},
                "outcome": {"type": "string"},
            },
        }
    },
    tags=["AI Chat"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_session(request, session_id):
    """
    Get chat session history.
    """
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response(
            {"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND
        )

    messages = session.messages.all().values("id", "role", "text", "created_at")

    return Response(
        {
            "session_id": str(session.id),
            "messages": list(messages),
            "outcome": session.outcome,
            "created_at": session.created_at,
        }
    )


@extend_schema(
    responses={204: None},
    tags=["AI Chat"],
)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    """
    Delete a chat session.
    """
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response(
            {"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # Clear from Gemini service
    gemini = get_gemini_service()
    gemini.clear_session(str(session_id))

    # Delete from database
    session.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    request=PolicyChatRequestSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
            },
        }
    },
    tags=["AI Chat"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def policy_chat(request):
    """
    Stateless policy Q&A endpoint.

    The frontend sends a question plus optional form context;
    the backend builds a system prompt with few-shot examples
    and calls Gemini, keeping the API key server-side.
    """
    serializer = PolicyChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    question = serializer.validated_data["question"]
    current_context = serializer.validated_data.get("current_context", "")
    form_data = serializer.validated_data.get("form_data", {})

    text = ask_policy_question(question, current_context, form_data)

    return Response({"text": text})


# --- File-based extraction helpers ---

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyPDF2."""
    import PyPDF2
    import io

    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def _extract_text_from_msg(file_bytes: bytes) -> str:
    """Extract text from a .msg (Outlook) file using extract-msg."""
    import extract_msg
    import io
    import tempfile
    import os

    # extract-msg requires a file path, so write to a temp file
    with tempfile.NamedTemporaryFile(suffix=".msg", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        msg = extract_msg.Message(tmp_path)
        parts = []
        if msg.sender:
            parts.append(f"From: {msg.sender}")
        if msg.to:
            parts.append(f"To: {msg.to}")
        if msg.subject:
            parts.append(f"Subject: {msg.subject}")
        parts.append("")
        if msg.body:
            parts.append(msg.body)
        msg.close()
        return "\n".join(parts)
    finally:
        os.unlink(tmp_path)


def _extract_text_from_eml(file_bytes: bytes) -> str:
    """Extract text from a .eml file using Python stdlib email module."""
    msg = email.message_from_bytes(file_bytes, policy=email_policy.default)
    parts = []

    # Headers
    for header in ("From", "To", "Subject"):
        val = msg.get(header)
        if val:
            parts.append(f"{header}: {val}")
    parts.append("")

    # Body
    body = msg.get_body(preferencelist=("plain", "html"))
    if body:
        content = body.get_content()
        if content:
            parts.append(content)
    else:
        # Fallback: decode raw payload
        payload = msg.get_payload(decode=True)
        if payload:
            parts.append(payload.decode("utf-8", errors="replace"))

    return "\n".join(parts)


def _call_gemini_for_extraction(extracted_text: str) -> dict:
    """Send extracted text to Gemini and ask it to identify manager and employee details."""
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

        prompt = (
            "Analyse this email/document text and identify:\n"
            "1. The SENDER (the manager who sent the approval).\n"
            "2. The RECIPIENT (the employee requesting the remote work).\n\n"
            f"TEXT CONTENT:\n{extracted_text[:10000]}\n\n"
            "INSTRUCTIONS:\n"
            "1. Extract the Manager's Full Name and Email Address.\n"
            "2. Extract the Employee's Full Name.\n"
            "3. Extract the Employee's Home Country ONLY if explicitly mentioned or clear from their signature. Otherwise, leave blank.\n"
            '4. Return JSON ONLY: { "managerName": "...", "managerEmail": "...", "employeeName": "...", "homeCountry": "..." }\n'
            "5. If any field is not found, use an empty string."
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )

        import json
        text = response.text
        if text:
            parsed = json.loads(text)
            return {
                "manager_name": parsed.get("managerName", ""),
                "manager_email": parsed.get("managerEmail", ""),
                "employee_name": parsed.get("employeeName", ""),
                "home_country": parsed.get("homeCountry", ""),
            }
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")

    return {"manager_name": "", "manager_email": "", "employee_name": "", "home_country": ""}


def _regex_fallback(extracted_text: str) -> dict:
    """Simple regex fallback if Gemini is unavailable."""
    email_match = re.search(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", extracted_text
    )
    return {
        "manager_name": "",
        "manager_email": email_match.group(0) if email_match else "",
        "employee_name": "",
        "home_country": "",
    }


@extend_schema(
    request={"multipart/form-data": {"type": "object", "properties": {"file": {"type": "string", "format": "binary"}}}},
    responses={
        200: {
            "type": "object",
            "properties": {
                "manager_name": {"type": "string"},
                "manager_email": {"type": "string"},
            },
        }
    },
    tags=["AI Chat"],
)
@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def extract_approval(request):
    """
    Extract manager name and email from an uploaded approval file.

    Accepts .pdf, .msg, .eml, or .txt files. Parses the text server-side
    and uses Gemini for entity extraction.
    """
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response(
            {"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
        )

    file_bytes = uploaded.read()
    filename = uploaded.name.lower()
    extracted_text = ""

    try:
        if filename.endswith(".pdf"):
            extracted_text = _extract_text_from_pdf(file_bytes)
        elif filename.endswith(".msg"):
            extracted_text = _extract_text_from_msg(file_bytes)
        elif filename.endswith(".eml"):
            extracted_text = _extract_text_from_eml(file_bytes)
        elif filename.endswith(".txt"):
            extracted_text = file_bytes.decode("utf-8", errors="replace")
        else:
            return Response(
                {"error": "Unsupported file type. Please upload .pdf, .msg, .eml, or .txt."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        logger.error(f"File text extraction failed: {e}")
        return Response(
            {"manager_name": "", "manager_email": "", "employee_name": "", "home_country": ""},
            status=status.HTTP_200_OK,
        )

    if not extracted_text or len(extracted_text.strip()) < 10:
        return Response(
            {"manager_name": "", "manager_email": "", "employee_name": "", "home_country": ""},
            status=status.HTTP_200_OK,
        )

    # Try Gemini, fall back to regex
    if getattr(settings, "GEMINI_API_KEY", None):
        result = _call_gemini_for_extraction(extracted_text)
    else:
        result = _regex_fallback(extracted_text)

    return Response(result, status=status.HTTP_200_OK)
