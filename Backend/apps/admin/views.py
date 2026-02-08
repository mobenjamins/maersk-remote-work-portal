"""
Views for admin portal endpoints.
"""

from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, HtmlContent
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.users.models import User
from apps.requests.models import (
    RemoteWorkRequest,
    PolicyDocument,
    MiraQuestion,
    RequestComment,
)
from common.permissions import IsAdminUser
from .serializers import (
    AdminUserSerializer,
    AdminRequestListSerializer,
    AdminAnalyticsSerializer,
    PolicyDocumentSerializer,
    MiraQuestionSerializer,
    RequestCommentSerializer,
)


class AdminDashboardViewSet(viewsets.ViewSet):
    """
    API endpoints for admin portal dashboard.
    Provides analytics and overview data for the global mobility team.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(
        tags=["Admin"],
        responses={200: AdminAnalyticsSerializer},
    )
    def list(self, request):
        """
        GET /api/admin/dashboard/
        Returns analytics data for the admin dashboard.
        """
        total_requests = RemoteWorkRequest.objects.count()
        approved = RemoteWorkRequest.objects.filter(status="approved").count()
        rejected = RemoteWorkRequest.objects.filter(status="rejected").count()
        escalated = RemoteWorkRequest.objects.filter(status="escalated").count()
        total_users = User.objects.count()

        approval_rate = (
            (approved / total_requests * 100) if total_requests > 0 else 0
        )

        data = {
            "total_requests": total_requests,
            "approved_requests": approved,
            "rejected_requests": rejected,
            "escalated_requests": escalated,
            "total_users": total_users,
            "approval_rate": round(approval_rate, 2),
        }

        serializer = AdminAnalyticsSerializer(data)
        return Response(serializer.data)


class AdminRequestViewSet(mixins.DestroyModelMixin, viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for admin request management.
    Allows admins to view, filter, and delete remote work requests.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminRequestListSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["user__email", "destination_country", "home_country"]
    ordering_fields = ["created_at", "status", "start_date"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return all requests for admins."""
        queryset = RemoteWorkRequest.objects.select_related("user").all()

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        decision_status = self.request.query_params.get("decision_status")
        if decision_status:
            queryset = queryset.filter(decision_status=decision_status)

        # Filter by country if provided
        country_filter = self.request.query_params.get("country")
        if country_filter:
            queryset = queryset.filter(destination_country=country_filter)

        # Filter by date range if provided
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset

    @extend_schema(
        tags=["Admin"],
        responses={200: AdminRequestListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        """Get list of all remote work requests with optional filters."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["Admin"],
        responses={200: AdminRequestListSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        """Get details of a specific request."""
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def decide(self, request, pk=None):
        """
        Approve or reject a request with optional admin note.
        """
        decision = request.data.get("decision")
        note = request.data.get("note", "").strip()
        instance = self.get_object()

        if decision not in ["approved", "rejected"]:
            return Response(
                {"error": "Decision must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.status = decision
        instance.decision_source = "human"
        if note:
            instance.decision_reason = note
            RequestComment.objects.create(
                request=instance, author=request.user, body=note
            )

        instance.decision_notified_at = timezone.now()
        instance.save()

        self._send_decision_email(instance, note)

        return Response(AdminRequestListSerializer(instance).data)

    def _send_decision_email(self, instance, note: str):
        if not settings.SENDGRID_API_KEY:
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
            # Avoid blocking the decision if email fails
            return


class PolicyDocumentViewSet(viewsets.ModelViewSet):
    """
    Upload and publish policy/FAQ documents with versioning.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = PolicyDocumentSerializer
    queryset = PolicyDocument.objects.all()
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        doc_type = self.request.query_params.get("doc_type")
        if doc_type:
            qs = qs.filter(doc_type=doc_type)
        return qs

    def perform_create(self, serializer):
        # auto-increment version per doc_type
        doc_type = serializer.validated_data["doc_type"]
        latest = (
            PolicyDocument.objects.filter(doc_type=doc_type)
            .order_by("-version")
            .first()
        )
        next_version = (latest.version + 1) if latest else 1
        serializer.save(uploaded_by=self.request.user, version=next_version)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        doc = self.get_object()
        # Mark all other docs of same type as draft
        PolicyDocument.objects.filter(doc_type=doc.doc_type).update(status="draft")
        doc.publish()
        return Response(self.get_serializer(doc).data)


class MiraQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for Mira Q&A asked by employees.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = MiraQuestionSerializer
    queryset = MiraQuestion.objects.select_related("user").all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["question_text", "user__email", "context_country"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]


class RequestCommentViewSet(viewsets.ModelViewSet):
    """
    Comments thread per request (admin + employee).
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = RequestCommentSerializer
    queryset = RequestComment.objects.select_related("author", "request").all()
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()
        request_id = self.request.query_params.get("request")
        if request_id:
            queryset = queryset.filter(request_id=request_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for admin user management.
    Allows admins to view all users and their statistics.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminUserSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["created_at", "email", "days_remaining"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return all users for admins."""
        return User.objects.all()

    @extend_schema(
        tags=["Admin"],
        responses={200: AdminUserSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        """Get list of all Maersk employees."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["Admin"],
        responses={200: AdminUserSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        """Get details of a specific user including their request history."""
        return super().retrieve(request, *args, **kwargs)
