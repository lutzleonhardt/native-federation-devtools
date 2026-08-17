### Task

Preserve the real witnessed pool and servedBy anchors as bounded optional raw SnapshotV1 fields across both collector schema layers, with exact /3 producer provenance and persisted /2 compatibility.

### Status

DONE

All three Task 2.1 acceptance criteria are covered by green automated tests and deterministic fixture evidence. The implementation stops at the raw snapshot boundary.

### Files Modified

- captures/README.md (modified) — updates the current probe/mapper and collector version map plus data-flow diagram from /2 to /3.
- projects/collector/src/lib/constants.ts (modified) — advances COLLECTOR_VERSION to nf-devtools-collector/3.
- projects/collector/src/lib/fixture-drift.spec.ts (modified) — registers the twelfth lab scenario, checks all 13 corpus-derived fixtures, and pins the witnessed value/own-key-absence matrix.
- projects/collector/src/lib/passive-probe.ts (modified) — adds pool and servedBy to the injected bounded-string schema mirror and emits passive-probe/3.
- projects/collector/src/lib/runtime-schema.ts (modified) — adds pool and servedBy to the host-side bounded-string schema mirror.
- projects/collector/src/lib/snapshot-mapper.spec.ts (modified) — independently tests both schema paths against non-strings, throwing getters, and over-limit strings, and proves otherwise-valid raw /2 results are rejected.
- projects/collector/src/lib/snapshot-mapper.ts (modified) — gates on passive-probe/3 and conditionally preserves each projected anchor only when present as a string.
- projects/devtools-bridge/src/lib/chrome-snapshot-provider.spec.ts (modified) — updates the valid raw probe stub to passive-probe/3.
- projects/devtools-bridge/src/lib/fixtures/clean-skip.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/co-declared-share.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/dynamic-init-native.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/dynamic-init-shim.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/dynamic-override.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/frankenstein-live.fixture.ts (modified) — deterministically regenerates the live fixture with /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/index.ts (modified) — registers pooling-anchor in the canonical fixture catalog.
- projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts (new) — derives the real five-declaration pooling witness through the standard capture pipeline.
- projects/devtools-bridge/src/lib/fixtures/scope-isolation.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/scoped.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/self-fill.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/strict-scope.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/fixtures/strict-split.fixture.ts (modified) — deterministically regenerates the corpus-run banner and /3 collector provenance.
- projects/devtools-bridge/src/lib/snapshot-v1.spec.ts (modified) — proves the new witness round-trip, exact own-key presence/absence, schemaVersion 1, and a representative persisted collector /2 round-trip with both keys absent.
- projects/devtools-bridge/src/lib/snapshot-v1.ts (modified) — adds optional raw pool?: string and servedBy?: string fields to ExternalRemoteV1 without changing SnapshotV1.schemaVersion.
- projects/devtools-ui/src/app/shared/store/ingest.spec.ts (modified) — updates the fixture-derived provenance expectation to collector /3 without changing Store behavior.

### Files Read (Context Only)

- docs/work/resolution-model/plan.md — Task 2.1 scope, acceptance criteria, raw-boundary limit, and cross-cutting contributions.
- docs/work/resolution-model/task-log/task-2-capture-pooling-anchor-witness.md — completed dependency, witness meaning, exact raw path, and explicit no-inference boundary.
- docs/work/resolution-model/task-log/task-1-normalize-canonical-registry-evidence.md — prior SnapshotV1/mapper assumptions and the canonical model's missing-evidence treatment.
- captures/pooling-anchor/20260816T182544Z.json — five witnessed participant declarations and their independent pool/servedBy omissions.
- scripts/validate-lab-corpus.mjs — semantic witness assertions for candidate URLs, effective targets, raw fields, and honest chunk-evidence absence.
- scripts/derive-fixtures.ts — standard all-corpus derivation and deterministic generated-module format.
- scripts/derive-fixtures.mjs — esbuild launcher used to regenerate the fixture catalog.
- projects/collector/src/testing/capture-pipeline.ts — real capture-to-probe-to-mapper fixture path.
- projects/collector/src/lib/safe.ts — descriptor-only reads and boundedString behavior reused by the host projection.
- projects/collector/src/lib/edge-cases.spec.ts — existing accessor and over-limit testing patterns.
- projects/collector/src/lib/passivity-harness.spec.ts — passivity guarantees for page-controlled getters and detached probe results.
- package.json — full test, collector, and guard commands.
- angular.json — Bridge and UI test target configuration.

### Key Decisions

