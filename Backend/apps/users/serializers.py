"""
Serializers for user-related API endpoints.
"""

from rest_framework import serializers
from .models import User


class LoginSerializer(serializers.Serializer):
    """Serializer for initiating login."""

    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate that email is a Maersk or The Cozm domain."""
        allowed_domains = ("@maersk.com", "@thecozm.com")
        if not value.endswith(allowed_domains):
            raise serializers.ValidationError(
                "Only @maersk.com and @thecozm.com email addresses are allowed."
            )
        return value.lower()


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification."""

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""

    days_used = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "phone",
            "maersk_entity",
            "home_country",
            "is_sales_role",
            "days_allowed",
            "days_used",
            "days_remaining",
            "profile_completed",
            "profile_consent_given",
            "created_at",
        ]
        read_only_fields = ["id", "email", "created_at", "days_used", "days_remaining"]


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile (PATCH)."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "middle_name",
            "last_name",
            "phone",
            "home_country",
            "profile_consent_given",
        ]


class UserDaysSerializer(serializers.Serializer):
    """Serializer for days remaining endpoint."""

    used = serializers.IntegerField()
    allowed = serializers.IntegerField()
    remaining = serializers.IntegerField()


class AuthTokenSerializer(serializers.Serializer):
    """Serializer for authentication response."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
