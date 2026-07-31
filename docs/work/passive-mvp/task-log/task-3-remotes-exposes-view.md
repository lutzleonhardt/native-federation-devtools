# Task 3: Remotes & Exposes view and honest-state primitives

### Task

Built the first real view (Remotes & Exposes) against `SnapshotProvider`
with per-(remote, expose-key) rows, created the shared honest-state
primitives and a signal-based `SnapshotStore` with manual refresh, added
the synthetic collision fixture, and fixed a fixture-selection timing bug
in the DI wiring.

### Status

DONE

### Files Modified

New — devtools-bridge:

- `projects/devtools-bridge/src/lib/fixtures/synthetic-collision.fixture.ts`
  (new) — two remotes (`calendar`, `chat`) exposing the identical module
  key with different files; double-labeled synthetic; `importShim`
  unavailable so `effective: null` stays consistent
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) —
  registered `synthetic-collision` in `FIXTURES`
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  synthetic id list extended; new test: colliding key identical across
  remotes, files distinct

New — devtools-ui shared layer:

- `projects/devtools-ui/src/app/shared/snapshot-store.ts` (new) —
  root-provided signal store over `SNAPSHOT_PROVIDER`:
  `capturing | captured | error` union, `refresh()`, sequence guard
  against out-of-order resolutions; captures once on construction
- `projects/devtools-ui/src/app/shared/honest-state/missing-evidence.{ts,html,css}`
  (new) — block-level "Evidence missing" + verbatim reason
- `projects/devtools-ui/src/app/shared/honest-state/state-badge.{ts,html,css}`
  (new) — `kind: 'partial' | 'ambiguous'` badge (solid vs. dashed/italic),
  optional `note` as tooltip; no consumer yet (first use: Task 9 /
  Task 4+)
- `projects/devtools-ui/src/app/shared/honest-state/not-detected.{ts,html,css}`
  (new) — global "No Native Federation detected" empty state + reason
- `projects/devtools-ui/src/app/shared/honest-state/honest-state.spec.ts`
  (new) — distinct renderings, verbatim reasons, tooltip note

Modified — devtools-ui view + shell:

- `projects/devtools-ui/src/app/views/remotes-exposes.ts` (rewritten) —
  placeholder → real view: rows computed as flattened
  (remote, expose-key) pairs, host tagged, refresh via store
- `projects/devtools-ui/src/app/views/remotes-exposes.html` (new) —
  external template: toolbar (refresh, capture meta), honest-state
  branching (not-recognized → not-detected, unavailable →
  missing-evidence, runtime-null-despite-available → defensive
  missing-evidence, zero remotes → observation), dense `.nf-table`
- `projects/devtools-ui/src/app/views/remotes-exposes.spec.ts` (new) —
  fixture-driven component tests incl. counting provider
- `projects/devtools-ui/src/app/app.config.ts` (modified) — BUGFIX:
  fixture id now read at module-evaluation time; the lazy factory read
  `location.search` after the hash router had stripped it (see Key
  Decisions)
- `projects/devtools-ui/src/styles.css` (modified) — `--nf-color-warning-*`
  tokens in all three theme blocks; global shared view chrome
  (`.view-toolbar`, `.view-meta`, `.nf-button`, `.nf-table`, `.nf-tag`,
  `.view-observation`, `.view h1`, `.view-placeholder`)
- `projects/devtools-ui/src/app/app.css` (modified) — removed
  `.shell-content h1` / `.view-placeholder` rules: emulated encapsulation
  meant they never reached routed views (latent Task-1 issue); replaced
  by the global rules above

Plan:

- `docs/work/passive-mvp/plan.md` (modified) — appended Task 9
  (channel-state tab indicators + shell-level refresh, user-requested
  mid-task) and added T9 to XC-04 touches

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 3 block
- `docs/work/passive-mvp/task-log/task-2-snapshot-dto-fixtures.md` —
  data contract, honest-state rules, env gotchas
- `docs/work/passive-mvp/task-log/task-1-scaffold-extension-shell.md` —
  theming rules (targeted grep only)
