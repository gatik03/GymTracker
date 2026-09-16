# GYM TRACKER - MASTER PROJECT CONTEXT

> **Current implementation note — August 30, 2026:** Any older "complete" status or localStorage-token description below is historical. The verified current state is documented in [README.md](README.md), [SECURITY.md](SECURITY.md), and [production_security_audit.md](production_security_audit.md).
> Product direction updated August 30, 2026: GymTracker is a data, design, performance, privacy, and UX product. AI/ML, automated advice, chatbots, and training-intelligence features are explicitly out of scope. Google and GitHub OAuth are required before production.

## ROLE & GOAL

Act as a Staff Software Architect, Senior Backend/Frontend Engineer, DevOps, and Security specialist.

**Goal**: Transform this codebase into a production-ready fitness analytics platform (SaaS quality) suitable for startup-grade demonstrations.

---

# IMPORTANT GUIDELINES FOR NEW CLI / AGENTS

1. **DO NOT** create a new project.
2. **DO NOT** regenerate existing architecture or rebuild completed work.
3. **DO NOT** use mock data placeholders or fake analytics widgets.
4. **ALWAYS** enforce strict **User Isolation** at both the database level (Django querysets) and API level (React Query client states).
5. **ALWAYS** compile the project using `npm run build` inside `frontend/` to verify TypeScript typecheck safety and turbopack build success before concluding.

---

# PRODUCT VISION

Build a premium fitness analytics platform with aesthetics inspired by Linear, Stripe, and Notion.
- **Dark Mode First**: HSL-based Tailwind variables, glassmorphic card overlays, neon-accented borders, and premium typography.
- **Mobile First**: All views, forms, dialog modals, charts, and navigations must adapt perfectly to mobile screens.
- **Data Driven**: Uses real-time Recharts visualizations (Pie charts, Bar charts, Area/Line charts) displaying mathematical models.

---

# REPOSITORY STRUCTURE & ARCHITECTURE

```
gym_Tracker/
├── backend/                  # Django REST Framework application
│   ├── gym_tracker/          # Django core configurations
│   ├── workouts/             # Workout application
│   │   ├── admin.py          # Custom Django admin panel registrations
│   │   ├── analytics.py      # Core analytics & 1RM math endpoints
│   │   ├── models.py         # ORM schemas (Exercise, Session, Set, BodyWeight)
│   │   ├── serializers.py    # Request/Response validators & parsers
│   │   ├── tests.py          # Backend Django unit tests (19 test cases)
│   │   ├── urls.py           # API routes mappings
│   │   └── views.py          # Model viewset definitions
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js 16 + TypeScript application
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── analytics/    # Performance Insights dashboard
│   │   │   ├── login/        # Glassmorphic Login page
│   │   │   ├── profile/      # User profile & bodyweight tracking board
│   │   │   ├── workouts/     # Workout list & detailed session CRUD logs
│   │   │   ├── layout.tsx    # Global React Query & Auth Providers wrapper
│   │   │   └── page.tsx      # Main User Dashboard
│   │   ├── components/       # UI & Layout components
│   │   │   ├── dashboard/    # Widgets (StatsGrid, VolumeChart, Muscle Distribution, etc.)
│   │   │   ├── layout/       # Auth guards and menus (Sidebar, MobileNav, ProtectedRoute)
│   │   │   ├── ui/           # Radix-ui/shadcn base items (Button, Card, Dialog, Input)
│   │   │   └── workouts/     # Workout log forms and lists
│   │   ├── context/          # Client AuthContext & session state management
│   │   ├── hooks/            # Custom React Query query/mutation hooks
│   │   ├── lib/              # Axios API client and routing configs
│   │   └── services/         # Authentication API requests
│   └── package.json          # Node dependencies
├── venv/                     # Python Virtual Environment
├── requirements.txt          # Python dependencies copy
└── learning.md               # Full-Stack Integration & Architecture Guide
```

---

