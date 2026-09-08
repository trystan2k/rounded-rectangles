# Architecture

A one-page view of how the app is structured and **why** each decision was made.

## The big picture: two layers

```
 VIEW  (React)      App → Stage → RectangleShape
                    reads models during render; mutations happen only in event handlers

 MODEL (plain TS)   No React, no DOM → runs and unit-tests in Node
```

**Data flow (always the same, whatever the trigger — drag, button, or API):**

```
model mutation → Rectangle fires 'change' → Application: version += 1 → listeners
              → React (useSyncExternalStore) re-renders → view re-reads models → SVG updates
```

### Layer decisions

- **Model/view split** — logic and rules live in framework-free TypeScript; React is a
  thin renderer. Payoff: one place for rules, Node-testable logic, swappable view.
- **Single source of truth** — the data lives only in the model objects. No copies in
  React state, so UI and data can never disagree. React state is used for one
  view-only thing: which rectangle is selected (`activeId`).
- **Observer pattern via `EventTarget`** — `Rectangle` extends the browser's built-in
  pub/sub base class; every setter fires a `change` event. Zero custom event code, and
  it also exists in Node (unit tests).
- **Version counter as store snapshot** — `Application` counts all changes; React
  subscribes with `useSyncExternalStore(application.subscribe, application.getVersion)`.
  A number is the cheapest possible snapshot: stable between notifications, O(1) to
  compare. One subscription at the app root re-renders everything; fine at this scale. To scale up we could use Zustand for example, to listen to slices of the state.
- **Public API as first-class citizen** — the app exposes `window.application`
  (`getRectById` → chainable `setPosition`/`setSize`/`setCornerRadius` → `toJSON()` =
  exactly `{ id, x, y, width, height, radius }`). Because every mutation funnels through
  the models, API edits update the live UI for free — no sync code.
- **Boot contract** — initial scene comes from `window.rectanglesData` if a grader
  injected one, else the sample scene; the global API is installed _before_ first render.

## Key decisions, feature by feature

- **Clamping lives in the model, not the UI** — `setCornerRadius` clamps to
  `[0, min(width, height) / 2]`, `setSize` floors at 0 and **re-clamps an existing
  radius** (shrinking can invalidate it). Why: rules must hold no matter who edits —
  drag, button, or grader API. Geometry reason: corner arcs overlap unless
  `r ≤ min(w, h) / 2`.
- **`setPosition` is not clamped** — being partly off-canvas is legal; only physically
  impossible values are rejected.
- **Chainable setters (`return this`)** — the required API scenario
  (`setSize(...).setPosition(...)`) reads like a sentence; costs one `return`.
- **Constructor trusts its input; setters enforce validity** — boot/grader data is not
  silently altered (so `toJSON()` comparisons stay honest). Consequence: the _producer_
  of new data (spawn) must generate valid values itself.
- **Spawn limits are a UX rule, not a model rule** — `SPAWN_LIMITS` (80–320 × 60–240)
  apply only to newly added rectangles; the model API accepts any valid values. Random
  sizes are rounded, and the radius cap is **floored** so a rounded radius can never
  exceed a fractional `min(w, h)/2` cap.
- **Cascade placement** — new rectangles sit near the stage center, offset by
  `(id mod 6) × 30 px` diagonally, wrapping after 6. Why: consecutive adds visibly
  stack like shuffled cards instead of landing exactly on top of each other.
  Randomness is **injectable** (`random` parameter) so spawn is deterministic in tests.
- **Z-order is data, stored as Map insertion order** — `getRectangles()` returns the
  Map's values in insertion order; SVG paints in document order; therefore insertion
  order _is_ stacking order. **Bring-to-front** is simply `delete` + `set` (re-insert at
  the end) — no separate z-index bookkeeping. Triggered at `pointerdown` so the dragged
  rectangle is visible above its neighbors _during_ the drag.
- **Colors keyed by id, not render position** — `colorsForId(id)` wraps around a 6-pair
  palette. Since bring-to-front reorders rendering constantly, index-keyed colors would
  shuffle everyone's colors on every click. Id-keying makes color an identity attribute.
- **SVG with no `viewBox`, filling the viewport** — 1 SVG unit = 1 CSS pixel; drag math
  needs only a constant offset (the stage origin), never scaling. SVG also gives
  built-in hit-testing and `rx`/`ry` mapping 1:1 to the corner radius.
- **Pointer Events + `setPointerCapture`** — one code path for mouse/touch/pen; capture
  retargets all events of that pointer to the `<svg>`, so drags survive leaving the
  canvas or the window. `touch-action: none` in CSS stops the browser claiming touches
  for scrolling.
- **Event bubbling as wiring** — shapes handle only `pointerdown` (start) and report to
  the parent via a callback; the `<svg>` root handles `pointermove`/`up`/`cancel`. One
  set of handlers serves any number of rectangles.
- **Delta-based dragging** — at `pointerdown` the Stage snapshots where the pointer and
  the rectangle were; every `pointermove` computes "start + delta". No accumulation, no
  drift, no dependence on the previous event.
- **Radius gesture is absolute, not relative** — the handle sits on the corner's 45°
  diagonal at distance `r·√2`; the new radius is `distance(pointer, corner) / √2`. So
  the handle stays **exactly under the pointer** by construction — model and view can't
  drift apart.
- **Drag state in `useRef`, selection in `useState`** — the drag is control flow (~60
  events/s) that shouldn't trigger renders (model changes already do that); selection
  is pure appearance, so React state is its honest home. A `pointerId` check ignores
  second fingers; `handleDragStart` returns `true/false` (drag accepted or rejected).
- **React as a dumb renderer** — components re-read models on every render; no
  memoization (the tree is tiny), no duplicated state, no context machinery (the single
  `Application` instance flows down as a prop).
- **All colors + spacing as CSS custom properties** — one `:root` token block is the
  single place to re-theme. The palette values live there too; `palette.ts` emits
  `var(--palette-N-*)` references keyed by id. Fill/stroke are applied via inline
  `style` because SVG presentation attributes cannot hold `var()`.
- **Invisible 16 px hit circle behind the 5.5 px handle** — a finger can't reliably hit
  11 px; the invisible circle (made clickable with `pointer-events: all`) gives a
  32 px touch target with zero visual weight.
- **Accessibility as a testing hook** — `role="application"`, `aria-label` on the
  stage, and `aria-label="Rectangle N"` per group: read by screen readers _and_ used as
  the e2e selectors.

## Quality & delivery

- **Two-tier testing** — the DOM-free model layer is unit-tested in Node (Vitest,
  deterministic via injected randomness); rendering/gestures are e2e-tested in a real
  browser on the production build (Playwright, Chromium + Firefox + WebKit). E2e
  asserts model state through `window.application`, DOM spot-checks, and computed-style
  colors.
- **Quality gates** — oxlint + oxfmt on staged files (pre-commit), unit tests on push
  (pre-push), and a CI pipeline (lint → format → unit → e2e → build) that **gates** the
  Vercel production deploy to green pushes on `main`.
- **Zero runtime dependencies beyond React** — all geometry, interaction and state
  management is hand-written; build tooling is dev-only.
