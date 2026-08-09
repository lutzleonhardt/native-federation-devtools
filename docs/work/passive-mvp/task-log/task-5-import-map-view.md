# Task 5: Import Map view

### Task

Built the Import Map view (global imports with effective targets, scopes
grouped beneath, integrity-presence indicator, resolution-only caption) on a
new sibling honest-state helper (`importMapViewState`), added the missing
`synthetic-no-import-maps` fixture the acceptance criteria required, aligned
the section tables via fixed shared column widths, and — user-driven — removed
the unused full `snapshot` from both view-state `ready` branches.

### Status

DONE

### Files Modified

New — devtools-ui shared layer:

- `projects/devtools-ui/src/app/shared/import-map-view-state.ts` (new) —
  sibling of `runtimeViewState` bound to the two import-map channels
  (`domImportMaps`, `importShim`); discriminated union
  `capturing | error | not-detected | missing | document-only | ready`;
  `document-only` is the one deliberate shape difference (document maps
  observed, effective layer missing with the shim reason); defensive
  inconsistent-snapshot reasons when a channel claims available but data is
  null; `ready` carries `{ capture, effective }`
- `projects/devtools-ui/src/app/shared/import-map-view-state.spec.ts` (new) —
  8 unit tests over all branches incl. both defensive cases and the
  zero-document-maps observation

New — devtools-ui view:

- `projects/devtools-ui/src/app/views/import-map.ts` (rewritten) — Task-1
  placeholder (last remaining inline template) → real view: `ImportRow[]` /
  `ScopeGroup[]` computed from the vm, integrity presence via
  `integrityFor` set membership
- `projects/devtools-ui/src/app/views/import-map.html` (new) — external
  template: verbatim toolbar, flat `@let v` + `@switch (v.kind)`,
  resolution-only caption, global-imports table, scope-group tables beneath,
  document-only/missing/observation states; shared `<colgroup>` in both
  tables; `title` tooltips on specifier/target cells
- `projects/devtools-ui/src/app/views/import-map.css` (new) — muted section
  headings (scope URL exempt from uppercase), fixed table layout with shared
  column widths (specifier 320px, integrity 6rem) so the stacked section
  tables align, cell ellipsis, document-map list
- `projects/devtools-ui/src/app/views/import-map.spec.ts` (new) — 10
  fixture-driven component tests (T5-AC-01/02 + integrity negative case via
  in-memory snapshot variant + document-only + zero-maps + capture meta +
  refresh); adds a `renderSnapshot(snapshot)` helper alongside the
  `renderView(fixtureId)` recipe

Modified — devtools-ui (user-driven vm slimming, behavior unchanged):

- `projects/devtools-ui/src/app/shared/runtime-view-state.ts` (modified) —
  `snapshot: SnapshotV1` removed from the `ready` branch (was never read by
  any view or template); ready = `{ capture, runtime }`
- `projects/devtools-ui/src/app/shared/runtime-view-state.spec.ts` (modified)
  — ready assertion without `snapshot`

Modified — devtools-bridge:

- `projects/devtools-bridge/src/lib/fixtures/synthetic-no-import-maps.fixture.ts`
  (new) — both import-map channels unavailable with reasons,
  `importMaps: null`, runtime absent too; double-labeled synthetic. Fills a
  discovered gap: every pre-existing fixture had `domImportMaps: available`
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) —
  registered `synthetic-no-import-maps`
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  synthetic id list extended; new facts test (both channels unavailable with
  reasons, importMaps null); fixture annotated as `SnapshotV1` to widen the
  literal channel type (TS2367 otherwise)

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 5 block
- `docs/work/passive-mvp/task-log/task-4-shared-dependencies-view.md` —
  vm pattern, Task-5 caveats (sibling helper, data facts), env gotchas
- `docs/work/passive-mvp/task-log/task-2-snapshot-dto-fixtures.md` —
  import-map DTO null-semantics, fixture-growth recipe, guard coverage
- `projects/devtools-bridge/src/lib/{snapshot-v1.ts,fixtures/*}` — DTO
  shapes, fixture states, registry
- `projects/devtools-ui/src/app/{shared/snapshot-store.ts,shared/runtime-view-state.*,shared/honest-state/*,views/shared-dependencies.*,app.routes.ts}`,
  `styles.css` — patterns, primitives, tokens
- `captures/frankenstein/production-04-remote-interaction.json` — raw
  shared-chunks keys and document-map scope entries (data-interpretation
  discussion with Lutz)
- Research repo (read-only reference, sanctioned by plan):
  `packages/collector/src/runtime-schema.js` — `remoteProvider` naming
  confirmed the provider-not-consumer semantics of version participants

### Key Decisions

