# AGENTS.md - GymTracker Developer & AI Agent Context

> **Target Audience**: AI Coding Assistants (Antigravity, Claude Code, Cursor, Copilot, Windsurf) and Human Developers setting up or working on GymTracker across machines.

---

## 🎯 Project Overview & Philosophy

**GymTracker** is a production-grade, full-stack fitness and wellbeing tracking platform. It focuses on reliable workout set logging, a hybrid exercise catalog (built-in + custom), bodyweight trends, private journaling, and progress analytics (Epley 1RM, volume distributions, heavy performance records).

### Core Design & Architecture Principles
- **Dark-First Modern UI**: Inspired by Linear and Stripe (HSL-based Tailwind variables, glassmorphic overlays, responsive mobile navigation).
- **Security & Privacy First**: Django is the sole authorization boundary. Strict user data isolation across all querysets. Cookie-based HttpOnly JWT authentication with automatic refresh token rotation and blacklisting.
- **Same-Origin API Architecture**: Next.js App Router proxies `/api/*` calls to the Django REST Framework backend so browser cookies remain same-origin.
- **Explicit Scope Boundary**: AI/ML features, automated training advice, chatbots, and psychological interpretation are **deliberately out of scope**.

---

## 🛠️ Tech Stack & Environment

| Layer | Technology | Key Dependencies |
| :--- | :--- | :--- |
| **Backend** | Python 3.12+ / Django 6.0+ | Django REST Framework, SimpleJWT, `psycopg2-binary`, SQLite (dev) / PostgreSQL (prod) |
| **Frontend** | Next.js 16+ (App Router) | React 19, TypeScript, Tailwind CSS, TanStack React Query v5, Axios, Recharts, Lucide Icons |
| **Auth System** | HttpOnly Cookies + OAuth2 | Access & Refresh JWT cookies, CSRF protection, Google & GitHub OAuth authorization code flows |

---

## 🚀 Quick Start Guide (New Machine Setup)

Follow these steps to set up GymTracker on a new device:

### 1. Repository Setup & Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd gym_Tracker

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Install frontend Node dependencies
cd frontend
npm ci
cd ..
```

### 2. Environment Configuration

```bash
# Copy example environment configuration
cp .env.example .env
```

Edit `.env` if local port overrides are needed (defaults work out of the box for standard development).

### 3. Database Initialization & Catalog Seeding

```bash
# Export environment variables into shell session
set -a
source .env
set +a

# Apply Django database migrations
venv/bin/python backend/manage.py migrate

# Seed built-in exercise catalog (idempotent)
venv/bin/python backend/manage.py seed_exercises
```

### 4. Running Development Servers

- **Backend Server** (Terminal 1):
  ```bash
  venv/bin/python backend/manage.py runserver 8000
  ```

- **Frontend Server** (Terminal 2):
  ```bash
  cd frontend
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser. Verification and reset codes are printed to the Django terminal when using the console email backend.

---

## 🏗️ Repository Layout & Key File Map

