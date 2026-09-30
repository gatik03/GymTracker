# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, confirmed by the owner on 2026-09-30:

- **Recruiters and hiring engineers.** STACKD is deployed as a demo site that shows the owner can build a full-stack product. These visitors arrive cold, spend little time, and judge what they can see and click: the entry experience, whether real features work end to end, and whether the build looks deliberate.
- **The lifter inside the product.** The product itself is a working gym tracker. Its in-product user logs sets between exercises, usually on a phone, and later reviews progress and journal entries.

How a recruiter gets into the app is undecided: see Capabilities and Constraints.

## Product Purpose

STACKD is a working fitness tracker that doubles as a portfolio piece. It exists to demonstrate full-stack capability through a real product: authentication, data modelling, an API, analytics, and a considered frontend. Success is a visitor concluding, from the deployed site alone, that the author can design and ship a complete application.

## Positioning

A demo that is a real product, not a mock. Every screen is backed by the Django API and real persisted records; nothing on screen is placeholder data. The evidence of capability is that the features work.

## Operating Context

- Deployed publicly and reached by link from a CV, portfolio or application.
- Viewed on a recruiter's laptop first; the in-product logging flow is designed for a phone held between sets.
- Django REST backend and Next.js frontend, same-origin `/api` proxy, HttpOnly cookie authentication, Google and GitHub OAuth.

## Capabilities and Constraints

From `PRD.md`, `Architecture.md` and the code; not re-confirmed item by item:

- Registration, login, email verification, password reset, Google and GitHub OAuth.
- Exercise library (built-in and custom), workout sessions and set logging, drafts.
- Dashboard, progress analytics (volume, PRs, estimated 1RM, muscle distribution), bodyweight, private journal.
- Out of scope unless explicitly decided: social features, payments, medical or nutrition advice, AI/ML coaching, wearables, a native app.
- Django is the only authorization boundary. No mock fallbacks and no invented training data.

Undecided:

- **Demo access.** Whether recruiters get a seeded demo account, a one-click guest login, or must register. No such flow exists in the code today.
- **Demo data.** Whether a fresh account should show seeded history so dashboards and charts are not empty on first view.
- **`PRD.md` framing.** `PRD.md` still describes a private personal tool with the owner as the primary user. It predates the recruiter-demo purpose recorded here and has not been revised.

## Brand Commitments

- The user-facing brand is **STACKD** (confirmed 2026-09-30). "GymTracker" is the repository and working name; it still appears in the page title, metadata and docs.
- The login's barbell-to-plate-stack transformation is the brand's entry moment.

## Evidence on Hand

- The running application and its source.
- Backend test suite in `backend/workouts/tests.py`.
- No testimonials, user counts, customer logos, benchmarks or press exist. Future work must not invent any.

## Product Principles

1. **Working beats impressive.** A feature that functions end to end is stronger evidence than a visual effect around one that does not.
2. **First impressions are the brief.** A cold visitor decides quickly; the entry experience and the first authenticated screen carry the most weight.
3. **Honest data.** Show recorded facts, label estimates, never fabricate records to fill a chart.
4. **Logging stays fast.** The set-logging flow must remain quick enough to use between sets, whatever is built around it.
5. **Security is part of the demonstration.** Server-side authorization, cookie-based sessions and CSRF protection are features to keep intact, not obstacles to polish.

## Accessibility & Inclusion

From `Design.md` and `Rules.md`: semantic HTML, labelled controls, keyboard operation, visible focus, WCAG-conscious contrast, no colour-only status, reduced-motion support, usable from about 360px wide, and a non-WebGL fallback for anything essential.
