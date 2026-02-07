# Admin Portal Integration Guide

## Overview

This document describes the integration of the Admin Portal into the Maersk Remote Work Portal application using **Option 2: Separate Frontend, Shared Backend**.

### Architecture

```
Frontend (Employee)          Frontend (Admin)             Backend (Shared)
localhost:3000              localhost:3001               localhost:8000

  Employee UI    <──────────────────────────────────────> Django REST API
                                                          - /api/requests/
                                                          - /api/users/
                                                          - /api/ai/
                                                          - /api/compliance/

  Admin UI       <──────────────────────────────────────> Django REST API
                                                          - /api/admin/dashboard/
                                                          - /api/admin/requests/
                                                          - /api/admin/users/
```

---

## Backend Changes

### 1. **User Model Enhancement** ✅

**File**: `Backend/apps/users/models.py`

Added `is_admin` field to the User model:
```python
is_admin = models.BooleanField(
    default=False,
    help_text="Whether the user has access to the admin portal",
)
```

**Migration**: `Backend/apps/users/migrations/0003_user_is_admin.py`

### 2. **Permission Classes** ✅

**File**: `Backend/common/permissions.py`

Added two new permission classes:
- `IsAdminUser` - Restricts access to users with `is_admin=True`
- `IsAdminOrOwner` - Allows admins full access and users access to their own data

### 3. **Admin API App** ✅

**Location**: `Backend/apps/admin/`

New Django app with three ViewSets:

#### **AdminDashboardViewSet**
- `GET /api/admin/dashboard/` - Returns analytics KPIs
  - `total_requests`, `approved_requests`, `rejected_requests`, `escalated_requests`
  - `total_users`, `approval_rate`

#### **AdminRequestViewSet** (Read-Only)
- `GET /api/admin/requests/` - List all requests (paginated)
  - Supports filtering by: `status`, `country`, `start_date`, `end_date`
  - Supports searching by: `user__email`, `destination_country`, `home_country`
  - Supports ordering by: `created_at`, `status`, `start_date`
- `GET /api/admin/requests/{id}/` - Request details

#### **AdminUserViewSet** (Read-Only)
- `GET /api/admin/users/` - List all users (paginated)
  - Supports searching by: `email`, `first_name`, `last_name`
  - Supports ordering by: `created_at`, `email`, `days_remaining`
- `GET /api/admin/users/{id}/` - User details

### 4. **Django Settings** ✅

**File**: `Backend/config/settings/base.py`
- Added `apps.admin` to `INSTALLED_APPS`

**File**: `Backend/config/urls.py`
- Added `path("api/admin/", include("apps.admin.urls"))`

### 5. **CORS Configuration** ✅

**File**: `Backend/config/settings/local.py`

Development mode allows both frontends:
- `http://localhost:3000` (Employee frontend)
- `http://localhost:3001` (Admin frontend)

```python
CORS_ALLOW_ALL_ORIGINS = True  # For development only
```

For production, update `Backend/config/settings/production.py` with specific allowed origins via environment variables.

---

## Frontend Changes

### Admin Frontend Structure

**Location**: `Admin_frontend/admin-app/src/`

#### **Core Files**
- `App.tsx` - Main application component with routing
- `types.ts` - TypeScript type definitions
- `index.tsx` - React entry point

#### **Components** (`components/`)
- `Login.tsx` - OTP authentication component
- `Header.tsx` - Navigation header
- `Dashboard.tsx` - Main dashboard with KPIs and request table

#### **Services** (`services/`)
- `api.ts` - API client with:
  - Auth functions: `login()`, `verifyOTP()`, `logout()`
  - Admin endpoints: `getAdminDashboard()`, `getAdminRequests()`, `getAdminUsers()`
  - Token management with localStorage

#### **Styles** (`styles/`)
- `App.css` - Global styles
- `Header.css` - Header component styles
- `Login.css` - Login component styles
- `Dashboard.css` - Dashboard component styles

### Vite Configuration

**File**: `Admin_frontend/admin-app/vite.config.ts`

Configured to run on port 3001:
```typescript
server: {
  port: 3001,
  host: 'localhost',
}
```

---

## Running the Application

### Terminal 1: Backend
```bash
cd Backend
source venv/bin/activate
python3 manage.py migrate          # Apply database migrations
python3 manage.py runserver        # Runs on http://localhost:8000
```

### Terminal 2: Employee Frontend
```bash
cd Frontend
npm install                         # If needed
npm run dev                         # Runs on http://localhost:3000
```

### Terminal 3: Admin Frontend
```bash
cd Admin_frontend/admin-app
npm install                         # If needed
npm run dev                         # Runs on http://localhost:3001
```

---

## Authentication Flow

### Admin Login
1. Admin enters email at `localhost:3001`
2. Backend sends OTP to email (MVP: mock, shows in console)
3. Admin enters 6-digit OTP
4. Backend verifies OTP and checks `user.is_admin == True`
5. If not admin: returns "Access denied: Admin privileges required"
6. If admin: returns JWT tokens and user object
7. Frontend stores tokens in localStorage
8. Admin can now access `/api/admin/` endpoints