```text
gym_Tracker/
├── AGENTS.md                         # (This file) AI agent & developer master context
├── CLAUDE.md                         # Reference entry for Claude / Antigravity CLI
├── README.md                         # Master repository README
├── SECURITY.md                       # Security policy, auth flows, & security disclosures
├── .env.example                      # Environment variables reference template
├── .gitignore                        # Comprehensive root gitignore rules
├── backend/                          # Django REST Framework application
│   ├── config/                       # Core Django settings, URLs, WSGI, health checks
│   │   ├── health.py                 # Health and database readiness check endpoints
│   │   ├── settings.py               # Main settings (JWT, CORS, CSRF, Security)
│   │   └── urls.py                   # Master URL routing
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependency requirements
│   └── workouts/                     # Main domain application
│       ├── account_serializers.py    # Auth, register, password reset, profile serializers
│       ├── account_services.py       # Security code generation & email delivery service
│       ├── account_views.py          # Account verification, password reset, profile endpoints
│       ├── admin.py                  # Custom Django admin registrations
│       ├── analytics.py              # Epley 1RM, volume aggregation, trend views
│       ├── authentication.py         # Cookie-based SimpleJWT authentication class
│       ├── exceptions.py             # Custom API exception handlers
│       ├── models.py                 # Exercise, Session, Set, BodyWeight, Journal, Profile, OAuth models
│       ├── oauth_services.py         # Google & GitHub OAuth token exchange & user linking
│       ├── oauth_views.py            # OAuth start & callback endpoints
│       ├── serializers.py            # Workout & exercise serializers with validation rules
│       ├── tests.py                  # Automated backend test suite (40 test cases)
│       ├── urls.py                   # Workouts API route declarations
│       ├── views.py                  # DRF viewsets (Workouts, Sets, Exercises, Journal)
│       ├── data/                     # Exercise seed data catalog
│       └── management/commands/      # Seed management command (seed_exercises)
├── docs/                             # Full documentation archive
│   ├── README.md                     # Documentation folder index
│   ├── ProjectContext.md             # Detailed project history & architecture map
│   ├── production_security_audit.md  # Detailed security audit report
│   ├── production_and_security_checklist.md # Pre-release checklist
│   ├── AUDIT_REPORT.md               # Historical architecture audit report
│   └── learning.md                   # Full-Stack Integration & Architecture guide
└── frontend/                         # Next.js 16 App Router frontend
    ├── next.config.ts                # Next.js settings & /api rewrite rules
    ├── package.json                  # Node dependencies & scripts
    └── src/
        ├── app/                      # Next.js App Router pages
        │   ├── analytics/            # Performance Insights dashboard
        │   ├── journal/              # Private workout journal
        │   ├── login/                # Authentication page
        │   ├── profile/              # User profile & bodyweight manager
        │   ├── register/             # User registration
        │   ├── workouts/             # Workout session list & detail pages ([id])
        │   ├── layout.tsx            # Root layout with Query & Auth Providers
        │   └── page.tsx              # Main dashboard view
        ├── components/               # React UI components
        │   ├── auth/                 # Login & Registration forms
        │   ├── dashboard/            # StatsGrid, VolumeChart, MuscleDistribution, ActivityFeed
        │   ├── layout/               # Sidebar, Topbar, MobileNav, ProtectedRoute
        │   ├── ui/                   # Shadcn/Radix UI base primitives
        │   └── workouts/             # Workout logging, Anatomy map, Dialogs
        ├── context/                  # AuthContext client state provider
        ├── hooks/                    # Custom TanStack React Query hooks
        ├── lib/                      # Axios client instance, API endpoints, Navigation
        └── services/                 # Auth & Profile API service layers
```

---

## ⚡ Developer & AI Agent Guidelines

### 1. Mandatory Data Isolation & Authorization
- **Database Level**: Always scope querysets using `request.user` (e.g., `WorkoutSession.objects.filter(user=request.user)`).
- **Relation Validation**: Verify that nested resources (e.g., `ExerciseSet` attached to a `WorkoutSession`) belong to `request.user`.
- **Client Cache Level**: React Query client state must never leak cross-user state.

### 2. Cookie & Token Security
- JavaScript **never** reads or stores JWT tokens in `localStorage` or `sessionStorage`.
- All access and refresh tokens are handled in **HttpOnly, SameSite cookies**.
- All non-GET requests require a valid CSRF token header (`X-CSRFToken`).

### 3. Coding & Modification Practices
- **No Mock Fallbacks**: Never introduce dummy placeholder data or swallow API exceptions silently.
- **Preserve API Contracts**: Ensure frontend TypeScript types in `frontend/src/lib/` stay strictly synchronized with DRF serializers in `backend/workouts/serializers.py`.
- **Type Safety**: Keep TypeScript strict mode clean with zero `any` evasions.

---

## ✅ Verification & Testing Protocols

Before committing or concluding work, run these commands to verify codebase health:

```bash
# 1. Run Backend Django Unit Tests (Must pass 40/40 tests)
venv/bin/python backend/manage.py test workouts

# 2. Run Django Security & Deployment Check
venv/bin/python backend/manage.py check --deploy

# 3. Run Frontend ESLint Check (Must output zero warnings/errors)
npm --prefix frontend run lint

# 4. Run Frontend Production TypeScript Build (Must compile successfully)
npm --prefix frontend run build
```

---

## 📚 Related Documentation

- 📘 [Master Readme](README.md)
- 🛡️ [Security Policy & Controls](SECURITY.md)
- 📂 [Full Documentation Archive](docs/README.md)
