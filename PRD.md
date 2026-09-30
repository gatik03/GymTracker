# GymTracker — Product Requirements Document

## 1. Product summary

GymTracker is a private, fitness-first web application for logging workouts, understanding training progress, and keeping a personal training journal.

The product should make logging a workout fast enough to use between sets and make historical progress easy to review without spreadsheets.

The product is not a social network, medical tool, nutrition adviser, or generic gym-management system.

Core product idea:

> **Training → data → progress**

## 2. Target users

### Primary user

The owner of the project: a person who wants to define exercises/routines, log workouts, review progress, track bodyweight, and keep private training notes.

### Later users

A small number of private individual lifters or coach/client workflows may be considered later.

Public social features are not part of the current product direction.

## 3. Goals

- Record workouts with minimal friction.
- Preserve reliable historical workout data.
- Make previous performance easy to find.
- Show useful strength, volume, PR, muscle, and bodyweight trends.
- Make the workout logger the primary high-frequency interaction.
- Provide a private journal for training reflections.
- Provide a polished, responsive, premium fitness UI.
- Keep security and ownership enforcement server-side.
- Avoid unnecessary complexity and AI/ML features.

## 4. Non-goals

Do not add without an explicit product decision:

- social feeds
- following/likes/public profiles
- payments/subscriptions
- gym membership management
- staff administration
- medical diagnosis
- injury diagnosis
- automated nutrition advice
- automated psychological analysis
- AI/ML coaching or emotion classification
- wearable integrations
- barcode scanning
- native mobile app as part of the current web release

A future Flutter/mobile client may consume the same backend, but it is not required for the current web milestone.

## 5. Authentication and account

The application must support:

- registration
- username/email + password login
- logout
- email verification
- password reset
- secure session persistence
- route protection
- object-level authorization
- Google OAuth
- GitHub OAuth

OAuth must use secure backend-controlled state/callback handling and environment-provided credentials.

Apple may appear in the login UI as a visual placeholder, but Apple authentication is not considered implemented until a backend provider flow exists.

The login experience begins with the **Barbell Drop** intro:

```text
barbell
  ↓
plates fall
  ↓
plates stack
  ↓
physical lock-in
  ↓
assembly morphs
  ↓
login interface
```

The intro must never prevent access to the login form after it resolves or is skipped.

## 6. Exercise library

Users can:

- browse built-in exercises
- search/filter exercises
- favorite exercises
- revisit recent exercises
- create custom exercises
- edit/delete their own custom exercises
- view exercise metadata

Exercise metadata may include:

- name
- muscle group
- equipment
- difficulty
- exercise type
- instructions/notes where supported
- built-in/custom state

Historical workout references must remain safe when exercises are renamed, archived, or otherwise changed.

## 7. Workout routines

The product should support repeatable routines such as:

- Upper A
- Lower A
- Push
- Pull
- Legs

A routine may contain:

- ordered exercises
- target sets
- rep ranges
- target weight
- rest time
- notes

Starting a workout from a routine must allow real-world deviations without rewriting the routine itself.

## 8. Workout logger — signature feature

The workout logger is the core product experience.

### Desktop

Use a deliberate split between:

```text
WORKOUT LOGGER | 3D ANATOMY
```

The logger side prioritizes:

1. current exercise
2. set entry
3. previous performance
4. next action

The anatomy side shows broad muscle regions and reacts to the selected exercise.

### Mobile

Stack the logger and anatomy experience rather than forcing a 50/50 layout.

### Logging

A user can:

- add/select an exercise
- add multiple sets
- record weight
- record reps
- record RPE/RIR where supported
- add notes
- mark set classification
- edit/delete draft sets
- see previous performance
- finish the workout

Advanced per-repetition data is optional and should not make normal set logging slower.

### Reliability

The logger must:

- autosave persisted set data
- protect against accidental navigation
- support draft recovery
- provide undo/recovery for accidental destructive actions where practical
- prevent a workout with no logged sets from being treated as completed
- confirm completion with a concise summary

Completed workouts must be immutable at the backend boundary unless an explicit correction workflow is defined.

## 9. Three.js anatomy experience

The anatomy experience is a visual feedback system, not medical anatomy.

Requirements:

- broad muscle groups
- exercise → muscle mapping
- smooth highlight transitions
- reusable 3D model/scene
- no separate 3D model per exercise
- reduced-motion support
- responsive mobile behavior
- lazy loading where appropriate

Example mappings:

- bench press → chest
- lat pulldown → back
- curl → biceps
- pushdown → triceps
- squat → quads
- RDL → hamstrings
- hip thrust → glutes
- lateral raise → shoulders

Multiple primary/secondary muscle mappings can be added later.

## 10. Dashboard

The dashboard should answer:

> **How am I doing?**

It should prioritize useful information rather than card quantity.

Potential dashboard information:

- recent workout activity
- current-month volume
- workout days
- meaningful heavy performances
- personal records
- muscle distribution
- recent progress

“Heavy Hits” should use meaningful recent performances rather than arbitrary random records.

For daily volume charts:

- actual workout days may show volume
- days with no workout should be represented as missing/null where appropriate
- do not create misleading zero-volume workouts

## 11. Progress

Progress should answer:

> **Am I getting better?**

Primary areas:

- Strength
- Volume
- Personal Records
- Muscles
- Bodyweight

Supported analytics include:

- exercise progression
- volume by time period
- volume by exercise
- volume by muscle group
- PRs
- estimated 1RM
- bodyweight trend
- bodyweight rate of change

Estimated values must be clearly labeled as estimates.

## 12. Journal

Journal is a private first-class product feature.

A journal entry contains:

- date
- optional title
- content
- created timestamp
- updated timestamp

The journal should provide:

- calm editor
- manual save
- autosave after an entry exists
- saved-state feedback
- edit/delete
- private ownership enforcement

The journal must not:

- diagnose mental health
- classify emotions
- provide automated psychological conclusions
- expose private content in logs or analytics unnecessarily

Future improvements may include pagination, search, filtering, draft recovery, and conflict handling.

## 13. Profile and settings

Support:

- units
- date/time preferences
- bodyweight
- OAuth connections
- account settings

Future account lifecycle improvements:

- authenticated password change
- session management
- account deletion
- personal-data export
- retention policy
- MFA

## 14. Quality requirements

- Personal data is private by default.
- Backend ownership checks protect every user-owned resource.
- Mutating requests use appropriate CSRF protection.
- Forms show clear validation errors.
- Dates/time zones are consistent.
- Core workflow remains usable with keyboard navigation.
- Responsive behavior works from approximately 360px upward.
- Reduced-motion behavior is supported.
- Accessibility is treated as a product requirement.
- Automated tests cover important backend rules.
- Browser-level tests should eventually cover critical user journeys.
- Performance should remain acceptable on normal laptops and mobile devices.

## 15. Success measures

A user should be able to:

- log a normal workout without leaving the main workout screen
- see the previous performance for an exercise within seconds
- complete a workout without losing draft data
- reconstruct a completed workout later
- understand progress through real recorded data
- use the application comfortably on a phone
- keep private reflections in the journal
- sign in securely without exposing tokens to browser storage

## 16. Open decisions

- exact routine/template UX
- rest-timer notification behavior
- account deletion/export UX
- MFA
- richer 3D anatomy roles/intensity
- offline workout logging
- whether and when a Flutter client should be started

These decisions must not block the current core web product.
