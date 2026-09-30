# GymTracker — AI Development Rules

These rules constrain implementation work in this repository. When a requirement conflicts with a rule, call out the conflict before changing direction.

## 1. Product scope

- Build the personal workout-tracking workflow first.
- Keep the product private and fitness-focused.
- Do not add social, commercial, medical, nutrition, wearable, or AI/ML features without an explicit product decision.
- Prefer a small complete feature over a broad unfinished abstraction.
- Do not silently change historical workout data.
- Treat the workout logger, progress, journal, and secure account flow as first-class product areas.

## 2. Technology choices

### Backend

- Use Django/Python and Django REST Framework.
- Use the existing authentication architecture unless there is a documented reason to change it.
- Use Django ORM, migrations, serializers, services, and tests.
- Use SQLite locally.
- Keep the application PostgreSQL-compatible.
- Use environment variables for secrets and deployment configuration.

### Frontend

- Use the existing Next.js/React/TypeScript stack.
- Prefer existing project components and conventions before introducing new UI libraries.
- Use TanStack Query for server state where appropriate.
- Use Recharts for 2D analytics already supported by the product.
- Use Framer Motion for ordinary UI motion when appropriate.
- Use **Three.js for intentional 3D experiences**, especially the anatomy/workout visualization.
- Use GSAP for complex deterministic timelines where it materially improves choreography, such as the Barbell Drop login intro.
- Add a dependency only when it has a clear product/technical justification.

Do not introduce another frontend framework.

## 3. Backend/frontend boundary

- The frontend is not a security boundary.
- Authorization must be enforced by Django.
- User-owned queries must be scoped to the authenticated user before object lookup.
- Never trust IDs supplied by the frontend without ownership validation.
- Frontend validation improves UX but does not replace server validation.
- Do not put secrets or authentication tokens in frontend source or browser storage.
- Do not weaken CSP/security controls merely to hide development warnings.

## 4. Code organization

- Inspect relevant code before editing.
- Make the smallest coherent change.
- Preserve unrelated user work.
- Keep domain logic out of React components/templates where it belongs in backend services.
- Keep multi-model backend mutations transactional.
- Use descriptive names and small functions.
- Keep feature-specific frontend components focused.
- Avoid giant page components.
- Avoid speculative abstractions.
- Prefer additive migrations.
- Never rewrite/delete an applied migration merely to simplify development.
- Keep documentation synchronized with implementation.

## 5. Data integrity

- Every user-owned resource must enforce ownership.
- Archive referenced exercises rather than destroying historical meaning.
- Completed workout records must not be casually mutable/deletable through generic endpoints.
- Validate numeric ranges, reps, timestamps, units, and required fields.
- Preserve drafts where the UI promises draft recovery.
- Analytics must exclude incomplete/draft records where appropriate.
- Never invent training data for charts.

## 6. UI/UX

- Use semantic HTML.
- Use visible focus states.
- Label every form control.
- Support keyboard interaction.
- Respect `prefers-reduced-motion`.
- Maintain WCAG-conscious contrast.
- Use clear units.
- Keep primary workout actions reachable on mobile.
- Do not use color as the only state indicator.
- Provide loading, disabled, success, error, and empty states where relevant.
- Avoid generic admin-dashboard aesthetics.
- Avoid excessive glassmorphism, gradients, glow, decorative cards, and animation without purpose.
- Motion should communicate state or physical behavior.

## 7. Three.js rules

- Three.js must have a clear product purpose.
- Do not use 3D merely because it is technically impressive.
- Keep 3D components isolated from ordinary UI components.
- Lazy-load heavy 3D scenes where practical.
- Avoid one asset/model per exercise.
- Prefer data-driven scene behavior.
- Provide reduced-motion behavior.
- Maintain a usable fallback if WebGL is unavailable.
- Do not make essential workout logging depend entirely on a 3D rendering context.

## 8. Login intro rules

The Barbell Drop intro must remain a presentation layer around the real authentication flow.

Required sequence:

```text
barbell
→ plate drops
→ impacts
→ final lock-in
→ physical morph
→ login UI
```

Do not implement:

```text
animation beside login card
```

The login form must be functional after reveal or skip.

The intro must support:

- skip
- replay
- reduced motion
- deterministic development testing
- return-visit behavior

Google and GitHub are real authentication requirements. Apple may remain a UI placeholder until backend support is explicitly implemented.

## 9. Error handling

- Give actionable validation errors near the relevant field.
- Do not expose tracebacks in production.
- Roll back failed multi-model mutations.
- Log enough information to debug unexpected errors without logging credentials or private journal content unnecessarily.
- Preserve incomplete workout state where recovery is promised.

## 10. Testing

Every new domain rule or bug fix requires tests.

At minimum, test:

- ownership boundaries
- validation failures
- successful mutations
- historical-data preservation
- workout calculations
- authentication lifecycle
- critical API contracts

Frontend work should run:

- ESLint
- TypeScript checks
- production build where practical

Critical user journeys should eventually have browser E2E tests.

Visual/3D work must also be manually inspected at representative desktop and mobile sizes.

Do not weaken/delete tests to make a suite pass.

## 11. Security

- Never commit secrets.
- Never commit local databases or generated build artifacts.
- Use secure cookies in production.
- Use HTTPS in production.
- Restrict CORS.
- Configure CSRF correctly.
- Use secure OAuth state handling.
- Rate-limit sensitive authentication endpoints.
- Keep access tokens short-lived where applicable.
- Rotate/revoke refresh credentials where applicable.
- Do not expose journal contents through logs or unnecessary analytics.
- Keep production security controls enabled even if development tooling complains.
- Run Django deployment checks for production configuration.

## 12. AI working agreement

- Inspect before editing.
- State assumptions when requirements are ambiguous.
- Do not add placeholder functionality that looks complete but does not work.
- Do not claim visual completion without browser inspection for visual tasks.
- Do not claim production readiness from build success alone.
- Update project documentation after meaningful implementation changes.
- Update `Memory.md` after implementation work with completed changes, decisions, tests, and known follow-ups.

## 13. Frontend workflow and skill selection

All UI work follows `FrontendWorkflow.md`: the twelve-step process from research to final visual verification, which skill or tool to use at each step, the design rules, and the responsive and accessibility QA matrix.

The short version:

- Inspect the existing code and design language before changing anything.
- Pick only the skills the task needs; existing project decisions outrank any skill.
- A frontend task is not visually complete on TypeScript, ESLint, tests or build alone. It must be inspected in a real browser, and if that was not possible, visual acceptance is reported as pending.
- Usability, accessibility, performance, maintainability, semantic HTML, keyboard navigation and responsive behaviour are never traded for visual effect.
