"""
Admin configuration for users app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPCode


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""

    list_display = [
        "email",
        "first_name",
        "last_name",
        "maersk_entity",
        "home_country",
        "is_sales_role",
        "days_remaining",
        "is_active",
    ]
    list_filter = [
        "is_active",
        "is_staff",
        "is_sales_role",
        "maersk_entity",
        "home_country",
    ]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-created_at"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Maersk Information",
            {
                "fields": (
                    "maersk_entity",
                    "home_country",
                    "is_sales_role",
                    "days_allowed",
                )
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Maersk Information",
            {
                "fields": (
                    "email",
                    "maersk_entity",
                    "home_country",
                    "is_sales_role",
                    "days_allowed",
                )
            },
        ),
    )

    def days_remaining(self, obj):
        return f"{obj.days_remaining}/{obj.days_allowed}"

    days_remaining.short_description = "Days Remaining"


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    """Admin interface for OTP codes."""

    list_display = ["email", "code", "created_at", "is_used", "is_valid"]
    list_filter = ["is_used", "created_at"]
    search_fields = ["email"]
    ordering = ["-created_at"]
    readonly_fields = ["email", "code", "created_at"]

    def is_valid(self, obj):
        return obj.is_valid

    is_valid.boolean = True
    is_valid.short_description = "Valid"