# CURRENT STATUS SUMMARY

### 1. Backend (Django REST Framework)
- **Status**: **Complete & Fully Verified**
- **Authentication**: JWT validation using `djangorestframework-simplejwt`.
- **Database**: SQLite (local) / PostgreSQL (production config ready).
- **Core Models**:
  - `Exercise`: target `muscle_group` (chest, back, shoulders, triceps, biceps, forearms, legs, core). Linked to `created_by`.
  - `WorkoutSession`: `workout_type` (push, pull, legs, upper, lower, full_body, custom), date, and notes. Linked to `user`.
  - `ExerciseSet`: links sets (reps, weight, set_number) to `WorkoutSession` and `Exercise`.
  - `BodyWeightEntry`: Tracks daily weight logs. Enforces daily uniqueness per user: `unique_together = ('user', 'date')`.
- **Testing**: 19 automated unit tests verifying admins, analytics correctness, mathematical formulas, and user data isolation.

### 2. Frontend (Next.js & TypeScript)
- **Status**: **Complete & Fully Verified**
- **Data Query Layer**: `@tanstack/react-query` managing caches, background fetching, and automated mutations invalidations.
- **Routing & Shields**: Next.js App Router with custom `ProtectedRoute` route guards redirecting unauthenticated users to `/login`.
- **Axios Interceptors**: Implements **Refresh Token Rotation** (automatic intercept of HTTP 401, POSTs refresh token, resolves failed request queue seamlessly in the background).

---

# COMPLETED ROADMAP PHASES

### Phase B1: Django Admin Experience
- Registered custom `ModelAdmin` configurations for all models.
- Added `ExerciseSetInline` tabular inlines inside `WorkoutSessionAdmin` for inline session logging.
- Configured `raw_id_fields` to prevent heavy dropdown lookups.
- Added search limits and filter cards (date, user, muscle group).

### Phase B2: Analytics Engine
Exposed 7 core REST API endpoints:
1. `ExerciseProgressView`: Returns exercise-specific progress timeline.
2. `PersonalRecordsView`: Returns max-weights and estimated 1RM personal records.
3. `VolumePerExerciseView`: Returns total volume aggregated per exercise.
4. `VolumePerMuscleGroupView`: Returns total volume aggregated per target muscle.
5. `WeeklyVolumeView`: Returns volume aggregation grouped by week.
6. `MonthlyVolumeView`: Returns volume aggregation grouped by month.
7. `Estimated1RMView`: Returns estimated 1RM progression timeline using the Epley formula:
   $$\text{1RM} = \text{weight} \times \left(1 + \frac{\text{reps}}{30}\right)$$

### Phase B4: Bodyweight Tracking
- Created `BodyWeightEntry` model with database uniqueness constraints.
- Integrated `BodyWeightEntrySerializer` using `serializers.CurrentUserDefault()` to enforce proper validation check order.
- Created `BodyWeightTrendView` (chronological weight logs) and `BodyWeightRateView` (overall weight delta and weekly rate of change over a 30-day window).

### Phase F1 - F2: Authentication & React Query Layer
- Configured Axios interceptor for JWT token refresh rotation.
- Created `AuthProvider` client context and `ProtectedRoute` shielding layout.
- Integrated React Query providers (`QueryClientProvider`) wrapping the tree.
- Implemented type-safe query hooks (`useWorkouts`, `useExercises`, `useAnalytics`, `useBodyWeight`) with queries/mutations.

### Phase F3 - F4: Integration & Workout Logging Workflows
- Connected widgets: `DashboardHero` (dynamic greetings), `StatsGrid` (PR count, streak, volume), `VolumeChart` (Recharts weekly progression), `MuscleDistribution` (Pie charts), `RecentWorkouts` (logs history), `PersonalRecords` (PR logs), and `ActivityFeed` (deterministic heavy performances).
- Created `/workouts/[id]` details logs view allowing set creation, updates (weight, reps), and set deletion inline.
- Integrated `NewWorkoutDialog` to call mutations.

