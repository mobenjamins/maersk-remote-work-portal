"""
Serializers for admin portal endpoints.
"""

from rest_framework import serializers
from apps.users.models import User
from apps.requests.models import RemoteWorkRequest


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
            "decision_reason",
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
