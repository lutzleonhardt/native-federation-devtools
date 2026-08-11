# Task 4: Collector delta — corpus-validated schemas in probe, runtime-schema, and SnapshotV1

### Task

Replaced the collector's hardcoded old-generation projection with the
corpus-validated V2 shapes in both projection layers in lockstep
(in-page probe string + host-side `runtime-schema.ts`, hand-synced),
grew `SnapshotV1` additively (participant `bundle`/`entries`, own
scoped-externals schema, per-remote `integrity` with SRI values kept,
normalized `servedFiles`, generation discriminator), generalized
repository laziness to all four keys, and pinned everything with
corpus-shaped vectors from `captures/`.

### Status

DONE

### Files Modified

- `projects/collector/src/lib/passive-probe.ts` (modified) — inline
  schemas extended: participant += `bundle` + `entries` (map), own
  scoped schema `remote → pkg → {tag, bundle, entries}`, remote +=
  `integrity` map; contract stamp bumped to `passive-probe/2` so
  probe/mapper drift fails loudly; header rewritten (corpus-validated
  V2 shapes, hand-sync discipline).
- `projects/collector/src/lib/runtime-schema.ts` (modified) — host-side
  mirror of the probe schemas; `file` and `entries` values ride the
  `url` node (relative branch strips query/fragment), `bundle` is a
  name (string), per-remote integrity reuses the SRI-validating
  `integrity` node whose values are now kept by policy.
- `projects/collector/src/lib/snapshot-mapper.ts` (modified) — all four
  repository keys lazy (absent == `{}`) with a recognition floor (zero
  present keys → `not-recognized`); participant mapping with
  `file` XOR `entries` check (`participant-spelling-invalid` error +
  row drop), `servedFiles` normalization, per-participant `generation`
  + snapshot aggregation (`deriveGeneration`); new `toScopedExternals`
  (`scoped-package-incomplete` on missing tag); `toRemotes` collects
  the projected integrity map; probe gate on `passive-probe/2`.
- `projects/collector/src/lib/constants.ts` (modified) —
  `COLLECTOR_VERSION` → `nf-devtools-collector/2`.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) — DTO
  grown additively (no fork, `schemaVersion` stays 1): `GenerationV1`,
  `SnapshotGenerationV1`, `ServedFileV1`, `ScopedPackageV1`,
  `ScopedExternalsV1`; `ExternalRemoteV1` += `entries`/`bundle`/
  `servedFiles`/`generation`; `RemoteV1` += `integrity`;
  `RuntimeRepositoriesV1` uses the scoped type and carries the
  generation aggregate; laziness/recognition doc comments updated.
- `projects/collector/src/testing/lab-corpus.ts` (new) — test-only
  loader for the checked-in lossless corpus (newest runstamp per
  scenario, explicit phase file for live captures, namespace accessor).
- `projects/collector/src/lib/corpus-vectors.spec.ts` (new) —
  corpus-shaped vectors: clean-skip (dev conflicts), frankenstein-live
  01-initial (v4 + integrity + shared-chunks), dynamic-init-shim (dev
  per-remote integrity incl. empty map), scoped/non-dense (own scoped
  schema, lazy shared-externals), strict-scope (no `__GLOBAL__`
  assumption).
- `projects/collector/src/lib/snapshot-mapper.spec.ts` (modified) —
  dev-generation test rewritten (entries/bundle now collected), XOR
  both/neither error test, mixed-generation test, scoped-incomplete
  test, loud entry-cap truncation test (1200-entry chunk page),
  sanitization test extended with entries/scoped/integrity vectors,
  reason texts updated.
- `guards/privacy-scan.ts` (modified) — SRI rule made structural: hash
  values allowed only inside an `integrity`-keyed subtree (by-policy
  collection), violation everywhere else (`integrityFor` stays
  presence-only); option doc updated.
- `guards/privacy-scan.spec.ts` (modified) — new test pinning the
  structural SRI policy (allowed under `integrity`, flagged elsewhere).
- `scripts/derive-fixture.mjs` (modified) — projection extended to
  mirror the new mapper (participant XOR + servedFiles + generation,
  scoped own schema, per-remote integrity, all-keys-lazy + recognition
  floor, runtime generation aggregate); banner/doc updated (SRI values
  kept by policy).
- `projects/devtools-bridge/src/lib/fixtures/frankenstein-production.fixture.ts`
  (regenerated via script) — now carries per-remote integrity (29 SRI
  values), participant `bundle` values, `servedFiles`, generation
  `v4`; the old V1 raw capture had this data all along, the V1
  projection had dropped it.
