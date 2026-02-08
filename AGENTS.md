# AGENTS.md - Maersk Remote Work Portal

Instructions for AI coding agents working in this repository.

## Project Overview

A full-stack remote work compliance portal for Maersk employees. The system evaluates cross-border remote work requests against tax, immigration, and corporate policies.

**Tech Stack:**
- Backend: Django 4.2 LTS + Django REST Framework + PostgreSQL
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS (CDN)
- AI: Google Gemini API (both frontend and backend integrations)
- Auth: JWT (djangorestframework-simplejwt)

---

## AI Model Strategy (February 2026 Decision)

**Primary Model**: `gemini-3-flash-preview`
**Rationale**: 
- **Performance**: 3x faster than Gemini 2.5 Pro with superior reasoning (90.4% on GPQA Diamond).
- **Longevity**: Replaces the deprecated Gemini 2.0 Flash (shutting down March 31, 2026).
- **Efficiency**: 30% more token efficient for complex policy analysis and extraction tasks.
- **Context**: 1M+ token window allows processing of full policy documents without chunking.

**Important**: Do not revert to 2.0 or 2.5 without explicit architectural review. All extraction and chat services are optimized for Gemini 3's reasoning modulation.

---

## Build & Development Commands

### Backend (Django)

```bash
cd Backend
source venv/bin/activate

# Development server
python3 manage.py runserver 8000

# Run all tests
python3 manage.py test

# Run single app tests
python3 manage.py test apps.compliance
python3 manage.py test apps.users

# Run single test class
python3 manage.py test apps.compliance.tests.ComplianceRulesTest

# Run single test method
python3 manage.py test apps.compliance.tests.ComplianceRulesTest.test_duration_rule

# Database migrations
python3 manage.py makemigrations
python3 manage.py migrate

# Create superuser
python3 manage.py createsuperuser
```

### Frontend (React/Vite)

```bash
cd Frontend
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Code Formatting

```bash
# Backend (Python) - install first: pip install black isort flake8
cd Backend
black .
isort .
flake8

# Frontend - no linting configured (manual review)
```

---

## Project Structure

```
Maersk2/
├── Backend/                      # Django REST API
│   ├── apps/
│   │   ├── users/               # Authentication & user profiles
│   │   ├── requests/            # Remote work request CRUD
│   │   ├── compliance/          # Rules engine (rules.py)
│   │   └── ai/                  # Gemini chat integration
│   ├── common/                  # Shared utils & permissions
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Core settings
│   │   │   ├── local.py         # Local development
│   │   │   └── production.py    # Production
│   │   └── urls.py              # API routing
│   └── manage.py
├── Frontend/                     # React + Vite SPA
│   ├── components/              # React components
│   ├── services/
│   │   ├── api.ts               # Django API client
│   │   └── geminiService.ts     # Gemini AI client
│   ├── types.ts                 # TypeScript types
│   ├── App.tsx                  # Main app component
│   └── index.tsx                # Entry point
└── Input_Data/                  # Policy PDF documents
```

---

## Code Style Guidelines

### Python (Backend)

**Formatting:**
- Use `black` for auto-formatting (line length 88)
- Use `isort` for import sorting
- Use `flake8` for linting

**Imports (order):**
```python
# 1. Standard library
import os
from datetime import timedelta
from typing import Optional

# 2. Third-party
from django.conf import settings
from rest_framework import serializers

# 3. Local
from apps.compliance.rules import COMPLIANCE_RULES
from common.utils import calculate_duration
```

**Naming:**
- `snake_case` for functions, variables, module names
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Prefix private methods with underscore: `_validate_request`

**Docstrings:**
```python
def evaluate_compliance(request_data: dict) -> ComplianceRule:
    """
    Evaluate a remote work request against compliance rules.
    
    Args:
        request_data: Dictionary containing request details.
    
    Returns:
        ComplianceRule dataclass with evaluation result.
    """
```

**Type Hints:**
- Always use type hints for function parameters and returns
- Use `dataclasses` for structured data (see `apps/compliance/rules.py`)

**Error Handling:**
```python
# Use DRF's built-in exceptions
from rest_framework.exceptions import ValidationError, PermissionDenied

if not user.has_permission:
    raise PermissionDenied("User cannot access this resource.")
```

**Language:**
- Use British English spelling (organisation, authorised, colour)
- Settings use `LANGUAGE_CODE = "en-gb"`

---

### TypeScript/React (Frontend)

**Component Structure:**
```typescript
import React, { useState, useEffect } from 'react';
import { SomeType } from './types';

interface ComponentProps {
  user: User;
  onSubmit: (data: FormData) => void;
}

const Component: React.FC<ComponentProps> = ({ user, onSubmit }) => {
  const [state, setState] = useState<string>('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(e.target.value);
  };
  
  return <div>...</div>;
};

export { Component };  // Named export preferred
export default App;    // Default only for App.tsx
```

**Naming:**
- `PascalCase` for components and interfaces
- `camelCase` for functions, variables, props
- `handle*` prefix for event handlers: `handleSubmit`, `handleChange`
- `on*` prefix for callback props: `onLogin`, `onSubmit`

**Types:**
- Define interfaces in `types.ts` or co-located with components
- Use explicit type annotations for useState: `useState<User | null>(null)`
- Use enums for state machines (see `ViewState` in `types.ts`)

**Imports:**
```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { Dialog } from '@headlessui/react';

// 3. Local components
import { Header } from './components/Header';

// 4. Local services/utils
import { login, verifyOTP } from './services/api';

// 5. Types
import { ViewState, User } from './types';
```

**Styling:**
- Use Tailwind CSS utility classes (loaded via CDN)
- Keep inline styles minimal
- Brand colour: `#42b0d5` (Maersk teal)

---

## API Patterns

**Backend endpoints follow REST conventions:**
- `GET /api/requests/` - List
- `POST /api/requests/` - Create
- `GET /api/requests/{id}/` - Retrieve
- `PATCH /api/requests/{id}/` - Partial update
- `DELETE /api/requests/{id}/` - Delete

**Frontend API calls use `fetchWithAuth` helper:**
```typescript
// See Frontend/services/api.ts for pattern
const response = await fetchWithAuth('/requests/', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

---

## Environment Variables

**Backend (.env):**
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_SETTINGS_MODULE=config.settings.local
GEMINI_API_KEY=your-gemini-key
DB_NAME=maersk_remote_work
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Frontend (.env.local):**
```
GEMINI_API_KEY=your-gemini-key
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Compliance rules engine | `Backend/apps/compliance/rules.py` |
| API client | `Frontend/services/api.ts` |
| Main app component | `Frontend/App.tsx` |
| TypeScript types | `Frontend/types.ts` |
| Django settings | `Backend/config/settings/base.py` |
| API routes | `Backend/config/urls.py` |

---

## Testing Guidelines

- Backend uses Django's test framework
- No frontend tests configured
- Run tests before pushing changes
- Add tests for new compliance rules in `apps/compliance/tests.py`

---

## Common Gotchas

1. **API URL**: Frontend connects to `http://localhost:8741/api` (not 8000)
2. **Virtual env**: Always activate with `source venv/bin/activate`
3. **Tailwind**: Loaded via CDN, not npm - check `index.html`
4. **Auth**: MVP mode accepts any 6-digit OTP code
5. **TypeScript**: Strict mode not enabled (`allowJs: true`)
