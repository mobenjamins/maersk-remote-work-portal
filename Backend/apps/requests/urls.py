"""
URL patterns for remote work request endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("", views.RemoteWorkRequestViewSet, basename="requests")

urlpatterns = [
    # SIRW Wizard endpoints
    path("sirw/submit/", views.sirw_wizard_submit, name="sirw-wizard-submit"),
    path("sirw/balance/", views.sirw_annual_balance, name="sirw-annual-balance"),
    path("sirw/check-overlap/", views.check_date_overlap, name="sirw-check-overlap"),
    # File upload
    path("upload/", views.upload_file, name="upload-file"),
    # Standard CRUD endpoints
    path("", include(router.urls)),
]