- `projects/devtools-bridge/src/lib/fixtures/synthetic-{multi-version,hostile,collision,not-recognized}.fixture.ts`
  (modified) — mechanical DTO updates (new participant fields,
  `integrity: {}`, runtime `generation`, new not-recognized reason).
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  runtime key list += `generation`; react participant assertion
  extended.
- `projects/devtools-bridge/src/lib/chrome-snapshot-provider.spec.ts`
  (modified) — mock probe stamp → `passive-probe/2`.
- `projects/devtools-ui/src/app/views/{remotes-exposes,shared-dependencies}.spec.ts`
  (modified) — not-recognized reason substring updated to the new
  fixture text.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 4 block
- `docs/work/v2/task-log/task-3-frankenstein-live-recapture.md` —
  amendments (file XOR entries, generation awareness), corpus contract
- `docs/work/v2/task-log/task-2-lossless-capture-corpus.md` — envelope
  contract for vector extraction, allowlist-dropped-fields evidence
- `captures/` (clean-skip, scoped, non-dense, strict-scope,
  dynamic-init-shim, frankenstein-live) — shape ground truth, verified
  by script before schema design (XOR 52/52, per-key laziness table)
- `projects/collector/src/lib/{safe,errors,privacy}.ts`,
  `edge-cases.spec.ts`, `probe-source.spec.ts`,
  `passivity-harness.spec.ts`, `testing/fixture-pages.ts` — defensive
  read/cap machinery and existing spec surface (probe static tests and
  passivity harness needed no changes)
- `projects/devtools-ui/src/app/views/shared-dependencies.ts`,
  `shared/runtime-view-state.ts`, `shared/snapshot-export*.ts` —
  export-compat consumer check

### Key Decisions

— session 2026-08-11

- **Recognition floor for the all-keys-lazy rule** (refinement beyond
  the plan text): every repository key is lazy (absent == `{}`), but a
  global carrying NONE of the four keys stays `not-recognized`
  ("carries none of the four repository keys") — otherwise any foreign
  object named `__NATIVE_FEDERATION__` would report as an NF runtime
  with four empty repos. Corpus-safe: every real capture has ≥3 keys.
- **XOR violation → error + row drop**: a participant with both or
  neither spelling is recorded as `participant-spelling-invalid`
  (detail: path, participant, spelling) and dropped — consistent with
  the existing incomplete-row handling, never silently normalized.
- **Generation surfaced as `runtime.generation`** aggregated from
  participant spellings only (`v4`/`dev`/`mixed`/`unknown`);
  `unknown` = zero participants (e.g. all-scoped page) — spelling
  evidence is honestly absent there, scoped shapes are deliberately
  not used as a secondary heuristic.
- **`servedFiles: { entry, file }[]`** as the normalized
  representation: dev feeds one row per `entries` key, v4 one
  `{entry: null, file}` row; raw spelling fields stay on the
  participant as generation evidence.
- **`schemaVersion` stays literal 1** (no fork). Export-compat check
  outcome: `devtools-ui` never reads `scopedExternals`, all five V1
  fixtures carried `{}` there, export is verbatim DTO serialization
  (stamp already lands in every export, spec-pinned) — the corrected
  scoped shape breaks no consumer.
- **Probe contract bumped to `passive-probe/2`** and
  `COLLECTOR_VERSION` to `/2`: probe and mapper ship in lockstep,
  nothing persists raw probe results; a version mismatch now fails
  loudly instead of half-projecting.
- **Privacy-guard SRI rule made structural** (guard policy change):
  hash values allowed exactly inside an `integrity`-keyed subtree —
  the by-policy collection shape — and a violation everywhere else;
  `integrityFor` stays presence-only. Chosen over `allowSriHashes:
  true` at snapshot call sites, which would have disabled the check
  wholesale.
- **`bundle` typed as string, not url**: it is a bundle name (join key
  into shared-chunks), not a file path; only `file` and `entries`
  values fall under URL sanitization per the plan's privacy rules.
- **Primary fixture regenerated via `derive-fixture.mjs`** (not
  hand-edited), keeping its generated-file contract; the script now
  mirrors the mapper's projection rules and is the auditable record.

### Review Focus

- **Behavior claims:**
  - Both orchestrator generations project losslessly-within-allowlist:
    corpus vectors assert projected participants/scoped
    packages/integrity/shared-chunks equal the raw captured registry
    (clean-skip, frankenstein-live, scoped, non-dense,
    dynamic-init-shim), with zero collection errors.
  - Truncation is never silent: a 1200-entry chunk page surfaces
    `array-item-limit` in `snapshot.errors` end-to-end.
  - SRI hash values appear in snapshots exactly under
    `remotes.*.integrity`; the privacy scan structurally rejects them
    anywhere else, and `entries`/`file` values are query/fragment
    stripped (leak-string assertions).
