# Rounded Rectangle Editor

A single-page application for editing
rectangles with rounded corners — drag a rectangle to move it, drag its corner
handle to change the radius of **all four corners** at once.

## Stack

- **Vite + React + TypeScript** — component structure, type safety, fast dev loop.
- **No other runtime dependencies.** All geometry, interaction and state
  management is hand-written. The model layer (`src/rectangle.ts`,
  `src/application.ts`) is plain TypeScript with zero framework knowledge.
- Code style is enforced by **oxfmt** (React-recommended options, see
  `.oxfmtrc.json`) and **oxlint**; **husky** runs lint + format checks on every
  commit and the unit tests on every push.
- Build tooling (Vite, Vitest, oxlint, oxfmt, husky, Playwright) is dev-only
  and does not ship to production; the production bundle is a single JS file +
  CSS.

## Running

Requires **pnpm ≥ 10**, pinned via the `packageManager` field in
`package.json` (`corepack enable` once, if needed — the exact pnpm version is
then installed automatically). Using npm or yarn is **blocked**: a
`preinstall` guard (`only-allow pnpm`) aborts the install with a clear
message.

```bash
pnpm install
pnpm dev           # dev server (prints a local URL
```

To try it on a tablet, run `pnpm dev -- --host` and open the printed
network URL from the device (same Wi-Fi). The production deployment is served
by **Vercel** — see [Deployment & CI/CD](#deployment--cicd) below.

## Oher commands

```bash
pnpm build         # type-checks and produces dist/
pnpm preview       # serves the production build
pnpm test          # unit tests (Vitest)
pnpm test:e2e      # end-to-end tests (Playwright, see e2e/)
pnpm lint          # oxlint
pnpm format        # format the code with oxfmt
pnpm format:check  # verify formatting (formatting is enforced on staged files)
```

## Deployment & CI/CD

The app is deployed on **Vercel** (project `rounded-rectangles`, Vite
framework preset). Deployment is fully automated by the GitHub Actions
workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **Triggers** — every push to `main` and every pull request targeting `main`.
  A concurrency group cancels superseded runs on the same ref.
- **Validation pipeline** (fails fast, in order): install with frozen lockfile
  → `oxlint` → `oxfmt --check` → unit tests (Vitest) → Playwright end-to-end
  tests against the production build → production build (`tsc -b && vite
build`).
- **Deploy gate** — the deploy step runs only if _all_ checks pass **and** the
  event is a push to `main`. Pull requests are validated only, never deployed.
- **Deployment** — the official Vercel CLI (`npx vercel deploy --prod`),
  authenticated with the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`
  and `VERCEL_PROJECT_ID`. The resulting production URL is written to the
  run's summary page (and is visible in the Vercel dashboard under the
  project).

## Interactions

| Gesture                  | Effect                                                                        |
| ------------------------ | ----------------------------------------------------------------------------- |
| Drag a rectangle body    | Moves the rectangle                                                           |
| Drag the corner handle   | Changes the corner radius (all four corners)                                  |
| `+ Add rectangle` button | Appends a rectangle (random size within min/max limits) near the stage center |
| Mouse, pen or touch      | Pointer Events + pointer capture unify all input                              |

## Public API

Everything is exposed on the `window` object and is usable from the browser
console, from automation scripts, or from an end-to-end test suite:

```js
window.application.getRectById(1).setCornerRadius(30); // try it in the console
```

### `window.rectanglesData` — optional boot input

```ts
window.rectanglesData?: RectangleData[]
```

If defined **before the app bundle loads**, the app starts with this scene
instead of the built-in sample data (`src/data.ts`). It is a **boot-time
injection point** for tests and graders (e.g. `page.addInitScript(...)`): the
value is read exactly once at startup, and assigning it afterwards has **no
effect**. Runtime scene changes go through the API below
(`addRectangle`, `getRectById(...).setSize(...)`, ...).

`RectangleData` is a plain object:

| Field    | Type     | Meaning                                             |
| -------- | -------- | --------------------------------------------------- |
| `id`     | `number` | Unique identifier (also used for color and z-order) |
| `x`, `y` | `number` | Position of the top-left corner, in CSS pixels      |
| `width`  | `number` | Width in pixels                                     |
| `height` | `number` | Height in pixels                                    |
| `radius` | `number` | Corner radius, applied to all four corners          |

### `window.application` — the app instance

| Method                | Input                  | Output              | What it does                                                                   |
| --------------------- | ---------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `getRectById(id)`     | `id: number`           | `Rectangle \| null` | Returns the rectangle with that id, or **`null`** if it does not exist         |
| `addRectangle(data)`  | `data: RectangleData`  | `Rectangle`         | Creates a rectangle at runtime (no spawn size limits apply); appears instantly |
| `nextId()`            | —                      | `number`            | The next free id (`0` when empty, otherwise largest existing id + 1)           |
| `getRectangles()`     | —                      | `Rectangle[]`       | All rectangles in render order (later items paint on top)                      |
| `bringToFront(id)`    | `id: number`           | `void`              | Moves the rectangle to the top of the stacking order (no-op if id is unknown)  |
| `getVersion()`        | —                      | `number`            | Counts mutations; changes on every edit (this is what React watches)           |
| `subscribe(listener)` | `listener: () => void` | `() => void`        | Calls `listener` on every change; returns the **unsubscribe** function         |

### `Rectangle` — returned by `getRectById` / `addRectangle`

Live fields, safe to read at any time: `id` (readonly), `x`, `y`, `width`,
`height`, `radius`. Every mutation is reflected on screen immediately.

| Member                           | Input                           | Output          | What it does                                                                                       |
| -------------------------------- | ------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `setPosition(x, y)`              | `x: number, y: number`          | `Rectangle`     | Moves the rectangle (any position is valid — no clamping)                                          |
| `setSize(width, height)`         | `width: number, height: number` | `Rectangle`     | Sets the size; negatives are clamped to `0`, and an existing radius that no longer fits is reduced |
| `setCornerRadius(radius)`        | `radius: number`                | `Rectangle`     | Sets the radius of **all four corners**; clamped to `[0, min(width, height) / 2]`                  |
| `toJSON()`                       | —                               | `RectangleData` | Snapshot of the exact contract shape `{ id, x, y, width, height, radius }`                         |
| `maxRadius`                      | — (getter)                      | `number`        | The largest legal radius for the current size: `min(width, height) / 2`                            |
| `addEventListener('change', fn)` | `fn: () => void`                | —               | Standard `EventTarget` subscription; fired after every successful mutation                         |

All setters are **chainable** (they return the rectangle itself).

### Example — the task-description scenario

```ts
const rect = window.application.getRectById(1); // Rectangle (initial data)
rect.setSize(100, 100); // size clamped to >= 0; radius re-clamped if needed
rect.setPosition(10, 10);
rect.setCornerRadius(5);
rect.toJSON(); // { id: 1, x: 10, y: 10, width: 100, height: 100, radius: 5 }
```

### Behavior guarantees

- Setters clamp the corner radius to `[0, min(width, height) / 2]` (an existing
  radius is re-clamped if `setSize` shrinks the rectangle), so the model always
  matches what is on screen.
- Every mutation dispatches a `change` event; the React layer subscribes via
  `useSyncExternalStore`, so edits made through the API appear in the UI live.
- New rectangles created through the API or the `+ Add rectangle` button are
  immediately movable and editable like any other.

The exact scenario above is covered by unit tests (see `src/rectangle.test.ts`)
and by end-to-end tests that run it in a real browser against the built app
(see `e2e/editor.spec.ts`).

## Testing

- `pnpm test` — unit tests for the framework-free model/store layer (Vitest).
- `pnpm test:e2e` — Playwright tests against the production build
  (`vite preview` is started automatically), in Chromium, Firefox and WebKit.
  First run requires `pnpm exec playwright install` to download the browsers.

Covered end-to-end: the task-description scenario through the public API
(including its live effect on the UI), initial rendering from the sample and
from a global `rectanglesData` list, moving by dragging the body, corner-radius
editing by dragging the handle (all four corners, clamped at the maximum),
the selection highlight, z-order/color stability, and adding new rectangles
at runtime.

## Code style & Git hooks

- `oxfmt` formats the code with React-recommended options (double quotes in
  JSX, single quotes elsewhere, trailing commas, 100 print width — see
  `.oxfmtrc.json`); `pnpm format` fixes, `pnpm format:check` verifies.
- husky hooks (activate automatically after `pnpm install` via the `prepare`
  script, which requires a git repository):
  - `.husky/pre-commit` — **lint-staged**: runs `oxlint --fix` and `oxfmt
--write` only on the staged files (the ones being committed) and re-stages
    them; the commit is rejected if lint errors cannot be auto-fixed
  - `.husky/pre-push` — unit tests (`pnpm test`)

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
