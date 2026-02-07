# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maersk Remote Work Portal is a full-stack application for managing remote work compliance and requests for Maersk employees. It evaluates work-from-anywhere requests against compliance rules and provides AI-powered chat assistance.

**Key Features:**
- OTP-based authentication (MVP: simplified for demo)
- Remote work request submission and tracking
- Compliance assessment engine (right to work, sales role restrictions, duration limits)
- AI chat assistant (Google Gemini integration)
- Dashboard with request history and days remaining

---

## Technology Stack

### Backend
- **Framework**: Django 5.x + Django REST Framework
- **Database**: PostgreSQL (with SQLite fallback for development)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Documentation**: drf-spectacular (Swagger/ReDoc)
- **AI**: Google Generative AI (Gemini)
- **Python**: 3.9+

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: Headless UI
- **Node**: Uses system default

### Shared
- **API**: RESTful JSON over HTTP
- **CORS**: Enabled between localhost:3000 (frontend) and localhost:8000 (backend)

---

## Project Structure

```
Maersk2/
├── Backend/                          # Django REST API
│   ├── manage.py                     # Django CLI
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example / .env           # Environment configuration
│   ├── db.sqlite3                    # Development database (SQLite)
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py              # Shared settings
│   │   │   ├── local.py             # Development overrides
│   │   │   └── production.py        # Production settings
│   │   ├── urls.py                  # Root URL routing
│   │   └── wsgi.py                  # WSGI application
│   ├── apps/                         # Django applications
│   │   ├── users/                   # Authentication, user profiles
│   │   ├── requests/                # Remote work request models & views
│   │   ├── compliance/              # Compliance rules engine
│   │   └── ai/                      # Gemini AI chat integration
│   ├── common/
│   │   ├── permissions.py           # Custom DRF permission classes
│   │   └── utils.py                 # Shared utility functions
│   └── media/                        # Uploaded files (approvals)
│
├── Frontend/                         # React + Vite app
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite build config
│   ├── .env.local                   # GEMINI_API_KEY
│   ├── index.tsx                    # React entry point
│   ├── App.tsx                      # Main app component & routing
│   ├── types.ts                     # TypeScript type definitions
│   ├── components/
│   │   ├── Login.tsx                # OTP login UI
│   │   ├── Dashboard.tsx            # Main dashboard (requests, days remaining)
│   │   ├── Questionnaire.tsx        # Remote work request form
│   │   ├── ChatInterface.tsx        # AI chat UI
│   │   ├── Header.tsx               # Top navigation
│   │   ├── CountryAutocomplete.tsx  # Country selection dropdown
│   │   └── Tooltip.tsx              # Tooltip component
│   └── services/
│       ├── api.ts                   # Backend API client
│       └── geminiService.ts         # Gemini AI client
│
├── Input_Data/                      # Sample data for testing
└── CLAUDE.md                        # This file
```

---

## Common Development Commands

### Backend Setup
```bash
cd Backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DJANGO_SECRET_KEY, GEMINI_API_KEY, database credentials
```

### Backend Development
```bash
# Activate virtual environment (if not already active)
source Backend/venv/bin/activate

# Run migrations
python3 Backend/manage.py migrate

# Create superuser (Django admin)
python3 Backend/manage.py createsuperuser

# Start development server (port 8000)
python3 Backend/manage.py runserver

# Run tests
python3 Backend/manage.py test

# Create migrations after model changes
python3 Backend/manage.py makemigrations
python3 Backend/manage.py migrate

# Code style checks (if installed)
black Backend/
isort Backend/
```

### Frontend Development
```bash
cd Frontend

# Install dependencies
npm install

# Start development server (port 3000 via Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running Both Services
For full-stack development, run in separate terminal tabs:
```bash
# Terminal 1: Backend
cd Backend && source venv/bin/activate && python3 manage.py runserver

# Terminal 2: Frontend
cd Frontend && npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs/ (Swagger)
- **Django Admin**: http://localhost:8000/admin/

---

## API Architecture

### Authentication Flow (MVP)
1. POST `/api/auth/login/` with `email` (any `@maersk.com` email) → OTP sent
2. POST `/api/auth/verify/` with `email`, `otp_code` (any 6 digits) → JWT tokens returned
3. All subsequent requests use `Authorization: Bearer {access_token}` header

**Note**: MVP uses mock authentication for rapid development. For production, integrate real OTP delivery and verification.

### Core API Endpoints

**Users**
- `GET /api/users/me/` — Current user profile
- `GET /api/users/me/days-remaining/` — Remote work days balance

**Remote Work Requests**
- `GET /api/requests/` — List user's requests
- `POST /api/requests/` — Create new request
- `GET /api/requests/{id}/` — Request details
- `PATCH /api/requests/{id}/` — Update request
- `DELETE /api/requests/{id}/` — Cancel request
- `POST /api/requests/upload/` — Upload approval document

**Compliance**
- `POST /api/compliance/assess/` — Run compliance assessment on a request
- `GET /api/compliance/rules/` — Get compliance rules summary

**AI Chat**
- `POST /api/ai/chat/` — Send message to AI assistant
- `POST /api/ai/chat/sessions/` — Create new chat session
- `GET /api/ai/chat/sessions/{id}/` — Get chat history
- `DELETE /api/ai/chat/sessions/{id}/delete/` — Delete session

