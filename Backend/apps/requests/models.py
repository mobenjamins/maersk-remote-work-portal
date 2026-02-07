"""
Models for remote work requests.
"""

import uuid
from datetime import timedelta
from django.db import models
from django.conf import settings


def calculate_workdays(start_date, end_date):
    """
    Calculate the number of workdays (excluding weekends) between two dates.
    """
    if not start_date or not end_date:
        return 0

    workdays = 0
    current = start_date
    while current <= end_date:
        # Monday = 0, Sunday = 6
        if current.weekday() < 5:  # Monday to Friday
            workdays += 1
        current += timedelta(days=1)
    return workdays


class RemoteWorkRequest(models.Model):
    """
    Remote work request submitted by an employee.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ESCALATED = "escalated", "Escalated"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class RequestType(models.TextChoices):
        SHORT_TERM = "short_term", "Short-Term Remote Work"
        PERMANENT_TRANSFER = "permanent_transfer", "Permanent Transfer"

    # Identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField(max_length=20, unique=True, editable=False)

    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="remote_work_requests",
    )

    # Request details
    request_type = models.CharField(
        max_length=20, choices=RequestType.choices, default=RequestType.SHORT_TERM
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )

    # Entity and location
    maersk_entity = models.CharField(
        max_length=100, help_text="Maersk entity for this request"
    )
    home_country = models.CharField(max_length=100, help_text="Country of employment")
    destination_country = models.CharField(
        max_length=100, help_text="Country where remote work will take place"
    )

    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.PositiveIntegerField(editable=False)

    # Compliance fields
    has_right_to_work = models.BooleanField(
        default=False,
        help_text="Does the employee have the right to work in the destination country?",
    )
    is_sales_role = models.BooleanField(
        default=False, help_text="Is this a sales role with contract signing authority?"
    )
    ineligible_role_categories = models.JSONField(
        default=list,
        blank=True,
        help_text="List of ineligible role categories the employee confirmed they are NOT in",
    )
    confirmed_role_eligible = models.BooleanField(
        default=False,
        help_text="Employee confirmed they are not in any ineligible role category",
    )

    # Manager approval details
    manager_first_name = models.CharField(
        max_length=100, blank=True, help_text="Approving manager's first name"
    )
    manager_middle_name = models.CharField(
        max_length=100, blank=True, help_text="Approving manager's middle name"
    )
    manager_last_name = models.CharField(
        max_length=100, blank=True, help_text="Approving manager's last name"
    )
    manager_email = models.EmailField(
        blank=True, help_text="Approving manager's email address"
    )
    manager_approval_document = models.FileField(
        upload_to="approvals/%Y/%m/",
        blank=True,
        null=True,
        help_text="Manager approval document (email/PDF)",
    )

    # Exception request fields
    is_exception_request = models.BooleanField(
        default=False,
        help_text="Whether this is an exception request (>20 days or >14 consecutive)",
    )
    exception_reason = models.TextField(
        blank=True,
        help_text="Reason for requesting an exception to normal limits",
    )

    # Outcome
    decision_reason = models.TextField(
        blank=True, help_text="Reason for approval/rejection/escalation"
    )
    escalation_note = models.TextField(
        blank=True, help_text="Additional notes for escalated requests"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Remote Work Request"
        verbose_name_plural = "Remote Work Requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        # Calculate duration (workdays excluding weekends)
        if self.start_date and self.end_date:
            self.duration_days = calculate_workdays(self.start_date, self.end_date)

        # Generate reference number
        if not self.reference_number:
            from django.utils import timezone

            year = timezone.now().year
            count = RemoteWorkRequest.objects.filter(created_at__year=year).count() + 1
            self.reference_number = f"SIRW-{year}-{count:04d}"

        super().save(*args, **kwargs)

    @property
    def manager_full_name(self):
        """Return the manager's full name."""
        parts = [
            self.manager_first_name,
            self.manager_middle_name,
            self.manager_last_name,
        ]
        return " ".join(p for p in parts if p)


class ChatSession(models.Model):
    """
    Stores AI chat sessions for compliance conversations.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_sessions"
    )
    request = models.ForeignKey(
        RemoteWorkRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_sessions",
    )

    outcome = models.CharField(
        max_length=20,
        choices=[
            ("approved", "Approved"),
            ("rejected", "Rejected"),
            ("escalated", "Escalated"),
            ("pending", "Pending"),
        ],
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Chat Session"
        verbose_name_plural = "Chat Sessions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Chat {self.id} - {self.user.email}"


class ChatMessage(models.Model):
    """
    Individual messages within a chat session.
    """

    class Role(models.TextChoices):
        USER = "user", "User"
        MODEL = "model", "Model"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )

    role = models.CharField(max_length=10, choices=Role.choices)
    text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.text[:50]}..."
