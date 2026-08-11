# Task 6: Normalized store — entities and ingest

### Task

Built the V2 normalized store (`ingestSnapshot` + `mergeDocumentMaps` +
entity model under `projects/devtools-ui/src/app/shared/store/`) and
absorbed a discovered collector delta (user-approved): the plan's
`mergeDocumentMaps` needs per-tag map content, but `DocumentImportMapV1`
carried counts only — the DTO was extended additively, the mapper now
projects each parsed tag through the existing allowlist schema, and all
fixtures were regenerated through the Task-5 deriver.

### Status

DONE

### Files Modified

- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) —
  `DocumentImportMapV1` grown additively: `imports`, `scopes` (as-authored
  — relative targets/scope keys/integrity keys stay relative; resolution
  is the store's job) and `integrity` with SRI values (kept by policy,
  under the `integrity` key per the structural privacy rule). Doc comment
  rewritten: tags are the map ground truth of V2.
- `projects/collector/src/lib/snapshot-mapper.ts` (modified) —
  `mapDocumentMaps` projects each JSON-parsed tag through
  `EFFECTIVE_IMPORT_MAP_SCHEMA` (same allowlist as the shim map; raw tag
  text still never reaches the snapshot); shared `toMapContent` helper
  now feeds both `toEffective` (drops hash values → `integrityFor`) and
  the per-tag content (keeps them); integrity copy via `defineSafe`
  (`__proto__`-hostile keys); header comment updated.
- `projects/collector/src/lib/runtime-schema.ts` (modified) —
  `EFFECTIVE_IMPORT_MAP_SCHEMA` doc: also projects parsed document tags.
- `projects/collector/src/lib/snapshot-mapper.spec.ts` (modified) —
  sanitization + hostile vectors now assert projected tag content
  (query-stripped) instead of counts-only; new describe "document map
  tag content": content projection with SRI values kept, `parsed: false`
  ⇒ empty content claim, invalid tag SRI → `invalid-integrity` loud.
- `scripts/derive-fixtures.ts` (modified) — emission template switched
  from `satisfies SnapshotV1` to a `: SnapshotV1` annotation: documentMaps
  entries with different integrity key sets union-infer phantom
  optional-undefined keys under `satisfies`, breaking the
  `Record<string, string>` index signature at the `FIXTURES` re-check.
- `projects/devtools-bridge/src/lib/fixtures/*.fixture.ts` (11 derived
  modules regenerated) — now carry per-tag imports/scopes/integrity;
  byte-identical on deriver re-run.
- `projects/devtools-bridge/src/lib/fixtures/synthetic-{hostile,missing-channel,not-recognized}.fixture.ts`
  (modified by hand) — tag content added coherently (root-relative
  as-authored spellings that resolve to the recorded effective maps);
  hostile additionally switched to the `: SnapshotV1` annotation (same
  phantom-key issue) with an explanatory comment.
