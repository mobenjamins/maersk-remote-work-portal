# Maersk Remote Work Portal - Gemini Context

## Project Overview
**Maersk Remote Work Portal** is a full-stack web application designed to manage and evaluate cross-border remote work requests against tax, immigration, and corporate policies.

**Repository**: Monorepo containing Backend, Employee Frontend, and Admin Frontend.
**Status**: Deployment Ready (MVP).

---

## 🏗️ Architecture & Components

The project consists of three main components:

### 1. Backend (API)
*   **Path**: `/Backend`
*   **Stack**: Django 5.x, Django REST Framework (DRF), PostgreSQL.
*   **Key Features**:
    *   JWT Authentication (`simplejwt`).
    *   Google Gemini AI integration (`apps/ai`) - **Primary Model: Gemini 3 Flash**.
    *   Compliance Rules Engine (`apps/compliance`).
    *   Swagger/OpenAPI documentation (`drf-spectacular`).
*   **Deployment**: Railway (Dockerized).

### 2. Frontend (Employee App)
*   **Path**: `/Frontend`
*   **Stack**: React 19, TypeScript, Vite, Tailwind CSS.
*   **Key Features**:
    *   Remote work request wizard.
    *   AI-powered policy chatbot.
    *   Compliance questionnaires.
*   **Deployment**: GitHub Pages.

### 3. Admin Frontend (Employer Dashboard)
*   **Path**: `/Admin_frontend/admin-app`
*   **Stack**: React 19, TypeScript, Vite, Tailwind CSS, Recharts.
*   **Key Features**:
    *   Dashboard with KPI cards and visualizations.
    *   Request management and approval workflows.
*   **Deployment**: GitHub Pages (Subpath `/employer/`).

---

## 🤖 AI Model Strategy

**Decision (Feb 2026)**: Use **Gemini 3 Flash** (`gemini-3-flash-preview`) as the primary engine for all features.

*   **Extraction**: Uses `gemini-3-flash-preview` after client-side text parsing (PDF/MSG/EML).
*   **Policy Chat**: Uses `gemini-3-flash-preview` for high-speed, high-reasoning response.
*   **Migration**: Completed migration from deprecated 2.0 and 2.5 models.

---

## 🚀 Development Setup

### Backend (Django)
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Database setup
# Ensure PostgreSQL is running and DB 'maersk_remote_work' exists
python3 manage.py migrate
python3 manage.py createsuperuser

# Run server (Port 8000)
python3 manage.py runserver 8000
```

### Frontend (Employee)
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173 (usually)
```

### Admin Frontend
```bash
cd Admin_frontend/admin-app
npm install
npm run dev
# Runs on http://localhost:5174 (usually)
```

---

## 📝 Coding Conventions

### Python (Backend)
*   **Style**: Adheres to PEP 8. Use `black`, `isort`, and `flake8`.
*   **Structure**: Django App pattern (`apps/users`, `apps/requests`, etc.).
*   **Naming**: `snake_case` for functions/vars, `PascalCase` for classes.
*   **Type Hints**: Strongly encouraged for function arguments and return values.

### TypeScript/React (Frontends)
*   **Component Structure**: Functional components with hooks.
*   **Naming**: `PascalCase` for components, `camelCase` for props/functions.
*   **Styling**: Tailwind CSS utility classes preferred over inline styles.
*   **State**: React `useState`, `useEffect`.

---

## ⚠️ Important Context & Gotchas

1.  **Authentication (MVP)**:
    *   The system uses a mock OTP flow.
    *   Any `@maersk.com` email is accepted.
    *   Any 6-digit code acts as a valid OTP.
2.  **Environment Variables**:
    *   Backend uses `.env` (template: `.env.example`).
    *   Frontends use `.env.local` for local dev.
    *   **Crucial**: API URL is controlled via `VITE_API_BASE_URL`.
3.  **Ports**:
    *   Backend: `8000`
    *   Frontend: Default Vite ports (`5173`, `5174`).
    *   *Note*: `AGENTS.md` mentions port `8741` in "Common Gotchas" but `README_DEPLOYMENT.md` says unified to `8000`. **Assume 8000** for the standardized setup.
4.  **Dependencies**:
    *   The project uses `npm` workspaces or separate `package.json` files. Always running `npm install` in the specific directory is safer.

---

## 📋 Remaining Tasks (Prioritized)

Refer to `REMAINING_TASKS.md` for the live list. Key high-priority items:
1.  **Bug Fixes**: Admin dashboard loading states and data display issues.
2.  **AI Service**: Upgrade Gemini model and implement real PDF parsing (`pdfjs-dist`).
3.  **Policy Modal**: Create a dedicated modal for the SIRW policy text.
4.  **UX Polish**: Fix text contrast/readability issues across the dashboard.
