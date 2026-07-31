# Task 4: Shared Dependencies view (resolver outcome only)

### Task

Built the Shared Dependencies view (per scope/package/version-tag rows with
action, provider, and per-participant declared requirements) on a newly
extracted shared honest-state helper (`runtimeViewState`), refactored the
Remotes view onto the same helper, added the synthetic multi-version
fixture, and rendered the claims aspect as explicitly missing (Phase 2).

### Status

DONE

### Files Modified

New — devtools-ui shared layer:

- `projects/devtools-ui/src/app/shared/runtime-view-state.ts` (new) —
  pure helper mapping `SnapshotState` → discriminated union
  `capturing | error | not-detected | missing | ready`; encodes the Task-3
  honest-state branching order once; every branch carries `capture`
  (`CaptureMetaV1` on snapshot-backed branches, `null` otherwise) so views
  render entirely from the vm and never touch the store state
- `projects/devtools-ui/src/app/shared/runtime-view-state.spec.ts` (new) —
  unit tests over all branches incl. capture-meta presence and the
  defensive inconsistent-snapshot case

New — devtools-ui view:

- `projects/devtools-ui/src/app/views/shared-dependencies.ts` (rewritten) —
  placeholder → real view: `VersionRow[]` computed (one row per
  scope × package × version tag), repository-literal `providerOf()`
  (host flag → `__NF-HOST__`; sole participant → that remote; else null)
- `projects/devtools-ui/src/app/views/shared-dependencies.html` (new) —
  external template: toolbar (refresh, capture meta from `v.capture`),
  flat `@let v` + `@switch (v.kind)` honest-state branching, dense
  `.nf-table`, ambiguous badge per multi-version row, claims aspect as
  `nf-missing-evidence` with the Phase-2 reason
- `projects/devtools-ui/src/app/views/shared-dependencies.css` (new) —
  participant list, package cell weight, claims-aspect heading
- `projects/devtools-ui/src/app/views/shared-dependencies.spec.ts` (new) —
  9 fixture-driven component tests (T4-AC-01/02/03 + channel states +
  zero-packages observation + capture-meta-in-not-detected + refresh)

Modified — devtools-ui (refactor, behavior unchanged):

- `projects/devtools-ui/src/app/views/remotes-exposes.ts` (modified) —
  local `@if`-chain state logic → `vm = computed(runtimeViewState(...))`;
  local `NF_HOST` const → import from devtools-bridge; `state` property
  removed (store is private implementation detail behind vm)
- `projects/devtools-ui/src/app/views/remotes-exposes.html` (modified) —
  template `@if` chain → flat `@let v` + `@switch (v.kind)`; toolbar
  disabled/meta now read `v.kind` / `v.capture` instead of raw store state

Modified — devtools-bridge:

- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) — exported
  `NF_HOST` constant (reserved host self-registration name, part of the
  data contract; was duplicated as a local const in both views)
- `projects/devtools-bridge/src/lib/fixtures/synthetic-multi-version.fixture.ts`
  (new) — `ui-lib` with two version tags (1.2.3/calendar, 2.0.0/chat),
  both action `share`, double-labeled synthetic
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) —
  registered `synthetic-multi-version`
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  synthetic id list extended; new test: two distinct tags, no field
  singles out a winner

Docs:

- `docs/specs/native-federation-devtools.md` (modified) — backlog
  candidate appended to §6 Deferred: consumer perspective on shared
  dependencies (user idea mid-task; evidence basis, honest limits, UI
  direction, lab-app conflict-capture prerequisite)

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 4 block
- `docs/work/passive-mvp/task-log/task-3-remotes-exposes-view.md` —
  agreed opening refactor, store/honest-state APIs, test recipe
- `docs/work/passive-mvp/task-log/task-2-snapshot-dto-fixtures.md` —
  data contract, DTO-growth recipe, guard coverage
- `projects/devtools-bridge/src/lib/{snapshot-v1.ts,fixtures/*}` — DTO
  shapes; verified `ExternalRemoteV1` already carries per-participant
  requirements (no DTO extension needed)
- `projects/devtools-ui/src/app/{shared/snapshot-store.ts,shared/honest-state/*,views/remotes-exposes.*,app.routes.ts}`,
  `styles.css` — refactor base, conventions, tokens
- `docs/specs/native-federation-devtools.md` §2/§6 — evidence-layer
  terminology for the backlog note (spec read happened during the
  backlog discussion, not for task implementation)

### Key Decisions

- **Opening refactor as agreed in Task 3:** channel branching extracted
  into pure `runtimeViewState()`; each view keeps its own row projection
  (`ExposeRow[]` / `VersionRow[]`). The shared part is the channel
  branching only — no all-views viewmodel. Remotes view's 5 existing
  tests guarded the refactor unchanged.
