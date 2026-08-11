# Task 7: Store derivations — provider, resolution arrows, chunk attribution, badges, provenance

### Task

Built the V2 derivations layer (`deriveFederation` over the Task-6
`FederationModel`): provider derivation with three honest outcomes,
per-participant resolution arrows, the three-level chunk-attribution
ladder with the source-derived losing-copy diff, secondary-entry parent
linking, capability badges plus the generation badge, and strict-scope
semantics — every derived field tagged with the rule that produced it.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/store/derived-model.ts` (new) —
  types of the derivation layer: closed `DerivationRule` union (13
  provenance tags), `ProviderDerivation` (derived/ambiguous/
  unattributable), `ResolutionArrow`, `ParentLink`, `DeclaredNotMapped`,
  `SharedRowFacts`, `RemoteChunkAttribution` (ladder levels
  package/remote/none), `RemoteBadges`, `GenerationBadge`,
  `PackageConflict`, `DerivedFederation`.
- `projects/devtools-ui/src/app/shared/store/derivations.ts` (new) —
  `deriveFederation(model)`: most-specific scope-prefix provider
  matching with host demotion, registry-election arrows (skip → unique
  winner's file, share/scope → own copy), attribution ladder
  (bundle-chunk join / pseudo-external groups / explicit absence),
  skip-row declared-not-mapped diff (tag `source-derived`), name-derived
  parent linking, per-remote badges, conflict indicator with
  strict-scope exclusion and pinned-range flags.
- `projects/devtools-ui/src/app/shared/store/derivations.spec.ts`
  (new) — 20 tests, fixture-driven (frankenstein-live, strict-split,
  self-fill, strict-scope, clean-skip, non-dense) + SEEDED cases
  (most-specific tie, foreign origin, orphan subpath, spelling pair);
  every T7 AC mapped, XC-02 equivalence pinned.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 7 block
- `docs/work/v2/task-log/task-6.5-generation-relabel.md` (label
  contract), `task-6-normalized-store-ingest.md` (model surface,
  strict hook, gotchas), `task-4-collector-corpus-schemas.md` (DTO
  fields the derivations read), `task-3-frankenstein-live-recapture.md`
  (live provider/badge ground truth, 20/20 verification at capture time)
- Store module (`federation-model.ts`, `ingest.ts`,
  `merge-document-maps.ts`, `semver-compare.ts`, `ingest.spec.ts`) —
  surface + test conventions
- Fixtures as spec ground truth: `frankenstein-live`, `strict-scope`,
  `strict-split`, `self-fill`, `non-dense`, `clean-skip`, `scoped`;
  `fixtures/index.ts` (FIXTURES keys), `snapshot-v1.ts` type names

### Key Decisions

— session 2026-08-12

- **Separate pure layer, ingest untouched**: `deriveFederation(model:
  FederationModel): DerivedFederation` beside `ingestSnapshot` — the
  Task-6 validated surface stays frozen; round-4 views call ingest →
  derive. Zero collector/DTO/fixture changes.
- **Host demotion is absolute, not length-based**: the host never
  outranks ANY matching remote, whatever the prefix lengths; it wins
  only as least-specific fallback when no remote prefix matches at all
  (`hostFallback: true`). A bare longest-prefix rule was rejected — a
  host scoped at the page base must never claim same-origin remote
  files (T7-AC-01).
- **Ambiguous == most-specific tie**: prefix matches of one target are
  always nested-or-equal, so "no unique most-specific winner" is
  exactly the equal-prefix case — seeded with two remotes sharing one
  scopeUrl; genuinely nested prefixes with a unique longest match stay
  *derived* (contrast assertion in the same test).
- **Winner = the unique share row** of the (scope, package) group; zero
  or several share rows yield an honest winner-less arrow (null
  participant/file/target), never a guess. The arrow target reuses the
  winner row's map-backed `resolution` instead of re-deriving
  scopeUrl + file — one source of truth for served URLs.
- **`servedFileOf`**: the row's servedFiles entry with `entry ===
  packageName` (v4.5) or `entry === null` (v4), fallback first entry —
  spelling-blind by construction.
- **Ladder levels**: 'package' requires bundle-carrying participant
  rows AND `shared-chunks`-origin groups of that remote; a bundle
  without a recorded chunk list keeps an explicit empty file list
  (live `browser-tslib`). Any groups without that join → 'remote'
  (rule `chunk-pseudo-externals`; the never-observed hybrid
  shared-chunks-without-bundle-rows degrades here too, by choice).
  No groups → 'none' with rule `no-chunk-evidence`.
- **Declared-not-mapped only on skip rows**: served files plus the
  losing copy's own bundle chunk lists, resolved against the
  participant's scope, diffed against the effective-map target set;
  always tagged `source-derived` (bounded residual — no capture shows
  losing bundle-bearing copies). Empty `files` means every copy is
  mapped; the claim stays present on skip rows.
- **Strict scope keyed on the literal registry scope name `strict`**
  (spec-pinned, corpus-backed by the strict-scope capture). Conflict
  indicator rule is `version-multiplicity` with a separate
  `strictExcluded` flag; strict rows carry `strictPinned` so views
  never render `requiredVersion` as a declared range.
- **Dense-externals badge reads shared participants only**: `bundle`
  on scoped packages (scoped fixture carries `browser-shared` there)
  is deliberately NOT the marker — the plan pins participants'
  `bundle`, and multi-key `entries` must not be the marker either.
- **Provenance tags as a closed union**: every derived object carries a
  `rule` field typed against `DerivationRule` — a new rule without a
  tag fails compilation (same single-source pattern as `GenerationV1`).
- **`SharedRowFacts` embeds the ingest row object** (identity
  reference, same order as `model.sharedRows`) instead of index
  alignment — tests and views join by object, not by position.

### Review Focus

- **Behavior claims:**
  - frankenstein-live: 20/20 row providers *derived* uniquely; each
    resolution target equals provider scopeUrl + served file; no
    whiteboard/mermaid target is ever attributed to the host; all 12
    host rows are host-fallback attributions.
  - Arrows over the corpus: strict-split skip row → winner's file
    (host copy), scope row → own scoped copy; self-fill `/extra` keeps
    an own-copy arrow AND parent-links to its base package; all four
    live subpath spellings link name-derived, base packages don't.
  - Ladder from real evidence: live host level-1 package chunk data
    (incl. explicit empty list for `browser-tslib`), non-dense mfe3
    level-2 "not-derivable", live whiteboard level-3 explicit absence;
    the strict-split losing copy's unmapped file carries
    `source-derived`. XC-02: a seeded v4/v4.5 spelling pair derives
    deep-equal projections outside generation provenance.
- **Assumptions / choices:** absolute host demotion (remote beats host
  even at equal prefix — degenerate config, never observed); winner
  uniqueness defined as exactly one share row; strict scope name
  pinned to the literal `strict`; dense-externals evidence from shared
  participants only; level-'remote' rule label covers the
  never-observed hybrid case.
- **Scope notes:** three new files only — no DTO, mapper, fixture,
  probe, or ingest changes; `.claude/` untracked session tooling stays
  out of commit scope.
- **Read next:**
  - `projects/devtools-ui/src/app/shared/store/derivations.ts`
    (`deriveProviders`) — the host-demotion core; check it against
    your reading of "least-specific fallback".
  - `deriveChunkAttribution` in the same file — whether the three
    level conditions match the plan's ladder wording.
  - `derivations.spec.ts` (AC-02 + XC-02 describes) — whether the
    seeded shapes really pin the honest outcomes.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 111 (incl. 20
  new derivation tests), devtools-bridge 68, collector 58 (incl. strict
  tsc pass), guards 42 — **279 tests, 0 failures** (259 before +20).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Corpus untouched:** `node scripts/validate-lab-corpus.mjs` →
  `corpus valid: 10 captures + 2 live phases, runId 20260811T095850Z,
  probe c9060b95128f…` (no probe/fixture edits this task).

### Acceptance Coverage

- **T7-AC-01** — passed: `derivations.spec.ts` provider describe —
  "derives all 20 row providers uniquely", "reproduces every row
  target as scopeUrl + servedFile", "never lets the host claim
  whiteboard or mermaid files", host-fallback assertion for the 12
  host rows.
- **T7-AC-02** — passed (SEEDED): most-specific tie → *ambiguous*
  (with nested-unique contrast staying *derived*); foreign-origin
  target → *unattributable*.
- **T7-AC-03** — passed: strict-split skip arrow → winner's file /
  scope arrow → own copy (full-object equality); self-fill `/extra`
  own share row with own-copy arrow AND parent link.
- **T7-AC-04** — passed: live subpath externals across all four
  spellings link name-derived (`@angular/common/http`,
  `rxjs/operators`, `@angular/core/primitives/di`, file-shaped), base
  packages carry no link; SEEDED orphan subpath yields none.
- **T7-AC-05** — passed: live badge matrix (host dense chunking +
  dense externals + SRI; whiteboard/mermaid SRI only); generation
  badge v4 live / v4.5 lab (clean-skip).
- **T7-AC-06** — passed: level-1 package chunk data (live host, incl.
  empty-list bundle), level-2 not-derivable (non-dense mfe3, 7
  groups), level-3 explicit absence (live whiteboard); losing-copy
  declared-not-mapped carries `source-derived`.
- **T7-AC-07** — passed: strict-scope two share rows → NO conflict +
  `strictExcluded` + pinned flags on both rows; clean-skip
  `__GLOBAL__` two version rows → conflict, no pinned flags.
- **T7-AC-08** — passed: tag sweep over frankenstein-live,
  strict-split, strict-scope, non-dense — every derived field carries
  its rule tag from the closed union.
- **XC-02** (contributes) — passed: SEEDED v4/v4.5 spelling pair
  derives equivalent projections (facts, providers, attribution,
  badges, conflicts deep-equal); spelling visible only as generation
  provenance.

### Open Issues

- Orchestrator generations before the observed two (≤ v4.4 variants,
  v3, …) remain unvalidated — carried from Task 6/6.5; closing it
  means a lab scenario + capture, per corpus doctrine.
- A merge-vs-shim-map divergence surface is still round-4 view
  material (carried from Task 6).
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Round 4 (shell + views, Tasks 8+ after re-plan) can treat as
validated: **`deriveFederation` is correct over the corpus fixtures**
— views render derived knowledge from `DerivedFederation` only and
never re-interpret registry semantics.

- **Surface:** `deriveFederation(model: FederationModel):
  DerivedFederation` (`store/derivations.ts`); all types in
  `store/derived-model.ts`. Wiring: `ingestSnapshot(snapshot)` →
  `deriveFederation(model)` — both pure, no DI yet.
- **Model invariants:** `sharedRowFacts` is same-order with
  `model.sharedRows` and embeds the row object; `providers` is sorted
  by targetUrl and covers every unique effective-map target;
  `packageConflicts` has exactly one entry per (scope, package) in
  store order; `chunkAttribution`/`remoteBadges` are one per remote in
  model order.
- **Rendering contracts:** rows with `strictPinned` must never render
  `requiredVersion` as a declared range; level-'none' attribution is
  explained by the capability badges (plan: views are gated on the
  ladder); `declaredNotMapped.files` may be empty (all copies mapped)
  — presence of the claim ≠ presence of a finding; ambiguous/
  unattributable providers and winner-less arrows are honest states
  that need visible treatment, not fallbacks.
- **Gotchas:** provider candidates list is most-specific-first with
  the host always last; `hostFallback` marks host attributions —
  Diagnostics can cite it; the generation badge is the ONLY
  generation-facing derived field (XC-02 pins spelling-blindness);
  `facts.provider` is null exactly when `row.resolution` is null.

### Git State

`git diff --stat`: empty — the task is three new (untracked) files.

`git status --short`:

```
?? .claude/
?? projects/devtools-ui/src/app/shared/store/derivations.spec.ts
?? projects/devtools-ui/src/app/shared/store/derivations.ts
?? projects/devtools-ui/src/app/shared/store/derived-model.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
