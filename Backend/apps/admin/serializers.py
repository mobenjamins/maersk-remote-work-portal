"""
Serializers for admin portal endpoints.
"""

from rest_framework import serializers
from apps.users.models import User
from apps.requests.models import (
    RemoteWorkRequest,
    PolicyDocument,
    MiraQuestion,
    RequestComment,
)


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for user list in admin portal."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "home_country",
            "is_admin",
            "is_sales_role",
            "days_allowed",
            "days_used",
            "days_remaining",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "days_used", "days_remaining"]


class AdminRequestListSerializer(serializers.ModelSerializer):
    """Serializer for request list in admin portal with summary data."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = RemoteWorkRequest
        fields = [
            "id",
            "user_email",
            "user_name",
            "destination_country",
            "home_country",
            "start_date",
            "end_date",
            "duration_days",
            "status",
            "decision_status",
            "decision_source",
            "decision_reason",
            "flags",
            "is_exception_request",
            "exception_reason",
            "decision_notified_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        """Return user's full name."""
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.email


class AdminAnalyticsSerializer(serializers.Serializer):
    """Serializer for analytics data."""

    total_requests = serializers.IntegerField()
    approved_requests = serializers.IntegerField()
    rejected_requests = serializers.IntegerField()
    escalated_requests = serializers.IntegerField()
    total_users = serializers.IntegerField()
    approval_rate = serializers.FloatField()


class PolicyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source="uploaded_by.email", read_only=True)

    class Meta:
        model = PolicyDocument
        fields = [
            "id",
            "doc_type",
            "file",
            "version",
            "status",
            "notes",
            "uploaded_by_email",
            "uploaded_at",
        ]
        read_only_fields = ["id", "version", "uploaded_by_email", "uploaded_at", "status"]


class MiraQuestionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = MiraQuestion
        fields = [
            "id",
            "user_email",
            "question_text",
            "answer_text",
            "context_country",
            "linked_policy_section",
            "answered",
            "created_at",
        ]
        read_only_fields = fields


class RequestCommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)

    class Meta:
        model = RequestComment
        fields = [
            "id",
            "request",
            "author_email",
            "body",
            "created_at",
        ]
        read_only_fields = ["id", "author_email", "created_at"]
