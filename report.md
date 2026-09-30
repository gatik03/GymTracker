# GymTracker Capability Audit

Audit type: read-only. No source code, configuration, dependencies, database data, or Git history were modified during the audit.

## Executive summary

GymTracker is a functional full-stack application with real authentication, workout tracking, exercise catalog management, analytics, bodyweight tracking, private journaling, and anatomy feedback.

It is not yet production-deployed or fully production-verified. The most important remaining gaps are production operations, browser-level testing, scalable history/analytics behavior, and server-side immutability for completed workouts.

The current code is more complete than some older project documentation suggests. The implementation and validation results below are based on the checked-out repository.

## Required documentation

The required documents all exist:

- `docs/ProjectContext.md`
- `docs/production_and_security_checklist.md`
- `README.md`

Some documentation is historical. In particular, older roadmap sections describe OAuth, journaling, and other features as future work even though the current repository implements them.

## Validation performed

- Backend tests: `40/40 passed`
- Frontend ESLint: passed with no errors
- Frontend TypeScript no-emit check: passed
- Django `check --deploy`: completed with five development-environment warnings
- Frontend production build: not run because Next.js build writes generated `.next` files, conflicting with the audit-only/no-file-creation requirement
- Git worktree: clean

The system-Python backend test initially failed because Django was not installed globally. The repository virtual environment worked correctly.

## Repository structure

```text
gym_Tracker/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── SECURITY.md
├── .env.example
├── .gitignore
├── requirements.txt
├── .github/workflows/ci.yml
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3                  # ignored local database
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── health.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   └── workouts/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── analytics.py
│       ├── urls.py
│       ├── tests.py
│       ├── authentication.py
│       ├── auth_views.py
│       ├── account_views.py
│       ├── account_serializers.py
│       ├── account_services.py
│       ├── oauth_views.py
│       ├── oauth_services.py
│       ├── exceptions.py
│       ├── admin.py
│       ├── data/exercises.py
│       ├── services/exercises.py
│       ├── management/commands/seed_exercises.py
│       └── migrations/0001_initial.py–0009_*.py
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── components.json
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       ├── proxy.ts
│       └── services/
└── docs/
    ├── ProjectContext.md
    ├── production_and_security_checklist.md
    ├── production_security_audit.md
    ├── AUDIT_REPORT.md
    ├── learning.md
    └── README.md
```

Generated or unnecessary local files exist but are ignored:

- `frontend/node_modules/`
- `frontend/.next/`
- Python `__pycache__/`
- `backend/db.sqlite3`

No tracked `.env`, credentials, private keys, `node_modules`, `.next`, virtual environment, or build output files were found. No actual secret values were exposed. `.env.example` contains placeholders only.

## Backend audit

### Framework and packages

| Area | Current implementation |
|---|---|
| Python | 3.12.3 in repository virtual environment |
| Django | 6.0.5 |
| Django REST Framework | 3.17.1 |
| Simple JWT | 5.5.1 |
| CORS | `django-cors-headers` 4.9.0 |
| Database driver | `psycopg2-binary` 2.9.12 |
| Default database | SQLite |
| Production database option | PostgreSQL |
| Test framework | Django `TestCase` / DRF API client |

Python compatibility is effectively Python 3.12+, as used by CI and project documentation.

### Architecture

The main Django app is `workouts`.

Models:

- `Exercise`
- `WorkoutSession`
- `ExerciseSet`
- `BodyWeightEntry`
- `FavoriteExercise`
- `JournalEntry`
- `AccountProfile`
- `AccountActionCode`
- `OAuthIdentity`

Services and utilities include account code generation, email delivery, OAuth provider exchange, exercise filtering, recent-exercise lookup, health checks, and generic API exception handling.

The API defaults to `IsAuthenticated`. Public authentication endpoints explicitly use `AllowAny`.

Owner isolation is implemented using `request.user` queryset scoping, nested workout/set ownership validation, custom-exercise ownership filtering, journal/bodyweight ownership filtering, and user-scoped analytics queries.

### Database

The local configuration defaults to:

```text
backend/db.sqlite3
```

PostgreSQL support already exists through `DB_ENGINE=postgresql` and environment-controlled connection settings. Production startup rejects SQLite when `DJANGO_DEBUG=false`.

Relationships:

