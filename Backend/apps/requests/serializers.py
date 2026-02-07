"""
Serializers for remote work request endpoints.
"""

from rest_framework import serializers
from django.conf import settings
from .models import RemoteWorkRequest, ChatSession, ChatMessage, calculate_workdays
from apps.compliance.blocked_countries import is_country_blocked, get_block_message


class RemoteWorkRequestSerializer(serializers.ModelSerializer):
    """Serializer for remote work request data."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    manager_full_name = serializers.CharField(read_only=True)

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "id",
            "reference_number",
            "user_email",
            "request_type",
            "status",
            "maersk_entity",
            "home_country",
            "destination_country",
            "start_date",
            "end_date",
            "duration_days",
            "has_right_to_work",
            "is_sales_role",
            "confirmed_role_eligible",
            "manager_first_name",
            "manager_middle_name",
            "manager_last_name",
            "manager_email",
            "manager_full_name",
            "manager_approval_document",
            "is_exception_request",
            "exception_reason",
            "decision_reason",
            "escalation_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reference_number",
            "user_email",
            "duration_days",
            "manager_full_name",
            "decision_reason",
            "escalation_note",
            "created_at",
            "updated_at",
        ]


class CreateRemoteWorkRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating a new remote work request (legacy)."""

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "request_type",
            "maersk_entity",
            "home_country",
            "destination_country",
            "start_date",
            "end_date",
            "has_right_to_work",
            "is_sales_role",
            "manager_approval_document",
        ]

    def validate(self, data):
        """Validate request data."""
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )

        duration = (data["end_date"] - data["start_date"]).days + 1
        if duration > 365:
            raise serializers.ValidationError(
                {"end_date": "Request duration cannot exceed 365 days."}
            )

        return data

    def create(self, validated_data):
        """Create request with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SIRWWizardRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the new SIRW wizard flow.
    Handles all fields from the multi-step wizard.
    """

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "destination_country",
            "start_date",
            "end_date",
            "has_right_to_work",
            "confirmed_role_eligible",
            "manager_first_name",
            "manager_middle_name",
            "manager_last_name",
            "manager_email",
            "manager_approval_document",
            "is_exception_request",
            "exception_reason",
        ]

    def validate_destination_country(self, value):
        """Validate destination country is not blocked."""
        if is_country_blocked(value):
            message = get_block_message(value)
            raise serializers.ValidationError(
                message or f"SIRW to {value} is not permitted."
            )
        return value

    def validate(self, data):
        """Validate request data."""
        # Date validation
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )

        # Calculate workdays
        workdays = calculate_workdays(data["start_date"], data["end_date"])

        # Check right to work
        if not data.get("has_right_to_work"):
            raise serializers.ValidationError(
                {
                    "has_right_to_work": "You must have the legal right to work in the destination country."
                }
            )

        # Check role eligibility
        if not data.get("confirmed_role_eligible"):
            raise serializers.ValidationError(
                {
                    "confirmed_role_eligible": "You must confirm your role is eligible for SIRW."
                }
            )

        # Check if exception is needed but not requested
        max_consecutive = settings.REMOTE_WORK_SETTINGS.get("MAX_CONSECUTIVE_DAYS", 14)
        max_annual = settings.REMOTE_WORK_SETTINGS.get("MAX_SINGLE_TRIP_DAYS", 20)

        if workdays > max_annual and not data.get("is_exception_request"):
            raise serializers.ValidationError(
                {
                    "is_exception_request": f"Requests exceeding {max_annual} workdays require an exception request."
                }
            )

        if data.get("is_exception_request") and not data.get("exception_reason"):
            raise serializers.ValidationError(
                {
                    "exception_reason": "Please provide a reason for your exception request."
                }
            )

        return data

    def create(self, validated_data):
        """Create request with current user and defaults."""
        user = self.context["request"].user

        validated_data["user"] = user
        validated_data["request_type"] = "short_term"
        validated_data["maersk_entity"] = user.maersk_entity
        validated_data["home_country"] = user.home_country

        return super().create(validated_data)


class UpdateRemoteWorkRequestSerializer(serializers.ModelSerializer):
    """Serializer for updating a remote work request."""

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "status",
            "decision_reason",
            "escalation_note",
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""

    class Meta:
        model = ChatMessage
        fields = ["id", "role", "text", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions."""

    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "user",
            "request",
            "outcome",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class RequestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for request list."""

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "id",
            "reference_number",
            "status",
            "destination_country",
            "start_date",
            "end_date",
            "duration_days",
            "created_at",
        ]
