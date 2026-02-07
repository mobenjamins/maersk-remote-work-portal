"""
User models for Maersk Remote Work Portal.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    Custom user model for Maersk employees.
    Extends Django's AbstractUser with remote work specific fields.
    """

    # Profile fields (for SIRW wizard)
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Employee's middle name",
    )
    phone = models.CharField(
        max_length=30,
        blank=True,
        help_text="Employee's phone number",
    )
    profile_completed = models.BooleanField(
        default=False,
        help_text="Whether the employee has completed their SIRW profile",
    )
    profile_consent_given = models.BooleanField(
        default=False,
        help_text="Whether the employee has consented to profile data storage",
    )

    # Maersk-specific fields
    maersk_entity = models.CharField(
        max_length=100,
        default="Maersk A/S",
        help_text="The Maersk entity the employee belongs to",
    )
    home_country = models.CharField(
        max_length=100, default="Denmark", help_text="Country of employment"
    )
    is_sales_role = models.BooleanField(
        default=False,
        help_text="Whether the employee has contract signing authority (PE risk)",
    )
    days_allowed = models.PositiveIntegerField(
        default=20, help_text="Annual remote work days allowed"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email or self.username

    @property
    def days_used(self):
        """Calculate days used from approved requests this year."""
        from apps.requests.models import RemoteWorkRequest
        from django.utils import timezone
        from django.db.models import Sum

        current_year = timezone.now().year
        result = self.remote_work_requests.filter(
            status__in=["approved", "completed"], start_date__year=current_year
        ).aggregate(total=Sum("duration_days"))

        return result["total"] or 0

    @property
    def days_remaining(self):
        """Calculate remaining remote work days for the year."""
        return max(0, self.days_allowed - self.days_used)


class OTPCode(models.Model):
    """
    Stores OTP codes for two-factor authentication.
    For MVP, this is mocked but structure is ready for real implementation.
    """

    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        verbose_name = "OTP Code"
        verbose_name_plural = "OTP Codes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} - {self.code}"

    @property
    def is_valid(self):
        """Check if OTP is still valid (10 minutes)."""
        from django.utils import timezone
        from datetime import timedelta

        expiry_time = self.created_at + timedelta(minutes=10)
        return not self.is_used and timezone.now() < expiry_time