- **Sibling helper, not generalization:** `importMapViewState` mirrors the
  `runtimeViewState` shape (per-branch `capture`) but stays bound to its two
  channels. The extra **`document-only`** kind keeps the template a flat
  `@switch` instead of nested `@if`s; it renders document-map counts as an
  observation plus an explicit missing effective layer. Zero document maps
  with an available channel stays an observation (empty-page fixture).
- **Missing-reason format for two channels:** labeled and joined —
  `Document maps: <reason> · Import shim: <reason>`; `not-detected` only when
  *both* channels report not-recognized; a channel claiming available while
  data is null yields defensive inconsistent-snapshot reasons (both levels:
  `importMaps` null and `effective` null).
- **New fixture instead of reusing:** T5-AC-02 needs a snapshot without any
  import-map channel; audit showed no existing fixture qualified
  (`synthetic-missing-channel` is deliberately *partial* — document map
  declared, shim absent — and now exercises `document-only`).
- **Integrity is presence-per-entry:** `integrityFor.includes(target)`,
  rendered as an `nf-tag` "SRI" with explanatory tooltip, never hashes. The
  real capture has integrity on all 29 entries, so the negative case is
  covered via an in-memory fixture variant (`renderSnapshot` helper).
- **Column alignment (user feedback on first render):** both section tables
  share fixed column widths via `<colgroup>` + `table-layout: fixed`,
  ellipsis + `title` for overflow. Discussed and parked alternatives for
  true content-driven alignment across sections: single table with
  `colspan` section rows (preferred), CSS subgrid (drops table semantics).
- **`snapshot` removed from both vm `ready` branches (user-driven):** grep
  proved no view/template ever read it; carrying the full `SnapshotV1` was a
  bypass hatch around the honest-state branching (layering rule: views see
  only their channel's evidence). The Task-6 exporter reads
  `SnapshotStore.state()` directly instead.
- **Session insight recorded for Phase 2 (not implemented):** the
  `sharedExternals` version participants are *providers*, not consumers
  (collector schema literally names them `remoteProvider`); resolution is
  order-dependent (first compatible provider wins) and actual consumption is
  unrecorded — closing this needs remote-entry claims + transport evidence
  (Phase 2). The spec §6 consumer-perspective backlog note should gain this
  first-wins nuance when next edited.

### Review Focus

- **Behavior claims:**
  - The primary fixture renders 22 global-import rows (specifier, effective
    target, SRI presence), one scope group headed by the scope URL with its
    7 imports, and the resolution-only caption — columns aligned across both
    section tables.
  - A snapshot without any import-map channel renders the missing state
    carrying *both* channel reasons; a document-declared map without a shim
    renders counts as observation plus an explicit missing effective layer —
    no table is invented in either state.
  - Both shared vm helpers now expose only `{ capture, <channel payload> }`
    on `ready`; no view can reach the full snapshot through a vm.
- **Assumptions / choices:** caption wording taken near-verbatim from the
  plan; `document-only` branch name and its observation texts chosen here;
  fixed column widths (320px specifier) calibrated to current fixture
  content; new fixture keeps *all* channels unavailable (minimal, not
  runtime-mixed).
- **Scope notes:** `runtime-view-state.ts` (Task-4 surface) touched by the
  vm-slimming refactor — guarded by its updated spec plus the unchanged
  remotes/shared-deps view tests; bridge spec gained a `SnapshotV1`
  annotation solely to widen a literal type. Column-alignment polish was
  user-requested mid-task, not in the plan block.
- **Read next:**
  - `projects/devtools-ui/src/app/shared/import-map-view-state.ts` — the
    two-channel branching order and defensive reasons
  - `projects/devtools-ui/src/app/views/import-map.html` — honest-state
    rendering against T5-AC-01/02 and the document-only aspect
  - `projects/devtools-bridge/src/lib/fixtures/synthetic-no-import-maps.fixture.ts`
    — the fixture T5-AC-02 rests on

### Test Evidence

Implementation session 2026-07-31:

- `CI=true npm test` → devtools-ui 46/46 (8 helper + 10 view tests new),
  devtools-bridge 38/38 (round-trip/labeling auto-extend + new facts test),
  guards 14/14 (privacy + registry completeness auto-cover the new fixture).
  One intermediate compile failure (TS2367, literal fixture type vs.
  `!== 'available'` guard) fixed via `SnapshotV1` annotation.
- `npm run build:extension` → AOT production build + bundle check green
  (2 JS, 2 HTML scanned).
- Headless Chromium against `ng serve --port 4300`, `#/import-map`: primary
  fixture 22 global rows + 1 scope group (7 rows) + 29 SRI tags + caption;
  `?fixture=synthetic-no-import-maps` → missing with both reasons + capture
  meta; `?fixture=synthetic-missing-channel` → document-only ("declares 1
  import map(s)", counts line, missing effective aspect);
  `?fixture=synthetic-empty-page` → zero-maps observation + missing
  effective aspect. Stale Task-4 dev server initially occupied 4300 — killed
  via `fuser -k`, restarted fresh before verification.
- Column-alignment fix verified by screenshot: both tables share column
  edges; longest specifier fits at 320px (at 300px it ellipsized).

— session 2026-08-09 (vm slimming):

- Full suite re-run after removing `snapshot` from both `ready` branches:
  46/38/14 green, `build:extension` + bundle check green.

### Acceptance Coverage

- **T5-AC-01** — passed: `import-map.spec.ts` "renders the 22 global imports
  with targets and integrity presence" + "renders the single scope grouped
  with its imports" (22 rows, scope URL heading, 7 scope rows, SRI on all
  29; negative integrity case via in-memory variant; caption test).
- **T5-AC-02** — passed (→ XC-04): "renders the missing state with reasons
  when no import-map channel yielded data" against the new
  `synthetic-no-import-maps` fixture (both reasons visible, no table, no
  caption); document-only and zero-maps tests secure the partial states
  beyond the AC letter.

### Open Issues

- Toolbar (h1 + refresh + meta) now duplicated verbatim across three view
  templates — becomes shared/shell-level when Task 9 lands (→ Task 9).
- Fixed column widths are calibrated to current fixture content; longer
  specifiers ellipsize (tooltip fallback). Robust alternative parked:
  one table with `colspan` section-header rows (content-driven alignment
  across all groups) — optional polish, user aware.
- Spec §6 consumer-perspective backlog note lacks the first-wins /
  provider-not-consumer nuance from this session's analysis (→ fold in on
  next spec edit or Phase-2 `/plan`).
