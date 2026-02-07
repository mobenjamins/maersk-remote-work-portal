# Maersk Remote Work Portal - Code Review & Improvement Recommendations

## Executive Summary

The application is well-structured with clear separation of concerns (Django backend + React frontend). The compliance rules engine is thoughtfully designed. However, there are several opportunities to improve **security**, **data consistency**, **frontend reliability**, and **production readiness**.

---

## 🔴 CRITICAL Issues

### 1. **Frontend API Base URL Hardcoded to Wrong Port**
**File**: `Frontend/services/api.ts:5`

```typescript
const API_BASE_URL = 'http://localhost:8741/api';  // ❌ Wrong port (should be 8000)
```

**Impact**: Frontend cannot communicate with backend in development.

**Fix**:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
```

Also update `.env.local`:
```
VITE_API_URL=http://localhost:8000/api
```

---

### 2. **Database Inconsistency with Workday Calculations**
**File**: `Backend/apps/requests/models.py:11-25`

The `calculate_workdays()` function excludes weekends but the frontend and compliance rules may not be aligned. This could lead to duration mismatches.

**Problem**:
- If user submits Mon-Fri (5 workdays) but `duration_days` is stored as 7 calendar days in compliance assessment, approval decisions may be wrong
- The `days_used` calculation uses `duration_days` but doesn't validate it matches workdays

**Fix**: Standardise across the app:
```python
# In models.py - add a method on RemoteWorkRequest
@property
def workdays_count(self):
    """Always use this method for compliance checks."""
    if self.start_date and self.end_date:
        return calculate_workdays(self.start_date, self.end_date)
    return self.duration_days

# In compliance assessment, always use workdays
def assess(self, request: RemoteWorkRequest, **kwargs):
    workdays = request.workdays_count  # Not duration_days
    # ... rest of assessment
```

---

### 3. **OTP Not Actually Validated (Security Risk)**
**File**: `Backend/apps/users/views.py:110-127`

The verify OTP endpoint **always accepts any 6-digit code**, even non-existent ones. This bypasses authentication entirely in "MVP" mode but the code persists to production.

**Problem**:
```python
# MVP: Accept any 6-digit code
# In production, validate against OTPCode model:
# otp = OTPCode.objects.filter(email=email, code=code, is_used=False).first()
# if not otp or not otp.is_valid:
#     return Response({'error': 'Invalid or expired code'}, status=400)
```

This **commented-out production code** is a huge red flag. It means someone might forget to uncomment it.

**Fix**: Use environment variables to toggle real vs. mock auth:
```python
if settings.DEBUG or settings.MOCK_AUTH_ENABLED:  # Only in development
    logger.warning("MOCK AUTH ENABLED - NOT FOR PRODUCTION!")
else:
    # Real OTP validation
    otp = OTPCode.objects.filter(email=email, code=code, is_used=False).first()
    if not otp or not otp.is_valid:
        return Response({'error': 'Invalid or expired OTP'}, status=400)
    otp.is_used = True
    otp.save()
```

Add to `.env`:
```
MOCK_AUTH_ENABLED=True  # Set to False in production
```

---

### 4. **Missing API Request Validation & Injection Risks**
**Files**: `Backend/apps/requests/serializers.py`, `Backend/apps/compliance/services.py`

The compliance assessment passes raw user input (`destination_country`, `home_country`) directly to rules without sanitisation:

```python
# In compliance/services.py
assessment = compliance_service.assess(
    destination_country=instance.destination_country,  # ❌ No validation
    home_country=instance.home_country,                # ❌ No validation
)
```

**Problem**:
- SQL injection via country names
- Logic errors if special characters in country names
- Blocked countries check uses string matching (case-sensitive)

**Fix**: Add validators to serializers:
```python
# In apps/requests/serializers.py
from django.core.validators import RegexValidator

country_validator = RegexValidator(
    r'^[a-zA-Z\s\-\']{2,100}$',
    'Country name must only contain letters, spaces, hyphens, and apostrophes'
)

class CreateRemoteWorkRequestSerializer(serializers.Serializer):
    destination_country = serializers.CharField(
        max_length=100,
        validators=[country_validator]
    )
    home_country = serializers.CharField(
        max_length=100,
        validators=[country_validator]
    )
```

---

### 5. **Frontend Token Refresh Not Implemented**
**File**: `Frontend/services/api.ts`

Tokens expire (8 hours for access, 7 days for refresh) but there's no automatic refresh mechanism.

**Impact**:
- Users get logged out after 8 hours without warning
- Stale state where UI thinks they're logged in but API rejects requests

**Fix**: Implement token refresh:
```typescript
// In api.ts
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access;
      localStorage.setItem('accessToken', data.access);
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  return false;
}