- `Exercise.created_by → User`
- `WorkoutSession.user → User`
- `ExerciseSet.workout_session → WorkoutSession`
- `ExerciseSet.exercise → Exercise`
- `BodyWeightEntry.user → User`
- `FavoriteExercise.user → User`
- `FavoriteExercise.exercise → Exercise`
- `JournalEntry.user → User`
- `AccountProfile.user → User`
- `AccountActionCode.user → User`
- `OAuthIdentity.user → User`

Important constraints include one active draft per user, draft/completed timestamp consistency, valid set ranges, unique set numbers, one bodyweight entry per user/date, one favorite per user/exercise, and unique OAuth identities.

Indexes exist for workout user/status/date, journal user/date, and account action-code lookup.

## Backend API inventory

All paths below are under `/api/`.

| Method | Endpoint | Purpose | Auth | Owner check | Status |
|---|---|---|---|---|---|
| GET | `/auth/csrf/` | Issue CSRF cookie/token | No | N/A | Implemented |
| POST | `/auth/login/` | Username/email login and JWT cookies | No, CSRF | N/A | Implemented |
| POST | `/auth/register/` | Create inactive account | No, CSRF | Account data | Implemented |
| POST | `/auth/verify-email/request/` | Resend verification code | No, CSRF | Account lookup | Implemented |
| POST | `/auth/verify-email/confirm/` | Verify account and sign in | No, CSRF | Code ownership | Implemented |
| POST | `/auth/password-reset/request/` | Request password reset | No, CSRF | Generic response | Implemented |
| POST | `/auth/password-reset/confirm/` | Reset password and revoke sessions | No, CSRF | Code ownership | Implemented |
| POST | `/auth/refresh/` | Rotate access/refresh cookies | No, CSRF | Token validation | Implemented |
| POST | `/auth/logout/` | Blacklist refresh token and clear cookies | No, CSRF | Current cookie | Implemented |
| GET | `/auth/session/` | Return current user | Yes | Current user | Implemented |
| POST | `/auth/oauth/google/start/` | Start Google OAuth | Public/authenticated | Signed state | Implemented |
| GET | `/auth/oauth/google/callback/` | Complete Google OAuth | Public | Signed state/cookie | Implemented |
| POST | `/auth/oauth/github/start/` | Start GitHub OAuth | Public/authenticated | Signed state | Implemented |
| GET | `/auth/oauth/github/callback/` | Complete GitHub OAuth | Public | Signed state/cookie | Implemented |
| GET | `/auth/oauth/connections/` | List linked providers | Yes | Current user | Implemented |
| GET | `/exercises/` | List accessible exercises | Yes | Built-ins + own custom | Implemented |
| GET | `/exercises/{id}/` | Retrieve accessible exercise | Yes | Accessible queryset | Implemented |
| GET | `/exercises/search/` | Search/filter exercises | Yes | Accessible queryset | Implemented |
| GET | `/exercises/muscle-group/` | Count by muscle group | Yes | Accessible queryset | Implemented |
| GET | `/exercises/favorites/` | List favorite exercises | Yes | Current user | Implemented |
| GET | `/exercises/recent/` | Recently used exercises | Yes | Current user | Implemented |
| POST | `/exercises/{id}/favorite/` | Favorite an exercise | Yes | Accessible/current user | Implemented |
| DELETE | `/exercises/{id}/favorite/` | Remove favorite | Yes | Current user | Implemented |
| POST | `/exercises/custom/` | Create custom exercise | Yes | Owner assigned server-side | Implemented |
| GET | `/exercises/custom/{id}/` | Retrieve custom exercise | Yes | Owner queryset | Implemented |
| PUT/PATCH | `/exercises/custom/{id}/` | Edit custom exercise | Yes | Owner queryset | Implemented |
| DELETE | `/exercises/custom/{id}/` | Delete custom exercise | Yes | Owner queryset | Implemented |
| GET | `/workout-sessions/` | Completed workout history | Yes | Current user | Implemented |
| POST | `/workout-sessions/` | Create draft workout | Yes | User assigned server-side | Implemented |
| GET | `/workout-sessions/active-draft/` | Retrieve active draft | Yes | Current user | Implemented |
| GET | `/workout-sessions/{id}/` | Retrieve workout | Yes | Current user | Implemented |
| PUT/PATCH | `/workout-sessions/{id}/` | Edit workout metadata | Yes | Current user | Implemented |
| DELETE | `/workout-sessions/{id}/` | Delete workout | Yes | Current user | Implemented |
| POST | `/workout-sessions/{id}/complete/` | Complete draft | Yes | Current user | Implemented |
| GET | `/exercise-sets/` | List user sets | Yes | Workout owner | Implemented |
| POST | `/exercise-sets/` | Add set | Yes | Workout/exercise validated | Implemented |
| GET | `/exercise-sets/{id}/` | Retrieve set | Yes | Workout owner | Implemented |
| PUT/PATCH | `/exercise-sets/{id}/` | Edit draft set | Yes | Workout/exercise validated | Implemented |
| DELETE | `/exercise-sets/{id}/` | Delete draft set | Yes | Workout owner | Implemented |
| GET/POST/PUT/PATCH/DELETE | `/bodyweight/` and `/{id}/` | Bodyweight CRUD | Yes | Current user | Implemented |
| GET/POST/PUT/PATCH/DELETE | `/journal/` and `/{id}/` | Journal CRUD | Yes | Current user | Implemented |
| GET | `/analytics/total-volume/` | Total completed volume | Yes | Current user | Implemented |
| GET | `/analytics/exercise-progress/{id}/` | Exercise progression | Yes | Current user | Implemented |
| GET | `/analytics/prs/` | Personal records | Yes | Current user | Implemented |
| GET | `/analytics/volume-per-exercise/` | Volume by exercise | Yes | Current user | Implemented |
| GET | `/analytics/volume-per-muscle-group/` | Volume by muscle group | Yes | Current user | Implemented |
| GET | `/analytics/weekly-volume/` | Weekly volume | Yes | Current user | Implemented |
| GET | `/analytics/daily-volume/` | Current-month daily volume | Yes | Current user | Implemented |
| GET | `/analytics/monthly-volume/` | Monthly volume | Yes | Current user | Implemented |
| GET | `/analytics/estimated-1rm/{id}/` | Epley 1RM progression | Yes | Current user | Implemented |
| GET | `/analytics/bodyweight/trend/` | Bodyweight trend | Yes | Current user | Implemented |
| GET | `/analytics/bodyweight/rate/` | 30-day weight rate | Yes | Current user | Implemented |
| GET | `/health/` | Liveness check | No | N/A | Implemented |
| GET | `/ready/` | Database readiness check | No | N/A | Implemented |