- **Assumptions / choices:** recognition floor (zero-of-four keys →
  not-recognized) is a refinement beyond the plan's literal "all keys
  lazy"; generation aggregate ignores scoped-externals shapes;
  `strict-scope` capture carries an empty `__GLOBAL__` alongside
  `strict` — the vector asserts both keys project as-is.
- **Scope notes:** `guards/privacy-scan.ts` policy change is
  guard-surface, not collector-surface — deliberate, spec'd by the
  task's "SRI hash values are collected by policy". UI view specs
  touched only for the fixture reason text. `.claude/` untracked
  session tooling stays out of commit scope. Pre-existing failure NOT
  addressed: `ng build devtools-bridge` (ng-packagr) fails with 18
  rootDir errors on clean HEAD too; the shipping path
  (`build:extension` + panel check) is green.
- **Read next:**
  - `projects/collector/src/lib/snapshot-mapper.ts`
    (`toExternalRemotes`, `mapRuntime`) — the XOR/generation/laziness
    core; check the recognition floor matches your reading of honest
    states.
  - `guards/privacy-scan.ts` — whether the structural SRI exemption is
    acceptably narrow.
  - `projects/collector/src/lib/corpus-vectors.spec.ts` — whether the
    vectors really pin the shapes the plan promised (T4-AC-01/02/04/05).

### Test Evidence

— session 2026-08-11

- **Full chain green:** `CI=true npm test` → devtools-ui 59, bridge
  48, collector 42 (incl. 7 corpus vectors), guards 33 — 182 tests, 0
  failures. `test:collector` includes the strict `tsc -p
  projects/collector/tsconfig.lib.json` pass.
- **Corpus ground-truth checks (pre-implementation, scripted):** file
  XOR entries holds for all 52 participants across 12 captures;
  per-key laziness table (shared-externals ABSENT in `scoped`,
  scoped-externals ABSENT in 8/10, remotes always present) — basis for
  the recognition floor.
- **Pipeline cross-validation:** probe→mapper over the fixture page
  equals the script-derived fixture (`toEqual` on channels/runtime/
  importMaps) — two independent implementations of the projection
  agree, now including 29 per-remote SRI values and bundle fields.
- **T4-AC-06 vector:** 30 bundles × 40 files → retained < 1200 and
  `array-item-limit` present in `snapshot.errors`.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass; `npx ng build devtools-ui` passes. `ng build devtools-bridge`
  fails identically on stashed HEAD (pre-existing, 18× TS6059).
- **Corpus untouched:** `node scripts/validate-lab-corpus.mjs` →
  `corpus valid: 10 captures + 2 live phases` (probe pin unaffected —
  the lab probe `scripts/lab-capture-dump.js` was not modified).

### Acceptance Coverage

- **T4-AC-01** — passed: `corpus-vectors.spec.ts` "clean-skip:
  participants keep bundle + entries…" (wrapper `{dirty, versions}` and
  share/skip conflict rows intact, participants equal raw registry);
  plus the rewritten dev-generation test in `snapshot-mapper.spec.ts`.
- **T4-AC-02** — passed: corpus vector "frankenstein-live … file
  spelling … v4 generation" (20 participants, `servedFiles` normalized
  from both spellings across the dev and v4 tests); mixed aggregation
  pinned by "aggregates mixed participant spellings".
- **T4-AC-03** — passed: "records a participant carrying both or
  neither spelling as a collection error" — row dropped +
  `participant-spelling-invalid` with spelling detail.
- **T4-AC-04** — passed: scoped/non-dense own-schema vectors (absent
  shared-externals == `{}`; present-but-empty scoped-externals == `{}`
  in the live vector; lazily-absent mapper tests), strict-scope
  no-`__GLOBAL__`-assumption vector, `scoped-package-incomplete` test.
- **T4-AC-05** — passed: per-remote integrity equals raw with SRI
  values kept (frankenstein-live 29 entries, dynamic-init-shim dev
  maps incl. empty), invalid SRI rejected with `invalid-integrity`
  (sanitization test); `sharedChunks` equals raw
  `remote → bundleName → fileName[]`.
- **T4-AC-06** — passed: loud-truncation test (synthetic over-cap
  chunk page → error codes in the final snapshot).
- **T4-AC-07** — passed: export spec asserts `schemaVersion` in the
  serialized export (pre-existing, still green over the grown DTO);
  compat outcome documented under Key Decisions (no consumer of the
  old scoped schema; export is verbatim DTO).