---

## Compliance Rules Engine

The compliance assessment (`apps/compliance/rules.py`) evaluates requests against:

1. **Right to Work** — Must have legal right to work in destination country
2. **Sales Role (PE Risk)** — Sales roles with contract signing authority are blocked
3. **Duration Limit** — Maximum 20 days per request
4. **Same Country Check** — Informational only (no block)

Each rule returns a status (approved/rejected/warning) and message. Rules can be extended by modifying `apps/compliance/rules.py`.

---

## Key Integration Points

### Frontend ↔ Backend Communication

**HTTP Client**: `Frontend/services/api.ts`
- Base URL configured to `http://localhost:8000`
- Handles JWT token management (localStorage)
- Automatic error handling and token refresh

**Example Integration**:
```typescript
// Services/api.ts handles all backend calls
const response = await api.post('/api/requests/', requestData);
const requests = await api.get('/api/requests/');
```

### AI Integration

**Backend**: Google Generative AI (Gemini)
- Configured in `apps/ai/views.py`
- API key from `GEMINI_API_KEY` environment variable
- Chat history stored in database for session context

**Frontend**: Google Generative AI Client Library
- Direct calls in `services/geminiService.ts`
- Used for UI chat component before backend integration

---

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_SETTINGS_MODULE=config.settings.local

DB_NAME=maersk_remote_work
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

GEMINI_API_KEY=your-gemini-api-key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

DEBUG=True
```

### Frontend (.env.local)
```
GEMINI_API_KEY=your-gemini-api-key
```

---

## Database

### Development Setup
By default, the project uses **SQLite** (`db.sqlite3`) for quick local development.

To use **PostgreSQL**:
1. Install PostgreSQL locally
2. Create database: `createdb maersk_remote_work`
3. Update `.env` with database credentials
4. Run migrations: `python3 manage.py migrate`

### Schema
Key models in each app:
- **users.User** — Custom user model (extends Django User)
- **requests.RemoteWorkRequest** — Request instances
- **compliance.ComplianceRule** — Compliance rule definitions
- **ai.ChatSession** — AI chat conversation history

---

## Important Architectural Decisions

### Authentication (MVP)
- Simplified OTP for demo purposes (no actual SMS/email sending)
- Auto-creates users on first login with any `@maersk.com` email
- Uses JWT tokens with refresh/access token pair (djangorestframework-simplejwt)

### Database Flexibility
- SQLite for development (zero setup)
- PostgreSQL ready for production (settings in `production.py`)
- Same ORM (Django) handles both

### API-First Design
- Frontend is a pure SPA consuming REST API
- API fully documented with Swagger/ReDoc (drf-spectacular)
- CORS configured for development workflow

### AI Chat
- Separate `ChatSession` model for persistence
- Google Gemini API integration (backend)
- Session context maintained across requests

---

## Testing & Linting

### Running Tests
```bash
# Backend tests
python3 Backend/manage.py test

# Run specific test module
python3 Backend/manage.py test apps.users

# Run with coverage (if coverage installed)
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Code Style
```bash
# Install dev tools
pip install black isort flake8

# Format
black Backend/
isort Backend/

# Check style
flake8 Backend/
```

---

## Debugging Tips

### Backend
- Check `Backend/server.log` for runtime errors
- Use `python3 manage.py shell` for interactive debugging
- Django admin at `http://localhost:8000/admin/` for data inspection
- API docs at `http://localhost:8000/api/docs/` for endpoint testing

### Frontend
- Browser DevTools (Console, Network tabs)
- Check `Frontend/frontend.log` if errors
- `npm run dev` provides hot reloading during development
- TypeScript catches many errors at compile time

### API Integration
- Use the Swagger UI (`/api/docs/`) to test backend endpoints directly
- Check CORS errors in browser console if frontend can't reach backend
- Verify `CORS_ALLOWED_ORIGINS` in `.env` includes frontend origin

---

## Production Deployment Considerations

- Set `DJANGO_SETTINGS_MODULE=config.settings.production`
- Generate strong `SECRET_KEY` for production
- Use PostgreSQL with secure credentials
- Enable HTTPS/SSL
- Configure allowed hosts and CORS properly
- Use gunicorn/uwsgi as WSGI server
- Set up static file serving (nginx, S3, etc.)
- Store uploaded files (approvals) in cloud storage

---

## Language & Style

- **British English**: organisation, authorise, colour (not American variants)
- **Code style**: Follow Django conventions (PEP 8), React/TypeScript best practices
- **Database**: Always migrate changes with `makemigrations` → `migrate`
- **Git commits**: Clear messages describing the change (no AI attribution)

---

## Known Limitations & Next Steps

**MVP Limitations:**
- Mock OTP authentication (needs real SMS/email in production)
- SQLite for development (must switch to PostgreSQL for production)
- Compliance rules are hardcoded (could be made configurable via admin)
- Document upload validation is basic

**Suggested Enhancements:**
- Real OTP delivery service (Twilio, AWS SNS)
- Admin panel for managing compliance rules dynamically
- Request approval workflow (manager review)
- Email notifications for request status changes
- File storage integration (S3, Azure Blob)
- User role management (manager, admin, employee)