Important correctness finding: completed workout sessions can still be edited or deleted through the generic `ModelViewSet`. The frontend presents completed workouts as locked and completed sets are protected, but workout-level mutation is not similarly blocked server-side.

## Authentication audit

| Capability | Status | Evidence |
|---|---|---|
| JWT login | IMPLEMENTED | Cookie token obtain view |
| Username/email login | IMPLEMENTED | Identifier resolver |
| Access/refresh expiration | IMPLEMENTED | 10-minute access, 7-day refresh defaults |
| Refresh rotation | IMPLEMENTED | SimpleJWT configuration |
| Refresh blacklisting | IMPLEMENTED | Blacklist app and logout/revocation |
| Logout | IMPLEMENTED | Blacklists token and clears cookies |
| Registration | IMPLEMENTED | Inactive until verification |
| Email verification | IMPLEMENTED | Six-digit, hashed, expiring, single-use codes |
| Password reset | IMPLEMENTED | Expiring, single-use codes |
| Session persistence | IMPLEMENTED | HttpOnly cookies and session bootstrap |
| Browser token storage | IMPLEMENTED securely | JWTs are not stored in browser storage |
| CSRF | IMPLEMENTED | Unsafe cookie-authenticated requests enforce CSRF |
| Google OAuth | PARTIAL | Flow/tests exist; deployed credentials unverified |
| GitHub OAuth | PARTIAL | Flow/tests exist; deployed credentials unverified |
| Account linking | PARTIAL | Explicit linking exists; unlinking does not |
| MFA | NOT IMPLEMENTED | No MFA flow |
| Session-management UI | NOT IMPLEMENTED | Server revocation exists but no UI |
| Password change | NOT IMPLEMENTED | Reset exists; authenticated change does not |
| Account deletion | NOT IMPLEMENTED | No deletion flow |

## Exercise system audit

The repository contains 110 built-in exercise records in `backend/workouts/data/exercises.py`.

