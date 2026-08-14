# Task 12.5: Co-declared shared-version evidence

### Task

Extended the lossless corpus with a real co-declared same-version witness and pinned the distinction between one registry version row, two participant-owned candidate URLs, and one exact import-map target without treating `cached` or participant order as a provider rule.

### Status

DONE

### Files Modified

- `captures/co-declared-share/20260813T151211Z.json` (new) — lossless real-orchestrator witness: one `share` row, two participants, identical entry file names, one mapped `mfe1` URL.
- `captures/manifest.json` (modified) — registers the eleventh lab scenario, its sha256, the new corpus run ID, and the additive playground commit.
- `docs/work/v2/shape-validation.md` (modified) — records participant/version cardinality and URL-based mappedness while explicitly declining a `cached`/order provider inference.
- `projects/collector/src/lib/corpus-vectors.spec.ts` (modified) — pins lossless participant projection plus two distinct absolute candidate URLs and exactly one exact target match.
- `projects/collector/src/lib/fixture-drift.spec.ts` (modified) — raises the derived-fixture count and explicitly requires `co-declared-share`.
- `projects/devtools-bridge/src/lib/fixtures/co-declared-share.fixture.ts` (new) — generated SnapshotV1 fixture derived through the real collector pipeline.
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) — registers the new corpus-derived fixture.
- `projects/devtools-bridge/src/lib/fixtures/clean-skip.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/dynamic-init-native.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/dynamic-init-shim.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/dynamic-override.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/scope-isolation.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/scoped.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/self-fill.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/strict-scope.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `projects/devtools-bridge/src/lib/fixtures/strict-split.fixture.ts` (modified) — generated banner updated to the new corpus run ID.
- `scripts/build-lab-manifest.mjs` (modified) — adds `co-declared-share` to the manifest's closed scenario catalog.
- `scripts/validate-lab-corpus.mjs` (modified) — validates row/participant cardinality, identical recorded file names, two resolved candidate URLs, and one exact selected URL independently of `cached`.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — V2 preamble and the approved Task 12.5 block.
- `docs/work/v2/task-log/task-12-import-map-view.md` — direct predecessor; URL-target attribution and resolution-only honesty contract.
- `docs/work/v2/task-log/task-5-corpus-fixture-derivation.md` — real-pipeline fixture generation, determinism, and drift-guard contract.
- `docs/work/v2/task-log/task-2-lossless-capture-corpus.md` — manifest, validator, hash, and provenance contract.
- `captures/README.md` — corpus regeneration and versioning rules.
- `/home/lutz/projects/nf/playground` at `a5ecd32` — source scenario commit; diff against `ee90a21` adds only the new scenario and its catalog documentation.

### Key Decisions

- **Evidence only:** no store, derivation, view-model, or UI file changes. The witness intentionally exposes the current semantic defect without fixing it in V2.
- **Exact URL equality is the mapping proof:** each participant's entry file is resolved below that participant's captured `scopeUrl`; exactly one of the two distinct candidate URLs equals the captured import-map target.
- **`cached` stays raw evidence:** the capture-specific `mfe1:true` / `mfe2:false` values are preserved and checked for losslessness, but neither `cached` nor `remotes[0]` elects a provider in validator or tests.
- **Generated churn is explicit:** the new manifest run ID changes ten existing lab-fixture banner lines; payloads are unchanged. The live fixture is unchanged.
- **Playground provenance remains truthful as a regeneration baseline:** `a5ecd32` is the prior catalog commit plus only the new scenario, so all previous scenario definitions remain reproducible from the pinned checkout.

### Review Focus

- **Behavior claims:** the manifest/validator accept 11 lab captures plus two live phases; the new capture proves one shared version row with two intact participants; two same-named files resolve to two URLs and exactly one URL matches the map.
- **Assumptions / choices:** `mfe1` is named only as the observed target in the shape report; executable invariants require one exact candidate match and do not promote the selected participant's name, `cached`, or order into a general resolver rule.
- **Scope notes:** ten existing generated fixtures change by one provenance-banner line each. No model or view code is in the diff.
- **Read next:** `scripts/validate-lab-corpus.mjs` (`EVIDENCE["co-declared-share"]`) for the evidence boundary; `projects/collector/src/lib/corpus-vectors.spec.ts` for the pipeline-level URL assertion; `docs/work/v2/shape-validation.md` for the deliberately bounded claim.

### Test Evidence

— session 2026-08-14

- `node scripts/validate-lab-corpus.mjs` → `corpus valid: 11 captures + 2 live phases, runId 20260813T151211Z`.
- Capture sha256 checked independently: file and manifest both `0a735ac089e06e960cef9ecbc952ad49cae6f3c00a98534e18e498968b0b2d86`.
- Focused: `npx vitest run --config vitest.collector.config.mts projects/collector/src/lib/corpus-vectors.spec.ts projects/collector/src/lib/fixture-drift.spec.ts` → 2 files, 22 tests passed.
- Determinism: working-tree fixture hashes already matched a fresh `node scripts/derive-fixtures.mjs`; a second derivation produced an identical complete fixture hash list.
- Full chain: `CI=true npm test` → devtools-ui 233, devtools-bridge 70, collector 60, guards 47; 410 tests, 0 failures.
- Shipping build: `npm run build:extension && npm run check:panel-bundle` → extension assembled; bundle check passed (2 JS, 2 HTML).
- `git diff --check` → clean.

### Acceptance Coverage

- **T12.5-AC-01** — passed: manifest entry, capture hash, probe hash, expected scenario set, envelope structure, and per-scenario evidence all pass the corpus validator.
- **T12.5-AC-02** — passed: fixture is registered, equals a fresh real-pipeline derivation, and two consecutive derivations are byte-identical.
- **T12.5-AC-03** — passed: validator and corpus-vector spec pin one row, two participants, identical entry names, two distinct candidate URLs, one target occurrence, and one exact candidate match.
- **T12.5-AC-04** — passed: shape validation separates observed `cached` values from URL mapping and contains no model fix or universal provider inference.
- **XC-01** (contributes) — passed for the new scenario: manifest pins source checkout, orchestrator/probe versions, capture path, runstamp, and sha256; existing regeneration tooling covers the added catalog entry.

### Open Issues

- The current store still flattens one version row with two participants into two `SharedParticipantRow`s; Packages and Remotes can therefore report two versions/no winner for this fixture. This is intentionally deferred to `feature/resolution-model`.
- The V2 conclusion that absent capture fields make `pool`/`servedBy` safe to drop is reopened by the pinned orchestrator 4.6.0 source, where both are optional. A pooling/`servedBy` witness and source/capture reconciliation belong in the resolution-model spec.
- V2 Tasks 13–15 remain deferred; Task 13 must not encode current winner/provider semantics as diagnostics.

### Context for Next Task

The next work is not V2 Task 13. After committing this evidence checkpoint, integrate `feature/v2` into `main`, create `feature/resolution-model`, and write `docs/specs/native-federation-resolution-model.md` before generating `docs/work/resolution-model/plan.md`.

The new spec must preserve the distinction between registry version registration, participants/declarations, resolved dependency copies, and per-consumer resolution. It must separately model or compare `registryServingSlot`, URL-derived `observedTargetProvider`, and optional `servedBy`; keep resolution distinct from request/execution; and treat the maintainer dependency-graph document as a semantic challenger and future consumer, not a raw-cache implementation plan.

### Git State

`git diff --stat` (untracked files are listed separately):

```text
 captures/manifest.json                             | 15 +++--
 docs/work/v2/shape-validation.md                   | 18 +++++-
 projects/collector/src/lib/corpus-vectors.spec.ts  | 57 +++++++++++++++++-
 projects/collector/src/lib/fixture-drift.spec.ts   |  5 +-
 projects/devtools-bridge/src/lib/fixtures/*.ts     | generated banner/index changes
 scripts/build-lab-manifest.mjs                     |  3 +-
 scripts/validate-lab-corpus.mjs                    | 67 +++++++++++++++++++++-
```

`git status --short`:

```text
 M captures/manifest.json
 M docs/work/v2/shape-validation.md
 M projects/collector/src/lib/corpus-vectors.spec.ts
 M projects/collector/src/lib/fixture-drift.spec.ts
 M projects/devtools-bridge/src/lib/fixtures/clean-skip.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-init-native.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-init-shim.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/dynamic-override.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/scope-isolation.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/scoped.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/self-fill.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/strict-scope.fixture.ts
 M projects/devtools-bridge/src/lib/fixtures/strict-split.fixture.ts
 M scripts/build-lab-manifest.mjs
 M scripts/validate-lab-corpus.mjs
?? captures/co-declared-share/
?? projects/devtools-bridge/src/lib/fixtures/co-declared-share.fixture.ts
```
