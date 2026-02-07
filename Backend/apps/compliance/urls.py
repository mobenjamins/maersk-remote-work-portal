"""
URL patterns for compliance endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("assess/", views.assess, name="compliance-assess"),
    path("rules/", views.rules, name="compliance-rules"),
]