- `projects/devtools-bridge/src/lib/{snapshot-v1.ts,snapshot-provider.ts,fixture-snapshot-provider.ts,public-api.ts}`
  and the four Task-2 fixtures — DTO shapes and fixture states
- `projects/devtools-ui/src/{main.ts,app/app.ts,app/app.html,app/app.routes.ts,app/app.spec.ts}`
  — shell wiring, test patterns

### Key Decisions

- **Plain HTML tables, no UI library** (plan rule, user-confirmed):
  native `<table>` + global CSS via `--nf-*` tokens only; Angular itself
  is the only framework involved.
- **No inline templates/styles** (user correction mid-task): every
  component uses `templateUrl`/`styleUrl` with sibling `.html`/`.css`
  files. Applies to all future components; the Task-1 placeholder views
  (`import-map.ts`, `shared-dependencies.ts`) still have inline templates
  and get converted when Task 4/5 rewrite them.
- **Row identity = (remote name, expose key):** one table row per pair;
  collisions stay separate entries attributed to each remote. The primary
  fixture demonstrates the collision in real data (mermaid + whiteboard
  both expose `…/Bootstrap`, distinct files) — validity confirmed:
  expose keys are per-remote namespaced in Native Federation
  (`loadRemoteModule(remote, key)`), so cross-remote key equality is
  normal, not an error.
- **Honest-state mapping in the view:** `not-recognized` → global
  not-detected state; `unavailable` → missing-evidence with verbatim
  reason; `runtime === null` despite channel `available` → defensive
  missing-evidence naming the inconsistency (never render "zero remotes"
  from inconsistent data); `remotes: {}` with channel available →
  explicit zero-remotes observation text. `__NF-HOST__` is rendered
  (tagged "host", "no exposes registered" as observation) — hiding it
  would be an invented filter.
- **`SnapshotStore` as root-provided signal store** (not per-view):
  one snapshot feeds all views; Task 9 hangs tab indicators off the same
  instance. Sequence counter drops stale resolutions. Store starts a
  capture on construction, so views need no init logic.
- **One `StateBadge` with `kind` input** instead of two components:
  partial = solid warning fill, ambiguous = dashed border + italic —
  distinct renderings with shared geometry. Rejected: two near-identical
  components.
- **Warning tokens** (`--nf-color-warning-{text,bg,border}`) added to all
  three theme blocks (light, dark media fallback, dark attribute) — the
  only token addition; everything else reuses Task-1 tokens.
- **BUGFIX — fixture query read at module-eval time:** the hash router's
  initial navigation rewrites `/?fixture=x` to `/#/remotes` and drops the
  search part; the `SNAPSHOT_PROVIDER` factory runs lazily (first
  injection by the view) and therefore saw an empty `location.search` —
  fixture selection silently always fell back to the primary fixture.
  Fix: capture `fixtureIdFromQuery(location.search)` in module scope of
  `app.config.ts` (evaluated before bootstrap, like Task 1's `?theme=`
  read in `main.ts`). Found via headless-Chromium repro with a temporary
  factory log (`search: ""` at factory time).
- **Global view styles instead of app.css:** App's emulated
  encapsulation scopes its CSS to its own template, so view-level
  classes styled there never applied inside routed components. Shared
  view chrome now lives in `styles.css` with a comment explaining why.

### Review Focus

- **Behavior claims:**
  - `?fixture=<id>` on the served URL now actually switches the rendered
    state (headless-verified for all five fixtures); before the
    app.config fix it silently always showed the primary fixture.
  - Colliding expose keys render as two attributed rows, proven by both
    the synthetic collision fixture test and the real collision in the
    primary fixture (same `…/Bootstrap` key, different files).
  - Refresh re-invokes `captureSnapshot()` through the DI token only —
    swapping the live provider in Task 8 requires no view change.
- **Assumptions / choices:** "expose key" = `ExposeV1.moduleName`;
  `__NF-HOST__` is shown as a host-tagged row; capture *errors* render
  through `MissingEvidence` ("Snapshot capture failed: …") rather than a
  dedicated error component; `partial`/`ambiguous` primitives ship
  without a production consumer (tested directly; first consumers are
  Task 4+/Task 9).
