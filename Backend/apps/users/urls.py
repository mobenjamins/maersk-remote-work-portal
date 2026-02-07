"""
URL patterns for authentication endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login, name="auth-login"),
    path("verify/", views.verify_otp, name="auth-verify"),
    path("logout/", views.logout, name="auth-logout"),
]
