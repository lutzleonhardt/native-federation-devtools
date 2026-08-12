# Task 8: Shell V2 — one federation store, V2 tab set, capture status strip

### Task

Replaced the V1 shell with the V2 frame: `snapshot-store.ts` evolved
into the single `FederationStore` (lifecycle + capture-sequence guard
unchanged, memoized `model`/`derived` computeds added), the nav became
Packages · Remotes · Import Map · Diagnostics over honest placeholders,
the capture status strip (pure view-model builder + strip component)
signals per-tab channel state plus the generation badge, the `select`
cross-link convention is documented at the routes, and all V1 view code
was deleted.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/store/federation-store.ts`
  (renamed from `shared/snapshot-store.ts`, git-detected R) — class
  `FederationStore`: provider DI, `refresh()` with capture-sequence
  guard and lifecycle `capturing | captured | error` verbatim from V1;
  new memoized computeds `model` (ingestSnapshot) and `derived`
  (deriveFederation), both null unless captured. Raw snapshot stays
  exposed via `state`.
- `projects/devtools-ui/src/app/shared/store/federation-store.spec.ts`
  (new) — first direct guard coverage: interleaved captures, stale
  rejection, memoization by object identity, null model/derived while
  capturing and on error.
- `projects/devtools-ui/src/app/shell/capture-status.ts` (new) — pure
  strip builder `buildCaptureStatus(source): CaptureStatusVm | null`:
  spec-4.6 channel→tab mapping, mode strictly from observed tag types,
  ground-truth check on the merged `effectiveMap` (empty merge →
  partial in both tag modes), shim channel consulted only in shim
  mode, Diagnostics severity aggregation, generation passthrough
  ('unknown' suppressed). Quiet = absent entry.
- `projects/devtools-ui/src/app/shell/capture-status.spec.ts` (new) —
  10 tests: fixture-driven (dynamic-init-native/-shim,
  synthetic-not-recognized, synthetic-missing-channel/-empty-page,
  frankenstein-live, clean-skip) + SEEDED shim-partial / empty-merge /
  native-empty-merge cases; every strip AC mapped.
- `projects/devtools-ui/src/app/shell/capture-status-strip.ts|.html|.css`
  (new) — dumb strip component over the builder: partial renders via
  `nf-state-badge` (its first real consumer), off as a muted "n/a"
  chip, warning as "!" chip, the all-off page as a single "no Native
  Federation detected" line, reasons verbatim as tooltips with
  dotted-underline + help-cursor affordance; generation badge at the
  end of the status line.
- `projects/devtools-ui/src/app/shared/honest-state/state-badge.css`
  (modified) — dotted-underline + help-cursor affordance whenever a
  badge carries a note (`title`), so tooltips are discoverable.
- `projects/devtools-ui/src/app/views/placeholder.ts|.html` (new) —
  shared honest placeholder ("view not implemented yet", title from
  route data) for all four tabs until Tasks 10–13.
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — V2 tab
  routes, `/packages` default, `select` query-param convention
  (`/packages?select=<scope>|<pkg>`, `/remotes?select=<remote>`,
  `/import-map?select=<specifier>`) documented at the routes.
- `projects/devtools-ui/src/app/app.ts|.html|.css` (modified) — V2
  nav, strip mounted in the capture status line; refresh/export
  buttons unchanged; capturedAt renders as a compact date badge (UTC
  date part of the verbatim stamp, full ISO stamp as tooltip with the
  dotted-underline affordance).
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — V2 rewrite:
  tab set, default route + placeholder sweep over all four tabs,
  generation badge v4/v4.5, warning rendering, refresh-through-store,
  export delegation; V1 assertions re-homed, not dropped.
- `projects/devtools-ui/src/app/shared/snapshot-export.service.ts`
  (modified) — injects `FederationStore`; still serializes the raw
  `SnapshotV1`, never the derived model.
- Deleted (V1 shell torn down): `views/remotes-exposes.*`,
  `views/shared-dependencies.*`, `views/import-map.*`,
  `shared/runtime-view-state.*`, `shared/import-map-view-state.*`
  (each incl. specs) — 16 files, zero remaining references.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 8 block
- `docs/work/v2/task-log/task-7-store-derivations.md` (derived
  surface, generationBadge contract),
  `task-6-normalized-store-ingest.md` (ingest surface, mapMode
  semantics, V1-store coexistence note),
  `task-5-corpus-fixture-derivation.md` (fixture surface, `?fixture=`
  preview)
- Store module (`federation-model.ts`, `derived-model.ts`,
  `ingest.ts`, `derivations.ts` signatures) — builder inputs
- `snapshot-v1.ts` (`ChannelStateV1`/`ChannelsV1`), fixtures
  (dynamic-init-native/-shim, synthetic-missing-channel/-empty-page/
  -not-recognized, frankenstein-live, clean-skip) as strip ground truth
- V1 shell surface before teardown: `app.*`, `snapshot-store.ts`,
  `snapshot-export.service.*`, `views/import-map.ts`,
  `honest-state/state-badge.*`, `styles.css`, `app.config.ts`

### Key Decisions

— session 2026-08-12

- **Store evolved in place, no second service**: guard, lifecycle, and
  DI indirection copied verbatim; `model`/`derived` are chained
  `computed()`s, so memoization falls out of the signal graph (one
  ingest + one derive per captured snapshot, object identity under
  test). Ingest/derivations stay pure modules.
- **Ground-truth amendment (user-approved)**: the builder input list
  grew beyond the plan-pinned three (`ChannelsV1`, `mapMode`, status)
  by `model.effectiveMap`. Rationale: tags that merge to an empty map
  declare no resolvable setup — the quiet state would lie. Mode stays
  strictly tag-type-keyed; the merged tag map is not a channel count,
  so the "never populated-channel counts" doctrine holds.
- **Deviation: empty native merge renders partial** — "native tags
  parsed → quiet" no longer holds unconditionally (SEEDED test; no
  corpus fixture has this shape).
- **Deviation: Diagnostics severity refined** — plan pinned only
  "partial when either side is missing"; implemented: warning on
  either layer propagates as warning, both layers off → off (nothing
  to diagnose is a normal state), any other unhealthy side → partial.
- **Shim channel consulted only in shim mode**: in native mode the
  shim plays no role at all (empty `getImportMap()` is the healthy
  norm); in shim mode an unreadable shim means nobody executes the
  tags → partial with the channel reason verbatim.
- **Quiet = absent entry**: `available` never appears in the vm; a
  fully healthy capture renders an empty strip plus the generation
  badge. AC-03 is asserted as "no Import Map entry", not as a state.
- **Generation 'unknown' suppresses the badge** — non-federated pages
  claim no generation (badge shows v4 / v4.5 / mixed only).
- **One shared `ViewPlaceholder`** (route-data title) instead of four
  stub components — Tasks 10–13 swap one route target each; the
  `select` convention lives as route documentation, not code.
- **Strip visual vocabulary**: partial via `StateBadge` (first real
  consumer of the honest-state kit primitive), off as muted text dot,
  warning as bordered "!" chip in warning tokens — all tooltips carry
  reasons verbatim.
- **Layer map documented at the store**: the `FederationStore` doc
  comment explains the four-layer data path — `state` (what was
  captured, raw evidence), `model` (what is there, normalized),
  `derived` (what it means, rule-tagged), vm (how it is shown, pure
  per-view builders) — with the strip builder cross-referencing it as
  the vm-pattern example for Tasks 9–13.
- **VM naming**: no "Signal" suffix on non-Angular-Signal names —
  `StripSignal` renamed to `StripIndicator` (`entry.indicator`,
  `…Indicator` helpers) to avoid colliding with Angular's reactive
  primitive; "indicator" is the plan's own vocabulary.
- **Strip redesign after first visual (user feedback)**: bare off
  dots were illegible — they read as list separators and gave zero
  tooltip affordance. Off now renders as a muted "n/a" chip; when
  every tab would be off (the normal non-federated page) the strip
  collapses to one summary — "no Native Federation detected",
  observation vocabulary like the honest-state kit, deliberately not
  a claim about the app — with the channel reasons joined verbatim in
  its tooltip. All reason-carrying elements (StateBadge included) get
  dotted-underline + help-cursor affordance. Deviation from the
  plan's literal "muted off dot" wording, user-directed. New vm field
  `noFederation`; the Diagnostics both-off branch is unreachable by
  construction and was removed.
- **capturedAt as date badge (user feedback)**: the status line shows
  only the UTC date part (`capturedAt.slice(0, 10)` — string slice of
  the verbatim ISO stamp, no Date parsing, no locale conversion); the
  full stamp is the tooltip. Known tradeoff: several same-day
  refreshes show identical badge text — the distinction lives in the
  hover.
- **URL and generation badges are links (user feedback)**: the
  pageUrl badge opens the captured page (`target="_blank"`,
  `rel="noopener noreferrer"`); the generation badge links to
  `https://native-federation.com/` (canonical orchestrator site —
  swap target if the GitHub repo is preferred). Affordance
  separation: link badges get pointer + hover-accent, the
  dotted-underline stays reserved for tooltip-only elements (date
  badge, strip chips) so the two interaction kinds stay
  distinguishable.

