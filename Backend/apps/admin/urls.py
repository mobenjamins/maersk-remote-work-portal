"""
URL configuration for admin portal endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdminDashboardViewSet,
    AdminRequestViewSet,
    AdminUserViewSet,
    PolicyDocumentViewSet,
    MiraQuestionViewSet,
    RequestCommentViewSet,
)

router = DefaultRouter()
router.register(r"dashboard", AdminDashboardViewSet, basename="admin-dashboard")
router.register(r"requests", AdminRequestViewSet, basename="admin-requests")
router.register(r"users", AdminUserViewSet, basename="admin-users")
router.register(r"policies", PolicyDocumentViewSet, basename="admin-policies")
router.register(r"mira-questions", MiraQuestionViewSet, basename="admin-mira-questions")
router.register(r"request-comments", RequestCommentViewSet, basename="admin-request-comments")

urlpatterns = [
    path("", include(router.urls)),
]
