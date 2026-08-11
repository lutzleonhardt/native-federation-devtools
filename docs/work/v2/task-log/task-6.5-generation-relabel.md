# Task 6.5: Generation relabel — 'dev' → 'v4.5'

### Task

Renamed the registry-format generation label `'dev'` to `'v4.5'` across
DTO, mapper, fixtures, specs, and docs, and re-documented both values as
*registry-format generations named by the release that introduced the
format* — source-verified basis: the corpus's "dev" commit `8e5e0b3` is
the released v4.6.0, the `entries` spelling shipped in v4.5.0
(`a424249`, "Support for integrated secondary entrypoints").

### Status

DONE

### Files Modified

- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) —
  `GenerationV1 = 'v4' | 'v4.5'`; doc comment rewritten to name the
  version facts (v4.5.0 / `a424249`; `8e5e0b3` == v4.6.0) per
  T6.5-AC-03; `entries`-spelling doc mentions on `ServedFileV1` and
  `ExternalRemoteV1` reworded.
- `projects/collector/src/lib/snapshot-mapper.ts` (modified) —
  `deriveGeneration` + participant mapping emit `'v4.5'`; the
  discriminator `Set` now typed via imported `GenerationV1` (stale
  literals become type errors); spelling comment reworded.
- `projects/collector/src/lib/passive-probe.ts` (modified) — header
  doc comment only ("registry-format generations", `entries` = v4.5+);
  the probe STRING is untouched — the stop-and-flag condition
  (probe-pin cascade) never triggered.
- `projects/collector/src/lib/runtime-schema.ts` (modified) — header
  doc comment reworded to match (hand-sync discipline).
- `scripts/derive-fixtures.ts` (modified) — lab banner "orchestrator
  dev commit ${…}" → "orchestrator v4.6.0 (${…})"; the generation
  banner line picks up `v4.5` from the mapper automatically.
- `projects/devtools-bridge/src/lib/fixtures/*.fixture.ts` (10 lab
  modules regenerated via `node scripts/derive-fixtures.mjs`) — banner
  + `generation` literals now `v4.5`; `frankenstein-live` regenerated
  byte-identical (its banner never carried "dev").
- `projects/collector/src/lib/corpus-vectors.spec.ts` (modified) —
  describe title + 4 generation assertions → `v4.5`.
