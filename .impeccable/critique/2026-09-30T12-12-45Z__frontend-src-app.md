---
target: current UI (whole app)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 3
target_identity: "file:/home/gatik7k/gatik/misc/gym_tracker/GymTracker/frontend/src/app"
timestamp: 2026-09-30T12-12-45Z
slug: frontend-src-app
---
Method: dual-agent (A: design review, B: detector + browser). Caveat: the parent ran `impeccable detect` before Assessment A returned; A itself was isolated from detector output.

## Design Health Score (intended dark design; shipped light-token state is about 8/40)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Disabled "Start workout" / "Log in" give no reason |
| 2 | Match system / real world | 3 | Raw ISO date on chart axis, "1 exercises" |
| 3 | User control and freedom | 2 | No undo; completed workouts locked with no edit path |
| 4 | Consistency and standards | 1 | Two brands, two accents, two type systems |
| 5 | Error prevention | 2 | window.confirm for every destructive action |
| 6 | Recognition rather than recall | 2 | Search box plus separate select; no previous performance |
| 7 | Flexibility and efficiency | 1 | No start-workout action on the dashboard |
| 8 | Aesthetic and minimalist design | 2 | Dashboard repeats one fact across several cards |
| 9 | Error recovery | 2 | Page-top banner, not field-level |
| 10 | Help and documentation | 2 | Good helper copy, no onboarding |
| Total | | 20/40 | Acceptable (shipped state: Critical) |

## Priority issues
- [P0] /api proxy redirect loop: Next strips the trailing slash, Django adds it back; every API call fails with ERR_TOO_MANY_REDIRECTS, so login cannot work.
- [P0] Logged-out visitors are bounced from /register and /forgot-password to /login?session=expired by the 401 handler in lib/api.ts.
- [P0] <html> has no `dark` class: dark-designed components render on a white page; page titles are 1.0:1 contrast and set values are invisible.
- [P0/P1] Brand and theme split: login is STACKD/amber/mono, app is GymTracker/emerald/Inter on stock shadcn tokens; Design.md tokens are not implemented.
- [P1] Dashboard has no primary action; recent workouts are not links; duplicate PR cards.
- [P1] Logger is not phone-first: log form below the exercise cards, no sticky Add set, 32-36px targets, select capped at 50 of 110 exercises.
- [P2] Empty states show invented zeros ("30-day change 0 kg").

## Detector
20 findings, all `gray-on-color` (text-zinc-950 on emerald): false positives, contrast 7.8:1 to 10.3:1. Browser overlay blocked by the page CSP (script-src 'self').
