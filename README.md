# Rounded Rectangle Editor

A single-page application for editing
rectangles with rounded corners — drag a rectangle to move it, drag its corner
handle to change the radius of **all four corners** at once.

## Stack

- **Vite + React + TypeScript** — component structure, type safety, fast dev loop.
- **No other runtime dependencies.** All geometry, interaction and state
  management is hand-written. The model layer (`src/rectangle.ts`,
  `src/application.ts`) is plain TypeScript with zero framework knowledge.
- Build tooling (Vite, Vitest, oxlint, Playwright) is dev-only and does not
  ship to production; the production bundle is a single JS file + CSS.

## Running

```bash
pnpm install
pnpm dev        # dev server (prints a local URL)
pnpm build      # type-checks and produces dist/
pnpm preview    # serves the production build
pnpm test           # unit tests (Vitest)
pnpm test:e2e   # end-to-end tests (Playwright, see e2e/)
pnpm lint       # oxlint
```

To try it on a tablet, run `pnpm dev -- --host` and open the printed
network URL from the device (same Wi-Fi). Any static host (GitHub Pages,
Netlify, etc.) can serve `dist/`.

## Interactions

| Gesture                  | Effect                                            |
| ------------------------ | ------------------------------------------------- |
| Drag a rectangle body    | Moves the rectangle                               |
| Drag the corner handle   | Changes the corner radius (all four corners)      |
| `+ Add rectangle` button | Appends a rectangle (random size within min/max limits) near the stage center |
| Mouse, pen or touch      | Pointer Events + pointer capture unify all input  |

## Public API

The application reads its initial scene from the global `rectanglesData`
(if defined before the bundle loads; otherwise the sample data from
`src/data.ts` is used), and exposes itself as `window.application`:

```ts
window.rectanglesData = [{ id: 0, x: 100, y: 100, width: 200, height: 150, radius: 10 }, ...];
```

```ts
const rect = application.getRectById(1); // Rectangle | null
rect.setSize(100, 100);                  // set size (clamped to >= 0)
rect.setPosition(10, 10);                // set position
rect.setCornerRadius(5);                 // radius of all 4 corners
rect.toJSON();                           // { id, x, y, width, height, radius }

application.addRectangle({ id, x, y, width, height, radius }); // create at runtime
application.nextId();                                          // next free id
```

- Setters are chainable and clamp the corner radius to `[0, min(width, height) / 2]`
  (an existing radius is re-clamped if `setSize` shrinks the rectangle), so the
  model always matches what is on screen.
- Every mutation dispatches a `change` event; the React layer subscribes via
  `useSyncExternalStore`, so edits made through the API appear in the UI live.
- New rectangles created through the API or the `+ Add rectangle` button are
  immediately movable and editable like any other.

The exact scenario from the task description (`setSize` → `setPosition` →
`setCornerRadius` → `toJSON`) is covered by unit tests (see
`src/rectangle.test.ts`) and by end-to-end tests that run it in a real browser
against the built app (see `e2e/editor.spec.ts`).

## Testing

- `pnpm test` — unit tests for the framework-free model/store layer (Vitest).
- `pnpm test:e2e` — Playwright tests against the production build
  (`vite preview` is started automatically), in Chromium, Firefox and WebKit.
  First run requires `npx playwright install` to download the browsers.

Covered end-to-end: the task-description scenario through the public API
(including its live effect on the UI), initial rendering from the sample and
from a global `rectanglesData` list, moving by dragging the body, corner-radius
editing by dragging the handle (all four corners, clamped at the maximum),
the selection highlight, z-order/color stability, and adding new rectangles
at runtime.

## Architecture

```
src/
  rectangle.ts            Model: data + clamping + "change" events (framework-free)
  application.ts          Controller/store: id -> Rectangle registry, getRectById,
                          bringToFront, subscribe/getVersion for React
  data.ts                 Sample rectanglesData from the task description
  types.ts                Window globals contract (rectanglesData, application)
  palette.ts              Fill colors, keyed by rectangle id (stable in any z-order)
  spawn.ts                Size (random within limits) and placement of new rectangles
  components/
    Stage.tsx             SVG stage, owns pointer interactions (drag state machine)
    RectangleShape.tsx    Renders one rectangle + corner handle
    Toolbar.tsx           "+ Add rectangle" button
  rectangle.test.ts       Model unit tests
  application.test.ts     Registry/store unit tests
  palette.test.ts         Palette unit tests
  spawn.test.ts           Spawn placement unit tests
e2e/
  editor.spec.ts          Playwright end-to-end tests (Chromium/Firefox/WebKit)
playwright.config.ts      E2E configuration (builds + serves dist/ automatically)
```

Key decisions:

- **SVG rendering** — crisp at any zoom/HiDPI, declarative updates, built-in
  hit-testing for the drag targets, and `rx`/`ry` map 1:1 to the corner radius.
- **1:1 coordinates** — the `<svg>` has no `viewBox` and fills the viewport,
  so 1 SVG unit = 1 CSS pixel; drag math stays trivial.
- **Radius handle geometry** — the handle sits on the corner diagonal at
  distance `radius * sqrt(2)` from the corner, so the new radius is derived
  directly from the pointer distance (`d / sqrt(2)`) and the handle always
  stays under the pointer.
- **Pointer Events + `setPointerCapture`** on the stage — one code path for
  mouse/touch/pen; `touch-action: none` prevents scrolling/zoom gestures.
- **Model ≠ view** — the model layer can be unit-tested without any DOM
  (see `pnpm test`), and React only reads models during render.

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop), and current iOS/Android
tablets — everything used (Pointer Events, `useSyncExternalStore`, ES2020+) is
supported by all evergreen browsers. No external libraries.

## Time spent

Approx. 4 hours in total: implementation ~2.5 h, manual testing ~0.5 h,
tests + documentation + packaging ~1 h.