Implemented:

- Built-in exercises
- Custom exercises
- Ownership enforcement
- Muscle groups
- Equipment
- Difficulty
- Exercise type
- Search
- Filtering
- Pagination
- Ordering
- Favorites
- Recent exercises
- Idempotent `seed_exercises` command
- Duplicate handling
- Custom edit/delete restrictions
- Read-only built-in exercises
- Exercise-to-muscle mapping for the anatomy UI

Missing or limited:

- No separate category model
- No aliases or alternate exercise names
- No exercise media library
- No multiple primary/secondary muscle mapping

## Workout system audit

| Capability | Status |
|---|---|
| Create workout | Implemented |
| Title, type, date, notes | Implemented |
| Draft state | Implemented |
| One active draft per user | Implemented |
| Add/edit/delete sets | Implemented for drafts |
| Weight, reps, RPE, RIR, notes | Implemented |
| Per-repetition data | Not implemented |
| Workout duration | Calculated from timestamps |
| Set autosave | Implemented through immediate set persistence |
| Workout metadata autosave | Not implemented |
| Complete workout | Implemented |
| Workout history | Implemented |
| Draft discard | Implemented |
| Exercise reordering | Not implemented |
| Completed-workout locking | Partial; workout-level mutation remains possible |

Actually implemented: a user can create a draft, select or create exercises, log sets, edit draft sets, see totals, complete the workout, and review history.

Missing: exercise ordering, per-rep data, templates, supersets/circuits, rest timers, offline logging, and complete server-side locking.

## Analytics audit

Implemented backend analytics:

- Total volume
- Daily current-month volume
- Weekly volume
- Monthly volume
- Volume per exercise
- Volume per muscle group
- Personal records
- Epley estimated 1RM
- Exercise progression
- Bodyweight trend
- Bodyweight rate of change

Frontend visualizations include dashboard volume charts, muscle distribution, PR cards, heavy-performance feed, exercise progression charts, bodyweight charts, and progress records.

Draft sets are excluded from analytics. The frontend calculates training streaks from completed workout history.

Analytics have backend tests, while frontend-derived streak and activity-feed calculations do not have dedicated frontend tests.

## Journal audit

Journal is implemented.

Backend support includes the `JournalEntry` model, CRUD API, ownership filtering, content length validation, title/date/timestamps, and a serializer that omits the owner field.

Frontend support includes `/journal`, create/read/update/delete, manual save, post-create autosave, empty/loading/error states, deletion confirmation, and accessible labels/live save status.

Missing:

- Search
- Filtering
- Pagination
- Conflict/version handling
- Rich text
- Server-side recovery of unsaved drafts

## Frontend audit

| Technology | Version/configuration |
|---|---|
| Next.js | 16.3.3 |
| React | 19.2.4 |
| TypeScript | 5.x, strict mode |
| Tailwind | Tailwind 4 |
| React Query | TanStack Query 5 |
| Axios | 1.16.1 |
| Recharts | 3.8.1 |
| Framer Motion | 12.40.0 |
| UI | Radix primitives and shadcn-style components |

### Frontend routes

| Route | Purpose | Implemented | API-connected | Protected |
|---|---|---:|---:|---:|
| `/` | Dashboard | Yes | Yes | Yes |
| `/login` | Login/OAuth | Yes | Yes | No |
| `/register` | Registration | Yes | Yes | No |
| `/verify-email` | Email verification | Yes | Yes | No |
| `/forgot-password` | Password reset request | Yes | Yes | No |
| `/reset-password` | Password reset confirmation | Yes | Yes | No |
| `/workouts` | Workout history/drafts | Yes | Yes | Yes |
| `/workouts/[id]` | Workout logger/detail | Yes | Yes | Yes |
| `/analytics` | Progress analytics | Yes | Yes | Yes |
| `/journal` | Private journal | Yes | Yes | Yes |
| `/profile` | Profile/OAuth/bodyweight | Yes | Yes | Yes |
| `/forbidden` | Forbidden page | Yes | No | No |

No separate exercises page exists. Exercise selection is embedded in workouts and analytics.

### UI/UX capability

Implemented:

