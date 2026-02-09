"""
Views for remote work request management.
"""

import logging

from django.conf import settings
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import RemoteWorkRequest, ChatSession, ChatMessage, calculate_workdays
from .serializers import (
    RemoteWorkRequestSerializer,
    CreateRemoteWorkRequestSerializer,
    UpdateRemoteWorkRequestSerializer,
    RequestListSerializer,
    ChatSessionSerializer,
    ChatMessageSerializer,
    SIRWWizardRequestSerializer,
    DecisionModalSerializer,
)
from apps.compliance.services import ComplianceService
from apps.compliance.blocked_countries import is_country_blocked, get_block_message

logger = logging.getLogger(__name__)


class RemoteWorkRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing remote work requests.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        """Return requests for the current user."""
        return RemoteWorkRequest.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return CreateRemoteWorkRequestSerializer
        if self.action in ["update", "partial_update"]:
            return UpdateRemoteWorkRequestSerializer
        if self.action == "list":
            return RequestListSerializer
        return RemoteWorkRequestSerializer

    @extend_schema(
        tags=["Requests"],
        responses={200: RequestListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        """List all requests for the current user."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["Requests"],
        responses={200: RemoteWorkRequestSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        """Get a specific request."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        tags=["Requests"],
        request=CreateRemoteWorkRequestSerializer,
        responses={201: RemoteWorkRequestSerializer},
    )
    def create(self, request, *args, **kwargs):
        """
        Create a new remote work request.
        Automatically runs compliance assessment.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the request
        instance = serializer.save()

        # Run compliance assessment
        compliance_service = ComplianceService()
        assessment = compliance_service.assess(
            has_right_to_work=instance.has_right_to_work,
            is_sales_role=instance.is_sales_role,
            duration_days=instance.duration_days,
            home_country=instance.home_country,
            destination_country=instance.destination_country,
        )

        # Update request with compliance decision
        instance.status = assessment["outcome"]
        instance.decision_reason = assessment["reason"]
        if assessment["outcome"] == "escalated":
            instance.escalation_note = assessment.get("escalation_note", "")
        instance.save()

        logger.info(
            f"Request {instance.reference_number} created with status: {instance.status}"
        )

        return Response(
            RemoteWorkRequestSerializer(instance).data, status=status.HTTP_201_CREATED
        )

    @extend_schema(
        tags=["Requests"],
        request=UpdateRemoteWorkRequestSerializer,
        responses={200: RemoteWorkRequestSerializer},
    )
    def update(self, request, *args, **kwargs):
        """Update a request."""
        return super().update(request, *args, **kwargs)

    @extend_schema(
        tags=["Requests"],
        request=UpdateRemoteWorkRequestSerializer,
        responses={200: RemoteWorkRequestSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        """Partially update a request."""
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["Requests"],
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        """
        Cancel a request (soft delete by changing status).
        """
        instance = self.get_object()
        if instance.status in ["approved", "completed"]:
            return Response(
                {"error": "Cannot cancel an approved or completed request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.status = "cancelled"
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="decisions/latest")
    def latest_decision(self, request):
        """
        Return the latest unacknowledged decision for the current user.
        """
        decision = (
            RemoteWorkRequest.objects.filter(
                user=request.user,
                status__in=["approved", "rejected"],
                decision_acknowledged_at__isnull=True,
            )
            .order_by("-updated_at")
            .first()
        )
        if not decision:
            return Response({"decision": None})
        return Response({"decision": DecisionModalSerializer(decision).data})

    @action(detail=True, methods=["post"], url_path="acknowledge")
    def acknowledge_decision(self, request, pk=None):
        """
        Mark a decision modal as acknowledged.
        """
        instance = self.get_object()
        if instance.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        instance.decision_acknowledged_at = timezone.now()
        instance.save(update_fields=["decision_acknowledged_at"])
        return Response({"status": "acknowledged"})


@extend_schema(
    tags=["SIRW"],
    request=SIRWWizardRequestSerializer,
    responses={
        201: {
            "type": "object",
            "properties": {
                "reference_number": {"type": "string"},
                "status": {"type": "string"},
                "outcome": {"type": "string"},
                "message": {"type": "string"},
            },
        },
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sirw_wizard_submit(request):
    """
    Submit a SIRW request from the multi-step wizard.

    This endpoint handles the full wizard submission including:
    - Manager approval details
    - Compliance validation
    - Annual day tracking
    - Auto-approve/reject/escalate logic
    """
    serializer = SIRWWizardRequestSerializer(
        data=request.data, context={"request": request}
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Get user and calculate annual usage
    user = request.user
    current_year = timezone.now().year

    # Calculate days already used this year
    days_used = (
        RemoteWorkRequest.objects.filter(
            user=user,
            status__in=["approved", "completed"],
            start_date__year=current_year,
        ).aggregate(total=Sum("duration_days"))["total"]
        or 0
    )

    # Calculate days for this request
    request_days = calculate_workdays(
        serializer.validated_data["start_date"],
        serializer.validated_data["end_date"],
    )

    # Check if this would exceed annual limit
    max_annual = settings.REMOTE_WORK_SETTINGS.get("DEFAULT_DAYS_ALLOWED", 20)
    max_consecutive = settings.REMOTE_WORK_SETTINGS.get("MAX_CONSECUTIVE_DAYS", 14)
    would_exceed_annual = (days_used + request_days) > max_annual
    exceeds_consecutive = request_days > max_consecutive
    is_exception = serializer.validated_data.get("is_exception_request", False)

    # Create the request
    instance = serializer.save()

    flags = []

    # Determine outcome
    if is_country_blocked(instance.destination_country):
        # Should not happen due to validation, but double-check
        instance.status = "rejected"
        instance.decision_status = RemoteWorkRequest.DecisionStatus.AUTO_REJECTED
        instance.decision_reason = get_block_message(instance.destination_country)
        outcome = "rejected"
        message = instance.decision_reason
        flags.append("sanctioned_country")
    elif not instance.has_right_to_work:
        instance.status = "rejected"
        instance.decision_status = RemoteWorkRequest.DecisionStatus.AUTO_REJECTED
        instance.decision_reason = (
            "SIRW cannot be approved without the legal right to work in the "
            "destination country."
        )
        outcome = "rejected"
        message = instance.decision_reason
        flags.append("no_right_to_work")
    elif not instance.confirmed_role_eligible:
        instance.status = "rejected"
        instance.decision_status = RemoteWorkRequest.DecisionStatus.AUTO_REJECTED
        instance.decision_reason = (
            "Your role category is not eligible for SIRW according to company policy."
        )
        outcome = "rejected"
        message = instance.decision_reason
        flags.append("role_ineligible")
    elif is_exception or would_exceed_annual or exceeds_consecutive:
        # Route to pending review
        instance.status = "escalated"
        instance.decision_status = RemoteWorkRequest.DecisionStatus.NEEDS_REVIEW
        reasons = []
        if would_exceed_annual:
            reasons.append(
                f"would exceed annual limit ({days_used} + {request_days} = {days_used + request_days} days)"
            )
            flags.append("exceeds_annual_limit")
        if exceeds_consecutive:
            reasons.append(f"exceeds {max_consecutive}-day consecutive limit")
            flags.append("exceeds_consecutive_limit")
        if is_exception:
            reasons.append("exception requested")
            if instance.exception_type:
                flags.append(f"exception:{instance.exception_type}")

        instance.decision_reason = (
            f"Request requires Global Mobility review: {', '.join(reasons)}. "
            f"Exception reason: {instance.exception_reason or 'Not provided'} (Policy Sections 4.1.2, 5)."
        )
        instance.escalation_note = (
            f"Days used this year: {days_used}. "
            f"Request duration: {request_days} days. "
            f"Manager: {instance.manager_full_name} ({instance.manager_email})"
        )
        outcome = "pending"
        message = (
            "Your request has been submitted for review by Global Mobility. "
            "You will receive confirmation via email."
        )
    else:
        # Auto-approve
        instance.status = "approved"
        instance.decision_status = RemoteWorkRequest.DecisionStatus.AUTO_APPROVED
        instance.decision_reason = (
            f"All compliance checks passed. SIRW to {instance.destination_country} "
            f"for {request_days} workdays is approved."
        )
        outcome = "approved"
        message = (
            f"Your SIRW request to {instance.destination_country} for {request_days} "
            f"workdays has been approved. A confirmation email has been sent."
        )

    instance.decision_source = RemoteWorkRequest.DecisionSource.AUTO
    instance.flags = flags
    if instance.status in ["approved", "rejected"]:
        instance.decision_notified_at = timezone.now()
    instance.save()

    if instance.status in ["approved", "rejected"]:
        _send_decision_email(instance, "")

    logger.info(
        f"SIRW Request {instance.reference_number} created: "
        f"status={instance.status}, days={request_days}, user={user.email}"
    )

    return Response(
        {
            "reference_number": instance.reference_number,
            "status": instance.status,
            "outcome": outcome,
            "message": message,
            "days_used_this_year": days_used,
            "days_remaining": max(0, max_annual - days_used - request_days)
            if outcome == "approved"
            else max(0, max_annual - days_used),
            "request": RemoteWorkRequestSerializer(instance).data,
        },
        status=status.HTTP_201_CREATED,
    )


def _send_decision_email(instance, note: str) -> None:
    if not settings.SENDGRID_API_KEY:
        return
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, HtmlContent
    except Exception:
        logger.warning("SendGrid client not available; decision email not sent.")
        return

    try:
        html_content = render_to_string(
            "emails/decision.html",
            {
                "employee_name": instance.user.first_name or instance.user.email,
                "reference_number": instance.reference_number,
                "status": instance.status,
                "decision_reason": instance.decision_reason,
                "note": note,
                "destination_country": instance.destination_country,
                "start_date": instance.start_date,
                "end_date": instance.end_date,
            },
        )
        manager_email = instance.manager_email or None
        cc_emails = [manager_email] if manager_email else None
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=instance.user.email,
            subject=f"SIRW Decision Update: {instance.reference_number}",
            html_content=HtmlContent(html_content),
            cc_emails=cc_emails,
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
    except Exception:
        logger.exception("Failed to send decision email.")


@extend_schema(
    tags=["SIRW"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "days_allowed": {"type": "integer"},
                "days_used": {"type": "integer"},
                "days_remaining": {"type": "integer"},
                "requests_this_year": {"type": "array"},
            },
        },
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sirw_annual_balance(request):
    """
    Get the user's annual SIRW day balance.

    Returns:
    - days_allowed: Total days allowed per year (default 20)
    - days_used: Days already used in approved/completed requests this year
    - days_remaining: Days available for new requests
    - requests_this_year: Summary of requests made this year
    """
    user = request.user
    current_year = timezone.now().year

    # Get all requests for this year
    year_requests = RemoteWorkRequest.objects.filter(
        user=user,
        start_date__year=current_year,
    ).order_by("-created_at")

    # Calculate days used (only approved/completed)
    approved_requests = year_requests.filter(status__in=["approved", "completed"])
    days_used = approved_requests.aggregate(total=Sum("duration_days"))["total"] or 0

    # Get settings
    max_annual = settings.REMOTE_WORK_SETTINGS.get("DEFAULT_DAYS_ALLOWED", 20)

    return Response(
        {
            "year": current_year,
            "days_allowed": max_annual,
            "days_used": days_used,
            "days_remaining": max(0, max_annual - days_used),
            "pending_days": year_requests.filter(status="escalated").aggregate(
                total=Sum("duration_days")
            )["total"]
            or 0,
            "requests_this_year": RequestListSerializer(year_requests, many=True).data,
        }
    )


@extend_schema(
    tags=["SIRW"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "has_overlap": {"type": "boolean"},
                "overlapping_requests": {"type": "array"},
            },
        },
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_date_overlap(request):
    """
    Check if proposed dates overlap with existing requests.
    Used to detect back-to-back requests that might circumvent the 14-day rule.
    """
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")

    if not start_date or not end_date:
        return Response(
            {"error": "start_date and end_date are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    current_year = timezone.now().year

    # Find overlapping or adjacent requests
    from datetime import datetime, timedelta

    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"error": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for requests within 7 days of this request (potential back-to-back)
    buffer_days = 7
    overlap_start = start - timedelta(days=buffer_days)
    overlap_end = end + timedelta(days=buffer_days)

    nearby_requests = (
        RemoteWorkRequest.objects.filter(
            user=user,
            status__in=["approved", "completed", "escalated", "pending"],
        )
        .filter(
            # Requests that overlap or are adjacent
            start_date__lte=overlap_end,
            end_date__gte=overlap_start,
        )
        .exclude(status="cancelled")
    )

    has_overlap = nearby_requests.exists()

    # Calculate combined days if there are nearby requests
    combined_days = 0
    if has_overlap:
        for req in nearby_requests:
            combined_days += req.duration_days
        combined_days += calculate_workdays(start, end)

    return Response(
        {
            "has_overlap": has_overlap,
            "nearby_requests": RequestListSerializer(nearby_requests, many=True).data,
            "combined_days": combined_days,
            "warning": (
                f"Combined with nearby requests, this would total {combined_days} workdays. "
                "Consider whether this effectively circumvents the 14-day consecutive limit."
            )
            if has_overlap and combined_days > 14
            else None,
        }
    )


@extend_schema(
    tags=["Files"],
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "file": {"type": "string", "format": "binary"},
            },
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "file_id": {"type": "string"},
                "filename": {"type": "string"},
            },
        },
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    Upload a manager approval document.
    Returns a file ID that can be attached to a request.
    """
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES["file"]

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "message/rfc822",
        "text/plain",
    ]
    if file.content_type not in allowed_types and not file.name.endswith(".eml"):
        return Response(
            {"error": "Invalid file type. Allowed: PDF, PNG, JPEG, EML."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        return Response(
            {"error": "File too large. Maximum size is 10MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Save file temporarily - in production, use proper storage
    from django.core.files.storage import default_storage
    import uuid

    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}_{file.name}"
    saved_path = default_storage.save(file_path, file)

    return Response(
        {
            "file_id": file_id,
            "filename": file.name,
            "path": saved_path,
        }
    )
