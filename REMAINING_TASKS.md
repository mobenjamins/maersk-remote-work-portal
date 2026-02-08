# Remaining Tasks — Maersk Remote Work Portal

## Current Status: Premium Admin Dashboard — 90% Complete

### Working
- Login flow (auth, OTP, JWT)
- Overview tab (KPI cards, world map, area chart, real API data)
- Sidebar navigation, user profile, logout
- Deployment pipeline (GitHub Actions → GitHub Pages)

---

## Admin Dashboard Bugs to Fix

### 1. Request Manager tab — blank/spinner on first load
**File:** `Admin_frontend/admin-app/src/components/RequestManager.tsx`

The component gets stuck in loading state. The API call works (returns 200 with 4 requests), but the component shows a spinner. After clicking away and back, it renders but only shows 1 of 4 rows. Likely a race condition in the `useEffect` + `AnimatePresence mode="wait"` interaction — the exit animation may unmount the component before `setLoading(false)` fires.

### 2. Request Manager — only 1 of 4 API rows displayed
**File:** `Admin_frontend/admin-app/src/components/RequestManager.tsx`

When it does render, only "Benjamin Oghene, Denmark → Norway" shows. The other 3 requests from the API are missing. Could be a `key` collision issue (UUIDs from API vs mock data `id` field) or a filtering bug.

### 3. Text readability on initial load
**File:** `Admin_frontend/admin-app/src/components/OverviewDashboard.tsx`

KPI cards and labels are extremely faint for the first ~2 seconds before the animated counters kick in. The `useSpring` animation starts from 0 and the labels use very light grey colours.

---

## Employee Frontend Polish (from plan: `~/.claude/plans/giggly-seeking-pinwheel.md`)

### 4. Fix Gemini AI service
**File:** `Frontend/src/services/geminiService.ts`

- Fix Gemini model from deprecated `gemini-2.5-flash-preview` to `gemini-2.0-flash` (all 3 usages)
- Add real file extraction using `pdfjs-dist`, `@kenjiuno/msgreader`, `eml-parse-js` (currently hardcodes "Lars Sorensen")
- Enrich `POLICY_CONTEXT` with full SIRW policy text so the chatbot gives accurate answers
- Install new packages: `pdfjs-dist`, `@kenjiuno/msgreader`, `eml-parse-js`

### 5. Policy Modal — NEW component
**File:** `Frontend/src/components/PolicyModal.tsx` (create new)

Full-screen overlay modal with the SIRW policy rendered as formatted HTML:
- Semi-transparent dark backdrop
- White content area, max-w-3xl, scrollable
- Close button (X) top-right
- All 7 sections rendered: Effective Date, Scope, Purpose, Main Policy Statement (4.1.1–4.1.5), Extended SIRW, Version Control, Appendix A (blocked countries table)
- "Download PDF" link at the bottom pointing to the static PDF asset

### 6. Wire Policy Modal in App
**File:** `Frontend/src/App.tsx`

- Add `isPolicyModalOpen` state
- Pass `onOpenPolicy` callback to Dashboard and Policy Guidelines sidebar
- Fix text colours: "Back to Dashboard" link `text-gray-400` → `text-gray-600`
- Add "View Full Policy" link in the Policy Guidelines sidebar
- Render `<PolicyModal>` conditionally

### 7. Static Policy PDF
Copy `/Users/benjaminoghene/Documents/Maersk2/Input_Data/Maersk SIRW Policy V3 08.08.24 MLE (2).pdf` to `Frontend/public/policy/Maersk-SIRW-Policy.pdf`

### 8. Fix Dashboard text readability
**File:** `Frontend/src/components/Dashboard.tsx`

All `text-gray-400` on light backgrounds → `text-gray-600`:
- Line 85: allowance label `text-[10px] text-gray-400` → `text-gray-600`
- Line 90: "/ 20d" `text-gray-400` → `text-gray-500`
- Line 141: "Loading your history..." → `text-gray-500`
- Line 147: Plus icon `text-gray-300` → `text-gray-400`
- Line 165: table headers `text-gray-400` → `text-gray-600`
- Line 188: "Working Days" `text-gray-400` → `text-gray-500`
- Line 217: "Viewing X of Y" `text-gray-400` → `text-gray-500`
- Line 268: profile labels `text-gray-400` → `text-gray-500`
- Line 55: cancelled status `text-gray-400` → `text-gray-600`

Wire "Full Policy PDF" button (line ~251) to open `/maersk-remote-work-portal/policy/Maersk-SIRW-Policy.pdf` in new tab.

### 9. Questionnaire enhancements
**File:** `Frontend/src/components/Questionnaire.tsx`

- **Profile Reset Link** (Step 1, below Home Country): button to reset firstName, lastName, homeCountry, managerName, managerEmail
- **Country Autocomplete** (Step 2): Replace `<select>` with existing `<CountryAutocomplete>` component (props: `showBlockedWarning={true}`, `allowBlocked={false}`)
- **Help texts** on every field (see full plan for exact texts per field, referencing SIRW policy sections)
- **Policy-aligned result messages**: Replace generic approval/rejection text with messages referencing specific SIRW policy sections (4.1, 4.1.1, 4.1.2, 4.1.3, Section 5)
- **Pass `File` object** to `extractApprovalData(file)` instead of `file.name`

---

## Key Files Summary

| File | Task |
|------|------|
| `Admin_frontend/admin-app/src/components/RequestManager.tsx` | Bugs #1 and #2 |
| `Admin_frontend/admin-app/src/components/OverviewDashboard.tsx` | Bug #3 |
| `Frontend/src/services/geminiService.ts` | Task #4 |
| `Frontend/src/components/PolicyModal.tsx` | Task #5 (new) |
| `Frontend/src/App.tsx` | Task #6 |
| `Frontend/public/policy/Maersk-SIRW-Policy.pdf` | Task #7 (copy) |
| `Frontend/src/components/Dashboard.tsx` | Task #8 |
| `Frontend/src/components/Questionnaire.tsx` | Task #9 |

## Live URLs
- **Backend API**: `https://maersk-remote-work-portal-production.up.railway.app`
- **Employee Frontend**: `https://mobenjamins.github.io/maersk-remote-work-portal/`
- **Admin Frontend**: `https://mobenjamins.github.io/maersk-remote-work-portal/employer/`
- **GitHub Repo**: `mobenjamins/maersk-remote-work-portal`

## Deployment
After fixing, commit and push to `main`. GitHub Actions workflow auto-builds both frontends and deploys to GitHub Pages.