- Dark-first UI
- Responsive Tailwind layouts
- Desktop sidebar and mobile sheet navigation
- Loading, empty, error, and retry states
- Destructive confirmations
- Form validation and disabled/loading states
- Dialogs and Recharts visualizations
- Keyboard focus styles
- Semantic buttons and links
- Accessible labels and live status messages
- Reduced-motion support for animated anatomy feedback
- Custom 403/404/error pages

Not verified automatically:

- Required responsive device matrix
- Screen-reader compatibility
- Automated contrast testing
- Browser E2E testing
- Offline and comprehensive network-failure behavior

The UI is dark-first and contains theme variables, but no complete user-facing theme switcher was found.

## Frontend data flow

### Login

```text
Login page
→ AuthContext.login()
→ authService.login()
→ Axios POST /auth/login/
→ Django CSRF and credential validation
→ HttpOnly access/refresh cookies
→ user payload
→ AuthContext state
→ protected route
```

### Exercise search

```text
Workout/analytics page
→ useExercises()
→ GET /exercises/?search=...
→ ExerciseViewSet
→ user-scoped queryset/filtering/pagination
→ selector/chart
```

### Create custom exercise

```text
Workout detail
→ useCreateExercise()
→ POST /exercises/custom/
→ serializer assigns current user and custom state
→ exercise becomes available to that user
```

### Create workout and add set

```text
NewWorkoutDialog
→ useCreateWorkout()
→ POST /workout-sessions/
→ draft created
→ workout detail
→ useCreateExerciseSet()
→ POST /exercise-sets/
→ ownership/range/status validation
→ set persisted
→ React Query invalidation
```

### Dashboard/progress analytics

```text
Dashboard or analytics page
→ React Query hooks
→ analytics endpoints
→ completed user-owned set aggregation
→ Recharts/stat cards/activity feed
```

Known contract/behavior gap: the frontend treats completed workouts as immutable, but backend workout-level update/delete routes do not enforce that rule.

## Mock-data audit

No active mock data or fake statistics were found in current product flows. Dashboard, analytics, workout, profile, journal, and authentication flows use real APIs.

Browser storage is used for preferences and temporary flow state:

- redirect destination
- weight unit
- reset identifier
- pending verification identifier

JWTs are not stored in localStorage or sessionStorage.

Likely cleanup candidates:

- `frontend/src/services/workoutService.ts`, which appears unused
- unused analytics hooks such as `useTotalVolume` and `useEstimated1RM`

## Workout logger and anatomy capability

The intended signature experience is partially supported:

- Workout logger page
- Exercise search
- Custom exercise creation
- Primary muscle-group association
- Large-screen split layout
- Workout logger and anatomy panel
- Inline SVG figure
- Muscle-group highlighting
- Framer Motion transitions
- Reduced-motion handling
- Mobile stacking

The best existing architecture is React plus inline SVG plus Framer Motion, driven by `exercise.muscle_group`. Canvas or external anatomy libraries are not currently necessary.

Missing:

- Front/back anatomy views
- Multiple primary/secondary muscle mappings
- Muscle intensity levels
- Exercise-specific media
- Animated exercise demonstrations

## Performance audit

Positive findings:

- React Query caching
- Limited query retries
- Exercise pagination capped at 50
- `select_related` and `prefetch_related`
- Database aggregation for volume analytics
- Ownership/date indexes
- OAuth response-size limits
- Request body size limit
- No large tracked media assets

Concerns:

- Completed workout history is unpaginated.
- Journal and bodyweight lists are unpaginated.
- Dashboard loads full nested workout/set history for some derived metrics.
- Workout serialization repeatedly calculates related totals.
- No bundle analysis, load testing, or lower-end-device testing.
- Recharts may become expensive with large histories.
- Some unused hooks/services add maintenance noise.

## Security audit

