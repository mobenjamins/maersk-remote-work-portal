"""
URL patterns for AI chat endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("chat/", views.send_message, name="ai-chat"),
    path("chat/sessions/", views.create_session, name="ai-create-session"),
    path("chat/sessions/<uuid:session_id>/", views.get_session, name="ai-get-session"),
    path(
        "chat/sessions/<uuid:session_id>/delete/",
        views.delete_session,
        name="ai-delete-session",
    ),
]
