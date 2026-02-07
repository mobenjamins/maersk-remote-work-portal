/**
 * Blocked countries for SIRW requests based on Maersk policy.
 * 
 * Two categories:
 * 1. UN/EU Sanctions - Countries under international sanctions
 * 2. No Maersk Entity - Countries where Maersk has no legal entity
 * 
 * SIRW cannot be performed in any of these countries.
 * Last updated: Based on SIRW Policy V3 (08.08.24) Appendix A
 */

export type BlockReason = 'sanctions' | 'no_entity';

export interface BlockedCountry {
  name: string;
  code: string;
  reason: BlockReason;
  region: string;
}

// UN/EU Sanctioned Countries
export const SANCTIONED_COUNTRIES: BlockedCountry[] = [
  // Asia Pacific
  { name: "Afghanistan", code: "AF", reason: "sanctions", region: "Asia Pacific" },
  { name: "North Korea", code: "KP", reason: "sanctions", region: "Asia Pacific" },
  { name: "Iran", code: "IR", reason: "sanctions", region: "Asia Pacific" },
  { name: "Iraq", code: "IQ", reason: "sanctions", region: "Asia Pacific" },
  { name: "Myanmar", code: "MM", reason: "sanctions", region: "Asia Pacific" },
  // Europe
  { name: "Bosnia and Herzegovina", code: "BA", reason: "sanctions", region: "Europe" },
  { name: "Russia", code: "RU", reason: "sanctions", region: "Europe" },
  { name: "Turkey", code: "TR", reason: "sanctions", region: "Europe" },
  { name: "Ukraine", code: "UA", reason: "sanctions", region: "Europe" },
  // India, Middle East & Africa (IMEA)
  { name: "Central African Republic", code: "CF", reason: "sanctions", region: "IMEA" },
  { name: "Congo (DRC)", code: "CD", reason: "sanctions", region: "IMEA" },
  { name: "Guinea", code: "GN", reason: "sanctions", region: "IMEA" },
  { name: "Libya", code: "LY", reason: "sanctions", region: "IMEA" },
  { name: "Somalia", code: "SO", reason: "sanctions", region: "IMEA" },
  { name: "South Sudan", code: "SS", reason: "sanctions", region: "IMEA" },
  { name: "Sudan", code: "SD", reason: "sanctions", region: "IMEA" },
  { name: "Syria", code: "SY", reason: "sanctions", region: "IMEA" },
  { name: "Yemen", code: "YE", reason: "sanctions", region: "IMEA" },
  { name: "Zimbabwe", code: "ZW", reason: "sanctions", region: "IMEA" },
  // North America
  { name: "Haiti", code: "HT", reason: "sanctions", region: "North America" },
  { name: "Nicaragua", code: "NI", reason: "sanctions", region: "North America" },
  // Latin America
  { name: "Venezuela", code: "VE", reason: "sanctions", region: "Latin America" },
];

// Countries with No Maersk Entity
export const NO_ENTITY_COUNTRIES: BlockedCountry[] = [
  // Asia Pacific
  { name: "Brunei", code: "BN", reason: "no_entity", region: "Asia Pacific" },
  { name: "Bhutan", code: "BT", reason: "no_entity", region: "Asia Pacific" },
  { name: "Fiji", code: "FJ", reason: "no_entity", region: "Asia Pacific" },
  { name: "Kiribati", code: "KI", reason: "no_entity", region: "Asia Pacific" },
  { name: "Laos", code: "LA", reason: "no_entity", region: "Asia Pacific" },
  { name: "Maldives", code: "MV", reason: "no_entity", region: "Asia Pacific" },
  { name: "Marshall Islands", code: "MH", reason: "no_entity", region: "Asia Pacific" },
  { name: "Micronesia", code: "FM", reason: "no_entity", region: "Asia Pacific" },
  { name: "Mongolia", code: "MN", reason: "no_entity", region: "Asia Pacific" },
  { name: "Nauru", code: "NR", reason: "no_entity", region: "Asia Pacific" },
  { name: "Nepal", code: "NP", reason: "no_entity", region: "Asia Pacific" },
  { name: "Palau", code: "PW", reason: "no_entity", region: "Asia Pacific" },
  { name: "Papua New Guinea", code: "PG", reason: "no_entity", region: "Asia Pacific" },
  { name: "Samoa", code: "WS", reason: "no_entity", region: "Asia Pacific" },
  { name: "Solomon Islands", code: "SB", reason: "no_entity", region: "Asia Pacific" },
  { name: "Timor-Leste", code: "TL", reason: "no_entity", region: "Asia Pacific" },
  { name: "Tonga", code: "TO", reason: "no_entity", region: "Asia Pacific" },
  { name: "Turkmenistan", code: "TM", reason: "no_entity", region: "Asia Pacific" },
  { name: "Tuvalu", code: "TV", reason: "no_entity", region: "Asia Pacific" },
  { name: "Uzbekistan", code: "UZ", reason: "no_entity", region: "Asia Pacific" },
  { name: "Vanuatu", code: "VU", reason: "no_entity", region: "Asia Pacific" },
  // Europe
  { name: "Albania", code: "AL", reason: "no_entity", region: "Europe" },
  { name: "Andorra", code: "AD", reason: "no_entity", region: "Europe" },
  { name: "Armenia", code: "AM", reason: "no_entity", region: "Europe" },
  { name: "Azerbaijan", code: "AZ", reason: "no_entity", region: "Europe" },
  { name: "Cyprus", code: "CY", reason: "no_entity", region: "Europe" },
  { name: "Iceland", code: "IS", reason: "no_entity", region: "Europe" },
  { name: "Liechtenstein", code: "LI", reason: "no_entity", region: "Europe" },
  { name: "Luxembourg", code: "LU", reason: "no_entity", region: "Europe" },
  { name: "Malta", code: "MT", reason: "no_entity", region: "Europe" },
  { name: "Monaco", code: "MC", reason: "no_entity", region: "Europe" },
  { name: "Montenegro", code: "ME", reason: "no_entity", region: "Europe" },
  { name: "North Macedonia", code: "MK", reason: "no_entity", region: "Europe" },
  { name: "Moldova", code: "MD", reason: "no_entity", region: "Europe" },
  { name: "San Marino", code: "SM", reason: "no_entity", region: "Europe" },
  // India, Middle East & Africa (IMEA)
  { name: "Burundi", code: "BI", reason: "no_entity", region: "IMEA" },
  { name: "Chad", code: "TD", reason: "no_entity", region: "IMEA" },
  { name: "Comoros", code: "KM", reason: "no_entity", region: "IMEA" },
  { name: "Equatorial Guinea", code: "GQ", reason: "no_entity", region: "IMEA" },
  { name: "Eritrea", code: "ER", reason: "no_entity", region: "IMEA" },
  { name: "Guinea-Bissau", code: "GW", reason: "no_entity", region: "IMEA" },
  { name: "Kazakhstan", code: "KZ", reason: "no_entity", region: "IMEA" },
  { name: "Kyrgyzstan", code: "KG", reason: "no_entity", region: "IMEA" },
  { name: "Sao Tome and Principe", code: "ST", reason: "no_entity", region: "IMEA" },
  { name: "Seychelles", code: "SC", reason: "no_entity", region: "IMEA" },
  { name: "Tajikistan", code: "TJ", reason: "no_entity", region: "IMEA" },
  // North America
  { name: "Antigua and Barbuda", code: "AG", reason: "no_entity", region: "North America" },
  { name: "Bahamas", code: "BS", reason: "no_entity", region: "North America" },
  { name: "Barbados", code: "BB", reason: "no_entity", region: "North America" },
  { name: "Cuba", code: "CU", reason: "no_entity", region: "North America" },
  { name: "Dominica", code: "DM", reason: "no_entity", region: "North America" },
  { name: "Grenada", code: "GD", reason: "no_entity", region: "North America" },
  { name: "Jamaica", code: "JM", reason: "no_entity", region: "North America" },
  { name: "Saint Kitts and Nevis", code: "KN", reason: "no_entity", region: "North America" },
  { name: "Saint Lucia", code: "LC", reason: "no_entity", region: "North America" },
  { name: "Saint Vincent and the Grenadines", code: "VC", reason: "no_entity", region: "North America" },
  // Latin America
  { name: "Belize", code: "BZ", reason: "no_entity", region: "Latin America" },
  { name: "Guyana", code: "GY", reason: "no_entity", region: "Latin America" },
  { name: "Suriname", code: "SR", reason: "no_entity", region: "Latin America" },
];

