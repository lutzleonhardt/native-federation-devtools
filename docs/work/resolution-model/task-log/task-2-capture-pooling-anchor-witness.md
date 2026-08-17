### Task

Produce and durably validate one real, provenance-pinned `pool`/`servedBy` browser witness, stopping before any product schema or Store behavior.

### Status

DONE

The canonical capture and its semantic validator cover Task 2's sole remaining acceptance criterion. Product contract work is deliberately deferred to Tasks 2.1 and 2.2.

### Files Modified

- captures/pooling-anchor/20260816T182544Z.json (new) — records the lossless browser witness for five participant declarations, their optional pooling fields, effective import-map targets, and available bundle/chunk evidence.
- captures/manifest.json (modified) — registers the twelfth lab capture and pins its SHA-256 plus the committed playground provenance.
- docs/work/resolution-model/plan.md (modified) — splits the oversized former Task 2 into evidence-only Task 2, raw-contract Task 2.1, and Store-normalization Task 2.2, with explicit YAGNI boundaries.
- scripts/build-lab-manifest.mjs (modified) — adds `pooling-anchor` to the expected canonical lab scenarios.
- scripts/validate-lab-corpus.mjs (modified) — pins the witnessed pooling fields, candidate URLs, effective targets, bundle evidence, and honest absence of a matching chunk list.

### Files Read (Context Only)

- docs/specs/native-federation-resolution-model.md — witness-before-schema requirements and the raw-versus-normalized pooling contract.
- scripts/lab-capture-dump.js — lossless capture envelope, passive collection behavior, and manifest probe provenance.
- captures/co-declared-share/20260813T151211Z.json — prior corpus pattern for comparing participant candidates with effective import-map targets.
- projects/collector/src/lib/constants.ts — current collector provenance marker considered while defining Task 2.1.
- projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts — confirms raw probe results are mapped live rather than persisted between probe generations.
- scripts/derive-fixtures.ts — existing all-corpus fixture derivation path and the scope of the future `/3` regeneration.
- package.json — collector and guard test commands.
- angular.json — Bridge test target configuration.

### Key Decisions

- The original vertical Task 2 was too large. The approved plan amendment stops this task at the evidence boundary; raw snapshot transport is Task 2.1 and Store normalization is Task 2.2.
- The playground witness is committed separately at `acdd0dd6cc2550ebfd4fce1e81684e66f6072efb` on `lab/v2-scenarios`, because manifest provenance must name an immutable playground HEAD.
- One canonical lossless capture is the durable artifact. A one-time own-property probe script, sidecar JSON, and temporary handoff were discarded instead of becoming permanent maintenance surface.
- The validator proves meaning rather than only file presence: it derives candidate URLs from captured scope and entry values, then compares the captured global and consumer-scoped import-map targets with those candidates.
- `bundle: "browser-shared"` with no `browser-shared` entry in `shared-chunks` is preserved as an honest `source-only` observation. No chunk filename or delivery claim is inferred.
- Raw `pool` labels are not pool identities, and `servedBy` is only explicit per-declaration anchor evidence. Task 2 derives neither a pool graph nor a universal provider.

### Review Focus

- **Behavior claims:** the capture retains the exact present/absent `pool` and `servedBy` combinations for five declarations; both same-tag consumers remain independent candidates while the `mfe2` effective target points to the `mfe1` anchor candidate; the manifest and validator reject capture-hash, probe/orchestrator, target, or chunk-evidence drift.
- **Assumptions / choices:** positive `browser-shared` bundle evidence plus no matching chunk list is intentionally classified as `source-only`; the canonical capture itself is sufficient, so no sidecar hash or one-time producer script is retained.
- **Scope notes:** the playground scenario already lives in its separate external commit. Existing dirty collector/Bridge/fixture files are incomplete Task 2.1 work, and `.gitignore` is unrelated user work; none belongs in the Task 2 commit.
- **Read next:** `scripts/validate-lab-corpus.mjs` at `EVIDENCE["pooling-anchor"]` — verify the semantic assertions; `captures/pooling-anchor/20260816T182544Z.json` — compare the five raw declarations and import map; `docs/work/resolution-model/plan.md` at Tasks 2, 2.1, and 2.2 — verify the revised boundaries.

### Test Evidence

