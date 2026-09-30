# GymTracker — Implementation Memory

## Current focus

Phase 2A: Three.js loaded-barbell release choreography and stacked-plate login experience. Phase 2B anatomy is explicitly not started.

## Application blockers fixed (2026-09-30)

Found by a real-browser audit with Chrome DevTools MCP; fixed without any redesign.

- **API proxy loop.** Next's default trailing-slash redirect turned `/api/x/` into `/api/x`, Django's `APPEND_SLASH` redirected it back, and the browser hit `ERR_TOO_MANY_REDIRECTS`. `frontend/next.config.ts` now sets `skipTrailingSlashRedirect: true` and the `/api/:path*` rewrite always forwards with a trailing slash, which is the form every Django API route uses. Side effect: page URLs with a trailing slash (`/login/`) now render instead of redirecting to `/login`.
- **False "session expired" on public pages.** The refresh-failure handler in `frontend/src/lib/api.ts` redirected from every path except `/login`. It now redirects only when `isProtectedRoute(pathname)` is true (`frontend/src/lib/routes.ts`, mirroring the matcher in `src/proxy.ts`). Refresh, logout and the expired-session redirect on protected pages are unchanged.
- **Dark root.** No theme provider exists; the design is dark-only and the `dark` class was simply never applied. `src/app/layout.tsx` now puts `dark` on `<html>` statically (server-rendered, so no hydration mismatch) and `.dark` in `globals.css` sets `color-scheme: dark` so scrollbars and native controls follow.
- Running the frontend needs `BACKEND_API_URL=http://127.0.0.1:8000`; without it no rewrite is registered and `/api/*` returns 404.
- The root `.gitignore` has `lib/`, which ignores `frontend/src/lib/`. `routes.ts` and the existing `apiErrors.ts` are therefore untracked and need `git add -f` or a `!frontend/src/lib/` negation.
- `.env.example` line 33 (`DEFAULT_FROM_EMAIL=GymTracker <no-reply@example.com>`) is unquoted, so the documented `source .env` step fails.

## Phase 2A visual correction (2026-09-30)

The earlier result (a small CSS plate rail beside stacked form cards) was rejected after browser inspection. This pass replaced it. `resume.md` has the full description; the essentials:

- The final stack is the WebGL stack itself. The five plates that fall in the intro remain on screen beside the login; the canvas stays mounted and renders on demand once ready.
- `PlateStackSurface` lays out an empty `[data-plate-stack-slot]` box. `LoginIntro3D` solves the final camera from that box every frame and uses a camera view offset to place the stack in it. On desktop each console row is exactly one plate tall.
- One canonical plate geometry (`usePlateGeometry` in `WeightPlate.tsx`) is shared by all five plates: lathe-turned rubber body, steel hub with a bore, amber rim stripe, "20 KG" rim marking.
- The bar is loaded 3 + 2 so the five bar plates are the five stack plates. It pivots upright on its end, the plates drop, the bar exits upward, then one camera move carries the stack to its slot and the console emerges.
- The login is one console: brand head plus five hairline-separated rows with row indices and leaders to the plates. The per-field cards, the divider and the unwired "Remember this device" checkbox are gone.
- Rotation dimming was caused by fog and distance-attenuated point lights while the camera pulled back. Both were removed; light is a once-baked studio environment map, a hemisphere light and directional lights.
- Skip, reduced motion and return visits jump the same timeline to its end, so they show the identical final composition. WebGL failure falls back to a CSS stack in the slot.
- Dust particles were removed (they read as stray dots). `DustParticles.tsx` is deleted.
- drei's `<Environment>` re-rendered every frame and is not used; `@react-three/drei` is now unused by the login.
- `/login?intro=debug&at=<seconds>` freezes the timeline for inspection. `frontend/scripts/login-visual-debug.cjs` captures all acceptance viewports and the timeline.

Validation: lint, `tsc --noEmit` and `npm run build` pass. Playwright screenshots were inspected at 360x800, 390x844, 430x932, 768x1024, 1440x900 and 1920x1080 with no overflow. All QA ran on Chromium's software renderer; real GPU and real phones are not yet checked, and the user's reference image was not available in the session.

The sections below describe earlier passes and are kept for history; where they disagree with this section, this section is current.

## Final 3D choreography pass

- The opening scene contains a fully loaded horizontal barbell with real 3D plate objects on both sleeves.
- The assembly enters, rotates approximately 90 degrees around Z into a vertical bar, and settles before release.
- Once upright, plates detach from their loaded local X positions and fall down the vertical shaft one at a time. Their local X target is the vertical stack coordinate, so the motion is physically tied to the bar rather than an unrelated screen-space stack.
- Each plate has a per-plate release time, fall duration, stack target, controlled release rotation, impact compression, rebound, settle, and a landing dust event.
- Plates accumulate at the bottom with distinct thickness offsets. The hardware is a separate child group, allowing the bar to exit while the plate stack remains in place.
- The camera follows the rotation, frames the complete vertical bar, then pushes toward the stack. DOM reveal begins only after the hardware exit has started and the stack is established.
- Current phases are `BAR_ENTER`, `BAR_ROTATE_VERTICAL`, `BAR_SETTLE`, `PLATE_RELEASE`, `PLATE_DROP`, `STACK_FORMING`, `STACK_SETTLE`, `STACK_TO_LOGIN`, `MORPHING`, `LOGIN_REVEAL`, and `READY`.
- Development-only `/login?intro=debug` diagnostics show phase, elapsed time, bar rotation, released count, and stacked count.

## Animation blocker resolved