- **Scope notes:** plan.md gained Task 9 mid-task (user-requested);
  `app.css`/`styles.css` restructure touches Task-1 surface (scoping
  fix, see Key Decisions); `snapshot-v1.spec.ts` in devtools-bridge
  extended for the new fixture. The dev-server smoke ran on port 4300 —
  4200 was occupied by an unrelated project.
- **Read next:**
  - `projects/devtools-ui/src/app/views/remotes-exposes.html` — the
    honest-state branching order is the core review surface
  - `projects/devtools-ui/src/app/app.config.ts` — the module-eval-time
    fixture read; subtle timing rationale in the comment
  - `projects/devtools-ui/src/app/shared/snapshot-store.ts` — sequence
    guard and state union all views will build on

### Test Evidence

- `CI=true npm test` → devtools-ui 12/12 (5 view tests + 4 honest-state
  tests + 3 pre-existing), devtools-bridge 30/30 (incl. new collision
  fixture round-trip/labeling/state), guards 12/12 (privacy + registry
  completeness automatically cover the new fixture).
- `npm run build:extension` → AOT production build + bundle check green
  (2 JS, 2 HTML scanned).
- Headless Chromium (`--dump-dom --virtual-time-budget=8000`) against
  `ng serve` on port 4300, all five fixture URLs:
  `frankenstein-production` 3 rows; `synthetic-collision` 3 rows with the
  `Widget` key twice (calendar + chat); `synthetic-empty-page` and
  `synthetic-missing-channel` → missing-evidence, no table;
  `synthetic-not-recognized` → not-detected, no table.
- Bugfix evidence: before the fix, `?fixture=synthetic-empty-page`
  rendered the frankenstein table; temporary factory log showed
  `{"href":"http://localhost:4300/#/remotes","search":""}` at factory
  time. After the fix all five URLs render their own state (above).

### Acceptance Coverage

- **T3-AC-01** — passed: `remotes-exposes.spec.ts` "renders name, scope
  URL, and expose keys per remote" (host/mermaid/whiteboard rows with
  scope URLs, keys, files).
- **T3-AC-02** — passed: "renders colliding expose keys as separate
  entries per remote" (two `Widget` rows attributed to calendar/chat).
- **T3-AC-03** — passed (→ XC-04): "renders the not-detected state with
  reason and no rows" (not-recognized fixture; no `.nf-table` in DOM).
- **T3-AC-04** — passed (→ XC-04): `honest-state.spec.ts` — distinct
  renderings for missing/partial/ambiguous + not-detected, reasons
  verbatim, note tooltip.
- **T3-AC-05** — passed: "refresh re-invokes captureSnapshot()" —
  counting fixture provider: 1 call on load, 2 after click, table still
  rendered.

### Open Issues

- After load, the address bar no longer shows `?fixture=` (hash router
  rewrites the URL); the selection still applies. Cosmetic; if it ever
  bothers, move the parameter into the hash part — small rework of the
  Task-2 query helper.
- Task-1 placeholder views (`import-map.ts`, `shared-dependencies.ts`)
  still use inline templates — convert during their rewrites (→ Task 4,
  Task 5).
- Channel-state visibility across views (missing-channel vs. empty-page
  look identical in this view — legitimately, same channel evidence)
  → Task 9 (tab indicators + shell-level refresh), added to the plan
  this session.
- Honest-state branching lives as an `@if` chain in the view template —
  only DOM-testable and about to be needed by the Shared Dependencies
  view (same channel). Extract into a shared pure helper + per-view
  viewmodel as the opening step of Task 4; deliberately deferred here
  (rule of two: design the shared API against the second consumer)
  (→ Task 4).

### Context for Next Task

- **Shared layer to reuse:** inject `SnapshotStore`
  (`shared/snapshot-store.ts`) — `state()` returns
  `{ status: 'capturing' } | { status: 'captured'; snapshot } |
  { status: 'error'; message }`; call `refresh()` for manual re-capture.
  Root-provided: all views + shell share one instance.
