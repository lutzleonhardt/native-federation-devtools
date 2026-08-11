# Task 5: Fixture derivation from the lossless corpus

### Task

Replaced the hand-mirrored fixture projection with derivation through
the REAL collector pipeline: a new deriver
(`scripts/derive-fixtures.mjs` + `.ts`) reads the lossless corpus via
the shared `testing/capture-pipeline.ts` step and generates 11
SnapshotV1 fixture modules (10 lab scenarios + frankenstein-live from
phase 01-initial), a drift spec pins fixture == pipeline output, the
entire `frankenstein-runtime-capture/1` evidence path was retired, and
`captures/README.md` gained the maintainer map (versioning table +
data-flow overview).

### Status

DONE

### Files Modified

- `scripts/derive-fixtures.ts` (new) — TypeScript deriver: enumerates
  the corpus from `captures/manifest.json`, gates on
  `lab-lossless-capture/1` / `lab-lossless-corpus/1` (loud failure on
  anything else), derives via `deriveCaptureSnapshot`, hard-fails on
  collection errors and on a non-v4 live generation, writes fixture
  modules with provenance banners.
- `scripts/derive-fixtures.mjs` (new) — thin esbuild launcher: bundles
  the TS entry (extensionless-TS imports, not loadable by Node
  directly) into a temp file and runs it; esbuild is a documented
  transitive devDependency (via @angular/build and vitest).
- `scripts/derive-fixture.mjs` (deleted) — the old-envelope,
  hand-mirrored projection; superseded end to end, no third
  implementation of the projection survives.
- `projects/collector/src/testing/capture-pipeline.ts` (new) —
  `deriveCaptureSnapshot(capture)`: buildCapturePage → passive probe →
  (gated) shim probe → `mapProbeResult` with `capturedAt` from the
  envelope; shared by deriver and drift spec, so fixture == pipeline
  output holds by construction.
- `projects/collector/src/testing/fixture-pages.ts` (modified) — new
  exported `buildCapturePage(capture)` reconstructing a vm sandbox from
  a lossless envelope (location, DOM script nodes from raw tag text,
  namespace clone, importShim with captured map); `buildFrankensteinPage`
  reseeded from the frankenstein-live capture on top of it (tripwires
  unchanged); the old-capture entry-list rebuild helpers
  (`rebuildMapObject`, `entriesToRecord`) deleted.
- `projects/collector/src/lib/fixture-drift.spec.ts` (new) — drift
  guard: every corpus-derived fixture (`FIXTURES` minus `synthetic-*`)
  equals a fresh `deriveCaptureSnapshot` run over its capture; plus the
  frankenstein-live provenance vector (pageUrl, v4, 20 file-spelling
  participants).
- `projects/devtools-bridge/src/lib/fixtures/<id>.fixture.ts` (new,
  11 generated modules: `clean-skip`, `strict-split`, `scope-isolation`,
  `strict-scope`, `scoped`, `non-dense`, `dynamic-init-native`,
  `dynamic-init-shim`, `dynamic-override`, `self-fill`,
  `frankenstein-live`) — each with a provenance banner (capture file,
  corpus run, generation; live: URL + date + phase-identity note).
- `projects/devtools-bridge/src/lib/fixtures/frankenstein-production.fixture.ts`
  (deleted) — superseded by `frankenstein-live.fixture.ts` (git shows
  the pair as a rename).
- `captures/frankenstein/production-04-remote-interaction.json`
  (deleted) — the old allowlist-projected capture; directory retired.
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) —
  11 corpus-derived + 7 synthetic entries; `PRIMARY_FIXTURE_ID` →
  `frankenstein-live`; registry doc explains generated vs synthetic.
- `captures/README.md` (modified) — intro reduced to two corpora with
  an explicit retirement note for `frankenstein-runtime-capture/1`;
  legacy "Frankenstein capture (V1 fixture source)" + its provenance
  section removed; new "Versioning map" (8 stamps with kind, meaning,
  bump rule) and "Data flow" (which script reads/writes which envelope,
  playground → probe → captures → manifest → validator → deriver →
  fixtures → provider, incl. drift guard).
