# Task 9: View kit — tree-table, master-detail split, participant row, kv-list, badges

### Task

Built the internal component kit under `shared/kit/` — tree-table over
caller-supplied flat rows, master-detail split, the shared
participant→resolution row, kv-list, and the quiet capability badge —
plus the `--nf-font-mono` token, a permanent kit-boundary guard
(T9-AC-04 in CI), and a dev-only `#/kit-demo` playground page
(user-directed addition) that immediately surfaced and fixed two visual
kit bugs.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/kit/tree-table.ts|.html|.css`
  (new) — flat-row tree renderer: `TreeTableRow` (stable id, depth,
  expandable, expanded, typed payload via projected template),
  emit-only expansion (`TreeTableToggle` carries the requested state),
  caller-owned selection (`selectedId` in / `selectRow` out), roving
  tabindex with focus as the only internal UI state, ARIA
  tree/treeitem/aria-level/aria-expanded; selected rows re-point
  `--nf-color-text-muted` to accent-contrast so projected content
  stays readable.
- `projects/devtools-ui/src/app/shared/kit/tree-table.spec.ts` (new) —
  7 tests: depth render, emit-only toggle (rendering pinned unchanged
  until input update), focus movement, Right/Left request semantics,
  Enter/click selection + ARIA, selection highlight, empty list.
- `projects/devtools-ui/src/app/shared/kit/master-detail.ts|.html|.css`
  (new) — CSS-grid split (minmax(220px, 320px) | 1fr), two projection
  slots (`nfMaster`/`nfDetail`), panes scroll independently.
- `projects/devtools-ui/src/app/shared/kit/master-detail.spec.ts`
  (new) — slot-projection test.
- `projects/devtools-ui/src/app/shared/kit/participant-row.ts|.html|.css`
  (new) — the shared row: discriminated `DeclaredVersion`
  (`range`|`pinned`) makes "pinned renders a range" unrepresentable;
  closed `ParticipantArrow` union (`winner`|`own`); strict marker;
  action chip verbatim with optional `actionNote` tooltip; `nfRowLinks`
  projection slot; fixed vocabulary "resolves to" as aria-label;
  provider spacing via margin (Angular strips whitespace-only nodes).
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts`
  (new) — 6 tests: both arrow kinds, pinned-never-range, vocabulary
  ("resolves to" present, "uses"/"loaded" absent), action-note
  tooltip present/absent, link-slot projection.
- `projects/devtools-ui/src/app/shared/kit/kv-list.ts|.html|.css`
  (new) — `KvItem` (label, value, mono?, href?); links open
  `_blank` + `noopener noreferrer` with pointer/hover-accent
  affordance; mono values via `--nf-font-mono`.
- `projects/devtools-ui/src/app/shared/kit/kv-list.spec.ts` (new) —
  order, mono flag, link rendering.
- `projects/devtools-ui/src/app/shared/kit/capability-badge.ts|.html|.css`
  (new) — quiet presence chip (muted, lowercase, accent ✓) with
  optional `note` tooltip; deliberately distinct from the
  warning-toned uppercase `StateBadge`.
- `projects/devtools-ui/src/app/shared/kit/capability-badge.spec.ts`
  (new) — chip render, tooltip present/absent, structural distinctness
  from `StateBadge`.
- `guards/kit-boundary.ts` + `guards/kit-boundary.spec.ts` (new) —
  structural guard: no `.ts` under `shared/kit/` imports a module with
  a `store` path segment; scan asserts >0 files scanned; negative
  tests incl. `./storefront` non-match. Runs in `npm run test:guards`.
- `projects/devtools-ui/src/styles.css` (modified) — new
  `--nf-font-mono` token (theme-invariant, in `:root` only);
  `.nf-table td` refactored onto it.
- `projects/devtools-ui/src/app/views/kit-demo.ts|.html|.css` (new) —
  dev-only playground (user-directed): interactive tree +
  master-detail + kv-list wiring (expansion/selection as caller-owned
  page state — the reference consumer pattern), all four
  participant-row variants, capability-vs-state badge contrast, sample
  tooltip notes (placeholder wording).
- `projects/devtools-ui/src/environments/environment.ts` (modified) —
  `extraRoutes` with lazy `kit-demo` route (dev only).
- `projects/devtools-ui/src/environments/environment.extension.ts`
  (modified) — `extraRoutes: []`; the fileReplacements swap keeps the
  demo component out of the packaged bundle entirely.
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — spreads
  `environment.extraRoutes` after the tab routes.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 9 block
- `docs/work/v2/task-log/task-8-shell-v2-store-strip.md` (shell
  contracts, affordance convention, StateBadge first consumer),
  `task-7-store-derivations.md` (arrow/pinned/strict rendering
  contracts the kit row mirrors; winner-less honest states)
