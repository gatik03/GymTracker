---
target: current UI (whole app)
total_score: 32
max_score: 40
na_heuristics: []
p0_count: 0
p1_count: 0
target_identity: "file:/home/gatik7k/gatik/misc/GymTracker/frontend/src/app"
timestamp: 2026-10-26
slug: frontend-src-app
---

Method: dual-agent (A: /root/ui_design_review · B: /root/ui_detector_review). Assessment A completed before detector evidence entered the parent context. A inspected the UI and source, then checked the corrective source changes without reading detector output. B used a separate browser context, ran the detector once, and checked the final production UI. Parent implemented fixes and exercised real API-backed workflows.

## Design health

The existing STACKD identity now carries through the main app: dark product tokens, Inter typography, green primary controls, and a localized amber login treatment. The form-first workout logger fits the phone use case; the dashboard offers a direct start/resume action.

Assessment A used the quality rubric **0 = poor, 4 = excellent**. These are qualitative judgments, not test coverage or a promise of complete accessibility conformance.

| # | Heuristic | Score | Evidence |
| --- | --- | --- | --- |
| 1 | Visibility of system status | 3 | Explicit loading, saved, error/retry and active-workout states; required fields use browser validation. |
| 2 | Match with the real world | 4 | Readable chart dates, correct exercise/set plurals, clear units and explicit estimates. |
| 3 | User control and freedom | 3 | Deletion dialogs, latest draft-set undo, journal unsaved-change confirmation; historical workout restrictions are explicit. |
| 4 | Consistency and standards | 3 | STACKD naming, documented dark tokens, common typography and shared controls. |
| 5 | Error prevention | 3 | Required/ranged inputs, server validation, confirmation before deletion, and protected journal switching. |
| 6 | Recognition rather than recall | 4 | Searchable paginated exercise picker and actual previous-session performance. |
| 7 | Flexibility and efficiency | 3 | Dashboard start/resume, form before saved sets, phone shortcut outside the form viewport. |
| 8 | Aesthetic and minimalist design | 3 | Removed duplicate PR panel, compact empty charts and two-column phone statistics. |
| 9 | Error recognition and recovery | 3 | Associated API field errors, Retry actions, undo, and separate journal save/delete failure states. |
| 10 | Help and documentation | 3 | First-workout guidance and useful empty-state explanations; no separate onboarding tour. |
| Total | | **32/40** | Improved from the archived intended-dark assessment of 20/40. |

## Original findings reconciled

- The three P0 fixes predated this pass: `skipTrailingSlashRedirect`, protected-route-only expiry redirects and a static `dark` root. Real login and public account pages were verified again.
- Applied product tokens and STACKD naming; retained the login accent exception explicitly permitted by Design.md.
- Added dashboard start/resume, linked recent sessions, removed the extra all-time PR panel, and made failed dashboard requests visible rather than presenting them as empty data.
- Replaced the logger/progress search-plus-select pair with one labelled keyboard-operable picker. Pagination reaches the complete 110-exercise catalog and has loading, error, retry and empty states.
- Logger form precedes saved sets, controls use suitable phone sizes, and the shortcut appears only while the form is out of view. Previous performance comes from actual completed workouts.
- Replaced `window.confirm` deletion prompts with project dialogs. The latest deleted draft set can be restored on the current page. Completed sessions remain read-only under Rules.md rather than adding an unsafe generic editing path.
- Added field-level API messages and native required-field validation. Journal switching confirms unsaved edits, deletion failures use independent state, and delayed autosaves preserve newer text.
- Corrected the missing-bodyweight-data contract at the API: change/rate are null until enough measurements exist; real measured zero is still zero. Frontend types and rendering match.

## Detector

One scan returned **21 warnings**: `gray-on-color` ×20 and `side-tab` ×1. The gray-on-color warnings identify near-black text on bright green actions. Measured product color pairs have contrast ratios of **8.34:1–12.92:1**; the default primary pair is **11.14:1**. These are confirmed false positives, not reasons to make button text lighter.

The side-tab warning points to the existing 2px login notice/error border, a semantic status treatment. No broad detector suppression was added.

Browser mutation preflight succeeded, but the existing CSP blocked the detector script served from another localhost port. **No browser overlay was installed.** Security policy was preserved; CLI findings and browser inspection were used instead.

## Verification

- Backend: **42 tests passed**, including missing/unchanged bodyweight cases.
- Frontend API-error helpers: **2 tests passed**; run `npm --prefix frontend run test:ui-helpers`.
- ESLint, TypeScript and configured production build passed.
- Production Chromium: dashboard, workout list, draft and completed loggers, progress, journal, profile and five public account routes at **360×800, 390×844, 430×932, 768×1024, 1440×900 and 1920×1080**. All **72 route/viewport checks** passed with no horizontal overflow or page exceptions. Protected-route API requests had no failures.
- Browser journeys covered dashboard workout creation; all six catalog pages; keyboard selection; consecutive set logging; delete/cancel/undo; completion; linked read-only history; previous performance; unsaved journal recovery; delayed autosave; separate deletion errors; duplicate bodyweight and registration validation.
- Independent browser checks covered picker focus/page retention, ARIA references, progress popup clipping, phone shortcut behavior, and dialog Escape/focus behavior.
- B's final pass found controlled-dialog focus loss and an absent mobile shortcut. Shared focus restoration and an observer attached to the actually mounted logger corrected them. B's focused confirmation then passed: both Escape paths restore opener focus; the shortcut hides near the form, appears at history, and returns focus to weight. The parent also reconfirmed final logger rendering at all six viewport sizes. Confirmation evidence is in `output/playwright/independent-final-confirmation.json`.
- Screenshots and JSON reports are local, ignored artifacts in `output/playwright/`; phone/desktop contact sheets and representative full-size images were inspected.

The initial large screenshot run exhausted the default anonymous CSRF rate allowance and some captures redirected to login. Those captures were discarded. The final run used an isolated temporary backend with a higher QA-only anonymous quota, fresh independent sessions, explicit route assertions and the production UI. Product security settings and real user data were not changed.

## Limits and follow-ups

- Console warnings remain for Recharts initial container measurement during mounting; final charts render. The overlay attempt also produces the expected CSP rejection.
- `check --deploy` under local development settings reports five warnings: HSTS, HTTPS redirect, secure session/CSRF cookies, and DEBUG. No production configuration was claimed verified.
- OAuth provider round trips need external credentials and were not exercised.
- Multi-step/persisted undo, historical workout editing, demo access and a separate onboarding tour remain outside this corrective pass.

Questions skipped: the user already authorized fixing the remaining issues; implementation and verification are complete without a new product decision.
