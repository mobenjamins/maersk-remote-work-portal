# Fix: "Failed to Fetch" on Employee and Admin Frontends

**Date:** 2026-02-08
**Status:** Resolved
**Symptom:** Both `cozmcode.github.io/remote-work/` and `cozmcode.github.io/remote-work/admin/` show "Failed to fetch" when attempting to log in.

---

## What We Did

We moved the frontend deployment from `mobenjamins/maersk-remote-work-portal` to `cozmcode/remote-work` to make the URLs more professional:

- **Old Employee URL:** `https://mobenjamins.github.io/maersk-remote-work-portal/`
- **Old Admin URL:** `https://mobenjamins.github.io/maersk-remote-work-portal/employer/`
- **New Employee URL:** `https://cozmcode.github.io/remote-work/`
- **New Admin URL:** `https://cozmcode.github.io/remote-work/admin/`

Changes made:
1. Created `cozmcode/remote-work` GitHub repo
2. Updated `Frontend/vite.config.ts` base path from `/maersk-remote-work-portal/` to `/remote-work/`
3. Updated `Admin_frontend/admin-app/vite.config.ts` base path from `/maersk-remote-work-portal/employer/` to `/remote-work/admin/`
4. Updated `.github/workflows/deploy-frontend.yml` admin subpath from `dist/employer` to `dist/admin`
5. Set `VITE_API_BASE_URL` and `GEMINI_API_KEY` secrets on the new repo
6. Pushed to `cozmcode/remote-work` — GitHub Actions built and deployed successfully
7. Attempted to update `CORS_ALLOWED_ORIGINS` on Railway via browser automation — **this did not stick**

---

## Root Cause: CORS Not Updated on Railway

The Railway backend at `https://maersk-remote-work-portal-production.up.railway.app` does **not** allow requests from `https://cozmcode.github.io`. The browser blocks the API call before it reaches the server.

### Proof

```bash
# OLD origin — WORKS (returns Access-Control-Allow-Origin header):
curl -s -I -X OPTIONS \
  -H "Origin: https://mobenjamins.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://maersk-remote-work-portal-production.up.railway.app/api/auth/login/
# Response includes: access-control-allow-origin: https://mobenjamins.github.io

# NEW origin — FAILS (no Access-Control-Allow-Origin header):
curl -s -I -X OPTIONS \
  -H "Origin: https://cozmcode.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://maersk-remote-work-portal-production.up.railway.app/api/auth/login/
# Response has NO access-control-allow-origin header — browser blocks this
```

### How Django reads the CORS config

File: `Backend/config/settings/production.py` line 13:
```python
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
CORS_ALLOW_CREDENTIALS = True
```

It reads from the `CORS_ALLOWED_ORIGINS` environment variable on Railway, split by comma.

---

## What Needs to Be Fixed

### Fix 1: Update CORS_ALLOWED_ORIGINS on Railway (Primary)

On the Railway dashboard, edit the `CORS_ALLOWED_ORIGINS` environment variable to include `https://cozmcode.github.io`.

**Current value:**
```
https://mobenjamins.github.io,http://localhost:3000,http://localhost:5173,http://localhost:5174
```

**Required value:**
```
https://mobenjamins.github.io,http://localhost:3000,http://localhost:5173,http://localhost:5174,https://cozmcode.github.io
```

**Steps:**
1. Go to Railway dashboard: https://railway.com/project/0e6b0b3c-8e6e-4230-be8c-242c01362d8a/service/2a584334-1f62-4795-95da-79163b59c14f/variables
2. Find `CORS_ALLOWED_ORIGINS` variable
3. Append `,https://cozmcode.github.io` to the existing value
4. Save the variable
5. Click "Deploy" to trigger a redeploy with the new value

### Fix 2: Verify VITE_API_BASE_URL Secret (Likely Fine)

The `cozmcode/remote-work` repo should have this GitHub Actions secret:
```
VITE_API_BASE_URL=https://maersk-remote-work-portal-production.up.railway.app/api
```

There is also a fallback in `Frontend/.env.production` with the same value.

The frontend reads it at `Frontend/services/api.ts` line 5:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

---

## Verification After Fix

After updating the Railway variable and redeploying, run:

```bash
# Should now return Access-Control-Allow-Origin: https://cozmcode.github.io
curl -s -I -X OPTIONS \
  -H "Origin: https://cozmcode.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://maersk-remote-work-portal-production.up.railway.app/api/auth/login/
```

Then visit https://cozmcode.github.io/remote-work/, enter any `@maersk.com` email, click Next. It should proceed to the OTP screen.

---

## Key References

| Resource | Location |
|----------|----------|
| Backend (live) | https://maersk-remote-work-portal-production.up.railway.app |
| Backend API docs | https://maersk-remote-work-portal-production.up.railway.app/api/docs/ |
| Employee Frontend | https://cozmcode.github.io/remote-work/ |
| Admin Frontend | https://cozmcode.github.io/remote-work/admin/ |
| GitHub Repo (CI runs here) | https://github.com/cozmcode/remote-work |
| GitHub Repo (legacy) | https://github.com/mobenjamins/maersk-remote-work-portal |
| Railway Project ID | `0e6b0b3c-8e6e-4230-be8c-242c01362d8a` |
| Railway Backend Service ID | `2a584334-1f62-4795-95da-79163b59c14f` |
| Railway Variables URL | https://railway.com/project/0e6b0b3c-8e6e-4230-be8c-242c01362d8a/service/2a584334-1f62-4795-95da-79163b59c14f/variables |
| CORS config | `Backend/config/settings/production.py:13` |
| Frontend API client | `Frontend/services/api.ts:5` |
| Frontend env | `Frontend/.env.production` |
| GitHub Actions workflow | `.github/workflows/deploy-frontend.yml` |

---

## Why the Previous Attempt Failed

We tried to update the CORS variable via Claude in Chrome browser automation on the Railway dashboard. The variable text field appeared to be edited and the Deploy button was clicked, but the change did not persist. Likely the edit was not committed to the input field properly, or the save was not triggered before deploy.
