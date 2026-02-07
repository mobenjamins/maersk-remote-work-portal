"""
Blocked countries for SIRW requests based on Maersk policy.

Two categories:
1. UN/EU Sanctions - Countries under international sanctions
2. No Maersk Entity - Countries where Maersk has no legal entity

SIRW cannot be performed in any of these countries.
Last updated: Based on SIRW Policy V3 (08.08.24) Appendix A
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class BlockedCountry:
    """Represents a blocked country with its reason for blocking."""

    name: str
    code: str  # ISO 3166-1 alpha-2
    reason: str  # 'sanctions' or 'no_entity'
    region: str


# UN/EU Sanctioned Countries
SANCTIONED_COUNTRIES: List[BlockedCountry] = [
    # Asia Pacific
    BlockedCountry(
        name="Afghanistan", code="AF", reason="sanctions", region="Asia Pacific"
    ),
    BlockedCountry(
        name="North Korea", code="KP", reason="sanctions", region="Asia Pacific"
    ),
    BlockedCountry(name="Iran", code="IR", reason="sanctions", region="Asia Pacific"),
    BlockedCountry(name="Iraq", code="IQ", reason="sanctions", region="Asia Pacific"),
    BlockedCountry(
        name="Myanmar", code="MM", reason="sanctions", region="Asia Pacific"
    ),
    # Europe
    BlockedCountry(
        name="Bosnia and Herzegovina", code="BA", reason="sanctions", region="Europe"
    ),
    BlockedCountry(name="Russia", code="RU", reason="sanctions", region="Europe"),
    BlockedCountry(name="Turkey", code="TR", reason="sanctions", region="Europe"),
    BlockedCountry(name="Ukraine", code="UA", reason="sanctions", region="Europe"),
    # India, Middle East & Africa (IMEA)
    BlockedCountry(
        name="Central African Republic", code="CF", reason="sanctions", region="IMEA"
    ),
    BlockedCountry(name="Congo (DRC)", code="CD", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Guinea", code="GN", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Libya", code="LY", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Somalia", code="SO", reason="sanctions", region="IMEA"),
    BlockedCountry(name="South Sudan", code="SS", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Sudan", code="SD", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Syria", code="SY", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Yemen", code="YE", reason="sanctions", region="IMEA"),
    BlockedCountry(name="Zimbabwe", code="ZW", reason="sanctions", region="IMEA"),
    # North America
    BlockedCountry(name="Haiti", code="HT", reason="sanctions", region="North America"),
    BlockedCountry(
        name="Nicaragua", code="NI", reason="sanctions", region="North America"
    ),
    # Latin America
    BlockedCountry(
        name="Venezuela", code="VE", reason="sanctions", region="Latin America"
    ),
]

# Countries with No Maersk Entity
NO_ENTITY_COUNTRIES: List[BlockedCountry] = [
    # Asia Pacific
    BlockedCountry(name="Brunei", code="BN", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(name="Bhutan", code="BT", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(name="Fiji", code="FJ", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Kiribati", code="KI", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(name="Laos", code="LA", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Maldives", code="MV", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(
        name="Marshall Islands", code="MH", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(
        name="Micronesia", code="FM", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(
        name="Mongolia", code="MN", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(name="Nauru", code="NR", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(name="Nepal", code="NP", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(name="Palau", code="PW", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Papua New Guinea", code="PG", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(name="Samoa", code="WS", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Solomon Islands", code="SB", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(
        name="Timor-Leste", code="TL", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(name="Tonga", code="TO", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Turkmenistan", code="TM", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(name="Tuvalu", code="TV", reason="no_entity", region="Asia Pacific"),
    BlockedCountry(
        name="Uzbekistan", code="UZ", reason="no_entity", region="Asia Pacific"
    ),
    BlockedCountry(
        name="Vanuatu", code="VU", reason="no_entity", region="Asia Pacific"
    ),
    # Europe
    BlockedCountry(name="Albania", code="AL", reason="no_entity", region="Europe"),
    BlockedCountry(name="Andorra", code="AD", reason="no_entity", region="Europe"),
    BlockedCountry(name="Armenia", code="AM", reason="no_entity", region="Europe"),
    BlockedCountry(name="Azerbaijan", code="AZ", reason="no_entity", region="Europe"),
    BlockedCountry(name="Cyprus", code="CY", reason="no_entity", region="Europe"),
    BlockedCountry(name="Iceland", code="IS", reason="no_entity", region="Europe"),
    BlockedCountry(
        name="Liechtenstein", code="LI", reason="no_entity", region="Europe"
    ),
    BlockedCountry(name="Luxembourg", code="LU", reason="no_entity", region="Europe"),
    BlockedCountry(name="Malta", code="MT", reason="no_entity", region="Europe"),
    BlockedCountry(name="Monaco", code="MC", reason="no_entity", region="Europe"),
    BlockedCountry(name="Montenegro", code="ME", reason="no_entity", region="Europe"),
    BlockedCountry(
        name="North Macedonia", code="MK", reason="no_entity", region="Europe"
    ),
    BlockedCountry(name="Moldova", code="MD", reason="no_entity", region="Europe"),
    BlockedCountry(name="San Marino", code="SM", reason="no_entity", region="Europe"),
    # India, Middle East & Africa (IMEA)
    BlockedCountry(name="Burundi", code="BI", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Chad", code="TD", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Comoros", code="KM", reason="no_entity", region="IMEA"),
    BlockedCountry(
        name="Equatorial Guinea", code="GQ", reason="no_entity", region="IMEA"
    ),
    BlockedCountry(name="Eritrea", code="ER", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Guinea-Bissau", code="GW", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Kazakhstan", code="KZ", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Kyrgyzstan", code="KG", reason="no_entity", region="IMEA"),
    BlockedCountry(
        name="Sao Tome and Principe", code="ST", reason="no_entity", region="IMEA"
    ),
    BlockedCountry(name="Seychelles", code="SC", reason="no_entity", region="IMEA"),
    BlockedCountry(name="Tajikistan", code="TJ", reason="no_entity", region="IMEA"),
    # North America
    BlockedCountry(
        name="Antigua and Barbuda",
        code="AG",
        reason="no_entity",
        region="North America",
    ),
    BlockedCountry(
        name="Bahamas", code="BS", reason="no_entity", region="North America"
    ),
    BlockedCountry(
        name="Barbados", code="BB", reason="no_entity", region="North America"
    ),
    BlockedCountry(name="Cuba", code="CU", reason="no_entity", region="North America"),
    BlockedCountry(
        name="Dominica", code="DM", reason="no_entity", region="North America"
    ),
    BlockedCountry(
        name="Grenada", code="GD", reason="no_entity", region="North America"
    ),
    BlockedCountry(
        name="Jamaica", code="JM", reason="no_entity", region="North America"
    ),
    BlockedCountry(
        name="Saint Kitts and Nevis",
        code="KN",
        reason="no_entity",
        region="North America",
    ),
    BlockedCountry(
        name="Saint Lucia", code="LC", reason="no_entity", region="North America"
    ),
    BlockedCountry(
        name="Saint Vincent and the Grenadines",
        code="VC",
        reason="no_entity",
        region="North America",
    ),
    # Latin America
    BlockedCountry(
        name="Belize", code="BZ", reason="no_entity", region="Latin America"
    ),
    BlockedCountry(
        name="Guyana", code="GY", reason="no_entity", region="Latin America"
    ),
    BlockedCountry(
        name="Suriname", code="SR", reason="no_entity", region="Latin America"
    ),
]

# Combined list of all blocked countries
ALL_BLOCKED_COUNTRIES: List[BlockedCountry] = SANCTIONED_COUNTRIES + NO_ENTITY_COUNTRIES

# Quick lookup sets for validation
SANCTIONED_COUNTRY_CODES = {c.code for c in SANCTIONED_COUNTRIES}
SANCTIONED_COUNTRY_NAMES = {c.name.lower() for c in SANCTIONED_COUNTRIES}

NO_ENTITY_COUNTRY_CODES = {c.code for c in NO_ENTITY_COUNTRIES}
NO_ENTITY_COUNTRY_NAMES = {c.name.lower() for c in NO_ENTITY_COUNTRIES}

ALL_BLOCKED_COUNTRY_CODES = SANCTIONED_COUNTRY_CODES | NO_ENTITY_COUNTRY_CODES
ALL_BLOCKED_COUNTRY_NAMES = SANCTIONED_COUNTRY_NAMES | NO_ENTITY_COUNTRY_NAMES


def is_country_blocked(country: str) -> bool:
    """
    Check if a country is blocked for SIRW.

    Args:
        country: Country name or ISO code

    Returns:
        True if the country is blocked
    """
    country_lower = country.lower().strip()
    country_upper = country.upper().strip()

    return (
        country_lower in ALL_BLOCKED_COUNTRY_NAMES
        or country_upper in ALL_BLOCKED_COUNTRY_CODES
    )


def get_block_reason(country: str) -> Optional[str]:
    """
    Get the reason why a country is blocked.

    Args:
        country: Country name or ISO code

    Returns:
        'sanctions', 'no_entity', or None if not blocked
    """
    country_lower = country.lower().strip()
    country_upper = country.upper().strip()

    if (
        country_lower in SANCTIONED_COUNTRY_NAMES
        or country_upper in SANCTIONED_COUNTRY_CODES
    ):
        return "sanctions"
    if (
        country_lower in NO_ENTITY_COUNTRY_NAMES
        or country_upper in NO_ENTITY_COUNTRY_CODES
    ):
        return "no_entity"
    return None


def get_blocked_country_info(country: str) -> Optional[BlockedCountry]:
    """
    Get full information about a blocked country.

    Args:
        country: Country name or ISO code

    Returns:
        BlockedCountry object or None if not blocked
    """
    country_lower = country.lower().strip()
    country_upper = country.upper().strip()

    for blocked in ALL_BLOCKED_COUNTRIES:
        if blocked.name.lower() == country_lower or blocked.code == country_upper:
            return blocked
    return None


def get_block_message(country: str) -> Optional[str]:
    """
    Get a user-friendly message explaining why a country is blocked.

    Args:
        country: Country name or ISO code

    Returns:
        User-friendly message or None if not blocked
    """
    info = get_blocked_country_info(country)
    if not info:
        return None

    if info.reason == "sanctions":
        return (
            f"SIRW to {info.name} is not permitted. This country is currently subject "
            f"to UN/EU sanctions, and remote work from this location would expose both "
            f"Maersk and the employee to significant legal and compliance risks."
        )
    else:
        return (
            f"SIRW to {info.name} is not permitted. Maersk does not have a legal entity "
            f"in this country, which means we cannot ensure compliance with local tax, "
            f"immigration, and employment regulations."
        )
