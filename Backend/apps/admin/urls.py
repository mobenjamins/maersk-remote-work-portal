"""
URL configuration for admin portal endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminDashboardViewSet, AdminRequestViewSet, AdminUserViewSet

router = DefaultRouter()
router.register(r"dashboard", AdminDashboardViewSet, basename="admin-dashboard")
router.register(r"requests", AdminRequestViewSet, basename="admin-requests")
router.register(r"users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("", include(router.urls)),
]
