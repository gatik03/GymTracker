# GymTracker 🏋️‍♂️

> A modern, full-stack personal fitness and wellbeing tracking platform focused on reliable workout logging, muscle volume progress, bodyweight analytics, private journaling, and dark-first UX.

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django)](https://djangoproject.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## ✨ Features & Capabilities

- **Secure Cookie-Based Authentication**:
  - Username or email login with HttpOnly short-lived access JWT cookies and rotating refresh cookies.
  - User registration with Django password validation and email code verification.
  - Expiring, single-use password reset codes with automated session revocation.
  - Google and GitHub OAuth authorization-code integration with state signature verification.
  - Authenticated profile account linking and duplicate account prevention.

- **Exercise Catalog Management**:
  - Built-in exercise library with equipment, target muscle group, and difficulty attributes.
  - Custom exercise creation, search, muscle filtering, recents, and favorites.
  - Idempotent seed command (`seed_exercises`) for instant catalog population.

- **Workout Session & Set Tracking**:
  - Workout session state handling (active draft vs completed session).
  - Rapid set logging with target weight, reps, RPE, RIR, and set notes.
  - Anatomy feedback map with interactive exercise muscle highlight.

- **Analytics & Visualizations**:
  - Deterministic volume analytics (weekly, monthly, volume per exercise, volume per muscle group).
  - Epley formula estimated 1RM progression tracking.
  - Personal record (PR) tracking and heavy performance feeds.
  - Bodyweight tracking, chronological trend chart, and 30-day rate of change.

- **Private Journaling**:
  - Private journal entry CRUD with server-side ownership enforcement and zero leak guarantee.

- **Developer & AI Ready**:
  - Centralized developer and AI context in [AGENTS.md](AGENTS.md).
  - Complete documentation archive in [docs/](docs/README.md).

---

## 🏗️ Architecture

```text
Next.js Components (React 19)
  │
  ├──► TanStack React Query (v5)
  │      │
  │      └──► Typed Service Layer & Axios Client
  │             │
  │             └──► Next.js /api Proxy Rewrite
  │                    │
  │                    └──► Django REST Framework (Python 3.12+)
  │                           │
  │                           └──► Django ORM
  │                                  │
  │                                  └──► SQLite (Dev) / PostgreSQL (Prod)
```

The browser receives HttpOnly access and refresh cookies; JavaScript never reads or stores raw JWTs. Unsafe cookie-authenticated API requests enforce Django CSRF header validation. Django REST Framework serves as the strict authorization boundary, scoping all querysets to `request.user`.

---

## 🚀 Quick Start (Local Setup)

### System Requirements
- Python 3.12+
- Node.js 20+ and npm

### 1. Environment & Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd gym_Tracker

# Set up Python virtual environment & backend packages
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Install frontend Node dependencies
cd frontend
npm ci
cd ..
```

### 2. Environment Variables Setup

```bash
# Create local environment file from example template
cp .env.example .env
```

Review [.env.example](.env.example) for variable definitions. Default local values work out-of-the-box for development.

### 3. Database Migration & Exercise Catalog Seeding

```bash
# Export environment variables into shell
set -a
source .env
set +a

# Run migrations and seed exercises
venv/bin/python backend/manage.py migrate
venv/bin/python backend/manage.py seed_exercises
```

### 4. Run Development Servers

- **Backend** (Default: `http://127.0.0.1:8000`):
  ```bash
  venv/bin/python backend/manage.py runserver 8000
  ```

- **Frontend** (Default: `http://localhost:3000`):
  ```bash
  cd frontend
  npm run dev
  ```

Open `http://localhost:3000` in your browser. Verification and password reset codes are output to the backend terminal when using the console email backend.

---

## ⚙️ Environment Configuration

Refer to [.env.example](.env.example) for the full configuration schema:

- **Django Core**: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- **Origins & CORS**: `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- **Database**: `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- **JWT & Cookies**: `JWT_COOKIE_SECURE`, `JWT_COOKIE_SAMESITE`, cookie names, lifetimes
- **Email**: `EMAIL_BACKEND`, SMTP options, code expiries
- **OAuth Providers**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Next.js Client**: `NEXT_PUBLIC_API_BASE_URL`, `BACKEND_API_URL`

---

## ✅ Verification & Testing

Verify system health before committing code:

```bash
# 1. Run Django Backend Test Suite
venv/bin/python backend/manage.py test workouts

# 2. Run Django Production Deployment Checks
venv/bin/python backend/manage.py check --deploy

# 3. Run Frontend ESLint Linter
npm --prefix frontend run lint

# 4. Run Frontend Production TypeScript Build
npm --prefix frontend run build
```

---

## 📁 Repository Structure

```text
gym_Tracker/
├── AGENTS.md                         # Primary AI agent & cross-device context guide
├── CLAUDE.md                         # Reference entry for Claude / Antigravity CLI
├── README.md                         # Master repository documentation
├── SECURITY.md                       # Security policy & vulnerability disclosures
├── .env.example                      # Environment variables reference template
├── .gitignore                        # Comprehensive root gitignore rules
├── backend/                          # Django REST Framework application
│   ├── config/                       # Core Django configuration & settings
│   ├── manage.py                     # Django CLI entrypoint
│   ├── requirements.txt              # Python package requirements
│   └── workouts/                     # Main workouts domain app (models, views, APIs)
├── docs/                             # Documentation archive & planning files
│   ├── README.md                     # Documentation folder index
│   ├── ProjectContext.md             # Master project context & architecture history
│   ├── production_security_audit.md  # Detailed security audit report
│   ├── production_and_security_checklist.md # Production deployment release checklist
│   ├── AUDIT_REPORT.md               # Historical architecture audit report
│   └── learning.md                   # Full-Stack Integration & Architecture guide
└── frontend/                         # Next.js 16 App Router application
    ├── next.config.ts                # Next.js settings & API rewrites
    ├── package.json                  # Frontend dependencies & scripts
    └── src/                          # Next.js pages, components, hooks, & services
```

---

## 🔐 Security & Deployment

For security posture, token handling rules, OAuth configuration details, and production readiness checks, please consult:
- 🛡️ [SECURITY.md](SECURITY.md)
- 🔒 [Production Security Audit](docs/production_security_audit.md)
- ✅ [Production Release Checklist](docs/production_and_security_checklist.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