- **`capture` on every vm branch** (user-driven mid-task): templates read
  disabled-state and capture meta from the vm; the raw store state is no
  longer referenced by any template. Capture identity stays visible in
  not-detected/missing — which page was captured when is evidence even
  when nothing was found. Rejected: leaving the toolbar on raw store
  state (two abstractions per template).
- **Provider derivation is repository-literal:** `host: true` →
  `__NF-HOST__` (host tag); else sole participant; multiple non-host
  participants → "no single provider recorded" (undemonstrated shape,
  never an inferred winner).
- **Row identity = (scope, package, version tag);** multi-version
  packages render one row per tag, every row carries
  `StateBadge kind="ambiguous"` (first production use of the Task-3
  primitive) — no element marks a selected winner (T4-AC-02).
- **`scopedExternals` stays out of this view** (user-confirmed): it is a
  separate repository, not the shared-dependency resolver outcome; empty
  in the primary capture.
- **`cached` flag never rendered** (plan rule — resolver bookkeeping,
  not browser-cache evidence).
- **No `SnapshotV1` extension:** the plan's "small DTO extension if
  needed" resolved to not needed — `ExternalRemoteV1` already records
  per-participant `requiredVersion`/`strictVersion`.
- **`NF_HOST` centralized in devtools-bridge** (user-requested): it is
  data-contract vocabulary, not a UI concern. Fixtures and specs keep
  the literal deliberately — fixtures are verbatim data; specs assert
  the real wire string so a constant typo would fail tests.
- **Spec backlog note instead of scope creep:** the consumer-perspective
  idea (which remote gets which version vs. what it declared) was parked
  in spec §6 with evidence basis (resolver outcome + import-map scopes,
  correlated never merged) and a fixture-first prerequisite (no
  cross-remote conflict demonstrated in the corpus yet).

### Review Focus

- **Behavior claims:**
  - The react outcome renders exactly as captured: `__GLOBAL__`,
    18.3.1, `share`, provider whiteboard, requirement `^18.3.1 (strict)`
    — and host-provided packages name `__NF-HOST__` as provider with the
    host's own requirement visible as participant.
  - A package with two version tags renders both rows with the ambiguous
    badge and no winner marker anywhere in the DOM.
  - No template reads the store state anymore; both views render
    entirely from `runtimeViewState` (incl. toolbar disabled + meta).
- **Assumptions / choices:** provider = host flag or sole participant
  (repository-literal, see Key Decisions); `sharedExternals` scopes only
  (`scopedExternals` excluded); claims-aspect wording ("recording reload
  (Phase 2)") chosen here, not in the plan.
- **Scope notes:** Remotes view + its template refactored (Task-3
  surface, guarded by its unchanged tests); `NF_HOST` export added to
  devtools-bridge public API; spec §6 gained a backlog subsection
  (user-requested). Stale Task-3 dev server on port 4300 was killed and
  restarted this session.
- **Read next:**
  - `projects/devtools-ui/src/app/shared/runtime-view-state.ts` — the
    branching order + per-branch `capture` typing all views now build on
  - `projects/devtools-ui/src/app/views/shared-dependencies.ts` —
    `providerOf()` is the one place interpretation could creep in
  - `projects/devtools-ui/src/app/views/shared-dependencies.html` —
    ambiguity and claims rendering against T4-AC-02/03

### Test Evidence

- `CI=true npm test` → devtools-ui 28/28 (9 shared-deps + 7 helper +
  12 pre-existing incl. the 5 unchanged remotes tests), devtools-bridge
  34/34 (incl. multi-version fixture test), guards 13/13 (privacy +
  registry completeness auto-cover the new fixture).
- `npm run build:extension` → AOT production build + bundle check green
  (2 JS, 2 HTML scanned).
- Headless Chromium against `ng serve --port 4300`, `#/shared` route:
  primary fixture 20 rows, react row + `whiteboard requires ^18.3.1
  (strict)`, rxjs row `__NF-HOST__ host requires ~7.8.0 (strict)`;
  `synthetic-multi-version` 2 rows, tags 1.2.3 + 2.0.0, ambiguous badge;
  `synthetic-collision` → zero-packages observation;
  `synthetic-not-recognized` → not-detected; `synthetic-missing-channel`
  → missing-evidence; claims aspect present in all ready states.
  Capture meta verified in the toolbar for primary and not-recognized on
  both views; `#/remotes` still renders 3 rows after the refactor.
- Session gotcha: port 4300 initially served a stale dev server from the
  Task-3 session (old placeholder DOM) — killed via `fuser -k 4300/tcp`,
  restarted, then verified.

### Acceptance Coverage

- **T4-AC-01** — passed: `shared-dependencies.spec.ts` "renders the react
  resolver outcome from the primary fixture" (scope, 18.3.1, share,
  whiteboard, `^18.3.1 (strict)`; 20 rows total) plus the host-provider
  test for rxjs.