- `node scripts/build-lab-manifest.mjs --playground /home/lutz/projects/nf/playground` — rebuilt the manifest with 12 captures and two live phases; provenance records playground commit `acdd0dd6cc2550ebfd4fce1e81684e66f6072efb` and capture SHA-256 `522e3413192910555f3a06d442f08856ae32c9a892511de07227030836c6ceaa`.
- `node scripts/validate-lab-corpus.mjs` — passed: `corpus valid: 12 captures + 2 live phases, runId 20260816T182544Z, probe c9060b95128f…`.
- Isolated negative validator check in a temporary corpus copy — changing the `mfe2` scoped target and inventing a `browser-shared` chunk list made validation fail with both expected semantic errors; the temporary copy was removed.
- `node --check scripts/validate-lab-corpus.mjs` — passed with no syntax diagnostics.
- Playground config syntax checks, scenario JSON parse, and external `git diff --check` — passed before external commit `acdd0dd`.
- `npm run test:collector` — 6 files, 62 tests passed in the current mixed worktree.
- `./node_modules/.bin/ng test devtools-bridge --watch=false` — 3 files, 72 tests passed in the current mixed worktree; only the existing non-LTS Node warning was emitted.
- `npm run test:guards` — 4 files, 49 tests passed in the current mixed worktree.
- `git diff --check` — passed.

### Acceptance Coverage

- **T2-AC-01 — passed:** the canonical capture plus `EVIDENCE["pooling-anchor"]` automatically pin raw field positions and omissions, separate same-tag consumers, explicit anchor, effective targets, comparable candidates, `browser-shared` bundle evidence, and the honest no-matching-chunk-list outcome.
- **T2-AC-02 — N/A:** retired by the approved task split; old/new raw snapshot compatibility and absence preservation moved to Task 2.1, with Store null normalization in Task 2.2.
- **T2-AC-03 — N/A:** retired by the approved task split; schema mirrors, mapper, Bridge contract, `/3` provenance, fixtures, and drift coverage moved to Task 2.1.
- **T2-AC-04 — N/A:** retired by the approved task split; focused hostile-value coverage moved to Task 2.1.
- **T2-AC-05 — N/A:** retired by the approved task split; the no-inference boundary is retained in Tasks 2.1 and 2.2 rather than implemented as Task 2 behavior.

### Open Issues

- No blocking Task 2 issues.
- Raw contract propagation, `/3` provenance, corpus-fixture regeneration, legacy own-key absence, and focused hostile-value tests remain deliberately unfinished (→ Task 2.1).
- Store normalization from absent raw keys to canonical `null` remains deliberately unfinished (→ Task 2.2).

### Context for Next Task

- Task 2.1 may now extend the two bounded collector string projections with optional `pool` and `servedBy`; absent keys must remain absent in raw `SnapshotV1` data.
- Advance the current collector and injected probe markers to `/3`, and keep the mapper's raw probe-version gate exact. Do not accept historical raw `/2` results; compatibility is tested at the persisted `SnapshotV1` boundary.
- Regenerate every corpus-derived fixture after the provenance bump because collector provenance is part of byte-stable output. Leave synthetic fixtures unchanged and avoid special-case generators.
- Add only focused coverage for non-string values, throwing getters, over-limit strings, and one representative persisted `/2` snapshot whose `pool` and `servedBy` own keys remain absent after round-trip.
- Use the capture's raw path `channels.nativeFederationGlobals.data.namespace["shared-externals"]...versions[].remotes[]` as the contract witness. Do not infer connectivity from equal `pool` labels or delivery from `bundle` metadata.
- The incomplete Task 2.1 files already in the worktree must be completed and wrapped separately; they must not be staged by `/commit 2`.

### Git State

git diff --stat

```text
 .gitignore                                         |   2 +-
 captures/manifest.json                             |  15 ++-
 docs/work/resolution-model/plan.md                 | 106 ++++++++++++++++-----
 projects/collector/src/lib/fixture-drift.spec.ts   |  36 ++++++-
 projects/collector/src/lib/passive-probe.ts        |   2 +
 projects/collector/src/lib/runtime-schema.ts       |   2 +
 projects/collector/src/lib/snapshot-mapper.ts      |   4 +
 projects/devtools-bridge/src/lib/fixtures/index.ts |   2 +
 projects/devtools-bridge/src/lib/snapshot-v1.ts    |   4 +
 scripts/build-lab-manifest.mjs                     |   3 +-
 scripts/validate-lab-corpus.mjs                    |  80 +++++++++++++++-
 11 files changed, 219 insertions(+), 37 deletions(-)
```

git status --short

```text
 M .gitignore
 M captures/manifest.json
 M docs/work/resolution-model/plan.md
 M projects/collector/src/lib/fixture-drift.spec.ts
 M projects/collector/src/lib/passive-probe.ts
 M projects/collector/src/lib/runtime-schema.ts
 M projects/collector/src/lib/snapshot-mapper.ts
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.ts
 M scripts/build-lab-manifest.mjs
 M scripts/validate-lab-corpus.mjs
?? captures/pooling-anchor/
?? docs/work/resolution-model/task-log/task-2-capture-pooling-anchor-witness.md
?? projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts
```

The `.gitignore` edit is unrelated user work. The collector, Bridge, and fixture changes are incomplete Task 2.1 work. All are intentionally excluded from the Task 2 file list and future staging scope.
