"""
URL patterns for user profile endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.me, name="users-me"),
    path("me/days-remaining/", views.days_remaining, name="users-days-remaining"),
]
