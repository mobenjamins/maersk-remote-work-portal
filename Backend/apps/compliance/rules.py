"""
Compliance rules for remote work requests.

These rules are based on the Maersk SIRW Policy V3 (08.08.24):
1. Maximum 20 days per year for short-term remote work
2. Maximum 14 consecutive workdays per request
3. Must have right to work in destination country
4. Sales/commercial/procurement/senior executive roles create PE risk
5. Cannot work in sanctioned countries or countries without Maersk entity

Future enhancements:
- Country-specific tax treaty rules
- Social security coordination
- Visa requirements by nationality
"""

from dataclasses import dataclass
from typing import Optional
from django.conf import settings

from .blocked_countries import (
    is_country_blocked,
    get_block_reason,
    get_block_message,
)


@dataclass
class ComplianceRule:
    """Represents a compliance rule and its evaluation."""

    name: str
    passed: bool
    reason: str
    severity: str  # 'block', 'warn', 'info'


class BaseRule:
    """Base class for compliance rules."""

    name: str = "Base Rule"
    severity: str = "block"

    def evaluate(self, **kwargs) -> ComplianceRule:
        raise NotImplementedError


class BlockedCountryRule(BaseRule):
    """
    Checks if the destination country is blocked due to sanctions or lack of Maersk entity.
    This is a blocking rule - blocked countries mean automatic rejection.
    """

    name = "Blocked Country Check"
    severity = "block"

    def evaluate(self, destination_country: str, **kwargs) -> ComplianceRule:
        if not is_country_blocked(destination_country):
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason=f"{destination_country} is an eligible destination for SIRW.",
                severity="info",
            )

        block_message = get_block_message(destination_country)
        return ComplianceRule(
            name=self.name,
            passed=False,
            reason=f"{block_message or 'SIRW to this country is not permitted'} (Policy Appendix A).",
            severity=self.severity,
        )


class RightToWorkRule(BaseRule):
    """
    Checks if employee has right to work in destination country.
    This is a blocking rule - no right to work means automatic rejection.
    """

    name = "Right to Work"
    severity = "block"

    def evaluate(
        self, has_right_to_work: bool, destination_country: str, **kwargs
    ) -> ComplianceRule:
        if has_right_to_work:
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason=f"Employee has right to work in {destination_country}.",
                severity="info",
            )
        return ComplianceRule(
            name=self.name,
            passed=False,
            reason=f"Employee does not have right to work in {destination_country}. "
            f"Remote work cannot be approved without valid work authorisation (Policy Section 4.1.3).",
            severity=self.severity,
        )


class SalesRoleRule(BaseRule):
    """
    Checks if employee has contract signing authority.
    Sales roles can create Permanent Establishment (PE) risk.
    """

    name = "Permanent Establishment Risk"
    severity = "block"

    def evaluate(
        self, is_sales_role: bool, destination_country: str, **kwargs
    ) -> ComplianceRule:
        if not is_sales_role:
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason="Employee does not have contract signing authority. No PE risk.",
                severity="info",
            )
        return ComplianceRule(
            name=self.name,
            passed=False,
            reason=f"Employee has contract signing authority which may create "
            f"Permanent Establishment risk in {destination_country}. "
            f"Sales activities from abroad are not permitted under this policy.",
            severity=self.severity,
        )


class DurationRule(BaseRule):
    """
    Checks if request duration is within allowed limits.
    Default maximum is 20 days per request.
    """

    name = "Duration Limit"
    severity = "block"

    def __init__(self):
        self.max_days = settings.REMOTE_WORK_SETTINGS.get("MAX_SINGLE_TRIP_DAYS", 20)

    def evaluate(self, duration_days: int, **kwargs) -> ComplianceRule:
        if duration_days <= self.max_days:
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason=f"Duration of {duration_days} days is within the {self.max_days}-day limit.",
                severity="info",
            )
        return ComplianceRule(
            name=self.name,
            passed=False,
            reason=f"Duration of {duration_days} days exceeds the maximum allowed "
            f"{self.max_days} days for short-term remote work. "
            f"Please shorten your request or apply for a permanent transfer (Policy Section 4.1.2).",
            severity=self.severity,
        )


