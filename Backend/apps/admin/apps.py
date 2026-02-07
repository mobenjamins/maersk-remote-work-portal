"""
Admin app for global mobility portal administration features.
"""

from django.apps import AppConfig


class AdminConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.admin"
    label = "portal_admin"