| Security area | Current status | Evidence | Risk |
|---|---|---|---|
| `SECRET_KEY` | Partial | Environment-driven; temporary generated key in debug | Production must provide a persistent strong key |
| `DEBUG` | Partial | Defaults true locally; production gates exist | Deploy check warns in local mode |
| `ALLOWED_HOSTS` | Partial | Environment-controlled and required in production | Deployment values unverified |
| CORS | Complete | Explicit origins and credentials; no wildcard | Production origin still needs verification |
| CSRF | Complete | Middleware and explicit unsafe-request enforcement | Production origin values must be correct |
| JWT | Complete | Short-lived access, rotating refresh, blacklist | No session-management UI |
| Token storage | Complete | HttpOnly cookies; no JWT browser storage | Bearer support exists for future clients |
| Cookies | Complete | HttpOnly, Secure in production, SameSite, scoped paths | Production deployment unverified |
| HTTPS | Missing locally | Production settings require HTTPS | No deployed TLS/domain verification |
| Security headers | Partial | HSTS, nosniff, framing, referrer, permissions, CSP | CSP permits unsafe inline allowances |
| Rate limiting | Partial | Global and scoped DRF throttles | Default cache is unsuitable for multi-instance production |
| Permissions | Complete | DRF permissions and ownership filters | Admin audit logging absent |
| Object authorization | Complete | User-scoped querysets and relation validation | Completed-workout mutability remains a correctness issue |
| OAuth | Partial | Signed state and verified provider emails | Real deployment unverified |
| Secrets | Partial | Environment variables and ignored env files | Git-history scan not verified |
| Journal privacy | Complete | Owner filtering and minimized serializer/logging | No retention/deletion policy |
| Error handling | Complete | Generic API 500s and frontend error pages | No managed centralized logging |
| Backups | Not implemented | No backup configuration/runbook | High operational risk |
| Monitoring | Not implemented | No monitoring/alerting integration | High operational risk |
| Legal/privacy pages | Not implemented | No privacy/terms/data-deletion flows | Production/compliance gap |

The local `check --deploy` warnings were:

- HSTS not enabled in the current debug configuration
- SSL redirect disabled
- secure session cookies disabled
- secure CSRF cookies disabled
- `DEBUG=True`

Production settings conditionally enable these controls, but deployment was not available for verification.

## Testing capability

### Backend

40 Django tests passed. They cover authentication, CSRF, registration, verification, password reset, JWT lifecycle, OAuth state/linking, exercises, favorites/recents, workouts, sets, bodyweight, analytics, journal privacy, and cross-user access.

### Frontend

| Area | Status |
|---|---|
| ESLint | Passing |
| TypeScript no-emit | Passing |
| Component tests | Not implemented |
| Integration tests | Not implemented |
| Browser E2E | Not implemented |
| Accessibility automation | Not implemented |
| Visual regression | Not implemented |
| Offline/network testing | Not implemented |
| Production build | Existing artifacts present; fresh build not run during audit |

### CI/CD

GitHub Actions runs backend checks/tests and a frontend production build. It does not explicitly run frontend lint.

## DevOps audit

| Capability | Status |
|---|---|
| Dockerfile | Not found |
| docker-compose.yml | Not found |
| Nginx configuration | Not found |
| PostgreSQL settings | Present |
| GitHub Actions | Present |
| Environment template | Present |
| Production settings gates | Present |
| Health/readiness endpoints | Present |
| Deployment configuration | Not implemented |
| Backup configuration | Not implemented |
| Monitoring | Not implemented |
| Rollback strategy | Not implemented |

## Git and repository hygiene

- Branch: `main`
- Remote tracking: `origin/main`
- Working tree: clean
- Lockfile: tracked
- CI file: tracked
- `.env`: not tracked
- `node_modules`: not tracked
- `.next`: not tracked
- `venv`: not tracked
- Python bytecode: not tracked
- SQLite database: ignored and not tracked

Potential hygiene issues:

- Local generated `.next`, `__pycache__`, and SQLite files exist but are ignored.
- Root `requirements.txt` duplicates `backend/requirements.txt`.
- `frontend/src/services/workoutService.ts` appears unused.
- Historical documents contain outdated implementation claims.

## Capability matrix

| Capability | Status |
|---|---|
| Authentication | COMPLETE |
| JWT | COMPLETE |
| Google OAuth | PARTIAL |
| GitHub OAuth | PARTIAL |
| Registration | COMPLETE |
| Password Reset | COMPLETE |
| Exercise Catalog | COMPLETE |
| Custom Exercises | COMPLETE |
| Favorites | COMPLETE |
| Workout Logging | PARTIAL |
| Exercise Sets | COMPLETE |
| Bodyweight | COMPLETE |
| Analytics | COMPLETE |
| PR Tracking | COMPLETE |
| Progress Charts | COMPLETE |
| Journal | COMPLETE |
| Dashboard | COMPLETE |
| Workout Logger | PARTIAL |
| Anatomy Visualization | PARTIAL |
| Responsive UI | PARTIAL |
| Accessibility | PARTIAL |
| Testing | PARTIAL |
| Docker | NOT IMPLEMENTED |
| PostgreSQL | PARTIAL |
| Deployment | NOT IMPLEMENTED |
| Security Hardening | PARTIAL |