- Playground (native-federation.github.io/playground) identified as
  attractive second real capture: four import-map scopes incl. per-remote
  chunks — would exercise multi-scope rendering that is currently only
  theoretically supported (→ capture possible once Task 7/8 tooling exists).

### Context for Next Task

- **Slimmed vm contracts (both helpers):** `RuntimeViewState.ready` =
  `{ kind, capture, runtime }`; `ImportMapViewState.ready` =
  `{ kind, capture, effective }`. Views deliberately cannot reach the full
  snapshot through a vm — the Task-6 exporter must read
  `SnapshotStore.state()` directly (`status === 'captured'` →
  `state.snapshot` is the complete `SnapshotV1`; store is
  `providedIn: 'root'`).
- **Validated baseline:** all three views render honestly from every
  registered fixture (7 ids: `frankenstein-production`, `synthetic-collision`,
  `synthetic-empty-page`, `synthetic-missing-channel`,
  `synthetic-multi-version`, `synthetic-no-import-maps`,
  `synthetic-not-recognized`) — export work never needs to touch view
  internals.
- **Test recipe:** `import-map.spec.ts` is the newest template; it adds
  `renderSnapshot(snapshot)` for in-memory fixture variants next to the
  counting provider + `settle()` + `rowCells()` pattern.
- **Fixture growth recipe unchanged** (Task-2 log): hand-write synthetic,
  register in `FIXTURES`, extend the synthetic id list in
  `snapshot-v1.spec.ts` — privacy/registry guards auto-cover.
- **Env gotchas:** dev server on 4300 (4200 occupied), IPv6-only bind
  (`localhost`, not `127.0.0.1`), stale dev servers from prior sessions may
  occupy 4300 — check freshness or `fuser -k 4300/tcp`; npm/loopback
  curl/chromium need sandbox-disabled commands; `?fixture=<id>` must be in
  the URL at load time (`/?fixture=<id>#/import-map`).

### Git State

`git diff --stat`:

```
 projects/devtools-bridge/src/lib/fixtures/index.ts |  2 +
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    | 13 +++-
 .../src/app/shared/runtime-view-state.spec.ts      |  1 -
 .../src/app/shared/runtime-view-state.ts           |  5 +-
 projects/devtools-ui/src/app/views/import-map.ts   | 70 ++++++++++++++++++----
 5 files changed, 76 insertions(+), 15 deletions(-)
```

`git status --short`:

```
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-ui/src/app/shared/runtime-view-state.spec.ts
 M projects/devtools-ui/src/app/shared/runtime-view-state.ts
 M projects/devtools-ui/src/app/views/import-map.ts
?? projects/devtools-bridge/src/lib/fixtures/synthetic-no-import-maps.fixture.ts
?? projects/devtools-ui/src/app/shared/import-map-view-state.spec.ts
?? projects/devtools-ui/src/app/shared/import-map-view-state.ts
?? projects/devtools-ui/src/app/views/import-map.css
?? projects/devtools-ui/src/app/views/import-map.html
?? projects/devtools-ui/src/app/views/import-map.spec.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
