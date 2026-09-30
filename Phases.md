# GymTracker — Implementation Phases

The repository already contains a substantial Django backend and Next.js frontend. These phases describe the **current product completion path**, not a hypothetical greenfield rebuild.

Each implementation phase should leave the project runnable, include relevant tests/checks, and update project documentation/`Memory.md` when decisions or capabilities change.

## Current baseline — Foundation already established

The project already has:

- Django + Django REST Framework backend
- Next.js + React + TypeScript frontend
- authentication lifecycle
- exercise catalog/custom exercises
- workout drafts and set logging
- analytics/progress
- bodyweight
- private journal
- responsive UI
- initial anatomy experience
- security controls
- backend automated coverage

Treat the existing implementation as the baseline. Do not rebuild working functionality merely to match an older document.

---

## Phase 1 — Login experience and frontend visual foundation

### Goal

Finish the premium GymTracker entry experience and establish the visual/interaction conventions for the frontend.

### Deliverables

- Barbell Drop login intro
- full-screen cinematic initial state
- physical plate drops and impacts
- final lock-in
- physical morph into login UI
- skip/replay/reduced-motion support
- deterministic development replay
- real existing login integration
- Google/GitHub integration points
- Apple as UI placeholder only unless backend support is explicitly added
- responsive login
- accessibility validation

### Exit criteria

A browser user can:

1. open login
2. see the barbell/plate sequence
3. skip it at any point
4. replay it
5. use reduced motion
6. reach a fully functional login form
7. use the form with keyboard/mobile layouts

The login must visually communicate:

> equipment transforms into the interface.

---

## Phase 2 — Three.js frontend foundation and anatomy

### Goal

Replace the current limited anatomy presentation with a reusable Three.js-backed visual system where 3D genuinely improves the workout experience.

### Deliverables

- Three.js scene architecture
- reusable human/anatomy model
- broad muscle-region mapping
- exercise → primary muscle mapping
- smooth muscle transitions
- responsive desktop/mobile composition
- reduced-motion behavior
- WebGL fallback
- lazy loading for the 3D scene
- performance safeguards

### Exit criteria

Selecting an exercise updates the appropriate broad muscle region smoothly without interfering with workout logging.

The logger remains usable if the 3D scene is unavailable.

---

## Phase 3 — Signature workout logger

### Goal

Make workout logging the fastest and most reliable interaction in the product.

### Deliverables

- polished exercise picker
- fast set entry
- previous-performance display
- weight/reps/RPE/RIR
- set notes/classification
- immediate set persistence
- draft recovery
- accidental-navigation protection
- undo/recovery for destructive set actions
- exercise ordering
- clear completion summary
- completed-workout server-side immutability
- mobile-first refinement

### Optional later additions

- rest timer
- exercise reorder
- templates
- supersets/circuits
- advanced per-repetition data

These should not slow ordinary set logging.

### Exit criteria

A user can complete a real workout on a phone without losing data or getting trapped by the interface.

---

## Phase 4 — Dashboard and history scaling

### Goal

Make the dashboard and history efficient with realistic amounts of training data.

### Deliverables

- paginate workout history
- paginate journal/bodyweight histories where required
- optimize dashboard summary queries
- avoid downloading unnecessary full history
- ensure daily charts distinguish no workout from zero volume
- retain React Query caching
- remove unused hooks/services
- add loading/error/empty states consistently

### Exit criteria

Large histories do not cause obviously unnecessary client work or slow dashboard rendering.

---

## Phase 5 — Progress experience

### Goal

Make Progress clearly answer:

> Am I getting better?

### Deliverables

- strength progression
- volume trends
- PRs
- estimated 1RM
- muscle distribution
- bodyweight trend
- useful date filters
- exercise history
- previous-performance views
- clear labeling of estimates
- frontend tests for derived calculations where practical

### Exit criteria

A user can identify recent and historical progress for an exercise without inspecting raw database records.

---

## Phase 6 — Journal robustness

### Goal

Make the private journal dependable for long-term use.

### Deliverables

- pagination
- search/filtering if usage justifies it
- stronger draft recovery
- conflict/version handling if needed
- save-state feedback
- privacy/security review
- export/retention considerations

### Exit criteria

A user can write and recover journal content without unnecessary loss or exposure.

---

## Phase 7 — Account lifecycle and OAuth completion

### Goal

Finish account management around the existing authentication foundation.

### Deliverables

- verify real Google OAuth deployment
- verify real GitHub OAuth deployment
- verify SMTP/email delivery
- authenticated password change
- session management UI
- OAuth unlinking rules
- account/data deletion flow
- personal-data export
- MFA planning/implementation if approved

### Exit criteria

Authentication works through real provider environments and account lifecycle behavior is documented and tested.

---

## Phase 8 — Security hardening

### Goal

Close production security gaps.

### Deliverables

- production secret/config verification
- strict CORS
- CSRF verification
- secure cookie verification
- security-header review
- CSP tightening where practical
- authentication rate-limit review
- shared production cache for distributed throttling
- Git-history secret scan
- journal privacy review
- deployment security checks
- security documentation

### Exit criteria

Production configuration passes deployment checks and sensitive flows have explicit security tests.

---

## Phase 9 — Frontend testing and accessibility

### Goal

Move beyond static checks into real browser confidence.

### Deliverables

- component tests where valuable
- frontend integration tests
- browser E2E for:
  - registration
  - login
  - verification
  - password reset
  - workout logging
  - workout completion
  - journal
  - progress
- accessibility automation
- keyboard testing
- reduced-motion testing
- mobile viewport matrix
- slow-network/error-path testing
- visual regression for important UI where practical

### Exit criteria

Critical user journeys can be repeatedly verified in CI.

---

## Phase 10 — Performance and large-data behavior

### Goal

Ensure the application remains responsive as history grows.

### Deliverables

- API pagination
- query profiling
- database indexes where justified
- bundle analysis
- Three.js performance profiling
- chart optimization
- mobile/lower-end-device testing
- load testing for important endpoints
- caching strategy

### Exit criteria

The application has measured performance characteristics rather than relying only on local development behavior.

---

## Phase 11 — PostgreSQL production path

### Goal

Move from local SQLite development to a verified production database path.

### Deliverables

- PostgreSQL deployment
- migration rehearsal
- connection configuration
- least-privilege credentials
- backup strategy
- restore test
- database health checks
- connection/pooling verification

### Exit criteria

A production-like PostgreSQL environment can be migrated, backed up, restored, and tested.

---

## Phase 12 — Docker and deployment

### Goal

Create a repeatable production deployment.

### Deliverables

- backend Dockerfile
- frontend Dockerfile
- PostgreSQL production strategy
- reverse proxy if required
- health checks
- persistent volumes where required
- environment configuration
- CI/CD deployment flow
- HTTPS/domain configuration
- monitoring
- backups
- rollback procedure
- deployment runbook

### Exit criteria

A clean environment can reproduce the production deployment from documented steps.

---

## Phase 13 — Deliberate future enhancements

Only begin after the core product demonstrates a real need.

Possible work:

- Flutter mobile client
- offline workout logging
- richer 3D anatomy
- exercise media
- templates/supersets
- rest notifications
- MFA
- optional coach workflows
- external integrations

Do not add these simply because they are technically possible.