## Technical debt

### Critical

1. Production deployment is not present.
2. No backups, restore procedure, monitoring, or alerting.
3. HTTPS/domain/DNS are not configured or verified.
4. Completed workouts can be modified or deleted through backend generic routes despite frontend locking.
5. Real OAuth provider deployments and callback URLs have not been exercised.

### High

1. No browser E2E coverage for registration through reset and workout logging.
2. No shared production cache for distributed throttling.
3. No PostgreSQL deployment or migration rehearsal.
4. No account deletion, data deletion, retention, or export flow.
5. Workout history, journal, and bodyweight endpoints lack pagination.
6. No frontend accessibility/device matrix.
7. No password-change or session-management UI.
8. Journal autosave starts only after an entry has been manually created.

### Medium

1. Dashboard derives some statistics from full workout history in the browser.
2. Several large frontend pages combine many responsibilities.
3. No API schema/OpenAPI documentation.
4. No formal frontend unit/component testing.
5. No load testing or realistic large-dataset benchmarks.
6. CSP still permits unsafe inline script/style.
7. Duplicate root/backend requirements files.
8. Unused service/hooks and historical implementation references.

### Low

1. No theme switcher despite theme variables.
2. No PWA/offline support.
3. No advanced anatomy views or multiple muscle roles.
4. No shared chart components.
5. No social metadata/sitemap, although this is primarily a private application.

## What the current project can do

### Today, a user can…

- Register, verify email, log in, stay signed in, refresh sessions, log out, and reset a password.
- Use Google/GitHub OAuth when configured.
- Browse 110 built-in exercises.
- Search/filter exercises and create, edit, delete, favorite, and revisit custom exercises.
- Start one workout draft, log sets, record weight/reps/RPE/RIR/notes, edit draft sets, complete the workout, and review history.
- Track bodyweight and view trend/rate charts.
- View volume, PR, estimated 1RM, muscle distribution, progression, and streak analytics.
- Write, edit, autosave, and delete private journal entries.
- Use a responsive dark-first UI with mobile navigation and SVG anatomy feedback.

### Today, a user cannot…

- Reorder exercises, record per-repetition data, use offline logging, use templates/supersets/rest timers, or rely on full server-side completed-workout immutability.
- Change a password while authenticated without using reset, manage individual sessions, unlink OAuth providers, use MFA, delete/export account data, or configure retention.
- Search/paginate journals, use a production backup/restore system, or rely on verified deployed OAuth/SMTP.
- Use browser E2E, accessibility automation, or load-test coverage because those suites do not exist.

### Three most important technical blockers

1. Production operations: HTTPS, PostgreSQL, backups, monitoring, deployment, and rollback.
2. End-to-end confidence: browser E2E, mobile/accessibility testing, network failure testing, and real OAuth/SMTP verification.
3. Workout data integrity: completed-workout server-side immutability plus pagination/scaling for history and analytics.

### Three most valuable product improvements

1. Finish the signature workout logger with ordering, templates, stronger muscle mapping, and robust autosave.
2. Add reliable progress/history experiences with pagination, better progression UX, and scalable dashboard queries.
3. Add account/data lifecycle features: password change, session management, account deletion, export, retention, and MFA planning.

## Proposed phased roadmap

### Phase 1 — Stabilization

- Objective: close correctness gaps and align documentation with implementation.
- Existing: 40 passing backend tests and broad CRUD/API coverage.
- Missing: completed-workout mutation protection, cleanup, API contract documentation, updated project context.
- Likely files: `backend/workouts/views.py`, `serializers.py`, `tests.py`, unused frontend service, project documentation.
- Dependency: none.
- Commit boundary: `fix: enforce completed workout immutability`

### Phase 2 — Workout UX

- Objective: strengthen the logger into the signature product experience.
- Existing: drafts, set logging, custom exercises, SVG anatomy, Framer Motion.
- Missing: ordering, templates, supersets, rest timer, metadata autosave, richer muscle mapping.
- Likely files: workout models/serializers/views, workout hooks/detail page, anatomy component.
- Dependency: Phase 1.
- Commit boundary: `feat: improve workout logger experience`