- `projects/collector/src/lib/snapshot-mapper.spec.ts` (modified) —
  test title, seeded expectations → `v4.5`; remote name `'dev-remote'`
  → `'v45-remote'` (sanitization test, referenced only by index).
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts`
  (modified) — clean-skip row expectations → `v4.5`; mixed-generation
  seeded participant renamed `'dev'` → `'v45'` with generation `v4.5`.
- `projects/devtools-ui/src/app/shared/store/ingest.ts` +
  `federation-model.ts` (modified) — chunk-source comments "(dev
  non-dense)" → "(v4.5 non-dense)".
- `docs/specs/native-federation-devtools-v2.md` (modified) —
  generation wording in §2 (2.4 spelling paragraph), §3 (edge-list,
  chunk rules, badges, variation catalog, attribution ladder, schema
  requirements) and §7 (generation-awareness finding); the §2 registry
  field name "`dev` blocks" deliberately untouched (field name, not a
  label).
- `captures/README.md` (modified) — versioning-map generation row
  renamed `v4.5 / v4` with the release facts; "dev panel" mention
  untouched (ng-serve meaning).
- `docs/work/v2/shape-validation.md` (modified) — stays historical;
  one blockquote addendum at the top maps the document's "dev" naming
  to the relabel.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 6.5 block
- `docs/work/v2/task-log/task-6-normalized-store-ingest.md` (origin of
  the task, fixture-regeneration workflow),
  `task-5-corpus-fixture-derivation.md` (deriver mechanics, probe-pin
  gotcha), `task-4-collector-corpus-schemas.md` (where
  `GenerationV1`/`deriveGeneration` were born, hand-sync discipline)
- Survey sweeps (`rg -w 'dev'` / case-insensitive variant) across
  projects/, scripts/, guards/, captures/, docs/specs/ to enumerate the
  full relabel surface before editing

### Key Decisions

— session 2026-08-12

- **Probe string untouched, comment-only probe edit**: the only `dev`
  in `passive-probe.ts` sits in the TS doc comment above
  `PASSIVE_PROBE_SOURCE`; `scripts/lab-capture-dump.js` (sha256-pinned
  in the manifest) contains zero `dev` mentions — no probe-pin cascade,
  verified before editing.
- **Synthetic fixtures: no-op** — the plan's "hand-update synthetic
  fixtures" turned out empty; synthetics carry zero `dev` occurrences
  (uniformly v4 since Task 4). Verified by per-file `rg -cw` count.
- **`Set<GenerationV1>` instead of a re-inlined literal union** in
  `deriveGeneration` — the DTO union is now the single source of the
  label values; a future label change fails compilation instead of
  silently drifting.
- **Test-name renames beyond the literal label** (grep hygiene +
  semantic honesty): `'dev-remote'` → `'v45-remote'`,
  seeded participant `'dev'` → `'v45'` — both referenced only by
  index/expectation, no behavior change. `'v45'` (not `'v4.5'`) as
  NAME to keep participant names visually distinct from generation
  labels.
- **Spec sweep deliberately wider than §3-literal**: generation-label
  mentions in §2 and §7 were reworded too (task text: "any
  'dev'-generation mentions"); the registry field name "`dev` blocks"
  (§2) and Angular "dev mode/dev panel" mentions stay — they are not
  generation labels.
- **shape-validation.md kept historical** with the optional one-line
  addendum (as a blockquote before the generation caveat) instead of a
  rewrite — its row evidence cites the corpus as captured.

### Review Focus

- **Behavior claims:**
  - The relabel is semantics-free: 259 tests unchanged in count and all
    green; the deriver reproduces all 18 fixture modules byte-identical
    on a second run; frankenstein-live regenerated with zero diff.
  - `rg -w 'dev'` over DTO, mapper, fixtures, and specs finds no
    generation-label remnant; every surviving hit is a non-label
    (`react/jsx-dev-runtime` corpus data, Angular "dev mode"/"dev
    (fixture)" comments, `angular.dev` URLs, README "dev panel").
  - The probe string and the lab probe are bit-identical to before —
    corpus validator green with unchanged probe hash `c9060b95128f…`.
- **Assumptions / choices:** `'v4.5'` is a pure label (never fed to the
  semver comparator); spec §2/§7 rewording beyond the §3-literal task
  text; `v45` naming for test participants.
- **Scope notes:** synthetic-fixture hand-updates were expected by the
  plan but are a verified no-op; no new tests (existing specs re-pin
  the renamed literals). `.claude/` untracked session tooling stays out
  of commit scope.
- **Read next:**
  - `projects/devtools-bridge/src/lib/snapshot-v1.ts` (`GenerationV1`
    doc block) — the citation is the task's durable artifact
    (T6.5-AC-03); check the facts read correctly.
  - `docs/specs/native-federation-devtools-v2.md` §2.4 spelling
    paragraph — the one edit that reflows a sentence rather than
    swapping a token.
  - `projects/collector/src/lib/snapshot-mapper.spec.ts`
    (sanitization test) — confirm the `v45-remote` rename really is
    index-only.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 91,
  devtools-bridge 68, collector 58 (incl. strict tsc pass), guards 42 —
  **259 tests, 0 failures** (same count as Task 6 — no tests added or
  removed).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass.
- **Deriver determinism (T6.5-AC-02):** sha256 over all 18 fixture
  modules, fresh `node scripts/derive-fixtures.mjs`, `sha256sum -c
  --quiet` → ALL 18 BYTE-IDENTICAL.
- **Corpus untouched (T6.5-AC-02):** `node scripts/validate-lab-corpus.mjs`
  → `corpus valid: 10 captures + 2 live phases, runId 20260811T095850Z,
  probe c9060b95128f…` (probe hash unchanged).
- **Grep-proof (T6.5-AC-01):** `rg -nw 'dev' projects/ scripts/
  guards/` → remaining hits are exclusively non-labels
  (`react/jsx-dev-runtime` ×3 in frankenstein-live corpus data,
  Angular `angular.dev` URLs in tsconfig comments, "dev mode"/"dev
  (fixture)"/"fixture-backed in dev" comments); a case-insensitive
  sweep with those classes filtered returns empty.

### Acceptance Coverage

- **T6.5-AC-01** — passed: grep-proof above; DTO, mapper, fixtures, and
  specs carry no generation-label `dev`; each residual word-`dev` hit
  is named and non-label.
- **T6.5-AC-02** — passed: 259/259 green, builds pass, deriver
  double-run byte-identical (18/18), corpus validator untouched with
  unchanged probe hash.
- **T6.5-AC-03** — passed: `GenerationV1` doc comment names v4.5.0 /
  `a424249` / `8e5e0b3` == v4.6.0 (`snapshot-v1.ts:56-63`).

### Open Issues

- Orchestrator generations before the observed two (≤ v4.4 variants,
  v3, …) remain unvalidated — carried from Task 6; closing it means a
  lab scenario + capture, per corpus doctrine.
- A merge-vs-shim-map divergence surface is still round-4 view material
  (carried from Task 6).
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Task 7 (store derivations) can treat as validated: **generation
literals are exactly `'v4' | 'v4.5' | 'mixed' | 'unknown'` everywhere**
— new specs can use them without relabel churn, and `GenerationV1` in
`snapshot-v1.ts` is the single source of the label values (the mapper's
discriminator set is typed against it).

- Everything Task 6 handed over stays valid unchanged: `ingestSnapshot`
  / `mergeDocumentMaps` surface, model invariants, strict-scope hook,
  fixture gotchas (see task-6 log's Context section).
- Label semantics: `'v4'` = format since v4.0 (`file` spelling),
  `'v4.5'` = format since v4.5.0 (`entries` spelling); the lab corpus
  runs v4.6.0 (`8e5e0b3`), which emits the v4.5 format — generation
  names the FORMAT, not the running version.
- Regeneration unchanged: `node scripts/derive-fixtures.mjs` from the
  repo root; lab banners now read "orchestrator v4.6.0 (8e5e0b3)".
- Historical docs (`docs/work/`, shape-validation rows) still say
  "dev" — that is deliberate; only the addendum maps the naming.

### Git State

`git diff --stat`:

```
 captures/README.md                                 |  2 +-
 docs/specs/native-federation-devtools-v2.md        | 27 ++++++++---------
 docs/work/v2/shape-validation.md                   |  4 +++
 projects/collector/src/lib/corpus-vectors.spec.ts  |  8 ++---
 projects/collector/src/lib/passive-probe.ts        |  4 +--
 projects/collector/src/lib/runtime-schema.ts       |  6 ++--
 projects/collector/src/lib/snapshot-mapper.spec.ts | 12 ++++----
 projects/collector/src/lib/snapshot-mapper.ts      | 15 +++++-----
 .../src/lib/fixtures/clean-skip.fixture.ts         | 10 +++----
 .../lib/fixtures/dynamic-init-native.fixture.ts    | 10 +++----
 .../src/lib/fixtures/dynamic-init-shim.fixture.ts  | 10 +++----
 .../src/lib/fixtures/dynamic-override.fixture.ts   | 10 +++----
 .../src/lib/fixtures/non-dense.fixture.ts          | 34 +++++++++++-----------
 .../src/lib/fixtures/scope-isolation.fixture.ts    | 10 +++----
 .../src/lib/fixtures/scoped.fixture.ts             |  2 +-
 .../src/lib/fixtures/self-fill.fixture.ts          | 12 ++++----
 .../src/lib/fixtures/strict-scope.fixture.ts       | 10 +++----
 .../src/lib/fixtures/strict-split.fixture.ts       | 12 ++++----
 projects/devtools-bridge/src/lib/snapshot-v1.ts    | 15 ++++++----
 .../src/app/shared/store/federation-model.ts       |  2 +-
 .../src/app/shared/store/ingest.spec.ts            | 10 +++----
 .../devtools-ui/src/app/shared/store/ingest.ts     |  4 +--
 scripts/derive-fixtures.ts                         |  2 +-
 23 files changed, 120 insertions(+), 111 deletions(-)
```

`git status --short`: all of the above `M`; additionally untracked:

```
?? .claude/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
