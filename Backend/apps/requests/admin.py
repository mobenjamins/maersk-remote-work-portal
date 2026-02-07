"""
Admin configuration for requests app.
"""

from django.contrib import admin
from .models import RemoteWorkRequest, ChatSession, ChatMessage


@admin.register(RemoteWorkRequest)
class RemoteWorkRequestAdmin(admin.ModelAdmin):
    """Admin interface for remote work requests."""

    list_display = [
        "reference_number",
        "user",
        "status",
        "destination_country",
        "start_date",
        "end_date",
        "duration_days",
        "created_at",
    ]
    list_filter = [
        "status",
        "request_type",
        "destination_country",
        "home_country",
        "has_right_to_work",
        "is_sales_role",
        "created_at",
    ]
    search_fields = [
        "reference_number",
        "user__email",
        "destination_country",
    ]
    ordering = ["-created_at"]
    readonly_fields = [
        "reference_number",
        "duration_days",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        (
            "Request Information",
            {
                "fields": (
                    "reference_number",
                    "user",
                    "request_type",
                    "status",
                )
            },
        ),
        (
            "Location",
            {
                "fields": (
                    "maersk_entity",
                    "home_country",
                    "destination_country",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "start_date",
                    "end_date",
                    "duration_days",
                )
            },
        ),
        (
            "Compliance",
            {
                "fields": (
                    "has_right_to_work",
                    "is_sales_role",
                    "manager_approval_document",
                )
            },
        ),
        (
            "Decision",
            {
                "fields": (
                    "decision_reason",
                    "escalation_note",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )


class ChatMessageInline(admin.TabularInline):
    """Inline admin for chat messages."""

    model = ChatMessage
    readonly_fields = ["role", "text", "created_at"]
    extra = 0
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Admin interface for chat sessions."""

    list_display = [
        "id",
        "user",
        "outcome",
        "message_count",
        "created_at",
    ]
    list_filter = ["outcome", "created_at"]
    search_fields = ["user__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ChatMessageInline]

    def message_count(self, obj):
        return obj.messages.count()

    message_count.short_description = "Messages"


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin interface for chat messages."""

    list_display = ["session", "role", "text_preview", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["text", "session__user__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]

    def text_preview(self, obj):
        return obj.text[:100] + "..." if len(obj.text) > 100 else obj.text

    text_preview.short_description = "Text"
