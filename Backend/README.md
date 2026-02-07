# Maersk Remote Work Portal - Backend

Django REST API backend for the Maersk Remote Work Compliance Portal.

## Tech Stack

- **Framework**: Django 5.x + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI Integration**: Google Gemini API
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)

## Project Structure

```
Backend/
├── manage.py                 # Django CLI
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
├── config/
│   ├── settings/
│   │   ├── base.py          # Base settings
│   │   ├── local.py         # Local development
│   │   └── production.py    # Production settings
│   ├── urls.py              # Root URL configuration
│   └── wsgi.py              # WSGI application
├── apps/
│   ├── users/               # User authentication & profiles
│   ├── requests/            # Remote work requests
│   ├── compliance/          # Compliance rules engine
│   └── ai/                  # Gemini AI integration
├── common/
│   ├── permissions.py       # Custom DRF permissions
│   └── utils.py             # Utility functions
└── media/                   # Uploaded files
```

## Quick Start

### 1. Create Virtual Environment

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Set Up PostgreSQL Database

```bash
# Create database
createdb maersk_remote_work

# Or using psql:
psql -c "CREATE DATABASE maersk_remote_work;"
```

### 5. Run Migrations

```bash
python3 manage.py migrate
```

### 6. Create Superuser (for Django Admin)

```bash
python3 manage.py createsuperuser
```

### 7. Run Development Server

```bash
python3 manage.py runserver 8000
```

The API will be available at `http://localhost:8000/`

## API Documentation

Once the server is running, access the API documentation at:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Initiate login (sends OTP) |
| POST | `/api/auth/verify/` | Verify OTP and get JWT tokens |
| POST | `/api/auth/logout/` | Logout (blacklist token) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/` | Get current user profile |
| GET | `/api/users/me/days-remaining/` | Get remote work days balance |

### Remote Work Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests/` | List user's requests |
| POST | `/api/requests/` | Create new request |
| GET | `/api/requests/{id}/` | Get request details |
| PATCH | `/api/requests/{id}/` | Update request |
| DELETE | `/api/requests/{id}/` | Cancel request |
| POST | `/api/requests/upload/` | Upload approval document |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/compliance/assess/` | Run compliance assessment |
| GET | `/api/compliance/rules/` | Get compliance rules summary |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat/` | Send message to AI assistant |
| POST | `/api/ai/chat/sessions/` | Create new chat session |
| GET | `/api/ai/chat/sessions/{id}/` | Get chat history |
| DELETE | `/api/ai/chat/sessions/{id}/delete/` | Delete chat session |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | (required) |
| `DB_NAME` | PostgreSQL database name | `maersk_remote_work` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `GEMINI_API_KEY` | Google Gemini API key | (required for AI chat) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:5173` |

## Mock Authentication (MVP)

For MVP/demo purposes, authentication is simplified:

1. Any `@maersk.com` email is accepted
2. Any 6-digit code is accepted for OTP verification
3. Users are auto-created on first login

To enable real authentication, update `apps/users/views.py` to validate OTP codes properly.

## Compliance Rules

The compliance engine evaluates requests against these rules:

1. **Right to Work** - Must have legal right to work in destination country
2. **Sales Role (PE Risk)** - Sales roles with contract signing authority are blocked
3. **Duration Limit** - Maximum 20 days per request
4. **Same Country Check** - Informational only

Rules can be extended in `apps/compliance/rules.py`.

## Django Admin

Access the admin interface at `http://localhost:8000/admin/` to:

- Manage users and their remote work allowances
- View and process remote work requests
- Review chat sessions
- Monitor OTP codes (for debugging)

## Development

### Running Tests

```bash
python3 manage.py test
```

### Code Style

```bash
# Install dev dependencies
pip install black isort flake8

# Format code
black .
isort .

# Check style
flake8
```

### Creating Migrations

```bash
python3 manage.py makemigrations
python3 manage.py migrate
```

## Production Deployment

1. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
2. Configure proper `SECRET_KEY`
3. Set up PostgreSQL with proper credentials
4. Configure allowed hosts and CORS origins
5. Use gunicorn or uwsgi as WSGI server
6. Set up static file serving (nginx, S3, etc.)
7. Enable SSL/HTTPS

## Frontend Integration

The frontend should update its API calls to use this backend:

```typescript
// Example: Login
const response = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@maersk.com' }),
});

// Example: Authenticated request
const requests = await fetch('http://localhost:8000/api/requests/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

## Licence

Proprietary - Maersk Internal Use Only
