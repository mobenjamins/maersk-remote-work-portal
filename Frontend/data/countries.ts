/**
 * Complete list of world countries (ISO 3166-1)
 * Includes country name, ISO code, flag emoji, and common aliases/synonyms
 * Based on UX research from Baymard Institute recommending synonym support
 */

export interface Country {
  name: string;
  code: string;
  flag: string;
  aliases?: string[]; // Alternative names, local spellings, common abbreviations
}

export const countries: Country[] = [
  { name: "Afghanistan", code: "AF", flag: "🇦🇫" },
  { name: "Albania", code: "AL", flag: "🇦🇱", aliases: ["Shqipëri"] },
  { name: "Algeria", code: "DZ", flag: "🇩🇿", aliases: ["Algérie"] },
  { name: "Andorra", code: "AD", flag: "🇦🇩" },
  { name: "Angola", code: "AO", flag: "🇦🇴" },
  { name: "Antigua and Barbuda", code: "AG", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", flag: "🇦🇲", aliases: ["Hayastan"] },
  { name: "Australia", code: "AU", flag: "🇦🇺", aliases: ["AUS", "Oz", "Down Under"] },
  { name: "Austria", code: "AT", flag: "🇦🇹", aliases: ["Österreich", "Oesterreich"] },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", flag: "🇧🇸", aliases: ["The Bahamas"] },
  { name: "Bahrain", code: "BH", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", flag: "🇧🇾", aliases: ["Беларусь", "Byelorussia"] },
  { name: "Belgium", code: "BE", flag: "🇧🇪", aliases: ["Belgique", "België", "Belgien"] },
  { name: "Belize", code: "BZ", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", flag: "🇧🇯" },
  { name: "Bhutan", code: "BT", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦", aliases: ["Bosnia", "BiH"] },
  { name: "Botswana", code: "BW", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", aliases: ["Brasil"] },
  { name: "Brunei", code: "BN", flag: "🇧🇳", aliases: ["Brunei Darussalam"] },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬", aliases: ["България"] },
  { name: "Burkina Faso", code: "BF", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", flag: "🇰🇭", aliases: ["Kampuchea"] },
  { name: "Cameroon", code: "CM", flag: "🇨🇲", aliases: ["Cameroun"] },
  { name: "Canada", code: "CA", flag: "🇨🇦", aliases: ["CAN"] },
  { name: "Cape Verde", code: "CV", flag: "🇨🇻", aliases: ["Cabo Verde"] },
  { name: "Central African Republic", code: "CF", flag: "🇨🇫", aliases: ["CAR"] },
  { name: "Chad", code: "TD", flag: "🇹🇩", aliases: ["Tchad"] },
  { name: "Chile", code: "CL", flag: "🇨🇱" },
  { name: "China", code: "CN", flag: "🇨🇳", aliases: ["PRC", "People's Republic of China", "中国", "Zhongguo"] },
  { name: "Colombia", code: "CO", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", flag: "🇰🇲" },
  { name: "Congo (DRC)", code: "CD", flag: "🇨🇩", aliases: ["Democratic Republic of the Congo", "DRC", "Zaire", "Congo-Kinshasa"] },
  { name: "Congo (Republic)", code: "CG", flag: "🇨🇬", aliases: ["Republic of the Congo", "Congo-Brazzaville"] },
  { name: "Costa Rica", code: "CR", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", flag: "🇭🇷", aliases: ["Hrvatska"] },
  { name: "Cuba", code: "CU", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", flag: "🇨🇾", aliases: ["Κύπρος", "Kıbrıs"] },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿", aliases: ["Czechia", "Česko", "Česká republika"] },
  { name: "Denmark", code: "DK", flag: "🇩🇰", aliases: ["Danmark", "DEN"] },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", flag: "🇩🇴", aliases: ["República Dominicana"] },
  { name: "Ecuador", code: "EC", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", aliases: ["Misr", "مصر"] },
  { name: "El Salvador", code: "SV", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", flag: "🇪🇪", aliases: ["Eesti"] },
  { name: "Eswatini", code: "SZ", flag: "🇸🇿", aliases: ["Swaziland"] },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹" },
  { name: "Fiji", code: "FJ", flag: "🇫🇯" },
  { name: "Finland", code: "FI", flag: "🇫🇮", aliases: ["Suomi"] },
  { name: "France", code: "FR", flag: "🇫🇷", aliases: ["FRA", "République française"] },
  { name: "Gabon", code: "GA", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", flag: "🇬🇲", aliases: ["The Gambia"] },
  { name: "Georgia", code: "GE", flag: "🇬🇪", aliases: ["საქართველო", "Sakartvelo"] },
  { name: "Germany", code: "DE", flag: "🇩🇪", aliases: ["Deutschland", "GER", "DEU", "Allemagne"] },
  { name: "Ghana", code: "GH", flag: "🇬🇭" },
  { name: "Greece", code: "GR", flag: "🇬🇷", aliases: ["Hellas", "Ελλάδα", "Ellada"] },
  { name: "Grenada", code: "GD", flag: "🇬🇩" },
  { name: "Guatemala", code: "GT", flag: "🇬🇹" },
  { name: "Guinea", code: "GN", flag: "🇬🇳", aliases: ["Guinée"] },
  { name: "Guinea-Bissau", code: "GW", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", flag: "🇭🇹", aliases: ["Haïti"] },
  { name: "Honduras", code: "HN", flag: "🇭🇳" },
  { name: "Hong Kong", code: "HK", flag: "🇭🇰", aliases: ["香港", "HKG"] },
  { name: "Hungary", code: "HU", flag: "🇭🇺", aliases: ["Magyarország", "Magyar"] },
  { name: "Iceland", code: "IS", flag: "🇮🇸", aliases: ["Ísland"] },
  { name: "India", code: "IN", flag: "🇮🇳", aliases: ["IND", "Bharat", "भारत"] },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Iran", code: "IR", flag: "🇮🇷", aliases: ["Persia", "Islamic Republic of Iran", "ایران"] },
  { name: "Iraq", code: "IQ", flag: "🇮🇶", aliases: ["العراق"] },
  { name: "Ireland", code: "IE", flag: "🇮🇪", aliases: ["Éire", "Republic of Ireland", "IRL"] },
  { name: "Israel", code: "IL", flag: "🇮🇱", aliases: ["ישראל"] },
  { name: "Italy", code: "IT", flag: "🇮🇹", aliases: ["Italia", "ITA"] },
  { name: "Ivory Coast", code: "CI", flag: "🇨🇮", aliases: ["Côte d'Ivoire", "Cote d'Ivoire"] },
  { name: "Jamaica", code: "JM", flag: "🇯🇲" },
  { name: "Japan", code: "JP", flag: "🇯🇵", aliases: ["Nippon", "日本", "JPN"] },
  { name: "Jordan", code: "JO", flag: "🇯🇴", aliases: ["الأردن"] },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿", aliases: ["Қазақстан"] },
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", flag: "🇰🇮" },
  { name: "Kosovo", code: "XK", flag: "🇽🇰", aliases: ["Kosova", "Косово"] },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", aliases: ["الكويت"] },
  { name: "Kyrgyzstan", code: "KG", flag: "🇰🇬", aliases: ["Кыргызстан"] },
  { name: "Laos", code: "LA", flag: "🇱🇦", aliases: ["Lao PDR"] },
  { name: "Latvia", code: "LV", flag: "🇱🇻", aliases: ["Latvija"] },
  { name: "Lebanon", code: "LB", flag: "🇱🇧", aliases: ["Liban", "لبنان"] },
  { name: "Lesotho", code: "LS", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", flag: "🇱🇷" },
  { name: "Libya", code: "LY", flag: "🇱🇾", aliases: ["ليبيا"] },
  { name: "Liechtenstein", code: "LI", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹", aliases: ["Lietuva"] },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺", aliases: ["Lëtzebuerg", "Luxemburg"] },
  { name: "Macau", code: "MO", flag: "🇲🇴", aliases: ["Macao", "澳門"] },
  { name: "Madagascar", code: "MG", flag: "🇲🇬", aliases: ["Madagasikara"] },
  { name: "Malawi", code: "MW", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", aliases: ["MYS"] },
  { name: "Maldives", code: "MV", flag: "🇲🇻" },
  { name: "Mali", code: "ML", flag: "🇲🇱" },
  { name: "Malta", code: "MT", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", flag: "🇲🇭" },
  { name: "Mauritania", code: "MR", flag: "🇲🇷", aliases: ["موريتانيا"] },
  { name: "Mauritius", code: "MU", flag: "🇲🇺" },
  { name: "Mexico", code: "MX", flag: "🇲🇽", aliases: ["México", "MEX"] },
  { name: "Micronesia", code: "FM", flag: "🇫🇲", aliases: ["FSM"] },
  { name: "Moldova", code: "MD", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", flag: "🇲🇳", aliases: ["Монгол"] },
  { name: "Montenegro", code: "ME", flag: "🇲🇪", aliases: ["Crna Gora"] },
  { name: "Morocco", code: "MA", flag: "🇲🇦", aliases: ["Maroc", "المغرب"] },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿", aliases: ["Moçambique"] },
  { name: "Myanmar", code: "MM", flag: "🇲🇲", aliases: ["Burma"] },
  { name: "Namibia", code: "NA", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", flag: "🇳🇵", aliases: ["नेपाल"] },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", aliases: ["Holland", "The Netherlands", "Nederland", "NED", "NLD"] },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", aliases: ["NZL", "Aotearoa"] },
  { name: "Nicaragua", code: "NI", flag: "🇳🇮" },
  { name: "Niger", code: "NE", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", aliases: ["NGA"] },
  { name: "North Korea", code: "KP", flag: "🇰🇵", aliases: ["DPRK", "Democratic People's Republic of Korea"] },
  { name: "North Macedonia", code: "MK", flag: "🇲🇰", aliases: ["Macedonia", "FYROM", "Северна Македонија"] },
  { name: "Norway", code: "NO", flag: "🇳🇴", aliases: ["Norge", "Noreg", "NOR"] },
  { name: "Oman", code: "OM", flag: "🇴🇲", aliases: ["عُمان"] },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", aliases: ["PAK", "پاکستان"] },
  { name: "Palau", code: "PW", flag: "🇵🇼" },
  { name: "Palestine", code: "PS", flag: "🇵🇸", aliases: ["Palestinian Territories", "فلسطين"] },
  { name: "Panama", code: "PA", flag: "🇵🇦", aliases: ["Panamá"] },
  { name: "Papua New Guinea", code: "PG", flag: "🇵🇬", aliases: ["PNG"] },
  { name: "Paraguay", code: "PY", flag: "🇵🇾" },
  { name: "Peru", code: "PE", flag: "🇵🇪", aliases: ["Perú"] },
  { name: "Philippines", code: "PH", flag: "🇵🇭", aliases: ["Pilipinas", "PHL"] },
  { name: "Poland", code: "PL", flag: "🇵🇱", aliases: ["Polska", "POL"] },
  { name: "Portugal", code: "PT", flag: "🇵🇹", aliases: ["POR"] },
  { name: "Qatar", code: "QA", flag: "🇶🇦", aliases: ["قطر"] },
  { name: "Romania", code: "RO", flag: "🇷🇴", aliases: ["România", "ROU"] },
  { name: "Russia", code: "RU", flag: "🇷🇺", aliases: ["Russian Federation", "Россия", "Rossiya", "RUS"] },
  { name: "Rwanda", code: "RW", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", code: "KN", flag: "🇰🇳", aliases: ["St. Kitts"] },
  { name: "Saint Lucia", code: "LC", flag: "🇱🇨", aliases: ["St. Lucia"] },
  { name: "Saint Vincent and the Grenadines", code: "VC", flag: "🇻🇨", aliases: ["St. Vincent"] },
  { name: "Samoa", code: "WS", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", flag: "🇸🇹", aliases: ["São Tomé and Príncipe"] },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", aliases: ["KSA", "السعودية", "Kingdom of Saudi Arabia"] },
  { name: "Senegal", code: "SN", flag: "🇸🇳", aliases: ["Sénégal"] },
  { name: "Serbia", code: "RS", flag: "🇷🇸", aliases: ["Србија", "Srbija"] },
  { name: "Seychelles", code: "SC", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", aliases: ["SIN", "SGP", "新加坡"] },
  { name: "Slovakia", code: "SK", flag: "🇸🇰", aliases: ["Slovensko", "Slovak Republic"] },
  { name: "Slovenia", code: "SI", flag: "🇸🇮", aliases: ["Slovenija"] },
  { name: "Solomon Islands", code: "SB", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", flag: "🇸🇴", aliases: ["Soomaaliya"] },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", aliases: ["RSA", "SA", "Suid-Afrika"] },
  { name: "South Korea", code: "KR", flag: "🇰🇷", aliases: ["Korea", "Republic of Korea", "ROK", "한국", "대한민국"] },
  { name: "South Sudan", code: "SS", flag: "🇸🇸" },
  { name: "Spain", code: "ES", flag: "🇪🇸", aliases: ["España", "ESP"] },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", aliases: ["Ceylon"] },
  { name: "Sudan", code: "SD", flag: "🇸🇩", aliases: ["السودان"] },
  { name: "Suriname", code: "SR", flag: "🇸🇷" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", aliases: ["Sverige", "SWE"] },
  { name: "Switzerland", code: "CH", flag: "🇨🇭", aliases: ["Schweiz", "Suisse", "Svizzera", "Svizra", "Swiss", "SUI"] },
  { name: "Syria", code: "SY", flag: "🇸🇾", aliases: ["Syrian Arab Republic", "سوريا"] },
  { name: "Taiwan", code: "TW", flag: "🇹🇼", aliases: ["ROC", "Republic of China", "台灣", "台湾", "Chinese Taipei"] },
  { name: "Tajikistan", code: "TJ", flag: "🇹🇯", aliases: ["Тоҷикистон"] },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", aliases: ["ประเทศไทย", "THA", "Siam"] },
  { name: "Timor-Leste", code: "TL", flag: "🇹🇱", aliases: ["East Timor"] },
  { name: "Togo", code: "TG", flag: "🇹🇬" },
  { name: "Tonga", code: "TO", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", flag: "🇹🇹", aliases: ["T&T"] },
  { name: "Tunisia", code: "TN", flag: "🇹🇳", aliases: ["Tunisie", "تونس"] },
  { name: "Turkey", code: "TR", flag: "🇹🇷", aliases: ["Türkiye", "Turkiye", "TUR"] },
  { name: "Turkmenistan", code: "TM", flag: "🇹🇲", aliases: ["Türkmenistan"] },
  { name: "Tuvalu", code: "TV", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", aliases: ["Україна", "Ukraina", "UKR"] },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", aliases: ["UAE", "Emirates", "الإمارات"] },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", aliases: ["UK", "Britain", "Great Britain", "England", "Scotland", "Wales", "GBR"] },
  { name: "United States", code: "US", flag: "🇺🇸", aliases: ["USA", "US", "America", "United States of America", "U.S.", "U.S.A."] },
  { name: "Uruguay", code: "UY", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿", aliases: ["O'zbekiston"] },
  { name: "Vanuatu", code: "VU", flag: "🇻🇺" },
  { name: "Vatican City", code: "VA", flag: "🇻🇦", aliases: ["Holy See", "Vatican"] },
  { name: "Venezuela", code: "VE", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", aliases: ["Viet Nam", "Việt Nam", "VNM"] },
  { name: "Yemen", code: "YE", flag: "🇾🇪", aliases: ["اليمن"] },
  { name: "Zambia", code: "ZM", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼" },
];

/**
 * Search countries by name, code, or aliases
 * Supports partial matching and prioritizes matches at start of string
 */
export function searchCountries(query: string): Country[] {
  if (!query.trim()) return countries;
  
  const q = query.toLowerCase().trim();
  
  // Score each country based on match quality
  const scored = countries.map(country => {
    let score = 0;
    const name = country.name.toLowerCase();
    const code = country.code.toLowerCase();
    
    // Exact match on code (highest priority)
    if (code === q) score = 100;
    // Name starts with query
    else if (name.startsWith(q)) score = 90;
    // Code starts with query
    else if (code.startsWith(q)) score = 85;
    // Name contains query
    else if (name.includes(q)) score = 70;
    // Check aliases
    else if (country.aliases) {
      for (const alias of country.aliases) {
        const a = alias.toLowerCase();
        if (a === q) { score = 95; break; }
        if (a.startsWith(q)) { score = 80; break; }
        if (a.includes(q)) { score = 60; break; }
      }
    }
    
    return { country, score };
  });
  
  // Filter and sort by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.country);
}

// Helper function to find country by name
export function findCountryByName(name: string): Country | undefined {
  return countries.find(c => c.name.toLowerCase() === name.toLowerCase());
}

// Helper function to find country by code
export function findCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code.toLowerCase() === code.toLowerCase());
}

// Helper to find country by name or alias
export function findCountryByNameOrAlias(query: string): Country | undefined {
  const q = query.toLowerCase().trim();
  return countries.find(c => 
    c.name.toLowerCase() === q ||
    c.code.toLowerCase() === q ||
    c.aliases?.some(a => a.toLowerCase() === q)
  );
}