- SnapshotV1.schemaVersion remains 1 because pool and servedBy are additive optional fields. Producer provenance moves independently to passive-probe/3 and nf-devtools-collector/3.
- The mapper accepts exactly passive-probe/3. Accepting raw /2 alongside /3 was rejected because probe and mapper ship together and doing so would weaken schema-drift detection.
- Backward compatibility lives at the persisted DTO boundary: collector /2 SnapshotV1 JSON remains readable and round-trips without either optional own key.
- Both fields reuse the existing bounded-string projection. Non-strings and accessor-backed properties are omitted; values beyond 4096 characters retain only the bounded prefix and record string-limit. No generalized validator was introduced.
- Conditional object spreads preserve true key absence. The mapper never synthesizes undefined or null for missing raw anchors.
- Inline probe projection and host-side re-projection are tested independently as defense in depth; a normal end-to-end pipeline alone would not prove the second boundary.
- Every corpus-derived fixture was regenerated through scripts/derive-fixtures.mjs because collector provenance is part of the byte-stable output. No special-case generator was added, and all synthetic fixtures remain byte-identical.
- Raw pool values remain opaque labels, and servedBy remains explicit per-declaration anchor evidence. No pool identity, graph, universal provider, Store normalization, or UI behavior was derived.

### Review Focus

- **Behavior claims:** The five witnessed declarations retain their exact pool/servedBy values and own-key omissions; raw passive-probe/2 is rejected while persisted collector /2 SnapshotV1 data remains readable; hostile values cannot invoke getters, coerce non-strings, or leak over-limit suffixes through either schema path.
- **Assumptions / choices:** Existing boundedString semantics intentionally truncate with a structured error rather than dropping an entire over-limit string. Equal pool labels are not identities, and absent servedBy is not interpreted as self-service or no provider.
- **Scope notes:** captures/README.md and the UI ingest provenance assertion changed only to keep current /3 documentation and fixture expectations honest. The large fixture diff is mechanical regeneration. The existing .gitignore modification is unrelated user work and must not be staged with Task 2.1.
- **Read next:** projects/collector/src/lib/snapshot-mapper.spec.ts at registerAnchorProjectionTests — verify the two independent hostile paths; projects/collector/src/lib/fixture-drift.spec.ts plus projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts — verify the witnessed matrix and standard derivation; projects/devtools-bridge/src/lib/snapshot-v1.spec.ts — verify new/legacy round-trip and own-key behavior.

### Test Evidence

- npm test — passed on the final code state: 24 UI files / 240 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, and 4 guard files / 49 tests. Only the existing odd-numbered Node 25 non-LTS warning was emitted.
- node scripts/validate-lab-corpus.mjs — passed: corpus valid for 12 captures plus 2 live phases, runId 20260816T182544Z, probe c9060b95128f….
- node scripts/derive-fixtures.mjs — ran twice over all 12 lab captures plus frankenstein-live. SHA-256 inventories were identical after both runs: corpus_second_run_byte_stable=true.
- sha256sum projects/devtools-bridge/src/lib/fixtures/synthetic-*.fixture.ts before and after derivation — all seven hashes remained identical: synthetic_fixtures_unchanged=true.
- Focused collector snapshot-mapper run — 33/33 tests passed after adding the /2 mismatch guard and twelve anchor projection cases.
- Focused Bridge snapshot/Chrome provider run — 2 files / 68 tests passed; focused UI ingest run — 1 file / 16 tests passed.
- Final npm run test:collector after converting the focused accessors to throwing getters — 6 files / 75 tests passed.
- git diff --check — passed on the final worktree.
- Independent read-only acceptance review — no remaining findings against T2.1-AC-01, T2.1-AC-02, or T2.1-AC-03; confirmed no Store normalization or pooling semantics were added.
- Scoped Prettier checks exposed pre-existing whole-file formatting drift in snapshot-mapper.ts, snapshot-mapper.spec.ts, snapshot-v1.ts, ingest.spec.ts, and captures/README.md. Task-local additions are formatted; unrelated format-only churn was deliberately reverted.

### Acceptance Coverage

- **T2.1-AC-01 — passed:** both bounded schema mirrors, mapProbeResult, and ExternalRemoteV1 agree on independently optional strings; fixture-drift and SnapshotV1 pooling tests prove own-key absence; all fixtures remain schemaVersion 1; the exact /3 gate and explicit raw /2 rejection are green. Contributes to XC-04.
- **T2.1-AC-02 — passed:** pooling-anchor is registered and derived through the standard pipeline; all 13 corpus-derived fixtures carry /3 provenance and reproduce byte-stably; all seven synthetic fixtures are unchanged; the persisted collector /2 round-trip retains both own keys as absent. Contributes to XC-02 and XC-04.
- **T2.1-AC-03 — passed:** registerAnchorProjectionTests covers pool and servedBy across inline-probe and host-mapper paths for non-string values, throwing getters, and over-limit strings; the full collector, passivity/privacy guard, Bridge, and UI suites remain green. Contributes to XC-04.