class SameCountryRule(BaseRule):
    """
    Warns if working from home country (not really 'remote' work abroad).
    This is informational only.
    """

    name = "Same Country Check"
    severity = "info"

    def evaluate(
        self, home_country: str, destination_country: str, **kwargs
    ) -> ComplianceRule:
        if home_country.lower() != destination_country.lower():
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason=f"Cross-border remote work from {home_country} to {destination_country}.",
                severity="info",
            )
        return ComplianceRule(
            name=self.name,
            passed=True,  # Not a blocker
            reason=f"Working from home country ({home_country}). "
            f"This may not require cross-border compliance review.",
            severity="info",
        )


class ConsecutiveDaysRule(BaseRule):
    """
    Checks if request exceeds the maximum consecutive workdays limit.
    Policy states the 20 days cannot be taken as a single block.
    Default maximum is 14 consecutive workdays.
    """

    name = "Consecutive Days Limit"
    severity = "block"

    def __init__(self):
        self.max_consecutive_days = settings.REMOTE_WORK_SETTINGS.get(
            "MAX_CONSECUTIVE_DAYS", 14
        )

    def evaluate(self, duration_days: int, **kwargs) -> ComplianceRule:
        if duration_days <= self.max_consecutive_days:
            return ComplianceRule(
                name=self.name,
                passed=True,
                reason=f"Duration of {duration_days} days is within the {self.max_consecutive_days}-day consecutive limit.",
                severity="info",
            )
        return ComplianceRule(
            name=self.name,
            passed=False,
            reason=f"Duration of {duration_days} consecutive days exceeds the maximum allowed "
            f"{self.max_consecutive_days} consecutive workdays. The 20-day annual allowance "
            f"cannot be taken as a single continuous block. Please shorten your request "
            f"or split into multiple trips (Policy Section 4.1.2).",
            severity=self.severity,
        )


class IneligibleRoleRule(BaseRule):
    """
    Checks if employee is in an ineligible role category.
    Expands beyond just sales roles to include all policy-defined ineligible categories.
    """

    name = "Role Eligibility Check"
    severity = "block"

    # List of ineligible role categories per policy
    INELIGIBLE_CATEGORIES = [
        "frontline_customer_facing",
        "onsite_required",
        "legal_restrictions",
        "commercial_sales",
        "procurement",
        "senior_executive",
    ]

    def evaluate(
        self,
        is_sales_role: bool = False,
        ineligible_role_categories: list = None,
        **kwargs,
    ) -> ComplianceRule:
        # Check legacy is_sales_role flag for backwards compatibility
        if is_sales_role:
            return ComplianceRule(
                name=self.name,
                passed=False,
                reason="Employee has contract signing authority which may create "
                "Permanent Establishment risk. Sales and commercial roles with "
                "contract signing authority are not eligible for SIRW (Policy Section 4.1.1).",
                severity=self.severity,
            )

        # Check new ineligible categories if provided
        if ineligible_role_categories:
            category_messages = {
                "frontline_customer_facing": "frontline or customer-facing role",
                "onsite_required": "role that must be performed on-site",
                "legal_restrictions": "role with legal restrictions preventing remote work abroad",
                "commercial_sales": "commercial/sales role with contract signing authority",
                "procurement": "procurement role with contract signing authority",
                "senior_executive": "senior executive leadership role",
            }

            flagged = [
                category_messages.get(cat, cat)
                for cat in ineligible_role_categories
                if cat in self.INELIGIBLE_CATEGORIES
            ]

            if flagged:
                return ComplianceRule(
                    name=self.name,
                    passed=False,
                    reason=f"Employee is in an ineligible role category: {', '.join(flagged)}. "
                    f"SIRW is not available for this role type (Policy Section 4.1.1).",
                    severity=self.severity,
                )

        return ComplianceRule(
            name=self.name,
            passed=True,
            reason="Employee role is eligible for SIRW.",
            severity="info",
        )


# Register all rules - order matters for evaluation priority
COMPLIANCE_RULES = [
    BlockedCountryRule(),  # Check destination first
    RightToWorkRule(),
    IneligibleRoleRule(),  # Replaces SalesRoleRule with expanded logic
    DurationRule(),
    ConsecutiveDaysRule(),
    SameCountryRule(),
]