- **T4-AC-08** — passed: sanitization test vectors for `entries`
  values, `file`, scoped entries, and integrity keys (query/fragment
  stripped, leak strings absent, `scanForPrivacyViolations` clean).
- **XC-02** (contributes) — corpus vectors + structural privacy rule
  keep collector output schema-clean and scan-enforced.

### Open Issues

- `ng build devtools-bridge` (ng-packagr path) fails with 18
  pre-existing TS6059 rootDir errors (bridge imports from `collector`
  since task-8 of passive-mvp); shipping path unaffected. Fix or
  retire the packagr target in a housekeeping task.
- Mixed-generation pages remain synthetic-only (no real deployment
  observed); representability is spec-pinned via the mixed test, the
  synthetic fixtures stay uniformly v4.
- Multi-key `entries` maps are allowed by the map schema but still
  observed nowhere — nothing requires them (per plan).

### Context for Next Task

Task 5 (fixture derivation from the lossless corpus) can treat as
validated: **the mapper ingests both generations of raw registry and
deterministically produces the extended `SnapshotV1`** — exactly the
transformation fixture derivation drives.

- **Extended DTO surface:** `ExternalRemoteV1 = { name,
  requiredVersion, strictVersion, file, entries, cached, bundle,
  servedFiles, generation }` (file XOR entries non-null);
  `ScopedPackageV1 = { tag, bundle, entries }`; `RemoteV1.integrity:
  Record<string, string>`; `RuntimeRepositoriesV1.generation:
  'v4' | 'dev' | 'mixed' | 'unknown'`. Key order in mapper output ==
  derive-script output (the `Object.keys` spec pins runtime key
  order with `generation` last).
- **Reusable test infrastructure:**
  `projects/collector/src/testing/lab-corpus.ts` (`loadLabCapture`,
  `labNamespace`) + `makeBarePage` + `evaluateProbe` is the proven
  path from corpus file to snapshot — fixture derivation for lab
  scenarios can either reuse the mapper directly or extend
  `derive-fixture.mjs`'s pattern (which now mirrors the mapper 1:1
  but reads the OLD `frankenstein-runtime-capture/1` envelope, NOT
  the `lab-lossless-capture/1` envelope — a new deriver must read
  `channels.nativeFederationGlobals.data.namespace`).
- **Gotchas:** the probe caps (512-entry global counter) truncate
  chunk-heavy registries — fixture derivation from very dense captures
  through the probe path would surface cap errors (corpus captures are
  comfortably under the cap; frankenstein-live projects error-free).
  The privacy scan now allows SRI values ONLY under `integrity`-keyed
  maps — derived fixtures with per-remote integrity pass, but a
  fixture placing hashes elsewhere fails the guard. `strict-scope`'s
  registry carries an empty `__GLOBAL__` next to `strict` — don't
  "clean it up" in fixtures, it is the honest observation.
- **Reason-text contract:** `not-recognized` reasons changed to
  "global present but repositories unreadable: …" and "global present
  but carries none of the four repository keys" — UI copy/tests key on
  these strings.

### Git State

`git diff --stat`:

```
 guards/privacy-scan.spec.ts                        |  11 +
 guards/privacy-scan.ts                             |  18 +-
 projects/collector/src/lib/constants.ts            |   2 +-
 projects/collector/src/lib/passive-probe.ts        |  37 ++-
 projects/collector/src/lib/runtime-schema.ts       |  45 +++-
 projects/collector/src/lib/snapshot-mapper.spec.ts | 203 ++++++++++++++--
 projects/collector/src/lib/snapshot-mapper.ts      | 196 ++++++++++++---
 .../src/lib/chrome-snapshot-provider.spec.ts       |   2 +-
 .../fixtures/frankenstein-production.fixture.ts    | 269 +++++++++++++++++++--
 .../lib/fixtures/synthetic-collision.fixture.ts    |   4 +
 .../src/lib/fixtures/synthetic-hostile.fixture.ts  |   7 +
 .../fixtures/synthetic-multi-version.fixture.ts    |  12 +
 .../fixtures/synthetic-not-recognized.fixture.ts   |   3 +-
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    |   5 +
 projects/devtools-bridge/src/lib/snapshot-v1.ts    |  86 ++++++-
 .../src/app/views/remotes-exposes.spec.ts          |   2 +-
 .../src/app/views/shared-dependencies.spec.ts      |   2 +-
 scripts/derive-fixture.mjs                         | 116 ++++++---
 18 files changed, 869 insertions(+), 151 deletions(-)
```

`git status --short` (additionally untracked):

```
?? projects/collector/src/lib/corpus-vectors.spec.ts
?? projects/collector/src/testing/lab-corpus.ts
?? .claude/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