// Combined list of all blocked countries
export const ALL_BLOCKED_COUNTRIES: BlockedCountry[] = [
  ...SANCTIONED_COUNTRIES,
  ...NO_ENTITY_COUNTRIES,
];

// Quick lookup sets for validation
const SANCTIONED_CODES = new Set(SANCTIONED_COUNTRIES.map(c => c.code.toUpperCase()));
const SANCTIONED_NAMES = new Set(SANCTIONED_COUNTRIES.map(c => c.name.toLowerCase()));

const NO_ENTITY_CODES = new Set(NO_ENTITY_COUNTRIES.map(c => c.code.toUpperCase()));
const NO_ENTITY_NAMES = new Set(NO_ENTITY_COUNTRIES.map(c => c.name.toLowerCase()));

const ALL_BLOCKED_CODES = new Set([...SANCTIONED_CODES, ...NO_ENTITY_CODES]);
const ALL_BLOCKED_NAMES = new Set([...SANCTIONED_NAMES, ...NO_ENTITY_NAMES]);

/**
 * Check if a country is blocked for SIRW.
 */
export function isCountryBlocked(country: string): boolean {
  const countryLower = country.toLowerCase().trim();
  const countryUpper = country.toUpperCase().trim();
  
  return ALL_BLOCKED_NAMES.has(countryLower) || ALL_BLOCKED_CODES.has(countryUpper);
}

/**
 * Get the reason why a country is blocked.
 */
export function getBlockReason(country: string): BlockReason | null {
  const countryLower = country.toLowerCase().trim();
  const countryUpper = country.toUpperCase().trim();
  
  if (SANCTIONED_NAMES.has(countryLower) || SANCTIONED_CODES.has(countryUpper)) {
    return 'sanctions';
  }
  if (NO_ENTITY_NAMES.has(countryLower) || NO_ENTITY_CODES.has(countryUpper)) {
    return 'no_entity';
  }
  return null;
}

/**
 * Get full information about a blocked country.
 */
export function getBlockedCountryInfo(country: string): BlockedCountry | null {
  const countryLower = country.toLowerCase().trim();
  const countryUpper = country.toUpperCase().trim();
  
  return ALL_BLOCKED_COUNTRIES.find(
    c => c.name.toLowerCase() === countryLower || c.code === countryUpper
  ) || null;
}

/**
 * Get a user-friendly message explaining why a country is blocked.
 */
export function getBlockMessage(country: string): string | null {
  const info = getBlockedCountryInfo(country);
  if (!info) return null;
  
  if (info.reason === 'sanctions') {
    return `SIRW to ${info.name} is not permitted. This country is currently subject to UN/EU sanctions, and remote work from this location would expose both Maersk and the employee to significant legal and compliance risks.`;
  } else {
    return `SIRW to ${info.name} is not permitted. Maersk does not have a legal entity in this country, which means we cannot ensure compliance with local tax, immigration, and employment regulations.`;
  }
}