- **Honest-state components:** `nf-missing-evidence [reason]`,
  `nf-not-detected [reason]`, `nf-state-badge [kind] [note]`
  (`shared/honest-state/`). Follow the Remotes view's branching order:
  not-recognized → not-detected; unavailable → missing-evidence;
  null-runtime-despite-available → defensive missing-evidence; empty
  data with available channel → explicit observation text.
- **Styling:** global classes in `styles.css` (`.view-toolbar`,
  `.nf-button`, `.nf-table`, `.nf-tag`, `.view-observation`) are meant
  for reuse by Task 4/5; do NOT put view-level classes into `app.css`
  (emulated scoping — they won't apply). Warning palette:
  `--nf-color-warning-{text,bg,border}`.
- **Component conventions:** external `templateUrl`/`styleUrl` always
  (user rule); OnPush; signals (`input.required`, `computed`).
- **Test recipe** (`remotes-exposes.spec.ts` is the template): counting
  fixture provider class implementing `SnapshotProvider`, TestBed
  provider override for `SNAPSHOT_PROVIDER`, `settle()` helper
  (setTimeout-flush + `whenStable` + `detectChanges`) for the async
  capture; `fixture.componentRef.setInput()` for required inputs.
- **Fixture previews in a browser:** `?fixture=<id>` must be in the URL
  at *load* time (module-eval read); the URL bar loses the param after
  bootstrap — re-enter the full URL to switch. Headless check:
  `chromium --headless --dump-dom --virtual-time-budget=8000 <url>`.
- **Env gotchas:** port 4200 may be occupied by an unrelated project —
  the smoke setup uses `ng serve --port 4300`; dev server binds IPv6
  (`localhost`, not `127.0.0.1`); loopback curl/chromium need
  sandbox-disabled commands here.
- **For Task 4 (Shared Dependencies) — agreed opening step:** do NOT
  copy the Remotes view's template `@if` chain. First extract the
  honest-state branching into a shared pure helper (working name
  `runtimeViewState(state)` → `'capturing' | 'error' | 'not-detected' |
  'missing' | 'ready'` + reason) and give each view a discriminated-union
  viewmodel `computed` (flat `@switch (vm().kind)` template); refactor
  the Remotes view onto it — its existing component tests guard the
  refactor. No global all-views viewmodel (that would be the "universal
  snapshot schema" the plan rejects); the shared part is the channel
  branching only. Task 9's tab indicators reuse the same helper.
  Resolver-outcome data then lives in
  `runtime.sharedExternals['__GLOBAL__']` (20 packages in the primary
  fixture, react 18.3.1 sole provider whiteboard) — same channel
  (`nativeFederationGlobals`) as this view.

### Git State

`git diff --stat`:

```
 docs/work/passive-mvp/plan.md                      |  80 +++++++++++++++-
 projects/devtools-bridge/src/lib/fixtures/index.ts |   2 +
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    |  11 ++-
 projects/devtools-ui/src/app/app.config.ts         |   8 +-
 projects/devtools-ui/src/app/app.css               |  11 +--
 .../devtools-ui/src/app/views/remotes-exposes.ts   |  61 +++++++++---
 projects/devtools-ui/src/styles.css                | 105 +++++++++++++++++++++
 7 files changed, 255 insertions(+), 23 deletions(-)
```

`git status --short`:

```
 M docs/work/passive-mvp/plan.md
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-ui/src/app/app.config.ts
 M projects/devtools-ui/src/app/app.css
 M projects/devtools-ui/src/app/views/remotes-exposes.ts
 M projects/devtools-ui/src/styles.css
?? .claude/
?? projects/devtools-bridge/src/lib/fixtures/synthetic-collision.fixture.ts
?? projects/devtools-ui/src/app/shared/
?? projects/devtools-ui/src/app/views/remotes-exposes.html
?? projects/devtools-ui/src/app/views/remotes-exposes.spec.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
