# Maersk SIRW Portal - Build Plan

Based on review of the SIRW Policy V3 (08.08.24), the following improvements are required to align the application with policy requirements.

---

## Priority 1: Sanctioned/Blocked Countries List (CRITICAL) ✅ COMPLETED

The policy explicitly prohibits SIRW in sanctioned countries and countries without a Maersk entity.

- [x] Create country data file with blocked countries from Appendix A
  - [x] UN/EU Sanctions category (hard block): Afghanistan, North Korea, Iran, Iraq, Myanmar, Russia, Ukraine, Turkey, Bosnia & Herzegovina, Syria, Yemen, Venezuela, Nicaragua, Haiti, Central African Republic, DRC, Guinea, Libya, Somalia, South Sudan, Sudan, Zimbabwe
  - [x] No Maersk Entity category (hard block): Fiji, Monaco, Iceland, Bahamas, Jamaica, Liechtenstein, Luxembourg, Malta, Andorra, Albania, Armenia, Azerbaijan, Cyprus, Montenegro, North Macedonia, Moldova, San Marino, Brunei, Bhutan, Kiribati, Lao, Maldives, Marshall Islands, Micronesia, Mongolia, Nauru, Nepal, Palau, Papua New Guinea, Samoa, Solomon Islands, Timor-Leste, Tonga, Turkmenistan, Tuvalu, Uzbekistan, Vanuatu, Burundi, Chad, Comoros, Equatorial Guinea, Eritrea, Guinea-Bissau, Kazakhstan, Kyrgyzstan, Sao Tome and Principe, Seychelles, Tajikistan, Antigua & Barbuda, Barbados, Cuba, Dominica, Grenada, Saint Kitts and Nevis, Saint Lucia, St Vincent & the Grenadines, Belize, Guyana, Suriname
- [x] Add backend validation to auto-reject requests to blocked countries
- [x] Add frontend validation with clear error messaging explaining why (sanctions vs no entity)
- [x] Store as configurable data so it can be updated as sanctions change

**Files created:**
- `Backend/apps/compliance/blocked_countries.py` - Backend data and validation functions
- `Frontend/data/blockedCountries.ts` - Frontend data and validation functions
- Updated `Backend/apps/compliance/rules.py` - Added BlockedCountryRule

---

## Priority 2: Multi-Step Approval Workflow ✅ COMPLETED

Redesign the request flow to match policy requirements.

### Step 1: Manager Approval Upload
- [x] Add file upload component for manager approval email
- [x] Integrate Gemini AI to extract manager details from uploaded email:
  - [x] Manager's first name
  - [x] Manager's middle name (if present)
  - [x] Manager's last name
  - [x] Manager's email address
- [x] Display extracted data for employee to confirm/correct
- [x] Store manager details with the request

### Step 2: Employee Profile (one-time, with consent)
- [x] Create profile completion step (skipped if profile already exists)
- [x] Capture fields:
  - [x] Phone number
  - [x] First name
  - [x] Middle name (optional)
  - [x] Last name
  - [x] Home country (confirm/update)
- [x] Auto-populate email from authentication
- [x] Add consent checkbox for data storage
- [ ] Store profile for future requests (backend integration pending)

### Step 3: Request Details
- [x] Destination country selector (with blocked country validation)
- [x] Start date picker
- [x] End date picker
- [x] Calculate and display workdays (excluding weekends)
- [x] Validate max 14 consecutive workdays per trip
- [x] Show warning if cumulative annual days would exceed 20
- [x] Allow "Exception Request" toggle with mandatory reason field

### Step 4: Compliance Confirmation
- [x] Right to work confirmation:
  - [x] Checkbox: "I have the legal right to work in [destination country]"
  - [x] Explanatory note: "The right to visit is NOT the same as the right to work"
- [x] Role eligibility confirmation:
  - [x] Display all ineligible role categories
  - [x] Checkbox: "I confirm my role is NOT one of the following ineligible categories"
  - [x] List categories: Frontline/customer-facing, On-site (seafarers, maintenance, warehouse), Legal profession, Data security restricted, Commercial/Sales, Procurement, Senior Executive leadership

### Step 5: Outcome Logic
- [x] Auto-approved: All validations pass, within 20 days, no exceptions
- [x] Auto-rejected: Blocked country, ineligible role confirmed, or no right to work
- [x] Pending review: Exception requested (>20 days, >14 consecutive days) - email Global Mobility
- [ ] Send confirmation email to employee with outcome (backend integration pending)
- [ ] Send notification to line manager (CC on outcome) (backend integration pending)

**Files created:**
- `Frontend/components/RequestWizard.tsx` - Complete 5-step wizard component
- Updated `Frontend/App.tsx` - Integrated wizard into app flow
- Updated `Frontend/components/CountryAutocomplete.tsx` - Added blocked country warnings