### Open Issues

- No blocking Task 2.1 issues.
- The exact orchestrator rules that decide when a raw pool label is emitted remain intentionally unmodeled; later work must treat it as opaque evidence rather than inferred identity.
- Non-blocking pre-existing Prettier drift remains in the files named under Test Evidence; broad reformatting was outside this task.

### Context for Next Task

- ExternalRemoteV1 now exposes pool?: string and servedBy?: string. Missing raw properties remain absent; consumers must use own-property-aware handling when absence matters.
- mapProbeResult accepts only passive-probe/3 and writes nf-devtools-collector/3 while SnapshotV1.schemaVersion remains 1. Persisted collector /2 DTOs are still structurally readable; raw probe /2 results are deliberately invalid.
- The pooling-anchor fixture is the validated raw handoff: host-main has neither field; mfe1-main has pool family and servedBy mfe1; mfe2-main has only servedBy mfe1; mfe1-extra has only pool family; mfe2-extra has neither.
- Store normalization may translate missing raw anchors into canonical null, but must not infer pool membership, pool identity, connectivity, or a universal provider. Candidate URLs and effective import-map bindings remain distinct facts.
- All corpus-derived fixture expectations now carry /3 provenance. Synthetic fixtures retain synthetic-fixture/1 and must stay outside the derivation pipeline.
- The unrelated .gitignore edit must remain excluded from Task 2.1 staging.

### Git State

git diff --stat

~~~text
 .gitignore                                         |   2 +-
 captures/README.md                                 |   8 +-
 projects/collector/src/lib/constants.ts            |   2 +-
 projects/collector/src/lib/fixture-drift.spec.ts   |  70 +++++++-
 projects/collector/src/lib/passive-probe.ts        |   4 +-
 projects/collector/src/lib/runtime-schema.ts       |   2 +
 projects/collector/src/lib/snapshot-mapper.spec.ts | 193 ++++++++++++++++++++-
 projects/collector/src/lib/snapshot-mapper.ts      |   6 +-
 .../src/lib/chrome-snapshot-provider.spec.ts       |   2 +-
 .../src/lib/fixtures/clean-skip.fixture.ts         |   4 +-
 .../src/lib/fixtures/co-declared-share.fixture.ts  |   4 +-
 .../lib/fixtures/dynamic-init-native.fixture.ts    |   4 +-
 .../src/lib/fixtures/dynamic-init-shim.fixture.ts  |   4 +-
 .../src/lib/fixtures/dynamic-override.fixture.ts   |   4 +-
 .../src/lib/fixtures/frankenstein-live.fixture.ts  |   2 +-
 projects/devtools-bridge/src/lib/fixtures/index.ts |   2 +
 .../src/lib/fixtures/non-dense.fixture.ts          |   4 +-
 .../src/lib/fixtures/scope-isolation.fixture.ts    |   4 +-
 .../src/lib/fixtures/scoped.fixture.ts             |   4 +-
 .../src/lib/fixtures/self-fill.fixture.ts          |   4 +-
 .../src/lib/fixtures/strict-scope.fixture.ts       |   4 +-
 .../src/lib/fixtures/strict-split.fixture.ts       |   4 +-
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    | 100 +++++++++++
 projects/devtools-bridge/src/lib/snapshot-v1.ts    |   4 +
 .../src/app/shared/store/ingest.spec.ts            |   2 +-
 25 files changed, 406 insertions(+), 37 deletions(-)
~~~

git status --short

~~~text
 M .gitignore
 M captures/README.md
 M projects/collector/src/lib/constants.ts
 M projects/collector/src/lib/fixture-drift.spec.ts
 M projects/collector/src/lib/passive-probe.ts
 M projects/collector/src/lib/runtime-schema.ts
 M projects/collector/src/lib/snapshot-mapper.spec.ts
 M projects/collector/src/lib/snapshot-mapper.ts
 M projects/devtools-bridge/src/lib/chrome-snapshot-provider.spec.ts
 M projects/devtools-bridge/src/lib/fixtures/clean-skip.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/co-declared-share.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-init-native.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-init-shim.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-override.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/frankenstein-live.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/scope-isolation.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/scoped.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/self-fill.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/strict-scope.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/strict-split.fixture.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
?? docs/work/resolution-model/task-log/task-2.1-preserve-witnessed-anchors.md
?? projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts
~~~