- `guards/privacy-scan.spec.ts` (modified) — capture-scan sentinel now
  the frankenstein-live 01-initial file.
- `projects/collector/src/lib/snapshot-mapper.spec.ts` (modified) —
  frankenstein pipeline test (T7-AC-06) compares against
  `frankensteinLiveFixture`.
- `projects/devtools-bridge/src/lib/fixture-snapshot-provider.spec.ts`
  (modified) — query-parsing vector uses the new id.
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  primary-fixture describe retitled to frankenstein-live; synthetic
  filter is prefix-based (`synthetic-*`) now that non-primary no longer
  implies synthetic.
- `projects/devtools-ui/src/app/{app,shared/snapshot-export,shared/snapshot-export.service,shared/runtime-view-state,shared/import-map-view-state,views/import-map,views/remotes-exposes,views/shared-dependencies}.spec.ts`
  (modified) — fixture id → `frankenstein-live`; deployment deltas:
  pageUrl/scope host `https://lutzleonhardt.de/frankenstein-meeting-room/`,
  capturedAt `2026-08-11T11:56:25.504Z`, export filename
  `nf-snapshot-lutzleonhardt.de-20260811T115625Z.json`, relative
  scopeUrls (`./`, `./mermaid/`, `./whiteboard/`) and expose keys
  (`./Bootstrap`). All other content assertions survived unchanged —
  the deployment serves the same build as the old research capture
  (identical bundle hashes, same react 18.3.1 row, same 22/1/29 map).

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 5 block
- `docs/work/v2/task-log/task-4-collector-corpus-schemas.md` — mapper
  surface, corpus-vectors pattern, gotchas (SRI rule, entry cap,
  `__GLOBAL__`)
- `docs/work/v2/task-log/task-3-frankenstein-live-recapture.md` —
  live-capture contract, provenance sidecar, probe-hash pin gotcha
- `docs/work/v2/task-log/task-2-lossless-capture-corpus.md` — envelope
  structure, manifest newest-runstamp rule
- `projects/collector/src/lib/{shim-map-probe,corpus-vectors.spec,snapshot-mapper,passivity-harness.spec}.ts`,
  `projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts` (the
  mirrored shim-probe gate), `guards/*.spec.ts`
- `captures/manifest.json`, `captures/clean-skip/…`, `captures/frankenstein-live/…`
  + `provenance.json` — envelope payload shapes for `buildCapturePage`
- `package.json` — available TS runners (vitest/esbuild/tsc only)

### Key Decisions

— session 2026-08-11

- **Real-pipeline derivation via a shared module** (plan-preferred
  option executed): `deriveCaptureSnapshot` lives in
  `testing/capture-pipeline.ts` and is used by BOTH the deriver script
  and the drift spec — one implementation, no hand-mirrored projection
  anywhere. The drift spec makes the property durable: mapper changes
  without re-derived fixtures fail CI.
- **esbuild launcher for TS execution**: Node 25 cannot import the
  collector's extensionless TS; tsx/vite-node are not installed. The
  launcher bundles with esbuild (transitive dep, documented in the
  header) into a temp file. Rejected alternative: a vitest-driven
  generator "test" (file-writing tests, test-runner-as-script-runner).
- **Corpus enumeration from `captures/manifest.json`** — the builder
  already resolves newest-runstamp; live phase `01-initial` is selected
  explicitly (no newest-wins rule for live captures).
- **Determinism by construction**: `capturedAt` comes from each
  envelope, mapper key order is spec-pinned → byte-identical re-runs.
- **Fixture ids = scenario ids**; `PRIMARY_FIXTURE_ID` →
  `frankenstein-live` (richest realistic fixture, replaces the retired
  primary).