- `shared/honest-state/state-badge.ts|.html|.css` +
  `honest-state.spec.ts` (visual vocabulary to stay distinct from;
  spec conventions), `shell/capture-status-strip.ts` (component
  conventions), `views/placeholder.ts|.html` (view conventions),
  `src/styles.css` (tokens), `app.routes.ts`, both environment files,
  `guards/bridge-boundary.ts|.spec.ts` (guard pattern),
  `vitest.guards.config.mts`, `angular.json` (unit-test builder),
  `package.json` (no CDK dependency)

### Key Decisions

— session 2026-08-12

- **Kit contracts as kit-local discriminated unions**: `DeclaredVersion`
  (`range`|`pinned`) and `ParticipantArrow` (`winner`|`own`) — the
  pinned/range mistake is unrepresentable at the type level instead of
  a runtime convention. Kit never imports store types (guard-enforced).
- **Closed two-kind arrow union, winner-less deferred**: Task 7's
  winner-less arrows (zero/several share rows) are honest states, but
  the plan pins exactly two kinds; the union is extended by Task 10/11
  together with its consumer ("build with its only consumer" doctrine).
- **No CDK**: keyboard behavior hand-rolled (roving tabindex keyed on
  stable row ids); no new dependency. Focus is the only internal
  tree-table state — expansion and selection are caller-owned;
  Right/Left only emit requests (no ARIA move-to-child, plan pins
  emit-only).
- **T9-AC-04 as a permanent guard** instead of a one-off grep:
  `guards/kit-boundary` follows the bridge-boundary pattern; a store
  import under `shared/kit/` fails `npm run test:guards` from now on.
- **"Monospace via tokens" implemented as `--nf-font-mono`** in
  `:root` (theme-invariant, so outside the light/dark blocks);
  `.nf-table td` refactored onto it — the only non-kit style touch.
- **Tooltip slots, not vocabulary (user-requested)**: optional `note`
  (capability badge) and `actionNote` (action chip) render as `title`
  with the shell's dotted-underline + help-cursor affordance — only
  when a note is set. The explanation texts belong to the Task-10/11
  view-model builders where they can be grounded in derivation rules;
  demo texts are placeholders.
- **Dev-only demo page via `environment.extraRoutes`** (user-requested):
  the established fileReplacements mechanism drops route AND lazy
  component from the extension build (verified: `rg 'kit-demo|KitDemo'
  dist/extension/` → zero); no build-step mutation, no flag checked at
  runtime in prod.
- **Two kit bugs found by screenshotting the demo, fixed at kit level**:
  (1) Angular strips whitespace-only text nodes between spans — arrow
  target and provider rendered glued ("19.2.3host"); spacing moved to
  `margin-left` on `.arrow-provider`. (2) muted text on the selected
  (accent) tree row was near-unreadable; `.tree-row.selected` re-points
  the `--nf-color-text-muted` token to accent-contrast, so projected
  consumer content inherits readable contrast without the kit styling
  foreign content.

### Review Focus

- **Behavior claims:**
  - The tree-table holds no expansion state: a toggle emits and the
    rendering provably stays unchanged until the caller updates the
    input (pinned in `tree-table.spec.ts`).
  - Keyboard contract: Up/Down move focus (roving tabindex + real
    `focus()`), Right/Left emit expand/collapse requests only when
    they would change state, Enter selects; ARIA tree semantics
    asserted.
  - The pinned participant-row variant cannot render a declared range —
    enforced by the `DeclaredVersion` union and asserted by class-level
    spec checks.
- **Assumptions / choices:** two arrow kinds only (winner-less states
  deferred to the consumer tasks); "resolves to" lives in the arrow's
  aria-label while visible text is "→ <target> <provider>" / "→ own
  copy"; demo tooltip texts are placeholder wording; `--nf-font-mono`
  as the reading of "monospace via tokens".
- **Scope notes:** demo page + environment wiring + tooltip inputs are
  user-directed additions beyond the plan block (approved in-session);
  `guards/` gained a third structural guard; `.claude/` untracked
  session tooling stays out of commit scope.
- **Read next:**
  - `shared/kit/tree-table.ts` (`onKeydown`, `moveFocus`, `tabStopId`)
    — the roving-tabindex semantics ARE the keyboard contract; check
    against your reading of T9-AC-02.
  - `shared/kit/participant-row.html` + its spec — whether the fixed
    vocabulary and pinned treatment match the plan's wording rules.
  - `guards/kit-boundary.ts` (`STORE_SEGMENT`) — whether the path-
    segment regex is the boundary you expect (it flags any `store`
    segment, not just `../store/`).

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 115 (incl. 20
  new kit tests), devtools-bridge 68, collector 58, guards 45 (incl. 3
  kit-boundary) — **286 tests, 0 failures** (263 before).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Boundary proofs:** `rg "from '.*store" shared/kit/` → zero hits
  (T9-AC-04, also CI-enforced by the new guard);
  `rg 'kit-demo|KitDemo' dist/extension/` → zero hits (demo absent
  from the packaged extension).
