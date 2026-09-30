# GymTracker Phase 2A Resume

## Current task

Phase 2A: the Three.js login transformation. Phase 2B anatomy must not begin.

```text
horizontal loaded barbell
        ↓
barbell is stood up on its end (90°)
        ↓
identical plates release and fall down the vertical bar
        ↓
plates accumulate into a physical stack
        ↓
bar is drawn up and out
        ↓
camera moves in; the stack takes its place beside the login
        ↓
[ physical plate stack ]  [ STACKD. / login console ]
```

## How the implementation works now

### One WebGL stack, from the first frame to the final login

The final stack is no longer a CSS imitation. The five plates that fall in the intro are the same five meshes that sit beside the login afterwards. The canvas stays mounted; once the intro resolves it renders on demand (`frameloop="demand"`), so a static login costs no continuous GPU work.

- `PlateStackSurface.tsx` lays out an empty box, `[data-plate-stack-slot]`, beside the console.
- `LoginIntro3D.tsx` reads that box every frame and solves the final camera so the front rim of the stack spans it exactly. A camera view offset (lens shift) slides the stack into the slot without off-axis distortion.
- On desktop the slot is five console rows tall, so plate N sits beside row N (email, password, log in, Google, GitHub). A hairline leader joins each plate to its row.
- Below 900px the stack sits above the console.
- `/login?intro=skip`, reduced motion and return visits build the same timeline and jump it to its end, so they show the identical final composition.
- If WebGL is unavailable the error boundary reports it and the slot draws a CSS stand-in stack; the login still resolves.

### Canonical plate

`loginIntroTypes.ts` holds `PLATE_RADIUS`, `PLATE_DEPTH`, `PLATE_GAP`, `PLATE_COUNT`. `WeightPlate.tsx` builds one set of geometry (`usePlateGeometry`) that every plate shares: a lathe-turned rubber body with a raised lip, recessed web, hub boss and bevelled edge, a steel hub insert with a real bore, an amber rim stripe and a "20 KG" rim marking. No plate is scaled individually.

### Timeline (GSAP, 5.15s)

| Time | Phase |
| --- | --- |
| 0.02 | `BAR_ENTER`: loaded bar is set down |
| 0.75–1.75 | `BAR_ROTATE_VERTICAL`: bar pivots upright on its end |
| 1.75 | `BAR_SETTLE` |
| 1.96 | `PLATE_RELEASE` |
| 2.0–3.33 | `PLATE_DROP` / `STACK_FORMING`: three lower plates drop the sleeve's free travel, two upper plates free-fall the shaft; each compresses and rebounds |
| 3.59 | `STACK_SETTLE` |
| 3.7 | `STACK_TO_LOGIN`: bar exits upward; from 3.9 the camera moves in and the stack travels to its slot |
| 4.7 | `LOGIN_REVEAL`: console emerges |
| 5.15 | `READY` |

Camera shots are recomputed every frame from the live layout, so resizing at any point is safe.

### Lighting

The rotation dimming came from scene fog (7.5–15 units) and distance-attenuated point lights: the camera pulled back during the rotation and the bar faded toward the background. Fog and point lights are gone. Light is now a baked studio environment map (four soft boxes, generated once with `PMREMGenerator`), a hemisphere light and two directional lights. None of them fall off with distance. Nothing animates exposure, canvas opacity or an overlay.

### Development aids

- `/login?intro=debug` shows phase, timeline time, bar rotation, released and stacked counts.
- `/login?intro=debug&at=2.4` freezes the timeline at 2.4s.
- `node scripts/login-visual-debug.cjs <outDir>` (from `frontend/`, dev server running) captures the skip state at six viewports, a real-time run, and frozen timeline frames at desktop and mobile, and writes `report.json`.

## Decisions worth knowing

- **Five plates, loaded 3 + 2.** The brief requires five plates in the stack, and the stack is the same objects as the bar's load, so the bar carries three plates on the lower sleeve and two on the upper. Changing to a symmetric 3 + 3 means adding one entry to `PLATE_SPECS`, setting `PLATE_COUNT = 6`, and adding a sixth console row.
- **Dust particles were removed.** At the framing the shot needs they read as stray dots. Impact is carried by compression, rebound and a small camera kick.
- **The non-functional "Remember this device" checkbox was removed.** It was never wired to anything.
- **drei's `<Environment>` is not used.** It re-rendered the environment every frame (about 0.9s per frame under software rendering). `@react-three/drei` is now unused by the login and can be dropped from `package.json` if nothing else needs it.

## Validation

- `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.
- Playwright, Chromium headless, screenshots inspected: skip state at 360x800, 390x844, 430x932, 768x1024, 1440x900, 1920x1080; no horizontal overflow and no vertical scroll at any of them.
- Real-time intro reaches `READY` at 1440x900 and 390x844 and ends on the same composition as skip.
- Also checked: error message in the console head (stack follows the rows), filled/enabled submit, keyboard order, reduced motion, WebGL-unavailable fallback, skip mid-intro, replay, live resize, 844x390 landscape.
- Only console error: `/api/auth/csrf` 404, because the Django backend was not running. Warnings: `THREE.Clock` deprecation from react-three-fiber, and Chromium's software-GL `ReadPixels` stall during screenshots.

## Not verified

- Real GPU hardware and real phones. All QA ran on Chromium's software renderer.
- The user's reference image. It was not available in the session; the composition follows the written brief.
- Login, OAuth and password reset against a running backend (the auth code paths were not changed).

## Next

1. User visual acceptance on a real display.
2. Decide 3 + 2 versus 3 + 3 loading.
3. Do not begin Phase 2B until Phase 2A is accepted.
