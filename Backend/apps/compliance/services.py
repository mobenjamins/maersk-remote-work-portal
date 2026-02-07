"""
Compliance service for evaluating remote work requests.
"""

import logging
from typing import Dict, List, Any

from .rules import COMPLIANCE_RULES, ComplianceRule

logger = logging.getLogger(__name__)


class ComplianceService:
    """
    Service for running compliance assessments on remote work requests.

    Outcomes:
    - approved: All rules passed
    - rejected: One or more blocking rules failed
    - escalated: Complex case requiring human review
    """

    def __init__(self, rules=None):
        self.rules = rules or COMPLIANCE_RULES

    def assess(
        self,
        has_right_to_work: bool,
        is_sales_role: bool,
        duration_days: int,
        home_country: str,
        destination_country: str,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Run all compliance rules and determine outcome.

        Args:
            has_right_to_work: Whether employee can legally work in destination
            is_sales_role: Whether employee has contract signing authority
            duration_days: Number of days for the request
            home_country: Country of employment
            destination_country: Country where work will take place

        Returns:
            Dict with:
                - outcome: 'approved', 'rejected', or 'escalated'
                - reason: Human-readable explanation
                - rules: List of all rule evaluations
        """
        logger.info(
            f"Running compliance assessment: {home_country} -> {destination_country}, "
            f"{duration_days} days, RTW={has_right_to_work}, Sales={is_sales_role}"
        )

        # Evaluate all rules
        rule_results: List[ComplianceRule] = []
        blocking_failures: List[ComplianceRule] = []
        warnings: List[ComplianceRule] = []

        evaluation_context = {
            "has_right_to_work": has_right_to_work,
            "is_sales_role": is_sales_role,
            "duration_days": duration_days,
            "home_country": home_country,
            "destination_country": destination_country,
            **kwargs,
        }

        for rule in self.rules:
            try:
                result = rule.evaluate(**evaluation_context)
                rule_results.append(result)

                if not result.passed and result.severity == "block":
                    blocking_failures.append(result)
                elif not result.passed and result.severity == "warn":
                    warnings.append(result)

            except Exception as e:
                logger.error(f"Error evaluating rule {rule.name}: {e}")
                # Don't block on rule errors - escalate instead
                rule_results.append(
                    ComplianceRule(
                        name=rule.name,
                        passed=False,
                        reason=f"Error evaluating rule: {str(e)}",
                        severity="warn",
                    )
                )
                warnings.append(rule_results[-1])

        # Determine outcome
        if blocking_failures:
            outcome = "rejected"
            # Combine all blocking reasons
            reasons = [f.reason for f in blocking_failures]
            main_reason = " | ".join(reasons)
        elif warnings:
            outcome = "escalated"
            reasons = [w.reason for w in warnings]
            main_reason = "Manual review required. " + " | ".join(reasons)
        else:
            outcome = "approved"
            main_reason = (
                f"All compliance checks passed. Remote work in {destination_country} "
                f"for {duration_days} days is approved."
            )

        logger.info(f"Compliance assessment result: {outcome}")

        return {
            "outcome": outcome,
            "reason": main_reason,
            "rules": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "reason": r.reason,
                    "severity": r.severity,
                }
                for r in rule_results
            ],
            "escalation_note": main_reason if outcome == "escalated" else "",
        }

    def get_rules_summary(self) -> List[Dict[str, str]]:
        """
        Get a summary of all compliance rules.
        Useful for documentation and admin interfaces.
        """
        return [
            {
                "name": rule.name,
                "severity": rule.severity,
                "description": rule.__doc__ or "",
            }
            for rule in self.rules
        ]