- `projects/devtools-ui/src/app/shared/store/federation-model.ts` (new) —
  entity types: `SharedParticipantRow` (edge list with joined
  `resolution`), `RemoteEntity`/`ExposeJoin`, `ScopedPackageRow`,
  `ChunkGroup`, `ImportMapEntryRow`, `EffectiveMap`, `StoreProvenance`,
  `MapMode`, `FederationModel`.
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts`
  (new) — the pinned merge rule (document order, active mode from tag
  kinds, later-tag-wins, URL + URL-shaped-specifier resolution against
  the page base) plus `detectMapMode`; `__proto__`-safe key writes.
- `projects/devtools-ui/src/app/shared/store/semver-compare.ts` (new) —
  minimal concrete-tag comparator (numeric triple + prerelease rules;
  non-semver tags ordered last).
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (new) —
  `ingestSnapshot`: chunk union reclassification (`@nf-internal/` scoped
  pseudo-externals ∪ `shared-chunks`; zero-file bundle lists like
  `mapping-or-exposed` contribute no group), row sort (scope, package,
  semver desc, action; stable for participants), single zero-entry
  accessor for `runtime: null`, loader-style resolution join (longest
  scope prefix, then imports), `/./`-tolerant expose join, provenance
  carry.
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.spec.ts`
  (new) — T6-AC-02/03 fixture-driven merge equality + seeded collision /
  inactive-kind / specifier-normalization / no-tags cases.
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` (new) —
  T6-AC-01/02/04/05/06 fixture-driven + seeded sort, mixed-generation,
  neither-spelling, provenance-carry cases.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 6 block
- `docs/work/v2/task-log/task-5-corpus-fixture-derivation.md` (fixture
  surface, gotchas), `task-4-collector-corpus-schemas.md` (mapper/DTO
  contract, structural SRI rule), `task-3-frankenstein-live-recapture.md`
  (merge-rule live evidence, chunk union amendment)
- `projects/devtools-ui/src/app/shared/snapshot-store.ts`,
  `import-map-view-state.ts` — V1 store surface + documentMaps consumers
- `projects/collector/src/lib/privacy.ts`, `testing/fixture-pages.ts`,
  `projects/devtools-bridge/src/public-api.ts`, `fixtures/index.ts`
- Fixture contents (clean-skip, strict-split, non-dense, scoped,
  dynamic-init-native/shim, frankenstein-live) as spec ground truth
- Post-task Q&A, source-verified in the LOCAL repos (not this repo):
  `/home/lutz/projects/nf/orchestrator` (tags/commits: `8e5e0b3` ==
  released v4.6.0; `entries` spelling since `a424249`, first in v4.5.0;
  `store-remote-entry.ts` singleton switch) and
  `/home/lutz/projects/nf/playground/scenarios/scoped/scenario.json`
  (singleton:false ⇒ true scoped rows).

### Key Decisions

— session 2026-08-12

- **Collector delta absorbed into Task 6** (user-approved after
  briefing): T6-AC-02/03 require computing the merge from the fixtures'
  tags, but Task 4 never touched the documentMaps projection (counts
  only — a V1 leftover where the shim map was the merge truth). The
  delta is host-side only: the probe already collects tag text, so no
  probe change, no manifest probe-pin churn, `captures/` untouched.
- **Tag content is as-authored**: relative targets/scope keys/integrity
  keys stay relative in the DTO (raw registry-truth doctrine); the store
  resolves against `capture.pageUrl`. SRI values kept per-tag under the
  `integrity` key — exactly the shape the structural privacy rule
  (Task 4) permits.
- **Counts stay untouched** next to the content (raw-tag key counts vs
  sanitized projection; divergence only for attacker-shaped tags —
  documented in the DTO).
- **Fixture modules export `: SnapshotV1` (annotation) instead of
  `satisfies`**: TS normalizes object-literal unions in arrays with
  phantom optional-undefined keys; with `satisfies` that inferred type
  leaks to `index.ts` and fails `Record<string, string>`. Annotation
  keeps contextual per-element checking and exports the wide type.
- **Store is a pure framework-free module** beside the V1
  `SnapshotStore` (which keeps serving V1 views until round 4); no DI or
  Angular service yet — views wire up in round 4.
- **Merge semantics**: active mode from observed tag kinds (`importmap`
  = native, `importmap-shim` = shim; on a never-observed mixed page shim
  wins — commented); later-tag-wins adopted from es-module-shims (seeded
  test, not corpus-proven); URL-shaped specifier keys normalized against
  the page base like the loader; unresolvable URLs kept verbatim.
- **Ingest rules**: chunk union with zero-file skip (`mapping-or-exposed`
  is empty in every capture, nothing may depend on its contents); row
  sort (scope, package, semver desc, action) with stable participant
  order; `resolution` = loader-style lookup (longest scope prefix of the
  participant's resolved scopeUrl, then imports) — a skip row therefore
  points at the winner's file, which is real loader semantics; expose
  join via naive `<remote>/<moduleName>` with `/./` collapse on both
  sides; `runtime: null` ⇒ empty entities + generation 'unknown'.
- **Integrity comparison is key-set only** against the shim map:
  `integrityFor` is presence-only by design; hash values live per-tag
  and per-remote.

### Review Focus

- **Behavior claims:**
  - The store-computed merge equals the recorded shim map on the corpus:
    frankenstein-live imports (22), scopes (1), integrity keys (29,
    absolute) and dynamic-init-shim over both tags — while
    dynamic-init-native computes from tags and ignores the empty shim
    map.
  - One ingest of any fixture yields the full entity model: clean-skip /
    strict-split edge rows intact (incl. distinct skip/scope rows for the
    same tag), chunk union from both sources with true scoped packages
    preserved, chunks never counted as packages.
  - The mapper's new tag projection is scan-clean: query-carrying and
    hostile tag content survives only sanitized; invalid tag SRI is
    rejected loudly; unparsable tags carry no content claim.
- **Assumptions / choices:** mixed tag-kind pages prefer shim (never
  observed, commented); zero-file bundle lists dropped at ingest;
  unresolvable URLs kept verbatim instead of dropped; skip-row
  resolution deliberately points at the winner target.
- **Scope notes:** the collector delta (DTO + mapper + deriver template
  + fixture regeneration) is beyond the plan-literal task surface —
  discovered scope, user-approved before implementation. Three synthetic
  fixtures hand-extended. `.claude/` untracked session tooling stays out
  of commit scope.
- **Read next:**
  - `projects/devtools-ui/src/app/shared/store/ingest.ts`
    (`resolveRow`, chunk union, sort) — the semantics core; check the
    loader-style join against your reading of import-map scope matching.
  - `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts` —
    whether specifier normalization and mixed-mode preference are
    acceptable readings.
  - `projects/collector/src/lib/snapshot-mapper.ts`
    (`mapDocumentMaps`/`toMapContent`) — the delta's privacy surface.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 91 (incl. 22
  new store tests in 2 files), devtools-bridge 68, collector 58 (incl.
  3 new tag-content tests), guards 42 — **259 tests, 0 failures**.
  `test:collector` includes the strict tsc pass.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Corpus untouched:** `node scripts/validate-lab-corpus.mjs` →
  `corpus valid: 10 captures + 2 live phases, runId 20260811T095850Z`
  (probe hash unchanged — no probe edit).
- **Deriver determinism:** sha256 over all 18 fixture modules, fresh
  `node scripts/derive-fixtures.mjs`, `sha256sum -c` → 18/18 OK,
  0 mismatches.
- **Privacy guards:** 42/42 over the regenerated fixtures — per-tag SRI
  values under `integrity` keys accepted, leak strings absent (mapper
  spec asserts `token-like`/`hidden` never serialize).

### Acceptance Coverage

- **T6-AC-01** — passed: `ingest.spec.ts` "keeps the clean-skip skip row
  and its participant intact" (full-row equality incl. servedFiles and
  winner-joined resolution) and "splits the strict-split 1.0.0 tag into
  distinct skip and scope rows with their own participants".
- **T6-AC-02** — passed: `ingest.spec.ts` frankenstein-live describe
  (20 packages / one participant each; every row joined to an
  integrity-covered absolute target) + `merge-document-maps.spec.ts`
  merge == recorded shim map for imports, scopes AND integrity
  (absolute-URL keys, 29/29).
- **T6-AC-03** — passed: `merge-document-maps.spec.ts` — both
  dynamic-init-shim tags reproduce the recorded `getImportMap()`
  exactly; dynamic-init-native merge computed from tags while the empty
  shim map is ignored (empty-map recording asserted).
- **T6-AC-04** — passed: `ingest.spec.ts` chunk-union describe —
  non-dense: 7 mapped `scoped-pseudo-external` groups (owning remote
  mfe3), package counts exclude `@nf-internal/`; frankenstein-live: 3
  `shared-chunks` groups (host only, `mapping-or-exposed` contributes
  none); scoped fixture: true packages NOT reclassified.
- **T6-AC-05** — passed: seeded shuffled-input sort test (semver desc
  incl. 10>2 and prerelease<release, then action); absent vs `{}`
  equivalence via scoped (no shared-externals) and frankenstein-live
  (`scoped-externals: {}`); runtime-less snapshot ⇒ empty entities.
- **T6-AC-06** — passed (seeded cases tagged SEEDED in test names):
  same-specifier collision resolves later-tag-wins; mixed-generation
  participants ingest per participant; neither-spelling row reads
  without invented served files; the `/./` expose join is even
  corpus-backed (dynamic-init-shim `mfe1/./Component`).
- **XC-02** (contributes) — regenerated fixtures remain scan-enforced
  (guards) and drift-guarded; the new tag content is covered by the
  structural SRI rule.

### Open Issues

- **`GenerationV1` labels are stale** (post-task source dig, memory
  `generation-labels-stale`): the "dev" commit `8e5e0b3` is the released
  **v4.6.0**; the `entries` spelling shipped in **v4.5.0** ("integrated
  secondary entrypoints", `a424249`); the live app runs ≤ v4.4.x. The
  spelling discriminator stays mechanically correct, but `'v4' | 'dev'`
  should eventually become version-range-based naming (rename ripples
  through DTO, probe comment, spec §3, fixture banners; deriver + drift
  spec make it mechanical).
- Orchestrator generations before the observed two (≤ v4.4 variants,
  v3, …) are unvalidated: by construction they degrade to honest states
  (unavailable / not-recognized / loud row drops), but which bucket a
  real v3 page lands in is unknown — closing it means a lab scenario +
  capture, per corpus doctrine.
- A merge-vs-shim-map divergence (e.g. `importShim.addImportMap()`
  without a DOM tag) is representable but not yet surfaced anywhere —
  round-4 view material.
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Task 7 (store derivations) can treat as validated: **`ingestSnapshot`
and `mergeDocumentMaps` are correct over all 11 corpus fixtures** —
derivations can build purely on `FederationModel` without touching
`SnapshotV1` or the tags again.

- **Surface:** `ingestSnapshot(snapshot: SnapshotV1): FederationModel`
  (`store/ingest.ts`), `mergeDocumentMaps(tags, pageBaseUrl):
  EffectiveMap` + `detectMapMode` (`store/merge-document-maps.ts`),
  `compareSemver` (`store/semver-compare.ts`), all types in
  `store/federation-model.ts`.
- **Model invariants:** `sharedRows` sorted (scope, package, semver
  desc, action) with registry-stable participant order; `resolution:
  null` and `ExposeJoin.mapTarget: null` are honest join absence;
  `ChunkGroup.mapped` is dumb target-set membership (the chunk
  attribution *ladder* is Task-7 scope); `chunkGroups` carry
  `origin` + `pseudoPackage` so provenance per source is reconstructable.
- **Strict-scope hook:** rows keep the share-scope name verbatim, and
  the strict scope pins `requiredVersion` to the exact tag at store time
  (config ranges lost — registry-lossy) — Task 7's strict flagging keys
  on `row.scope`.
- **Gotchas:** scoped fixture is the only populated scoped-externals
  evidence (live captures never show true scoped rows); `ScopedVersion`
  is registry-lossy ({tag, bundle?, entries} — no ranges to derive
  from); `singleton` is the hard shared-vs-scoped switch in the
  orchestrator (`store-remote-entry.ts:108`) — a singleton:false dep is
  loaded once per remote, never negotiated; skip-row resolutions point
  at the winner file by design; `synthetic-hostile` documentMaps carry a
  valid-shaped all-'A' SRI value.
- **Regeneration:** `node scripts/derive-fixtures.mjs` from the repo
  root; the drift spec pins fixture == pipeline output.

### Git State

`git diff --stat`:

```
 projects/collector/src/lib/runtime-schema.ts       |  11 +-
 projects/collector/src/lib/snapshot-mapper.spec.ts |  95 +++++++++++-
 projects/collector/src/lib/snapshot-mapper.ts      |  72 +++++++--
 .../src/lib/fixtures/clean-skip.fixture.ts         |  22 ++-
 .../lib/fixtures/dynamic-init-native.fixture.ts    |  28 +++-
 .../src/lib/fixtures/dynamic-init-shim.fixture.ts  |  33 ++++-
 .../src/lib/fixtures/dynamic-override.fixture.ts   |  18 ++-
 .../src/lib/fixtures/frankenstein-live.fixture.ts  | 162 ++++++++++++++++++++-
 .../src/lib/fixtures/non-dense.fixture.ts          | 104 ++++++++++++-
 .../src/lib/fixtures/scope-isolation.fixture.ts    |  28 +++-
 .../src/lib/fixtures/scoped.fixture.ts             |  37 ++++-
 .../src/lib/fixtures/self-fill.fixture.ts          |  26 +++-
 .../src/lib/fixtures/strict-scope.fixture.ts       |  37 ++++-
 .../src/lib/fixtures/strict-split.fixture.ts       |  32 +++-
 .../src/lib/fixtures/synthetic-hostile.fixture.ts  |  40 ++++-
 .../fixtures/synthetic-missing-channel.fixture.ts  |  15 +-
 .../fixtures/synthetic-not-recognized.fixture.ts   |  12 +-
 projects/devtools-bridge/src/lib/snapshot-v1.ts    |  15 +-
 scripts/derive-fixtures.ts                         |   2 +-
 19 files changed, 726 insertions(+), 63 deletions(-)
```

`git status --short`: all of the above `M`; additionally untracked:

```
?? .claude/
?? projects/devtools-ui/src/app/shared/store/
```

(`projects/devtools-ui/src/app/shared/store/` is the new store module —
commit scope; `.claude/` is session tooling, not commit scope.)
