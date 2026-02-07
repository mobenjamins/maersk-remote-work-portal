"""
Common utility functions.
"""

from typing import Any, Dict, List
from datetime import date, timedelta


def calculate_business_days(start_date: date, end_date: date) -> int:
    """
    Calculate the number of business days between two dates.
    Excludes weekends.

    Args:
        start_date: Start date
        end_date: End date

    Returns:
        Number of business days (inclusive)
    """
    if start_date > end_date:
        return 0

    business_days = 0
    current = start_date

    while current <= end_date:
        if current.weekday() < 5:  # Monday = 0, Friday = 4
            business_days += 1
        current += timedelta(days=1)

    return business_days


def get_country_code(country_name: str) -> str:
    """
    Get ISO 3166-1 alpha-2 country code from country name.
    Returns uppercase 2-letter code or empty string if not found.

    This is a simplified version - in production, use pycountry or similar.
    """
    # Common countries mapping
    country_codes = {
        "denmark": "DK",
        "united kingdom": "GB",
        "uk": "GB",
        "united states": "US",
        "usa": "US",
        "germany": "DE",
        "france": "FR",
        "spain": "ES",
        "italy": "IT",
        "netherlands": "NL",
        "belgium": "BE",
        "sweden": "SE",
        "norway": "NO",
        "poland": "PL",
        "portugal": "PT",
        "india": "IN",
        "china": "CN",
        "singapore": "SG",
        "australia": "AU",
        "brazil": "BR",
        "mexico": "MX",
        "canada": "CA",
    }

    return country_codes.get(country_name.lower(), "")


def format_decision_reason(rules: List[Dict[str, Any]]) -> str:
    """
    Format compliance rule results into a human-readable decision reason.

    Args:
        rules: List of rule evaluation results

    Returns:
        Formatted string explaining the decision
    """
    failed_rules = [r for r in rules if not r.get("passed")]
    passed_rules = [r for r in rules if r.get("passed")]

    if not failed_rules:
        return "All compliance checks passed."

    reasons = []
    for rule in failed_rules:
        reasons.append(f"- {rule['name']}: {rule['reason']}")

    return "The following compliance checks failed:\n" + "\n".join(reasons)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to remove potentially dangerous characters.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for storage
    """
    import re

    # Remove path separators and null bytes
    filename = filename.replace("/", "_").replace("\\", "_").replace("\0", "")

    # Remove other problematic characters
    filename = re.sub(r'[<>:"|?*]', "_", filename)

    # Limit length
    name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
    if len(name) > 100:
        name = name[:100]

    return f"{name}.{ext}" if ext else name