- **Visual verification:** demo page screenshotted headless (light via
  `?theme=light`, dark via `?theme=dark`) at `#/kit-demo`; screenshots
  delivered in-session. Interactive behavior (expand/collapse,
  selection, tooltips) exercised via the demo's caller-owned state.
  The screenshot pass caught the two kit bugs fixed above; both fixes
  re-verified by screenshot and green re-runs.
- **No collector/fixture/store changes** — corpus, probe, and store
  module untouched this task.

### Acceptance Coverage

- **T9-AC-01** — passed: `tree-table.spec.ts` "renders depth-indented
  rows from a flat row list" + "twisty click emits a toggle request
  without changing its own rendering" (re-render only after host
  input update).
- **T9-AC-02** — passed: `tree-table.spec.ts` focus-movement test
  (ArrowUp/Down + roving tabindex), request-emission test
  (ArrowRight/Left incl. no-emit cases), Enter/click selection + ARIA
  role/level/expanded assertions.
- **T9-AC-03** — passed: `participant-row.spec.ts` — winner arrow
  (target + provider), own-copy arrow, pinned variant renders the
  exact tag with `declared-pinned` styling and never `declared-range`.
- **T9-AC-04** — passed: `guards/kit-boundary.spec.ts` (CI-permanent)
  plus manual `rg` proof above.
- **T9-AC-05** — passed: `capability-badge.spec.ts` structural
  distinctness from `StateBadge`; `kv-list.spec.ts` mono/link
  rendering; `master-detail.spec.ts` slot projection.

### Open Issues

- Winner-less resolution arrows (zero/several share rows) are not yet
  a kit variant — extend `ParticipantArrow` with its first consumer
  (→ Task 10/11).
- Tooltip wording on action chips / capability badges is placeholder
  demo copy; final vocabulary belongs to the view-model builders
  (→ Task 10/11).
- Virtual scrolling deliberately not built — revisit only if the
  Import Map view proves the need (→ Task 12).
- `kv-list` links use `target="_blank"` — MV3 devtools-panel behavior
  joins the same pre-PR manual smoke item carried from Task 8.
- Orchestrator generations before the observed two remain unvalidated —
  carried from Task 6/6.5.
- Merge-vs-shim-map divergence surface → Task 13 material — carried
  from Task 6.
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Task 10 (Packages tab) can treat as validated: **the kit primitives
render and behave correctly** — keyboard, ARIA, emit-only expansion,
and the participant-row wording rules are spec-pinned; view specs only
need to test the view-model mapping into kit contracts.

- **Kit surface** (`shared/kit/`): `TreeTable` (`rows:
  readonly TreeTableRow[]`, `selectedId`, `label`; outputs `toggleRow:
  TreeTableToggle`, `selectRow: TreeTableRow`; row template context
  `{ $implicit: payload, row }`), `MasterDetail` (slots
  `nfMaster`/`nfDetail`), `ParticipantRow` (`name`, `declared:
  DeclaredVersion`, `strict`, `arrow: ParticipantArrow`, `action?`,
  `actionNote?`; slot `nfRowLinks`), `KvList` (`items: KvItem[]`),
  `CapabilityBadge` (`label`, `note?`).
- **Reference consumer:** `views/kit-demo.ts` shows the intended
  pattern — flatten hierarchy against a caller-owned `expandedIds`
  set, hold `selectedId`, rebuild rows in a `computed`. View it at
  `#/kit-demo` under `ng serve` (dev-only route via
  `environment.extraRoutes`).
- **Gotchas:** Angular removes whitespace-only text nodes between
  elements — never rely on template whitespace for visible spacing;
  selected tree rows re-point `--nf-color-text-muted`, so muted
  content needs no special-casing; the kit-boundary guard fails CI on
  any `store` path-segment import under `shared/kit/`; tooltip slots
  render the affordance only when a note is actually set.
- **Conventions to keep:** view renders from a pure vm builder (XC-06);
  identifiers in row templates use `var(--nf-font-mono)`; tooltip-only
  elements get the dotted-underline affordance, navigating elements
  pointer + hover-accent — the kit already does this internally.

### Git State

`git diff --stat`:

```
 projects/devtools-ui/src/app/app.routes.ts                   |  3 +++
 .../devtools-ui/src/environments/environment.extension.ts    |  3 +++
 projects/devtools-ui/src/environments/environment.ts         | 12 ++++++++++++
 projects/devtools-ui/src/styles.css                          |  6 +++++-
 4 files changed, 23 insertions(+), 1 deletion(-)
```

`git status --short`:

```
 M projects/devtools-ui/src/app/app.routes.ts
 M projects/devtools-ui/src/environments/environment.extension.ts
 M projects/devtools-ui/src/environments/environment.ts
 M projects/devtools-ui/src/styles.css
?? .claude/
?? guards/kit-boundary.spec.ts
?? guards/kit-boundary.ts
?? projects/devtools-ui/src/app/shared/kit/
?? projects/devtools-ui/src/app/views/kit-demo.css
?? projects/devtools-ui/src/app/views/kit-demo.html
?? projects/devtools-ui/src/app/views/kit-demo.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
