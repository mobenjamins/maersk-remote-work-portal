"""
Views for AI chat endpoints.
"""

import logging
import uuid

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .gemini_service import get_gemini_service
from .serializers import (
    ChatMessageRequestSerializer,
    ChatMessageResponseSerializer,
    CreateChatSessionSerializer,
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