- **Deriver hard-failures**: unknown envelope/manifest schemaVersion
  (T5-AC-04), any collection error in a derived snapshot (corpus is
  error-free — errors indicate a deriver bug), live generation ≠ v4.
- **Shim-probe gating mirrors `ChromeSnapshotProvider`**
  (`shimProbeIndicated`: probe reports importShim as readable data
  property) — the reconstruction runs the same conditional second eval
  as the real extension.
- **Probe file NOT touched**: rewording its historical
  `frankenstein-runtime-capture/1` mention would change the sha256 the
  manifest pins (rebuild + revision-note cascade for a comment). The
  README retirement note carries the documentation duty instead; the
  edit was made and deliberately reverted.
- **`snapshot-v1.spec` synthetic filter prefix-based** — with 11
  derived fixtures, "not primary" no longer implies "synthetic".

### Review Focus

- **Behavior claims:**
  - Every corpus-derived fixture equals a fresh run of the real
    pipeline over its source capture (drift spec, 11/11), and
    re-running `node scripts/derive-fixtures.mjs` reproduces
    byte-identical modules (sha256-verified double run).
  - The deriver fails loudly: unknown envelope schemaVersion → exit 1
    with a naming message (verified by in-place mutation + restore);
    collection errors or a non-v4 live generation abort the run.
  - The old envelope path is fully retired: no tool reads
    `frankenstein-runtime-capture/1`; the only remaining textual
    mentions are the README retirement note and the hash-pinned probe's
    historical lineage comment.
- **Assumptions / choices:** fixture ids equal scenario ids; primary
  fixture switched to frankenstein-live; UI specs now assert the live
  deployment's values — including relative `./` scopeUrls and
  `./Bootstrap` expose keys, which are the raw registry truth the
  mapper's url node keeps (the old fixture had absolute URLs only
  because the old projection re-sanitized them).
- **Scope notes:** `scripts/lab-capture-dump.js` deliberately untouched
  (manifest sha256 pin); guards sentinel updated; 10 spec files across
  ui/bridge/collector migrated to the new fixture — content deltas are
  deployment metadata only. `.claude/` untracked session tooling stays
  out of commit scope.
- **Read next:**
  - `projects/collector/src/testing/capture-pipeline.ts` +
    `projects/collector/src/testing/fixture-pages.ts`
    (`buildCapturePage`) — the page reconstruction IS the derivation
    mechanism; check the channel-absence handling matches the envelope
    contract.
  - `projects/collector/src/lib/fixture-drift.spec.ts` — whether the
    drift guard pins what the plan promised (T5-AC-01/02).
  - `captures/README.md` (Versioning map + Data flow) — bump rules and
    flow accuracy; this is the maintainer-facing deliverable (T5-AC-06).

### Test Evidence

— session 2026-08-11

- **Full chain green:** `CI=true npm test` → devtools-ui 69,
  devtools-bridge 68, collector 55 (incl. 13 drift tests), guards 42 —
  234 tests, 0 failures. `test:collector` includes the strict
  `tsc -p projects/collector/tsconfig.lib.json` pass.
- **Determinism (T5-AC-01):** `sha256sum` over all 11 generated modules,
  re-run `node scripts/derive-fixtures.mjs`, `sha256sum -c` →
  BYTE-IDENTICAL.
- **Loud failure (T5-AC-04):** `clean-skip` capture mutated in place to
  `schemaVersion: lab-lossless-capture/99` → deriver exits 1 with
  "unknown envelope schemaVersion … understands only
  'lab-lossless-capture/1'"; corpus restored via git checkout, `git
  status` clean, no partial fixture writes.
- **Corpus untouched:** `node scripts/validate-lab-corpus.mjs` →
  `corpus valid: 10 captures + 2 live phases, runId 20260811T095850Z`.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Retirement sweep:** `rg 'frankenstein-production|
  production-04-remote-interaction|frankenstein-runtime-capture|
  derive-fixture\.mjs'` (excl. docs/work, .claude) → exactly the two
  documented mentions (README retirement note, probe lineage comment).
