# STACKD / GymTracker — Frontend Workflow

How UI work is done in this repository. It applies to anything that changes what a user sees in `frontend/`. Backend-only and behaviour-only changes skip it.

Read with `Design.md` (the visual system), `PRODUCT.md` (who the product is for) and `Rules.md` (engineering rules).

## Precedence

When sources disagree, the higher one wins:

1. An explicit instruction from the owner for the task at hand.
2. `PRODUCT.md`, `Design.md`, `Rules.md` and the existing, working implementation.
3. Accessibility, performance, responsive behaviour and maintainability.
4. Guidance from any skill or tool below.
5. Decorative preference.

A skill is advice. It never justifies replacing a working component, swapping the design system, or adding a dependency on its own say-so.

## The process

```text
1  RESEARCH                   what is being asked, for whom, and what already exists
2  INSPECT EXISTING CODE      components, tokens, patterns, the route being changed
3  DESIGN DIRECTION           one stated direction, consistent with Design.md
4  DESIGN SYSTEM              tokens, type, spacing, states; reuse before adding
5  IMPLEMENT                  smallest coherent change
6  RUN APPLICATION            dev server up, the real route loaded
7  INSPECT IN REAL CHROME     DOM, console, network, actual rendering
8  IMPECCABLE CRITIQUE        detector plus critique on what was built
9  FIX                        one batch, from steps 7 and 8
10 RESPONSIVE QA              the viewport matrix below
11 ACCESSIBILITY QA           keyboard, focus, labels, contrast, reduced motion
12 FINAL VISUAL VERIFICATION  screenshots looked at, then reported
```

Notes on the steps that are easy to skip:

- **1–2.** Read the route, its components and `globals.css` before proposing anything. State what is being kept.
- **3.** Write the direction down in a sentence or two before writing code. If it cannot be stated, it is not decided.
- **6–7.** Source code is not evidence of how a page looks. Nothing is visually verified until it has been loaded in a browser.
- **8–9.** Critique once, fix once, confirm once. Do not loop on polish.
- **12.** Lint, TypeScript and build passing say nothing about appearance. If browser inspection was not possible, report visual acceptance as pending.

## Which tool for which step

| Need | Use | Steps |
| --- | --- | --- |
| Visual direction, art direction, typography, hierarchy | `frontend-design` | 3 |
| Design-system and UX decisions: tokens, components, states, responsive rules, accessibility | `ui-ux-pro-max` | 3, 4, 11 |
| Implementation, reference matching, visual refinement | `astra-frontend-design` | 5, 9 |
| Critique, anti-pattern detection, polish checks | Impeccable (`/impeccable critique`, `/impeccable audit`, the design hook) | 8 |
| An existing component that fits | shadcn MCP (search the registry first, then `npx shadcn add`) | 4, 5 |
| Real browser inspection: DOM, console, network, screenshots, emulation, Lighthouse | Chrome DevTools MCP | 7, 10, 11, 12 |
| Spatial, 3D, GSAP or advanced motion | `antigravity-design-expert` | only when it genuinely improves the product |
| Apple HIG principles | `apple-design` | only when HIG-style behaviour is appropriate |
| A capability none of the above covers | `find-skills` | as needed |

Rules for using them:

- Pick the skills the task needs. Do not invoke all of them by default, and do not combine conflicting design systems.
- `antigravity-design-expert` defaults to glass, depth and weightless motion, which `Design.md` restricts. Use it for the login intro and the planned 3D anatomy view, and for little else.
- `apple-design` is a reference for native Apple platforms. This is a web app with its own identity; borrow principles (clarity, deference, touch-target sizes), never the look.
- shadcn: search before building a primitive by hand, but install a component only when the task needs it. Installed components follow this project's tokens, not the registry defaults.
- Impeccable findings are triaged, not obeyed: fix real problems, record a narrow ignore through `/impeccable hooks ignore-value` for a confirmed false positive, ask when unsure.
- Third-party skill scripts are run only when the skill's own instructions call for them and the task needs them.

## Design rules

The product has its own visual identity, defined in `Design.md`: dark-first, warm-neutral surfaces, one restrained accent, "a premium training instrument translated into software".

Do not reach for these by default:

- purple gradients, or arbitrary gradients of any colour
- glassmorphism beyond a deliberate, isolated use
- rounded cards everywhere, or a grid of dashboard cards as the answer to every screen
- pill-shaped everything
- heavy or stacked shadows, glow
- animation that communicates nothing
- 3D that serves no purpose
- generic SaaS layouts and generic hero sections
- decoration with no function

Always:

- Existing design decisions take precedence over a skill's suggestion.
- Do not replace a working component because a tool proposes a different approach.
- Accessibility, performance, responsive behaviour and maintainability outrank decorative effect.
- No placeholder data and no fake functionality (`Rules.md` §12).
- Keep TypeScript strict and keep frontend types in step with the DRF serializers.

## Running and inspecting

```bash
# backend (needed for anything behind login)
venv/bin/python backend/manage.py runserver 8000

# frontend
cd frontend && npm run dev          # http://localhost:3000
```

Chrome DevTools MCP drives a real Chromium against the running app. Use it to read the accessibility tree, console messages and network requests, to resize and emulate devices, and to take screenshots. It is for the local app; do not browse unrelated sites with it.

The login has its own capture script: `node scripts/login-visual-debug.cjs <outDir>` from `frontend/`.

## Responsive QA

Check every changed screen at these sizes, with no horizontal overflow:

| Class | Viewports |
| --- | --- |
| Phone | 360×800, 390×844, 430×932 |
| Tablet | 768×1024 |
| Desktop | 1440×900, 1920×1080 |

Also check loading, empty, error, disabled and focus states wherever the screen has them.

## Accessibility QA

- Every control reachable and operable by keyboard, in a sensible order.
- Visible focus on every interactive element.
- Every form control labelled; icon-only controls have accessible names.
- Text and essential graphics meet WCAG AA contrast.
- State is never conveyed by colour alone.
- `prefers-reduced-motion` respected.
- Touch targets around 44px on mobile.
- Anything essential still works without WebGL.

## Before reporting work as done

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Then state, for the UI that changed: which viewports were inspected in a browser, what the console showed, what Impeccable reported, and anything not verified.

## Tooling reference

| Tool | Where it is configured | Scope |
| --- | --- | --- |
| `frontend-design`, `ui-ux-pro-max`, `astra-frontend-design`, `antigravity-design-expert`, `find-skills` | `.claude/skills/` (symlinks to `~/.agents/skills/`) | this project, this machine |
| Impeccable skill | `~/.claude/skills/impeccable` | all projects |
| Impeccable design hook | `.claude/settings.local.json`, `.impeccable/config.json` | this project |
| Impeccable product context | `PRODUCT.md`, `Design.md` | this project |
| shadcn MCP | `.mcp.json` | this project |
| Chrome DevTools MCP | `.mcp.json` (Playwright's Chromium, sandbox disabled) | this project |
| `apple-design` | plugin `apple-design@tzzs` in `~/.claude/settings.json` | all projects |

`.claude/` is gitignored, so the skill links and the hook entry exist only on this machine. `.mcp.json`, `.impeccable/config.json`, `PRODUCT.md` and this file can be committed.
