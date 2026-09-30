# GymTracker — Visual Design

## 1. Design principles

- **Focused:** help the user log a set between exercises.
- **Data-forward:** hierarchy and useful information matter more than decorative dashboards.
- **Fitness-first:** the product should feel connected to training without becoming an aggressive sports advertisement.
- **Premium but restrained:** polish comes from typography, spacing, motion, and interaction quality rather than effects.
- **Practical:** controls should be reachable with one hand on a phone.
- **Honest:** clearly distinguish recorded facts from estimates.
- **Accessible:** never use color as the only signal.
- **Motion with purpose:** animations communicate physicality, state, or transition.

## 2. Overall visual direction

Use a dark-first interface with high contrast, warm-neutral surfaces, and a restrained fitness accent.

The main application should feel like:

> a premium training instrument translated into software.

Avoid:

- generic admin dashboards
- excessive glassmorphism
- neon cyberpunk styling
- giant gradient backgrounds
- meaningless cards
- excessive glow
- excessive rounded containers
- animation that exists only to look busy

The product should feel calm while the workout logger remains energetic and responsive.

## 3. Product color tokens

Use named CSS custom properties so colors can be changed centrally.

Suggested baseline:

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0a0b0d` | Main application background |
| `--color-surface` | `#111317` | Cards/forms/navigation |
| `--color-surface-raised` | `#181b20` | Raised/active surfaces |
| `--color-text` | `#f4f5f2` | Primary text |
| `--color-text-muted` | `#9da4a0` | Supporting text |
| `--color-border` | `#2a2f35` | Borders/dividers |
| `--color-accent` | `#78d69a` | Primary product action/progress |
| `--color-accent-strong` | `#3fbf70` | Hover/active accent |
| `--color-danger` | `#f07f7f` | Errors/destructive actions |
| `--color-warning` | `#e7bd68` | Warnings/incomplete state |

### Login/brand exception

The Barbell Drop login intro may use a restrained warm orange/amber accent because it is part of the industrial barbell visual language.

This is a **localized visual treatment**, not permission to introduce multiple competing product accent systems throughout the application.

The login intro should still remain visually compatible with the main product.

## 4. Typography

Primary UI:

- `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`

Use tabular numerals for:

- weights
- reps
- duration
- volume
- dates where appropriate

Use sentence case for normal UI labels.

Avoid all-caps UI except for tiny intentional metadata/brand treatments.

The login intro may use a condensed display face for the temporary wordmark/headline, provided it does not reduce readability.

## 5. Layout

### Desktop

- narrow navigation/sidebar where appropriate
- centered content
- strong whitespace
- maximum content width around 1100–1200px for ordinary application pages
- workout logger may use a deliberate larger split layout

### Mobile

- single-column layout
- minimum touch target around 44px
- sticky primary actions where useful
- no horizontal clipping
- controls optimized for one-handed use

Use a 4px spacing scale with common values:

8 / 12 / 16 / 24 / 32px

## 6. Dashboard

The dashboard should answer:

> How am I doing?

Do not overload it with cards.

Prioritize:

- recent training
- current-month volume
- workout consistency
- meaningful heavy performances
- PRs
- muscle distribution where useful

Charts should use actual training records.

If a day contains no workout, do not visually imply that a zero-volume workout happened. Use gaps/nulls when the chart semantics require it.

## 7. Workout logger

The workout logger is the signature interaction.

Desktop:

```text
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│      WORKOUT LOGGER      │      3D ANATOMY         │
│                          │                          │
│ exercise                 │      human figure       │
│ sets / weight / reps     │      broad muscles      │
│ previous performance     │      selected muscle    │
│ next action              │      smooth highlight   │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

The logger should feel instant.

The anatomy visualization should support the logger, not compete with it.

## 8. Three.js visual language

Three.js anatomy should use:

- simplified athletic human form
- broad muscle regions
- restrained materials
- subtle lighting
- smooth transitions
- minimal visual noise

Do not create detailed medical anatomy.

When the selected exercise changes:

```text
previous muscle
    ↓
smoothly relax
    ↓
new muscle
    ↓
smoothly highlight
```

The scene must have a non-WebGL/fallback state sufficient to continue logging.

## 9. Login — Barbell Drop

The login intro is a special cinematic entry experience.

Initial state:

```text
dark gym environment
        +
large centered barbell
        +
falling weight plates
```

There should NOT be a permanent two-column intro card.

The login form is initially hidden.

Animation:

```text
barbell enters
→ plates fall
→ impacts/squash
→ dust
→ final lock-in
→ bar/plates morph
→ login interface forms
```

The final UI should look like the physical equipment has become the interface.

The barbell must not remain behind the final login card as decoration.

Use GSAP for deterministic choreography.

Support:

- skip
- replay
- reduced motion
- return visits
- deterministic development replay

## 10. Components

Cards should group related information but not hide essential actions.

Forms:

- persistent labels
- inline validation
- clear disabled/loading states
- visible focus ring
- concise error messages

Interactive controls require:

- default
- hover
- focus
- active
- disabled
- loading
- success/error where relevant

Destructive actions require confirmation and recovery/undo where practical.

## 11. Content and voice

Use concise, direct language:

- Start workout
- Log set
- Complete workout
- Previous performance
- Save entry
- Resume workout
- Discard draft

Avoid:

- shame-based language
- exaggerated performance claims
- medical certainty
- pseudo-coaching claims
- AI-generated motivational clutter

## 12. Accessibility

Required:

- semantic landmarks
- correct heading order
- associated labels
- keyboard navigation
- visible `:focus-visible`
- sufficient contrast
- non-color status cues
- field-level validation
- error summaries where appropriate
- reduced-motion support
- accessible names for icon-only controls
- narrow viewport testing
- screen-reader-friendly names
- WebGL fallback for essential workflows

## 13. Motion

Motion should be:

- purposeful
- short enough for repeated use
- physically believable where representing physical objects
- interruptible where appropriate
- disabled/reduced under `prefers-reduced-motion`

Do not animate every element simply because an animation library is available.