### Review Focus

- **Behavior claims:**
  - The motivating V1 pair is distinguishable end to end:
    synthetic-missing-channel (per-tab: Packages/Remotes n/a,
    Diagnostics partial) vs synthetic-empty-page (collapsed
    no-federation summary), full-vm equality in
    `capture-status.spec.ts`.
  - Healthy native AND shim fixtures render entirely quiet strips
    (`entries: []`); the live fixture shows only the v4 badge.
  - The capture-sequence guard is under direct test for the first
    time, including the stale-rejection variant (an old failure never
    overwrites a newer capture).
- **Assumptions / choices:** empty-merge means no imports and no
  scope entries (integrity alone resolves nothing); builder-authored
  tooltip texts for tag-absence states (channel reasons stay verbatim
  where a channel is the source); Diagnostics severity mapping beyond
  the plan wording; 'unknown' generation suppressed rather than
  rendered.
- **Scope notes:** builder input list extended by `effectiveMap` —
  user-approved amendment before implementation, documented above.
  New `app/shell/` directory. `.claude/` untracked session tooling
  stays out of commit scope.
- **Read next:**
  - `projects/devtools-ui/src/app/shell/capture-status.ts`
    (`importMapIndicator`) — the predicate ordering (dom channel → tag
    mode → empty merge → shim channel) IS the strip semantics; check
    it against your reading of spec 4.6.
  - `projects/devtools-ui/src/app/shared/store/federation-store.ts` —
    whether the chained computeds match your reading of "memoized".
  - `capture-status.spec.ts` (AC-07 describe) — whether the pinned
    full-vm shapes are the honest outcomes you expect.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 95 (incl. 5
  store + 10 strip tests; V1 view/helper specs deleted with their
  views), devtools-bridge 68, collector 58, guards 42 — **263 tests,
  0 failures** (279 before; the delta is deleted V1 view coverage
  replaced by shell coverage).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Teardown sweep:** `rg 'snapshot-store|runtime-view-state|
  import-map-view-state|SnapshotStore|RemotesExposes|
  SharedDependencies'` (excl. docs/, .claude/) → zero hits.
