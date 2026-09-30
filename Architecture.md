# GymTracker — Architecture

## 1. Architectural direction

GymTracker uses a **Django backend + Next.js frontend** architecture.

The backend owns authentication, authorization, business rules, persistence, analytics, and API contracts. The frontend owns the product UI, interaction flow, responsive behavior, animation, and visualization.

The application is a private fitness product first. It should remain understandable and maintainable while allowing the frontend to provide a polished, responsive experience.

The frontend is a real application layer, not a collection of mock screens. All personal data and important state must ultimately be validated and persisted by the backend.

Three.js is the approved 3D rendering layer for experiences that genuinely benefit from 3D, including the anatomy/visual workout experience and future 3D product interactions. Three.js must not be introduced merely for decoration.

## 2. Technical stack

### Backend

- Python 3.12+
- Django 6.x
- Django REST Framework
- SimpleJWT/session-cookie authentication as implemented by the project
- SQLite for local development
- PostgreSQL as the production database
- Django ORM and migrations
- Django test framework / DRF API tests
- Environment variables for secrets and deployment configuration

### Frontend

- Next.js 16+
- React 19+
- TypeScript with strict checking
- Tailwind CSS / existing project styling conventions
- shadcn/Radix components where appropriate
- TanStack Query for server-state caching
- Recharts for 2D analytics
- Framer Motion where appropriate for ordinary UI transitions
- **Three.js for intentional 3D experiences**
- GSAP where a deterministic timeline is materially better suited to a complex cinematic sequence, such as the login barbell intro

Do not introduce a second framework or rendering system without a concrete requirement.

## 3. System boundaries

```text
Browser
  ↓
Next.js frontend
  ├── UI / responsive layout
  ├── client interaction
  ├── React Query server-state cache
  ├── charts
  ├── Three.js visual experiences
  └── animation orchestration
        ↓
Django REST API
  ├── authentication
  ├── authorization
  ├── validation
  ├── domain services
  ├── analytics
  └── persistence
        ↓
Database
  ├── SQLite locally
  └── PostgreSQL in production
```

The frontend must never be treated as the security boundary.

Authorization, ownership, validation, and data integrity belong on the backend.

## 4. Backend domain

Current/required product domains include:

- authentication and account lifecycle
- exercises
- workout sessions and sets
- bodyweight
- analytics/progress
- private journal
- profile/preferences
- favorites/recent exercises
- OAuth identities

Core workout records should remain historical and user-scoped.

Important invariants include:

- user ownership
- valid set values
- unique set ordering where applicable
- one active draft per user where the workflow requires it
- completed-workout immutability at the API boundary
- archived exercises remaining valid historical references

Where routines/templates are implemented, a workout should preserve enough session-specific information that later routine edits do not silently rewrite history.

## 5. Frontend structure

The current frontend is organized by routes, components, hooks, context, services, and shared UI.

A suitable direction is:

```text
frontend/src/
├── app/
│   ├── login/
│   ├── register/
│   ├── workouts/
│   ├── analytics/
│   ├── journal/
│   ├── profile/
│   └── ...
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── workouts/
│   ├── analytics/
│   ├── anatomy/
│   ├── journal/
│   ├── layout/
│   └── ui/
├── context/
├── hooks/
├── lib/
└── services/
```

Use feature-oriented components rather than one giant page component.

## 6. Data flow

Typical authenticated flow:

```text
Next.js route
  → React component/hook
  → service / React Query
  → Django API
  → authorization + validation
  → service/domain logic
  → ORM/database
  → serialized response
  → React Query cache
  → UI
```

The frontend may provide optimistic or immediate-feeling interactions, but the server remains authoritative.

## 7. Workout data model direction

The current application uses workout sessions, exercises, sets, bodyweight, and related records.

The long-term workout model should support:

- session metadata
- ordered exercises
- set classification
- weight/reps
- RPE/RIR
- notes
- timestamps
- draft/completed state
- historical stability

If routines/templates are added, prefer a session-specific exercise snapshot/reference so editing a routine does not silently alter completed history.

## 8. Request and data rules

- Views/API endpoints coordinate HTTP concerns.
- Services own multi-model mutations and transactions.
- Serializers/forms validate input.
- Model/database constraints protect data integrity.
- Every user-owned query is scoped to the authenticated user before object lookup.
- Completion and other multi-record mutations must be atomic.
- Long histories must be paginated.
- Use `select_related`/`prefetch_related` and query optimization where profiling or known access patterns justify it.
- Analytics must operate on real completed workout data.
- Missing workout days must not be represented as zero-volume workouts when the intended visualization means “no recorded session”; use gaps/nulls where appropriate.

## 9. Authentication and security boundary

The backend is the trusted authentication boundary.

Required/implemented account capabilities include:

- username/email + password authentication
- registration
- email verification
- password reset
- logout
- short-lived access credentials
- refresh rotation/revocation where applicable
- secure cookie handling
- CSRF protection for cookie-authenticated mutations
- Google OAuth
- GitHub OAuth
- secure OAuth state handling
- account linking rules

Apple may appear as a visual login option in the current design prototype, but it is **not an authentication backend requirement until explicitly implemented**.

JWTs must not be stored in localStorage/sessionStorage.

## 10. 3D architecture

Three.js is used only where it provides meaningful spatial or interactive value.

Primary intended use:

```text
Workout Logger
      ↓
Exercise selected
      ↓
Three.js anatomy scene
      ↓
Broad muscle region highlighted
      ↓
Smooth transition to next exercise
```

The anatomy system should be:

- responsive
- performant
- accessible
- driven by exercise → muscle mapping
- simplified to broad training regions
- independent of medical/diagnostic claims

Avoid loading a separate 3D asset for every exercise.

Prefer a reusable scene with data-driven muscle-region highlighting.

Use lazy loading for heavy 3D components.

## 11. Login animation architecture

The login intro is a dedicated cinematic experience:

```text
Dark gym scene
  ↓
barbell enters
  ↓
plates fall and land
  ↓
final physical lock-in
  ↓
bar/plates morph
  ↓
login interface forms
  ↓
normal interactive login
```

The intro must not be a permanent two-column marketing panel.

The physical assembly is the visual origin of the final login UI.

Use GSAP for deterministic choreography when implementing this sequence.

The intro must support:

- skip
- replay
- reduced motion
- return-visit behavior
- deterministic development testing
- keyboard accessibility

## 12. Performance

- Keep server components server-side where appropriate.
- Use client components only when interaction requires them.
- Use TanStack Query for server-state caching.
- Paginate large collections.
- Avoid unnecessary refetching and rerendering.
- Lazy-load Three.js and heavy visualization code.
- Animate primarily transform/opacity.
- Avoid large particle systems.
- Avoid unnecessary dependencies.
- Optimize charts and large history views.
- Test on mobile and lower-end devices before production.

## 13. Deployment

Local:

- SQLite
- development environment variables
- local Django/Next.js servers

Production target:

- PostgreSQL
- HTTPS
- secure cookies
- restricted CORS
- correct CSRF origins
- production secrets
- backups and restore procedure
- monitoring/error reporting
- health/readiness checks
- repeatable deployment and rollback process

Docker and deployment infrastructure are implementation phases, not reasons to compromise the application architecture.

## 14. Integration boundaries

External services must be isolated behind explicit modules/services.

Current relevant integrations:

- Google OAuth
- GitHub OAuth
- email delivery

Future integrations must define:

- credentials
- failure handling
- retry behavior where appropriate
- privacy implications
- tests
- configuration through environment variables

Do not add social feeds, wearables, payments, or unrelated external services without an explicit product decision.