- **Guards auto-coverage (T5-AC-05):** privacy + export guards scan all
  18 `FIXTURES` entries and enforce registry == on-disk file set
  (42/42; deleting the old fixture without registry cleanup would have
  failed here).

### Acceptance Coverage

- **T5-AC-01** — passed: 10 scenario fixtures derived by script;
  byte-identical double run (sha256 evidence above); durable via
  `fixture-drift.spec.ts` "corpus-derived fixtures equal fresh pipeline
  output" (11 vectors + count pin).
- **T5-AC-02** — passed: frankenstein-live fixture from phase
  01-initial; drift-spec provenance vector (pageUrl
  `https://lutzleonhardt.de/frankenstein-meeting-room/`, generation
  `v4`, 20 `file`-spelling participants); deployment provenance (URL,
  date, best-known orchestrator, phase-identity note) in the module
  banner; deriver hard-asserts v4.
- **T5-AC-03** — passed: all 11 load through `FixtureSnapshotProvider`
  (registry entries; guards' registry==disk test; provider spec green);
  `frankenstein-production` removed, all consumers migrated (zero
  references left).
- **T5-AC-04** — partial: the schemaVersion gate is implemented and
  scripted-verified (mutation test, exit 1); no committed automated
  test exercises the script entry itself — the gate lives in
  `loadEnvelope` inside `scripts/derive-fixtures.ts`, which specs don't
  import. Optional hardening noted under Open Issues.
- **T5-AC-05** — passed: privacy scan runs over every `FIXTURES` entry
  (guards 42/42); mapper-level sanitization already spec-pinned
  (Task 4); SRI values appear only under `integrity`-keyed maps.
- **T5-AC-06** — passed: `captures/README.md` versioning map covers all
  stamps named in the plan plus `lab-capture-dump/1`, each with
  kind/meaning/bump rule; data-flow overview names which script reads
  which envelope.
- **T5-AC-07** — passed: capture deleted, old deriver deleted,
  `buildFrankensteinPage` migrated to the lossless corpus; remaining
  mentions are explicitly historical and named in the README retirement
  note (probe comment untouched due to the sha256 pin — documented
  above).
- **XC-02** (contributes) — fixtures remain scan-enforced (guards) and
  drift-guarded against schema/pipeline divergence.

### Open Issues

- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried from Task 4, shipping
  path unaffected (fix or retire the packagr target in housekeeping).
- T5-AC-04 hardening option: move the envelope schemaVersion gate into
  `deriveCaptureSnapshot` (shared step) so the drift spec can pin it as
  an automated test; currently script-level with scripted evidence.
- esbuild is consumed as a transitive dependency by the launcher
  (documented in its header); if a future dependency bump drops it,
  add `esbuild` to devDependencies explicitly.
- The probe's historical envelope mention can only be reworded together
  with a planned probe change (manifest re-pin + README revision-note
  treatment) — not worth a standalone edit.

### Context for Next Task

Task 6 (normalized store — entities and ingest) can treat as validated:
**the 11 corpus-derived fixtures ARE real pipeline output over the real
corpus** (drift-guarded), so store ingest can develop against them
without ever touching `captures/`.

- **Fixture surface:** `FIXTURES` in
  `projects/devtools-bridge/src/lib/fixtures/index.ts` — 11 derived ids
  (= scenario ids: `clean-skip`, `strict-split`, `scope-isolation`,
  `strict-scope`, `scoped`, `non-dense`, `dynamic-init-native`,
  `dynamic-init-shim`, `dynamic-override`, `self-fill`,
  `frankenstein-live`) + 7 `synthetic-*`; `PRIMARY_FIXTURE_ID =
  'frankenstein-live'`; dev preview via `?fixture=<id>`.
- **Reusable infrastructure:**
  `deriveCaptureSnapshot(capture)` (testing/capture-pipeline.ts) and
  `buildCapturePage(capture)` (testing/fixture-pages.ts) go from any
  lossless envelope to SnapshotV1 / a seeded page — useful for store
  specs that want capture-shaped input beyond the fixtures.
  Regeneration: `node scripts/derive-fixtures.mjs` from the repo root.
- **Content gotchas for ingest/derivation logic:** the live fixture
  carries RELATIVE scopeUrls (`./`, `./whiteboard/`) and expose keys
  (`./Bootstrap`) — raw registry truth, resolve against
  `capture.pageUrl` when absolute URLs are needed (the shim map's scope
  key is absolute: `https://lutzleonhardt.de/frankenstein-meeting-room/`).
  `scoped` has `generation: 'unknown'` (no participants — honest
  absence). `strict-scope` keeps its empty `__GLOBAL__` scope.
  `non-dense` is the biggest fixture (~550 lines, 14 participants).
  All derived fixtures have `errors: []` by deriver policy.
- **URL/date contract in specs:** UI specs assert
  `lutzleonhardt.de/frankenstein-meeting-room/` and capturedAt
  `2026-08-11T11:56:25.504Z`; a live re-capture after a redeploy will
  ripple into these (deliberate — same loudness doctrine as the corpus
  validator).

### Git State

`git diff --stat HEAD`:

```
 captures/README.md                                 |   80 +-
 .../production-04-remote-interaction.json          | 2213 --------------------
 guards/privacy-scan.spec.ts                        |    4 +-
 projects/collector/src/lib/fixture-drift.spec.ts   |   45 +
 projects/collector/src/lib/snapshot-mapper.spec.ts |   10 +-
 projects/collector/src/testing/capture-pipeline.ts |   32 +
 projects/collector/src/testing/fixture-pages.ts    |  128 +-
 .../src/lib/fixture-snapshot-provider.spec.ts      |    4 +-
 .../src/lib/fixtures/clean-skip.fixture.ts         |  146 ++
 .../lib/fixtures/dynamic-init-native.fixture.ts    |  152 ++
 .../src/lib/fixtures/dynamic-init-shim.fixture.ts  |  175 ++
 .../src/lib/fixtures/dynamic-override.fixture.ts   |  133 ++
 ...ion.fixture.ts => frankenstein-live.fixture.ts} |  531 ++---
 projects/devtools-bridge/src/lib/fixtures/index.ts |   31 +-
 .../src/lib/fixtures/non-dense.fixture.ts          |  547 +++++
 .../src/lib/fixtures/scope-isolation.fixture.ts    |  133 ++
 .../src/lib/fixtures/scoped.fixture.ts             |  107 +
 .../src/lib/fixtures/self-fill.fixture.ts          |  176 ++
 .../src/lib/fixtures/strict-scope.fixture.ts       |  147 ++
 .../src/lib/fixtures/strict-split.fixture.ts       |  171 ++
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    |    4 +-
 projects/devtools-ui/src/app/app.spec.ts           |    8 +-
 .../src/app/shared/import-map-view-state.spec.ts   |    6 +-
 .../src/app/shared/runtime-view-state.spec.ts      |    4 +-
 .../src/app/shared/snapshot-export.service.spec.ts |    2 +-
 .../src/app/shared/snapshot-export.spec.ts         |    4 +-
 .../devtools-ui/src/app/views/import-map.spec.ts   |   10 +-
 .../src/app/views/remotes-exposes.spec.ts          |   12 +-
 .../src/app/views/shared-dependencies.spec.ts      |    6 +-
 scripts/derive-fixture.mjs                         |  280 ---
 scripts/derive-fixtures.mjs                        |   37 +
 scripts/derive-fixtures.ts                         |  139 ++
 32 files changed, 2594 insertions(+), 2883 deletions(-)
```

`git status --short`: all of the above staged (`M`/`A`/`D`, the
old→new frankenstein fixture detected as `R`); additionally untracked:

```
?? .claude/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