- **No collector/fixture/capture changes** — corpus and probe
  untouched this task.
- **Post-rename re-runs:** after the `StripIndicator` rename and the
  layer-map doc comment, `ng test devtools-ui` re-run green (95/95);
  full chain unaffected (comment + rename only).
- **Strip-redesign re-run:** off→"n/a" relabel, all-off collapse, and
  tooltip affordance — builder + app specs updated, `ng test
  devtools-ui` green (95/95).
- **Date-badge re-run:** capturedAt as date badge with full-ISO
  tooltip — app spec updated, `ng test devtools-ui` green (95/95).
- **Link-badge re-run:** pageUrl + generation badges as anchors
  (href/target under test) — `ng test devtools-ui` green (95/95).

### Acceptance Coverage

- **T8-AC-01** — passed: `app.spec.ts` "renders the V2 tab set" +
  "defaults to /packages and renders honest placeholders on all
  tabs"; deletions verified by the teardown sweep and compile.
- **T8-AC-02** — passed: `federation-store.spec.ts` — interleaved
  guard, stale rejection, memoization by identity, null
  model/derived while capturing and on error; export service reads
  the same store (service spec green through `FederationStore`).
- **T8-AC-03** — passed: `capture-status.spec.ts` quiet strip for
  dynamic-init-native (and dynamic-init-shim as contrast).
- **T8-AC-04** — passed (SEEDED): shim tags + unreadable shim →
  partial with verbatim reason; tags merging to empty map → partial;
  no tags of either type → muted off state (rendered as "n/a" chip
  per-tab; an all-off page collapses to the no-federation summary).
