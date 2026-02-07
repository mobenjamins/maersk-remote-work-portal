"""
Serializers for compliance endpoints.
"""

from rest_framework import serializers


class ComplianceAssessmentRequestSerializer(serializers.Serializer):
    """Request serializer for compliance assessment."""

    has_right_to_work = serializers.BooleanField()
    is_sales_role = serializers.BooleanField()
    duration_days = serializers.IntegerField(min_value=1, max_value=365)
    home_country = serializers.CharField(max_length=100)
    destination_country = serializers.CharField(max_length=100)


class RuleResultSerializer(serializers.Serializer):
    """Serializer for individual rule results."""

    name = serializers.CharField()
    passed = serializers.BooleanField()
    reason = serializers.CharField()
    severity = serializers.CharField()


class ComplianceAssessmentResponseSerializer(serializers.Serializer):
    """Response serializer for compliance assessment."""

    outcome = serializers.ChoiceField(choices=["approved", "rejected", "escalated"])
    reason = serializers.CharField()
    rules = RuleResultSerializer(many=True)
    escalation_note = serializers.CharField(allow_blank=True)


class RuleSummarySerializer(serializers.Serializer):
    """Serializer for rule summary."""

    name = serializers.CharField()
    severity = serializers.CharField()
    description = serializers.CharField()
