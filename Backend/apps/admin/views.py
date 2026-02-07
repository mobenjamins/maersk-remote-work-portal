"""
Views for admin portal endpoints.
"""

from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.users.models import User
from apps.requests.models import RemoteWorkRequest
from common.permissions import IsAdminUser
from .serializers import (
    AdminUserSerializer,
    AdminRequestListSerializer,
    AdminAnalyticsSerializer,
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


class AdminRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for admin request management.
    Allows admins to view and filter all remote work requests.
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