- **T4-AC-02** — passed (→ XC-04): "renders a multi-version package as
  ambiguous with all versions visible" (both tags, badge per row, DOM
  free of selected/winner markers).
- **T4-AC-03** — passed (→ XC-04): "renders the claims aspect as missing
  with the Phase-2 reason" (missing-evidence inside `.claims-aspect`, no
  data table in the aspect; not-detected state renders no claims aspect
  at all).

### Open Issues

- Toolbar (h1 + refresh + meta) is duplicated verbatim across both view
  templates — deliberate; becomes a shared component or moves to the
  shell when Task 9 lands shell-level refresh (→ Task 9).
- `views/import-map.ts` still has the Task-1 inline-template placeholder
  — convert during its rewrite (→ Task 5).
- `runtimeViewState` covers the runtime channel only; the Import Map view
  reads `domImportMaps`/`importShim` and needs its own channel branching
  (sibling helper, same pattern) (→ Task 5).
- Consumer perspective on shared dependencies parked as spec §6 backlog
  candidate; prerequisite: extend the Frankenstein lab app to produce a
  real cross-remote version conflict and capture it (→ Phase-2 `/plan`).

### Context for Next Task

- **Shared vm pattern (validated):** inject `SnapshotStore`, derive
  `vm = computed(() => runtimeViewState(this.store.state()))`, template
  starts with `@let v = vm();` + flat `@switch (v.kind)`; toolbar uses
  `v.kind === 'capturing'` and `@if (v.capture; as capture)`. Angular 22
  narrows the union in `@case` blocks via the `@let` alias — no casts.
- **Task 5 caveat:** `runtimeViewState` is bound to
  `nativeFederationGlobals`. The Import Map view renders from
  `domImportMaps`/`importShim` — build a sibling helper with the same
  shape (and per-branch `capture`), don't force this one to generalize.
  Note `importMaps: null` iff neither channel yielded data;
  `documentMaps: []` with channel available is a zero-maps observation.
- **Data for Task 5:** primary fixture `importMaps.effective` has 22
  imports, 1 scope, 29 `integrityFor` entries (presence only — never
  render as hashes); `documentMaps` carries counts, not entry lists.
- **Bridge API additions this task:** `NF_HOST` exported from
  `devtools-bridge` (use it instead of the literal in components; keep
  literals in fixtures/specs).
- **Test recipe unchanged** (`shared-dependencies.spec.ts` is the newest
  template): counting fixture provider, `settle()`, `rowCells()`
  whitespace-normalized cell matrix.
- **Env gotchas:** dev server on 4300 (4200 occupied); IPv6-only bind
  (`localhost`, not `127.0.0.1`); loopback curl/chromium and npm need
  sandbox-disabled commands; a stale dev server from a previous session
  may occupy 4300 and serve old bundles — check DOM freshness or restart
  before headless verification; `?fixture=<id>` must be in the URL at
  load time (`/?fixture=<id>#/shared`).

### Git State

`git diff --stat`:

```
 docs/specs/native-federation-devtools.md           |  36 +++++++
 projects/devtools-bridge/src/lib/fixtures/index.ts |   2 +
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    |  13 ++-
 projects/devtools-bridge/src/lib/snapshot-v1.ts    |   3 +
 .../devtools-ui/src/app/views/remotes-exposes.html | 104 ++++++++++-----------
 .../devtools-ui/src/app/views/remotes-exposes.ts   |  12 +--
 .../src/app/views/shared-dependencies.ts           | 100 +++++++++++++++++---
 7 files changed, 198 insertions(+), 72 deletions(-)
```

`git status --short`:

```
 M docs/specs/native-federation-devtools.md
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.ts
 M projects/devtools-ui/src/app/views/remotes-exposes.html
 M projects/devtools-ui/src/app/views/remotes-exposes.ts
 M projects/devtools-ui/src/app/views/shared-dependencies.ts
?? .claude/
?? projects/devtools-bridge/src/lib/fixtures/synthetic-multi-version.fixture.ts
?? projects/devtools-ui/src/app/shared/runtime-view-state.spec.ts
?? projects/devtools-ui/src/app/shared/runtime-view-state.ts
?? projects/devtools-ui/src/app/views/shared-dependencies.css
?? projects/devtools-ui/src/app/views/shared-dependencies.html
?? projects/devtools-ui/src/app/views/shared-dependencies.spec.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