The plate drop was frozen because `IntroScene`'s GSAP `useEffect` depended on `onReady`, while `LoginIntro3D` recreated its `finish` callback on every render. The timeline called `setPhase`, the parent rerendered, the effect cleanup killed the timeline, and the setup immediately reset every plate to its initial position. Stabilizing `finish` with `useCallback` prevents the timeline from being recreated by phase updates.

Temporary development diagnostics proved the fix: one timeline initialization, monotonically increasing GSAP time, changing plate positions, six release events, six landing events, and the state sequence `INTRO → BAR_ENTER → BAR_ROTATE_VERTICAL → BAR_SETTLE → PLATE_RELEASE → PLATE_DROP → STACK_FORMING → STACK_SETTLE → STACK_TO_LOGIN → MORPHING → LOGIN_REVEAL → READY`.

## Completed in this implementation pass

- Replaced the rejected giant circular login surface with a reusable `PlateStackSurface` DOM component.
- Added a visible center spine/collar and separate stacked modules for brand, inputs, action, and OAuth controls. Each module has a front face, lower thickness, contact shadow, bevel, and mechanical edge.
- Kept real DOM inputs, checkbox, links, password toggle, form submission, validation, loading feedback, and accessibility semantics.
- Reused the existing OAuth service behavior through `OAuthButtons` for Google and GitHub. Apple is not implemented by the current backend and was not faked.
- Fixed the plate-drop staging: the camera frustum was too tight for the initial `y = 3.9` plate positions, so plates were above the visible frame. The camera now has a wider vertical stage and the barbell scales per viewport.
- Kept the staggered alternating left/right drop sequence, impact compression, final stack lock-in, and camera push toward the loaded stack.
- Added finite-value guards for weight-plate dimensions and animation positions. Corrected the weight-plate torus argument ordering and all depth-derived positions.
- Scoped CSP `unsafe-eval` to development only, based on the local Next.js CSP guidance. Production CSP does not include it.

## Latest visual correction

- Falling 3D plates now use one canonical `PLATE_RADIUS` and `PLATE_DEPTH`; all six participating plates share identical dimensions while retaining restrained color variation.
- The final DOM destination is a two-part composition: a persistent five-layer plate rail on the left and the real login controls beside it. The rail remains visible after the WebGL bar exits and aligns its layers with the auth rows.
- Rotation lighting now includes stable ambient, hemisphere, front directional, and front fill contributions. No exposure, canvas opacity, or overlay animation is tied to the rotation phase.
- Responsive layout keeps the rail beside the form down to 360px without horizontal overflow; the password recovery link remains on one line at the narrowest tested width.

## Files changed for Phase 2A

- `frontend/src/components/auth/PlateStackSurface.tsx`
- `frontend/src/components/auth/LoginCard.tsx`
- `frontend/src/components/auth/OAuthButtons.tsx`
- `frontend/src/components/auth/LoginIntro3D/LoginIntro3D.tsx`
- `frontend/src/components/auth/LoginIntro3D/WeightPlate.tsx`
- `frontend/scripts/login-visual-debug.cjs` (lint-only suppression for its external Playwright `require`)
- `frontend/src/app/globals.css`
- `frontend/next.config.ts`

The prior `frontend/src/components/auth/PlateFaceSurface.tsx` was removed because the circular surface direction was rejected.

## Validation

- `npm run lint` — passed with zero errors/warnings.
- `npx tsc --noEmit` — passed.
- `npm run build -- --webpack` — blocked before compilation by the environment/Next error `Could not parse output from TypeScript's --showConfig`; this reproduced without the RTK wrapper and is not a TypeScript error from the changed files.
- Dev `/login?intro=skip` — manually checked in Chromium; no page errors and no horizontal overflow at 390px and 1440px.
- Production CSP behavior remains unchanged: `unsafe-eval` is development-only.
- `git diff --check` — passed.
- Playwright timeline script — captured all requested timestamps; screenshots showed the loaded horizontal barbell, upright rotation, individual downward plate motion, stack formation, and final DOM login.
- `/login?intro=debug` smoke check — passed; debug telemetry reported `bar rotation: 1.57rad`, `released: 6/6`, `stacked: 6/6`, and `READY` at the end.
- Final visual correction Playwright run — passed; inspected horizontal loaded barbell, vertical transition, equal-sized plates, stack formation, and the persistent beside-stack login at desktop. Skip composition was inspected at 360px, 390px, 430px, and 768px with no horizontal overflow.

## Environment limitation

The repository Playwright helper uses the installed global Playwright package and was available for this debugging pass. Full pixel-level inspection at every requested viewport remains separate from this animation-only task; the skip destination was smoke-checked at 390x844 and 1440x900 for overflow and page errors.

## Next verification steps

1. Open `/login?intro=1` and confirm each plate is visible above the bar, falls in a staggered alternating sequence, impacts, and settles into a stack before the camera push resolves into the same stacked-plate UI as `/login?intro=skip`.
2. Verify `/login` with reduced motion enabled reaches the plate-face UI without the cinematic sequence.
3. Verify Google/GitHub OAuth, login validation, forgot password, signup, keyboard order, password managers, and focus states.
4. Inspect the browser console for the original `computeBoundingSphere` NaN warning and confirm it is absent.

## Known unrelated browser messages

- Two 404 resource messages were emitted by the debug run; they were not traced or changed in this animation-only task.
- Three.js emitted `THREE.Clock` deprecation and `PCFSoftShadowMap` removal warnings, plus Chromium GPU-stall diagnostics. None were tied to the frozen animation.
