"""
Serializers for AI chat endpoints.
"""

from rest_framework import serializers


class ChatMessageRequestSerializer(serializers.Serializer):
    """Request serializer for sending a chat message."""

    session_id = serializers.UUIDField(required=False)
    message = serializers.CharField(max_length=4000)


class ChatDecisionSerializer(serializers.Serializer):
    """Serializer for extracted decision."""

    outcome = serializers.CharField(required=False)
    reason = serializers.CharField(required=False)


class ChatMessageResponseSerializer(serializers.Serializer):
    """Response serializer for chat messages."""

    session_id = serializers.UUIDField()
    text = serializers.CharField()
    decision = ChatDecisionSerializer(required=False, allow_null=True)


class CreateChatSessionSerializer(serializers.Serializer):
    """Request serializer for creating a chat session."""

    request_id = serializers.UUIDField(required=False)


class PolicyChatRequestSerializer(serializers.Serializer):
    """Request serializer for the policy Q&A chatbot."""

    question = serializers.CharField(max_length=2000)
    current_context = serializers.CharField(max_length=200, required=False, default="")
    form_data = serializers.DictField(required=False, default=dict)
