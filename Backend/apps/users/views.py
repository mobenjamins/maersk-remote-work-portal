"""
Views for user authentication and profile management.
"""

import logging
import random
import string
from typing import Dict

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import User, OTPCode
from .serializers import (
    LoginSerializer,
    VerifyOTPSerializer,
    UserSerializer,
    UserUpdateSerializer,
    UserDaysSerializer,
    AuthTokenSerializer,
)

logger = logging.getLogger(__name__)


def parse_name_from_email(email: str) -> Dict[str, str]:
    """
    Parse first, middle, and last name from a Maersk email address.

    Examples:
        benjamin.oghene@maersk.com -> {"first_name": "Benjamin", "last_name": "Oghene"}
        john.middle.smith@maersk.com -> {"first_name": "John", "middle_name": "Middle", "last_name": "Smith"}
        alice@maersk.com -> {"first_name": "Alice", "last_name": ""}
    """
    prefix = email.split("@")[0]  # e.g., "benjamin.oghene"
    parts = prefix.split(".")  # e.g., ["benjamin", "oghene"]

    if len(parts) == 1:
        return {
            "first_name": parts[0].title(),
            "last_name": "",
        }
    elif len(parts) == 2:
        return {
            "first_name": parts[0].title(),
            "last_name": parts[1].title(),
        }
    else:
        # 3+ parts: first.middle.last or first.middle1.middle2.last
        return {
            "first_name": parts[0].title(),
            "middle_name": " ".join(p.title() for p in parts[1:-1]),
            "last_name": parts[-1].title(),
        }


@extend_schema(
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(description="OTP sent successfully"),
        400: OpenApiResponse(description="Invalid email"),
    },
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Initiate login by sending OTP to email.
    For MVP, OTP is not actually sent - any 6-digit code works.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    # Generate OTP (for MVP, we log it but don't send)
    code = "".join(random.choices(string.digits, k=6))

    # Store OTP
    OTPCode.objects.create(email=email, code=code)

    # In production, send email here
    logger.info(f"[MVP] OTP for {email}: {code}")

    return Response(
        {
            "message": "Verification code sent to your email.",
            "email": email,
            # For MVP/demo, include the code in response
            "debug_code": code if True else None,  # Remove in production
        }
    )


@extend_schema(
    request=VerifyOTPSerializer,
    responses={
        200: AuthTokenSerializer,
        400: OpenApiResponse(description="Invalid OTP"),
    },
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP and return JWT tokens.
    For MVP, any 6-digit code is accepted.
    """
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"].lower()
    code = serializer.validated_data["code"]

    # MVP: Accept any 6-digit code
    # In production, validate against OTPCode model:
    # otp = OTPCode.objects.filter(email=email, code=code, is_used=False).first()
    # if not otp or not otp.is_valid:
    #     return Response({'error': 'Invalid or expired code'}, status=400)
    # otp.is_used = True
    # otp.save()

    # Get or create user with properly parsed name
    name_parts = parse_name_from_email(email)

    # Auto-grant admin for specific domains/emails
    admin_domains = ("@thecozm.com",)
    admin_emails = ("mark.vaughan@maersk.com",)
    grant_admin = email.endswith(admin_domains) or email in admin_emails

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email.split("@")[0],
            "is_admin": grant_admin,
            **name_parts,
        },
    )

    if created:
        logger.info(f"Created new user: {email} ({name_parts})")
    elif grant_admin and not user.is_admin:
        # Upgrade existing users to admin if they match criteria
        user.is_admin = True
        user.save(update_fields=["is_admin"])

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }
    )


@extend_schema(
    responses={200: OpenApiResponse(description="Logged out successfully")},
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user by blacklisting refresh token.
    """
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception as e:
        logger.warning(f"Logout error: {e}")

    return Response({"message": "Successfully logged out."})


@extend_schema(
    responses={200: UserSerializer},
    tags=["Users"],
)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Get or update current user's profile.

    GET: Returns the current user's profile data.
    PATCH: Updates the current user's profile with provided fields.
    """
    if request.method == "GET":
        return Response(UserSerializer(request.user).data)

    # PATCH - update user profile
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Mark profile as completed if consent was given
    if request.data.get("profile_consent_given"):
        request.user.profile_completed = True
        request.user.save(update_fields=["profile_completed"])

    return Response(UserSerializer(request.user).data)


@extend_schema(
    responses={200: UserDaysSerializer},
    tags=["Users"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def days_remaining(request):
    """
    Get current user's remote work days balance.
    """
    user = request.user
    return Response(
        {
            "used": user.days_used,
            "allowed": user.days_allowed,
            "remaining": user.days_remaining,
        }
    )
