# AGENTS.md

Single-page rounded-rectangle editor (Xara client dev test). Vite + React 19 + TypeScript, rendered as SVG. Runtime deps: `react`/`react-dom` only.

## Package manager: pnpm (mandatory)

npm breaks on `oxfmt`'s peer chain (`workspace:` protocol) — never use it. pnpm ≥ 10 (enable once with `corepack enable`). Enforcement: `packageManager` pins pnpm@10.27.0 (Corepack auto-installs it) and a `preinstall` guard (`npx only-allow pnpm`) aborts npm/yarn installs. CI reads the pnpm version from `packageManager`.

```bash
pnpm install            # also activates husky hooks (prepare script)
pnpm dev                # dev server
pnpm build              # tsc -b && vite build -> dist/
pnpm test               # Vitest unit tests
pnpm test:e2e           # Playwright (builds + serves dist/ on :4173 automatically)
pnpm lint               # oxlint
pnpm format             # oxfmt --write .
pnpm format:check       # CI-style format verification
```

Playwright browsers: `pnpm exec playwright install` (chromium, firefox, webkit).

## Structure

```
src/rectangle.ts        Model: data + clamping + "change" events (framework/DOM-free)
src/application.ts      Store: id -> Rectangle registry, getRectById, addRectangle,
                        nextId, bringToFront, subscribe/getVersion (useSyncExternalStore)
src/spawn.ts            Size (random within SPAWN_LIMITS) + cascade placement of new rects
src/palette.ts          colorsForId: fill + selection stroke, keyed by id
src/components/         Stage.tsx (SVG + all pointer/drag logic), RectangleShape.tsx, Toolbar.tsx
e2e/editor.spec.ts      Playwright specs
```

## Invariants (do not break)

- **API contract** (used by automated graders): `window.application.getRectById(id)` → `Rectangle` with chainable `setPosition(x,y)`, `setSize(w,h)`, `setCornerRadius(r)`, and `toJSON()` returning exactly `{ id, x, y, width, height, radius }`. Globals: `window.rectanglesData` read at boot, `window.application` exposed.
- **Clamping**: radius clamped to `[0, min(width, height) / 2]` (also re-clamped on `setSize`); sizes floored at 0. Spawn limits (`SPAWN_LIMITS`) apply only to new rectangles, never to the model API.
- **Data flow**: model mutations dispatch `change` → `Application` bumps version → React re-renders. Rectangle state lives in the models, never in React state; components only read models during render.
- Model layer (`rectangle.ts`, `application.ts`, `spawn.ts`, `palette.ts`) must stay framework- and DOM-free (it is unit-tested without a DOM).
- Colors come from `colorsForId(id)` so they stay stable when z-order changes; do not key them by render order.
- SVG stage has no `viewBox` and fills the viewport: 1 SVG unit = 1 CSS px. Drag math depends on this.

## Conventions

- React components and standalone functions: `export const x = (...) => {...}` (no `export function`).
- Formatting: oxfmt, React-recommended options in `.oxfmtrc.json`; single quotes (double in JSX), trailing commas, print width 100.
- Comments only where they explain non-obvious decisions.

## Tests & hooks

- Unit tests live next to the code (`src/*.test.ts`); e2e specs in `e2e/`. Add/update tests with any behavior change; keep all green: `pnpm test && pnpm test:e2e`.
- husky: pre-commit runs lint-staged (`oxlint --fix` + `oxfmt --write` on staged files only, then re-stages); pre-push runs `pnpm test`. lint-staged needs at least one commit to exist.