---

## Priority 3: Expanded Role Eligibility Checking ✅ COMPLETED

- [x] Replace simple "is sales role" boolean with comprehensive role categories
- [x] Ineligible categories to check:
  - [x] Frontline, customer-facing roles
  - [x] On-site roles (seafarers, repair/maintenance crew, warehouse)
  - [x] Roles that cannot be performed abroad for legal reasons
  - [x] Commercial roles with contract signing authority
  - [x] Sales roles with contract signing authority
  - [x] Procurement roles with contract signing authority
  - [x] Senior Executive leadership roles
- [x] Display as checklist - employee confirms they are NOT in any category
- [x] If any checked, auto-reject with explanation

**Files updated:**
- `Backend/apps/compliance/rules.py` - Added IneligibleRoleRule with all categories
- `Frontend/components/RequestWizard.tsx` - Compliance step with role categories

---

## Priority 4: Annual Day Tracking with Balance Display ✅ COMPLETED

- [x] Track approved workdays per employee per calendar year
- [x] Add to dashboard: "Days used: X / 20" and "Days remaining: Y"
- [x] When submitting new request, calculate if it would exceed 20 days
- [x] If exceeding 20 days:
  - [x] Show warning message
  - [x] Allow employee to mark as "Exception Request"
  - [x] Require mandatory reason field for exceptions
  - [x] Route to "Pending Review" status for Global Mobility
- [x] Reset counter on 1 January each year (year-based filtering)

**Files updated:**
- `Backend/apps/requests/views.py` - `sirw_annual_balance` and `sirw_wizard_submit` endpoints
- `Frontend/components/RequestWizard.tsx` - Annual balance display with progress bar

---

## Priority 5: Continuous Days Validation (14-day limit) ✅ COMPLETED

- [x] Calculate workdays (exclude weekends) between start and end date
- [x] If >14 consecutive workdays:
  - [x] Show warning (not hard block - allows exception request)
  - [x] Show message explaining the 14-day limit
- [x] Detect back-to-back requests that would circumvent this rule
- [x] Allow exception request with justification for extended periods

**Files updated:**
- `Backend/apps/compliance/rules.py` - Added ConsecutiveDaysRule
- `Backend/config/settings/base.py` - Added MAX_CONSECUTIVE_DAYS setting
- `Backend/apps/requests/views.py` - Added `check_date_overlap` endpoint for back-to-back detection
- `Frontend/components/RequestWizard.tsx` - Workdays calculation, back-to-back warnings, and exception handling

---

## Technical Notes

- Backend: Django 4.2 LTS + Django REST Framework
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS (CDN)
- AI: Google Gemini API for email parsing
- Auth: JWT (djangorestframework-simplejwt)
- Blocked countries data: Store in `Backend/apps/compliance/` as Python data file
- Frontend country data: Extend `Frontend/data/countries.ts`

---

## Progress Tracker

| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Sanctioned/Blocked Countries | ✅ Completed |
| 2 | Multi-Step Approval Workflow | ✅ Completed |
| 3 | Expanded Role Eligibility | ✅ Completed |
| 4 | Annual Day Tracking | ✅ Completed |
| 5 | Continuous Days Validation | ✅ Completed |

---

## Files Changed/Created

### Backend
- `Backend/apps/compliance/blocked_countries.py` - NEW: Blocked countries data and validation
- `Backend/apps/compliance/rules.py` - UPDATED: Added BlockedCountryRule, ConsecutiveDaysRule, IneligibleRoleRule
- `Backend/config/settings/base.py` - UPDATED: Added MAX_CONSECUTIVE_DAYS setting

### Frontend
- `Frontend/data/blockedCountries.ts` - NEW: Blocked countries data for frontend
- `Frontend/components/RequestWizard.tsx` - NEW: 5-step SIRW request wizard
- `Frontend/components/CountryAutocomplete.tsx` - UPDATED: Added blocked country warnings
- `Frontend/components/Questionnaire.tsx` - UPDATED: Added workdays calculation and blocked country validation
- `Frontend/App.tsx` - UPDATED: Integrated RequestWizard component

---

## Remaining Work

1. ~~**Backend API Integration** - Connect RequestWizard to Django backend~~ ✅ Done
2. **Email Notifications** - Send confirmation emails on approval/rejection (future enhancement)
3. ~~**Profile Persistence** - Save employee profile to database~~ ✅ Done
4. ~~**Annual Day Tracking** - Backend logic to track cumulative days per year~~ ✅ Done
5. ~~**Back-to-back Request Detection** - Detect circumvention of 14-day rule~~ ✅ Done

### Optional Future Enhancements
- Email notifications on approval/rejection (requires email service configuration)
- Manager notification CC on outcomes
- PDF export of approved requests
- Calendar integration (.ics download)