// In fetchWithAuth, check token expiry before request
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Check if token is expiring soon
  if (isTokenExpiringSoon(accessToken)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Force logout
      await logout();
      throw new Error('Session expired');
    }
  }
  // ... rest of fetch
}
```

---

## 🟠 HIGH Priority Issues

### 6. **Race Condition in Reference Number Generation**
**File**: `Backend/apps/requests/models.py:146-157`

```python
def save(self, *args, **kwargs):
    if not self.reference_number:
        count = RemoteWorkRequest.objects.filter(created_at__year=year).count() + 1
        self.reference_number = f"SIRW-{year}-{count:04d}"
```

**Problem**: Two concurrent requests could get the same reference number.

**Fix**: Use database-level unique constraint and atomic operation:
```python
from django.db import transaction

def save(self, *args, **kwargs):
    if not self.reference_number:
        with transaction.atomic():
            year = timezone.now().year
            last_request = RemoteWorkRequest.objects.filter(
                created_at__year=year
            ).order_by('-reference_number').first()

            if last_request and last_request.reference_number:
                # Extract count from SIRW-2025-0042
                last_count = int(last_request.reference_number.split('-')[-1])
                count = last_count + 1
            else:
                count = 1

            self.reference_number = f"SIRW-{year}-{count:04d}"

    super().save(*args, **kwargs)
```

Or better, use `django-extensions`:
```python
from django_extensions.db.fields import AutoSlugField
```

---

### 7. **No Error Handling for Gemini API Failures**
**File**: `Backend/apps/ai/views.py` and `Backend/apps/ai/gemini_service.py`

If Gemini API is down or returns an error, the chat endpoint returns 500 with no recovery.

**Fix**:
```python
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request):
    try:
        gemini = get_gemini_service()
        response = gemini.send_message(...)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return Response(
            {
                "error": "AI service temporarily unavailable. Please try again later.",
                "fallback_response": "I'm temporarily unavailable. Please try your request again."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

---

### 8. **Compliance Rules Pass Extra Kwargs Silently**
**File**: `Backend/apps/compliance/rules.py`

Each rule has `**kwargs` but doesn't validate expected parameters. Missing data is silently ignored.

```python
def evaluate(self, **kwargs) -> ComplianceRule:  # ❌ Too permissive
```

**Fix**: Make parameters explicit:
```python
def evaluate(
    self,
    destination_country: str,
    has_right_to_work: bool,
    duration_days: int,
    home_country: str,
    is_sales_role: bool,
    ineligible_role_categories: list = None,
) -> ComplianceRule:
    # Now type checking catches missing params
```

---

### 9. **No Request Audit Trail**
**File**: All of `Backend/apps/requests/`

There's no history of who approved/rejected requests or when decisions changed. Compliance audits will be impossible.

**Fix**: Add audit logging:
```python
# In models.py
class RequestAuditLog(models.Model):
    request = models.ForeignKey(RemoteWorkRequest, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)  # 'created', 'approved', 'rejected'
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

# In views.py
def update_request_status(request, request_id, new_status):
    req = RemoteWorkRequest.objects.get(id=request_id)
    old_status = req.status
    req.status = new_status
    req.save()

    RequestAuditLog.objects.create(
        request=req,
        action=f'status_changed_to_{new_status}',
        old_status=old_status,
        new_status=new_status,
        changed_by=request.user,
        reason=request.data.get('reason', '')
    )
```

---

### 10. **Frontend Missing Error Boundaries**
**File**: `Frontend/components/`

React components don't have error boundaries. A single component error crashes the entire app.

**Fix**: Add error boundary wrapper:
```typescript
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-600 mt-2">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// In App.tsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

---

## 🟡 MEDIUM Priority Issues

### 11. **Workday Calculation Not Accounting for Holidays**
**File**: `Backend/apps/requests/models.py:11-25`

The function counts Mon-Fri but ignores company holidays. A request spanning Christmas might show 10 workdays but employee only works 8.

**Fix**: Integrate holiday calendar:
```python
from datetime import datetime, timedelta
from apps.compliance.models import Holiday  # New model

def calculate_workdays(start_date, end_date, exclude_holidays=True):
    workdays = 0
    current = start_date

    holidays = set()
    if exclude_holidays:
        holidays = set(
            Holiday.objects.filter(
                date__gte=start_date,
                date__lte=end_date
            ).values_list('date', flat=True)
        )

    while current <= end_date:
        if current.weekday() < 5 and current not in holidays:
            workdays += 1
        current += timedelta(days=1)

    return workdays
```

---

### 12. **No Pagination in Requests List (Performance)**
**File**: `Backend/apps/requests/views.py:59-61`

The `list()` endpoint returns all requests without pagination. Users with 1000+ requests get slow response.

**Fix**:
```python
# In settings/base.py - already configured
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ViewSet already inherits pagination, but ensure list() returns paginated response
def list(self, request, *args, **kwargs):
    queryset = self.filter_queryset(self.get_queryset())
    page = self.paginate_queryset(queryset)
    if page is not None:
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)
```

---

### 13. **CORS Configuration Too Permissive in Debug**
**File**: `Backend/config/settings/local.py` (not shown)

If CORS allows all origins in development, it's easy to accidentally deploy with `*`.

**Fix**: Be explicit:
```python
# In settings/base.py
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173'  # Default to safe dev URLs
).split(',')