- **T8-AC-05** — passed: builder (synthetic-not-recognized: Packages/
  Remotes/Diagnostics warning, reasons verbatim) + DOM title
  assertion in `app.spec.ts`.
- **T8-AC-06** — passed: builder returns null for capturing/error;
  shell-level: no `.shell-status`, no strip element while capturing.
- **T8-AC-07** — passed: missing-channel renders per-tab entries
  while empty-page collapses to the no-federation summary — full-vm
  equality for both fixtures plus explicit inequality.
- **T8-AC-08** — passed: builder passthrough (frankenstein-live v4,
  clean-skip v4.5, synthetic-empty-page → null) + DOM badge
  assertions for v4 and v4.5.
- **XC-05** (contributes) — the shell signals channel state itself;
  views never re-signal it.
- **XC-06** (contributes) — shell renders from the pure spec'd
  builder; templates consume only vm types, never store types.

### Open Issues

- Honest-state `missing-evidence`/`not-detected` are now fully
  unconsumed (kept deliberately per plan) until Tasks 10–13 wire the
  real views.
- Manual smoke of the packaged extension against
  frankenstein-meeting-room is the pre-PR gate after Task 14 —
  deliberately not an AC here. Explicitly include: anchor clicks
  (pageUrl badge, generation badge) must open a new tab from the
  packaged DevTools panel — `target="_blank"` behavior in MV3
  devtools pages is unverified.
- README build-out is deferred: the README deliberately stays
  product-boundary-only; a contributor-facing architecture section
  (four-line layer map + `FederationStore` pointer, plus build/test
  basics) belongs to the pre-PR housekeeping after Task 14.
- Orchestrator generations before the observed two (≤ v4.4, v3, …)
  remain unvalidated — carried from Task 6/6.5.
- Merge-vs-shim-map divergence surface → Task 13 Diagnostics
  material — carried from Task 6.
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Task 9 (view kit) can treat as validated: **the V2 shell frame is
correct over the corpus fixtures** — `FederationStore.model`/`derived`
are the only data entry points for views, and channel signaling is
owned by the shell.

- **Store surface:** `FederationStore` (`shared/store/
  federation-store.ts`): `state: Signal<SnapshotState>`, `model:
  Signal<FederationModel | null>`, `derived:
  Signal<DerivedFederation | null>`, `refresh()`. Both computeds are
  memoized per captured snapshot; null while capturing and on error.
- **Shell contracts:** routes `/packages` (default) · `/remotes` ·
  `/import-map` · `/diagnostics`; each view owns an optional `select`
  query param (documented in `app.routes.ts`); views replace
  `ViewPlaceholder` per route. Views never re-signal channel state
  (strip owns it) and never render generation logic (badge owns it).
- **View kit inputs:** the honest-state kit (`shared/honest-state/`)
  is available and partially consumed (StateBadge by the strip);
  global view chrome classes (`.view`, `.view-placeholder`,
  `.nf-table`, `.nf-button`, `.nf-tag`) live in `styles.css`.
- **Gotchas:** XC-06 — templates never consume store types; every
  view renders from a dedicated pure view-model builder (the strip
  sets the pattern: builder module + spec, dumb component). Quiet =
  absent entry is the strip convention; dev preview via
  `?fixture=<id>` still works for all 18 fixtures.
- **Affordance convention (shell-wide, adopt in views):** dotted
  underline + help cursor = element only carries a tooltip
  (StateBadge note, n/a chip, date badge); chip with pointer +
  hover-accent = element navigates (pageUrl badge, generation badge).
  Keep the two visually distinct in every view.

### Git State

`git diff --stat`: empty — every change is staged.

`git diff --stat HEAD`: 32 files changed, 863 insertions(+),
1349 deletions(-) — new `shell/` + store pair + placeholder,
`state-badge.css` affordance tweak, `app.css` date/URL badges,
V1 views/helpers deleted. The status no longer displays
`snapshot-store.ts` → `store/federation-store.ts` as `R` after the
comment-edit re-add; commit-time rename detection (`-M`) may still
pair the two.

`git status --short`: all task files staged (`M`/`A`/`D`);
additionally untracked:

```
?? .claude/
?? docs/work/v2/task-log/task-8-shell-v2-store-strip.md
```

(`.claude/` is session tooling, not part of this task's commit scope;
the task log itself is staged by `/commit 8`.)