### Phase 3 — Dashboard and history scaling

- Objective: make dashboard/history efficient at larger data volumes.
- Existing: real dashboard analytics and history.
- Missing: pagination, optimized summary endpoints, reduced full-history requests.
- Likely files: analytics/views, dashboard hooks/components.
- Dependency: Phase 1.
- Commit boundary: `perf: scale dashboard history queries`

### Phase 4 — Progress analytics

- Objective: improve progression and reporting depth.
- Existing: volume, PRs, estimated 1RM, muscle distribution, bodyweight trends.
- Missing: richer date filters, scalable aggregation, stronger progression UX, frontend tests.
- Likely files: `backend/workouts/analytics.py`, analytics hooks/page.
- Dependency: Phase 3.
- Commit boundary: `feat: expand progress analytics`

### Phase 5 — Journal

- Objective: make journaling robust for long-term use.
- Existing: private CRUD and post-create autosave.
- Missing: pagination, search/filtering, draft recovery, conflict handling, retention/export behavior.
- Likely files: journal views/serializers/hooks/page.
- Dependency: Phase 1.
- Commit boundary: `feat: improve journal history and draft recovery`

### Phase 6 — Authentication and OAuth

- Objective: complete account lifecycle behavior.
- Existing: JWT cookies, reset, verification, OAuth linking, throttles.
- Missing: real provider verification, SMTP verification, password change, session UI, unlink, MFA planning.
- Likely files: account/OAuth backend views and auth frontend components.
- Dependency: deployment environment.
- Commit boundary: `feat: add account session management`

### Phase 7 — Security hardening

- Objective: complete production security controls.
- Existing: CSRF, secure-cookie gates, headers, throttles, owner checks.
- Missing: shared cache, Git-history scan, deployment header verification, privacy/deletion flows, penetration/DAST testing.
- Likely files: settings, deployment configuration, security/account documentation and views.
- Dependency: Phase 6 and deployment infrastructure.
- Commit boundary: `feat: complete production security controls`

### Phase 8 — Performance

- Objective: support realistic data volumes.
- Existing: indexes, related-object optimization, database aggregation, React Query caching.
- Missing: pagination, load tests, bundle analysis, lower-end-device testing, cache strategy.
- Likely files: analytics/views/services and frontend hooks/components.
- Dependency: Phases 3 and 4.
- Commit boundary: `perf: add pagination and large-history safeguards`

### Phase 9 — Testing

- Objective: add confidence across real user journeys.
- Existing: backend tests, lint, TypeScript checks.
- Missing: component tests, frontend integration tests, browser E2E, accessibility automation, device matrix, offline/slow-network tests.
- Likely files: new test directories and CI workflow.
- Dependency: stabilization first.
- Commit boundary: `test: add critical browser user journeys`

### Phase 10 — PostgreSQL

- Objective: verify the production PostgreSQL path.
- Existing: conditional PostgreSQL settings and driver.
- Missing: deployed database, migration rehearsal, connection/pool verification, least-privilege credentials, backup/restore testing.
- Likely files: settings, environment templates, deployment documentation.
- Dependency: Phase 7.
- Commit boundary: `ops: verify postgres production path`

### Phase 11 — Docker

- Objective: containerize backend, frontend, and PostgreSQL.
- Existing: environment-driven settings and health endpoints.
- Missing: Dockerfiles, Compose, Nginx/reverse proxy, persistent volumes, container health checks.
- Likely files: new Docker/deployment files.
- Dependency: PostgreSQL phase.
- Commit boundary: `ops: containerize gymtracker`

### Phase 12 — Deployment

- Objective: establish a repeatable production release process.
- Existing: CI, health/readiness endpoints, production configuration gates.
- Missing: domain/DNS, HTTPS, SMTP, OAuth credentials, managed logs, monitoring, backups, rollback, deployment runbook.
- Likely files: CI workflow, deployment manifests, documentation.
- Dependency: Phases 7–11.
- Commit boundary: `ops: add production deployment runbook`

## Final assessment

The current repository is beyond a prototype: it has a working backend/frontend architecture and meaningful automated backend coverage. It should be treated as a strong pre-production application, not as a production-ready deployed service.