if not DEBUG and '*' in CORS_ALLOWED_ORIGINS:
    raise ValueError("CORS cannot allow all origins (*) in production!")
```

---

### 14. **User Profile Fields Not Validated**
**File**: `Backend/apps/users/serializers.py`

Fields like `phone`, `maersk_entity` accept anything without validation.

**Fix**:
```python
from django.core.validators import RegexValidator, MinLengthValidator

phone_validator = RegexValidator(
    r'^\+?1?\d{9,15}$',
    'Enter a valid phone number with 9-15 digits'
)

class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(
        validators=[phone_validator],
        required=False
    )
    maersk_entity = serializers.CharField(
        max_length=100,
        validators=[MinLengthValidator(2)]
    )
```

---

### 15. **No Logging of Compliance Decisions**
**File**: `Backend/apps/compliance/services.py`

When a request is approved/rejected, there's no audit log for compliance teams.

**Fix**: Log all decisions:
```python
def assess(self, **kwargs):
    logger.info(f"Compliance assessment started for user {kwargs.get('user_id')}")

    results = []
    for rule in COMPLIANCE_RULES:
        result = rule.evaluate(**kwargs)
        results.append(result)
        logger.debug(f"Rule '{rule.name}': {result.passed} - {result.reason}")

    outcome = 'approved' if all(r.passed for r in results) else 'rejected'
    logger.info(f"Compliance outcome: {outcome}")

    return {
        'outcome': outcome,
        'reason': ' | '.join(r.reason for r in results if not r.passed),
        'rules': results
    }
```

---

## 🔵 LOW Priority Issues (Code Quality)

### 16. **Circular Imports Risk**
**File**: `Backend/apps/users/models.py:68-77`

```python
@property
def days_used(self):
    from apps.requests.models import RemoteWorkRequest  # ❌ Circular import
```

This works but is fragile. If someone reorganises imports, it breaks.

**Fix**: Move to a utility function:
```python
# In common/queries.py
def get_user_days_used(user):
    from apps.requests.models import RemoteWorkRequest
    result = user.remote_work_requests.filter(
        status__in=['approved', 'completed']
    ).aggregate(total=Sum('duration_days'))
    return result['total'] or 0

# In users/models.py
@property
def days_used(self):
    from common.queries import get_user_days_used
    return get_user_days_used(self)
```

---

### 17. **Too Much Logic in save() Methods**
**File**: `Backend/apps/requests/models.py:146-159`

The `save()` method calculates duration and generates reference numbers. This should be in a manager or signal.

**Fix**:
```python
# In models.py
class RemoteWorkRequestManager(models.Manager):
    def create_request(self, **kwargs):
        if kwargs.get('start_date') and kwargs.get('end_date'):
            kwargs['duration_days'] = calculate_workdays(
                kwargs['start_date'],
                kwargs['end_date']
            )

        instance = self.model(**kwargs)
        # Generate reference number
        year = timezone.now().year
        count = self.filter(created_at__year=year).count() + 1
        instance.reference_number = f"SIRW-{year}-{count:04d}"
        instance.save()
        return instance

class RemoteWorkRequest(models.Model):
    objects = RemoteWorkRequestManager()

    def save(self, *args, **kwargs):  # Keep minimal
        super().save(*args, **kwargs)

# Usage
RemoteWorkRequest.objects.create_request(
    user=user,
    start_date=...,
    end_date=...
)
```

---

### 18. **Missing Model Validation**
**File**: `Backend/apps/requests/models.py`

No validation that `end_date > start_date`, `days_allowed > 0`, etc.

**Fix**:
```python
from django.core.exceptions import ValidationError

