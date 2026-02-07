"""
Views for compliance assessment endpoints.
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .services import ComplianceService
from .serializers import (
    ComplianceAssessmentRequestSerializer,
    ComplianceAssessmentResponseSerializer,
    RuleSummarySerializer,
)

logger = logging.getLogger(__name__)


@extend_schema(
    request=ComplianceAssessmentRequestSerializer,
    responses={200: ComplianceAssessmentResponseSerializer},
    tags=["Compliance"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assess(request):
    """
    Run compliance assessment for a remote work request.

    This endpoint evaluates the request against all compliance rules
    and returns an outcome (approved, rejected, or escalated) with
    detailed reasoning.
    """
    serializer = ComplianceAssessmentRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    service = ComplianceService()
    result = service.assess(**serializer.validated_data)

    return Response(result)


@extend_schema(
    responses={200: RuleSummarySerializer(many=True)},
    tags=["Compliance"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def rules(request):
    """
    Get a summary of all compliance rules.

    This endpoint is public and can be used for documentation
    or to display rules to users before they submit a request.
    """
    service = ComplianceService()
    rules_summary = service.get_rules_summary()

    return Response(rules_summary)
