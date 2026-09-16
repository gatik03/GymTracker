# Gym Tracker Audit Report

> **Historical audit:** This report predates the exercise catalog, cookie authentication, OAuth, Journal, and August 30 security hardening. Use [production_security_audit.md](production_security_audit.md) for current status.

## Scope

This audit compares the current codebase against `ProjectContext.md` as of June 14, 2026, before major exercise-system changes.

## Current Architecture

### Frontend

- Framework: Next.js App Router with React 19 and TypeScript.
- State and data: `@tanstack/react-query` with Axios.
- Auth: localStorage-backed JWT storage with client-only route protection.
- Layout: shared `AppLayout` with sidebar, topbar, and protected wrapper.
- Workout flow:
  - `/workouts` opens a `NewWorkoutDialog` for session creation.
  - `/workouts/[id]` handles set logging, inline set editing, and ad hoc exercise creation.
- UI system: basic shadcn-style primitives plus custom dark styling.

### Backend

- Framework: Django + DRF + SimpleJWT.
- App structure: single `workouts` app containing models, serializers, viewsets, analytics, intelligence, admin, and tests.
- Data model:
  - `Exercise`
  - `WorkoutSession`
  - `ExerciseSet`
  - `BodyWeightEntry`
- API shape:
  - DRF `ModelViewSet`s for CRUD.
  - Separate `APIView`s for analytics and intelligence endpoints.
- Database: SQLite in local settings.

## Comparison Against ProjectContext.md

`ProjectContext.md` describes a much more complete product than the current implementation actually provides.

### Matches

- Django/DRF backend exists.
- Next.js frontend exists.
- JWT auth exists.
- React Query exists.
- Analytics and intelligence endpoints exist.
- Bodyweight tracking exists.
- Protected frontend shell exists.

### Partial Matches

- Premium UI direction exists in places, but workout flows are still fairly raw.
- User isolation exists in some querysets, but not consistently enforced at the relation-validation level.
- Workout logging exists, but the exercise-selection workflow is minimal and not production-ready.

### Major Mismatches

- The document says backend and frontend are "complete & fully verified"; they are not.
- The current exercise system is user-created only. There is no built-in catalog, no seeding system, no favorites, no search API, no filters, and no custom/built-in split.
- `/api/exercises/` does not match the intended product behavior. It is currently plain CRUD over user-owned exercises.
- Pagination, sorting, and filtering are not implemented on the current DRF list endpoints.
- The frontend workout creation flow still depends on manual entry and a plain `<select>` exercise list.
- There is no recent-exercise or favorite-exercise workflow.
- There is no service-layer abstraction on the backend beyond direct viewset/model access.

## Gap Analysis

### Exercise Domain

- Missing fields on `Exercise`:
  - `equipment`
  - `difficulty`
  - `exercise_type`
  - `is_custom`
- `created_by` is mandatory, which prevents built-in global exercises.
- No favorites relation.
- No dedicated seed/import architecture.
- No protected distinction between built-in and user-created records.

### API

- Missing endpoints:
  - `GET /api/exercises/search/`
  - `GET /api/exercises/muscle-group/`
  - `GET /api/exercises/favorites/`
  - `POST /api/exercises/:id/favorite/`
  - `DELETE /api/exercises/:id/favorite/`
  - `POST /api/exercises/custom/`
  - `PATCH /api/exercises/custom/:id`
  - `DELETE /api/exercises/custom/:id`
- Existing exercise endpoint lacks:
  - pagination
  - filtering
  - sorting
  - combined built-in + custom visibility

### Frontend UX

- No command-palette style exercise picker.
- No search-as-you-type catalog workflow.
- No muscle-group or equipment filters.
- No favorite or recent exercise sections.
- No clear step-based workout creation flow.
- Current forms still read as functional CRUD instead of product-quality workflow UI.

## Technical Debt

### Backend

- Business rules are embedded directly in viewsets and serializers.
- No reusable query/service layer for exercises.
- `fields = '__all__'` exposes more model surface than needed and makes schema changes riskier.
- No relation-level validation to ensure `ExerciseSet.exercise` belongs to the requesting user or is globally allowed.
- Analytics and intelligence logic still assume older muscle groups like `legs` and `core`.
- Tests focus on analytics and do not cover the richer exercise-domain behavior now required.

### Frontend

- API base URL is hardcoded to `http://127.0.0.1:8000/api`.
- Query hooks assume non-paginated arrays.
- Auth state is inferred from localStorage rather than token introspection or bootstrap fetch.
- Workout detail view mixes catalog lookup, custom exercise creation, and set logging in one page component.
- Types are narrow and not ready for expanded exercise metadata.

## Security Concerns

- `DEBUG=True` in settings.
- Hardcoded Django `SECRET_KEY` in source.
- `CORS_ALLOW_ALL_ORIGINS = True`.
- No DRF throttling.
- No refresh-token blacklist or logout invalidation.
- No object-level validation preventing a crafted `ExerciseSet` POST from referencing another user's exercise if queryset assumptions change.
- Frontend keeps tokens in localStorage, which is XSS-sensitive.

## Performance Concerns

- No pagination on list endpoints.
- Exercise listing would not scale once a 100+ catalog is added.
- Frontend loads complete exercise arrays and filters client-side.
- Analytics compute some values in Python loops where larger datasets could benefit from more aggregation in the database.
- Query invalidation is broad and may over-refresh unrelated screens.

## Recommended Implementation Order

1. Expand the `Exercise` domain model for built-in and custom catalog support.
2. Add a seed-based built-in exercise library and management command.
3. Add favorites and searchable catalog endpoints with pagination/filtering.
4. Add backend validation and tests for isolation and built-in/custom permissions.
5. Upgrade frontend hooks to paginated/filterable exercise APIs.
6. Replace the plain exercise select with a searchable picker supporting favorites, recents, and filters.

## Immediate Next Phase

The next safe incremental change is to implement the backend exercise catalog system first, because the current frontend picker cannot become production-ready until the API and data model support built-in exercises, favorites, and query filtering.