class RemoteWorkRequest(models.Model):
    def clean(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError(
                    {'end_date': 'End date must be after start date'}
                )

            if (self.end_date - self.start_date).days > 365:
                raise ValidationError(
                    'Request cannot span more than 1 year'
                )

class User(models.Model):
    def clean(self):
        if self.days_allowed < 0:
            raise ValidationError('Days allowed cannot be negative')

# In serializers
def create(self, validated_data):
    instance = self.Meta.model(**validated_data)
    instance.full_clean()
    instance.save()
    return instance
```

---

### 19. **Frontend: No Loading States**
**File**: `Frontend/components/Questionnaire.tsx`, `Frontend/components/ChatInterface.tsx`

Buttons don't disable during API calls. Users can double-submit requests.

**Fix**:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (formData: any) => {
  setIsSubmitting(true);
  try {
    await api.post('/api/requests/', formData);
    // Success
  } finally {
    setIsSubmitting(false);
  }
};

<button
  onClick={handleSubmit}
  disabled={isSubmitting}
  className={isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
>
  {isSubmitting ? 'Submitting...' : 'Submit Request'}
</button>
```

---

### 20. **No Environment Validation**
**File**: `Backend/config/settings/base.py`

If critical env vars are missing, the app silently fails with cryptic errors.

**Fix**:
```python
import sys

REQUIRED_ENV_VARS = ['DJANGO_SECRET_KEY']

for var in REQUIRED_ENV_VARS:
    if not os.environ.get(var):
        print(f"ERROR: Required environment variable '{var}' not set")
        sys.exit(1)

if settings.DEBUG:
    print("WARNING: Running in DEBUG mode. Set DEBUG=False in production.")
```

---

## 📋 Summary of Fixes by Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 Critical | Wrong API port (8741 vs 8000) | 5 min | Breaks all development |
| 🔴 Critical | Workday calculation inconsistency | 30 min | Wrong approvals |
| 🔴 Critical | OTP validation skipped in production path | 20 min | Security breach |
| 🔴 Critical | No input validation | 45 min | Injection vulnerabilities |
| 🔴 Critical | Token refresh not implemented | 1 hour | Users logged out after 8 hours |
| 🟠 High | Reference number race condition | 30 min | Duplicate reference IDs |
| 🟠 High | Gemini API error handling missing | 20 min | 500 errors with no recovery |
| 🟠 High | Compliance rules too permissive | 30 min | Logic errors hard to catch |
| 🟠 High | No audit trail for decisions | 1 hour | Compliance risk |
| 🟠 High | No error boundaries in React | 30 min | App crashes on error |
| 🟡 Medium | Holiday calendar not integrated | 1 hour | Workday count wrong |
| 🟡 Medium | No pagination | 15 min | Slow API for large datasets |
| 🟡 Medium | Circular imports risk | 30 min | Maintenance burden |
| 🟡 Medium | Logic in save() methods | 45 min | Hard to test |
| 🟡 Medium | No model validation | 1 hour | Invalid data in DB |

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (Today)
1. Fix API base URL (8741 → 8000)
2. Toggle OTP validation with env var
3. Add input validators to serializers
4. Implement token refresh in frontend

### Phase 2: Security & Data Integrity (This Week)
5. Fix reference number race condition
6. Add error handling for Gemini API
7. Improve compliance rules validation
8. Add audit logging

### Phase 3: Quality & UX (Next Week)
9. Add React error boundaries
10. Add loading states to forms
11. Improve model validation
12. Refactor save() logic

### Phase 4: Scaling & Operations (Before Production)
13. Implement pagination
14. Add holiday calendar integration
15. Tighten CORS configuration
16. Add environment validation

---

## Testing Recommendations

```bash
# Add pytest to requirements
pip install pytest pytest-django pytest-cov

# Backend tests
pytest Backend/

# Frontend tests (if React Testing Library added)
npm run test

# Load testing (find bottlenecks before production)
pip install locust
```

---

## Deployment Checklist

- [ ] All .env secrets are managed (not in git)
- [ ] MOCK_AUTH_ENABLED=False in production
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured for production domain
- [ ] CORS limited to frontend domain only
- [ ] Database is PostgreSQL (not SQLite)
- [ ] Secrets Manager or equivalent configured
- [ ] Logging sent to CloudWatch/Datadog (not stdout)
- [ ] Rate limiting enabled on auth endpoints
- [ ] HTTPS/SSL certificate configured
- [ ] Database backups scheduled
- [ ] Error tracking (Sentry) integrated