### Logout
- Clears localStorage tokens
- Redirects to login

---

## Making Users Admin

### Via Django Admin
```bash
cd Backend
python3 manage.py shell
>>> from apps.users.models import User
>>> user = User.objects.get(email="user@maersk.com")
>>> user.is_admin = True
>>> user.save()
```

### Via Direct Database SQL
```sql
UPDATE apps_users_user SET is_admin = TRUE WHERE email = 'user@maersk.com';
```

---

## API Documentation

All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Public Endpoints (No Auth Required)
- `POST /api/auth/login/` - Send OTP
- `POST /api/auth/verify/` - Verify OTP

### Admin Endpoints (Requires `is_admin=True`)
- `GET /api/admin/dashboard/` - Analytics summary
- `GET /api/admin/requests/` - All requests with filters
- `GET /api/admin/requests/{id}/` - Request details
- `GET /api/admin/users/` - All users
- `GET /api/admin/users/{id}/` - User details

### Interactive API Documentation
Visit `http://localhost:8000/api/docs/` (Swagger UI) after backend starts

---

## Next Steps

### Phase 2 Features
Once rapid integration is complete, add:

1. **Advanced Analytics**
   - Sentiment analysis from chatbot interactions
   - Word cloud / frequency analysis

2. **Policy Management**
   - Version-controlled policy editor
   - Policy linkage to request assessments

3. **Geographic Visualization**
   - Interactive map showing migration flows
   - Country-level request heatmap

4. **Export & Reporting**
   - Excel export with filtered datasets
   - PDF reports by date range

5. **Real-time Updates**
   - WebSocket integration for live request updates
   - Notification system for escalated cases

---

## Troubleshooting

### Admin Frontend Shows "Access Denied"
- Verify user has `is_admin=True` in database
- Check browser console for error messages
- Confirm backend is running on port 8000

### CORS Errors
- Verify `CORS_ALLOW_ALL_ORIGINS = True` in `Backend/config/settings/local.py`
- Check that frontend URL matches CORS configuration
- Admin frontend should be on `localhost:3001`

### OTP Not Arriving in Email
- MVP uses mock authentication (check Django console or logs)
- In production, integrate Twilio or AWS SES

### Requests Not Loading
- Check backend is running and migrations are applied
- Verify user is logged in and token is valid
- Check browser Network tab for 401/403 errors

---

## Security Notes

### Development (Local)
- CORS allows all origins (fine for development)
- OTP codes are printed to console (not real email)
- JWT secret is default (change in production)

### Production
1. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
2. Configure specific CORS origins via environment variables
3. Integrate real OTP delivery (Twilio, AWS SNS, SendGrid)
4. Use strong `DJANGO_SECRET_KEY` from environment
5. Enable HTTPS/SSL
6. Use PostgreSQL instead of SQLite
7. Set secure cookie flags: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`

---

## File Checklist

### Backend
- ✅ `Backend/apps/users/models.py` - `is_admin` field added
- ✅ `Backend/apps/users/migrations/0003_user_is_admin.py` - Migration created
- ✅ `Backend/common/permissions.py` - Permission classes added
- ✅ `Backend/apps/admin/` - New admin app created
  - ✅ `__init__.py`
  - ✅ `apps.py`
  - ✅ `serializers.py`
  - ✅ `views.py`
  - ✅ `urls.py`
- ✅ `Backend/config/settings/base.py` - `apps.admin` registered
- ✅ `Backend/config/urls.py` - `/api/admin/` route added
- ✅ `Backend/config/settings/local.py` - CORS configured

### Frontend (Admin)
- ✅ `Admin_frontend/admin-app/src/App.tsx` - Main app component
- ✅ `Admin_frontend/admin-app/src/types.ts` - Type definitions
- ✅ `Admin_frontend/admin-app/src/services/api.ts` - API client
- ✅ `Admin_frontend/admin-app/src/components/Login.tsx` - Login form
- ✅ `Admin_frontend/admin-app/src/components/Header.tsx` - Navigation header
- ✅ `Admin_frontend/admin-app/src/components/Dashboard.tsx` - Main dashboard
- ✅ `Admin_frontend/admin-app/src/styles/App.css`
- ✅ `Admin_frontend/admin-app/src/styles/Header.css`
- ✅ `Admin_frontend/admin-app/src/styles/Login.css`
- ✅ `Admin_frontend/admin-app/src/styles/Dashboard.css`
- ✅ `Admin_frontend/admin-app/vite.config.ts` - Port 3001 configured

---

## Questions & Support

For implementation questions, refer to:
- `Backend/CLAUDE.md` - Backend architecture
- `Admin_frontend/README.md` - Admin portal features
- Project CLAUDE.md files in subdirectories

Last Updated: 7 February 2026