### Phase F5 - F6: Performance Analytics & Profile preference system
- Built `/analytics` containing Overview charts, Exercise progression selectors, and Strength trends list.
- Fixed mismatched tag errors and import paths in `analytics/page.tsx`.
- Created `/profile/page.tsx` with:
  - Metric vs Imperial unit toggle (`kg` vs `lbs`) saving settings to `localStorage`.
  - Bodyweight progression line chart with dynamic scaling domains.
  - CRUD weight dialog forms and entries history list.
- Verified compilation builds successfully.

---

# COMPLETED API ENDPOINTS

### Authentication
- `POST /api/token/` - Logs in and returns access/refresh JWT tokens.
- `POST /api/token/refresh/` - Rotates expired access tokens.

### Workouts CRUD ViewSets
- `/api/exercises/` - Lists/creates user exercises.
- `/api/workout-sessions/` - Lists/creates workout sessions.
- `/api/exercise-sets/` - Lists/creates/patches/deletes exercise sets.
- `/api/bodyweight/` - Lists/creates/deletes daily weight logs.

### Analytics Endpoints
- `GET /api/analytics/total-volume/`
- `GET /api/analytics/exercise-progress/<exercise_id>/`
- `GET /api/analytics/prs/`
- `GET /api/analytics/volume-per-exercise/`
- `GET /api/analytics/volume-per-muscle-group/`
- `GET /api/analytics/weekly-volume/`
- `GET /api/analytics/monthly-volume/`
- `GET /api/analytics/estimated-1rm/<exercise_id>/`
- `GET /api/analytics/bodyweight/trend/`
- `GET /api/analytics/bodyweight/rate/`

---

# FUTURE ROADMAP (FOR NEW CLI AGENTS)

The following roadmaps outline the remaining phases of work.

## SECURITY ROADMAP

### Required S1: Google OAuth
- Add support for Google OAuth registration and login workflows.
- Sync Django authentication backend with OAuth client payloads.
- **Commit**: `feat: add google oauth`

### Required S2: Account Security
- Add email verification workflows on user sign-up.
- Add password reset workflows (sending tokens via email/console backend).
- **Commit**: `feat: improve account security`

### Required S3: JWT Hardening
- Implement Refresh Token Blacklisting using `rest_framework_simplejwt.token_blacklist` to invalidate refresh tokens on user logout.
- **Commit**: `feat: harden jwt security`

### Required S4: Production Security
- Enable CSRF protections for Django sessions.
- Configure secure headers (`django-secure-headers` or standard settings: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`).
- Implement API Rate Limiting using Django REST Framework's built-in throttling classes (`AnonRateThrottle`, `UserRateThrottle`).
- **Commit**: `feat: add production security protections`

---

## DATABASE ROADMAP
- Migrate default database configuration from SQLite to PostgreSQL.
- Add Docker environment variables support to swap database engines conditionally.
- Implement migration check scripts to migrate existing user schema data.
- **Commit**: `feat: migrate to postgresql`

---

## DEVOPS ROADMAP
- Containerize both backend and frontend applications using Docker.
- Create `Dockerfile` (multi-stage builds for frontend optimization).
- Create a master `docker-compose.yml` to spin up Next.js client, DRF server, and PostgreSQL database with persistent volume volumes.
- Configure Nginx as a reverse proxy container routing SSL traffic and serving static files.
- **Commit**: `feat: containerize application`

---

## DEPLOYMENT ROADMAP
- Deploy Next.js frontend to Vercel.
- Deploy Django backend to Railway, Render, or AWS.
- Set up production PostgreSQL database.
- Configure production logging, status monitoring, and environment configurations.
- **Commit**: `feat: production deployment setup`

---

## FUTURE ROADMAP
- Develop a Flutter companion mobile application to log workouts offline, syncing automatically with backend REST APIs.
