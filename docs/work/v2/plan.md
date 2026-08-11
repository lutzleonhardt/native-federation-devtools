# Native Federation DevTools — V2 Plan

Spec: docs/specs/native-federation-devtools-v2.md

Branch scope: v2

Scope: capture-first inversion of the V2 work. Round 1 (Tasks 1–2,
done): serial scenario runner in the playground lab repo
(`/home/lutz/projects/nf/playground`) plus the lossless 10-scenario
capture corpus and the shape-validation report
(`docs/work/v2/shape-validation.md`). Round 2 (Task 3, done):
lossless re-capture of the public frankenstein app — rows 12–16 and
the per-decision consequences re-check closed spec §7 I–K; the spec
was amended in place (variation catalog, chunk-attribution ladder,
generation discriminator). Round 3 (Tasks 4–7, this edit): the
corpus-validated data layer in the product — collector delta, fixture
derivation from the lossless corpus, normalized store ingest, store
derivations. Round 4 (shell + views) stays deliberately unplanned —
see the end-of-plan roadmap.

Deliberate deviation from spec §7 ("one deployment serves a catalog"):
lab scenarios run serially from checked-in definition folders plus a
runner; stable IDs and regenerability are preserved (XC-01).

> The executing agent may adjust scope and ordering based on more
> up-to-date context discovered during implementation, as long as
> each task still satisfies the sizing rules above.
>
> When a task is finished (DONE or BLOCKED), close it with the
> `/wrap-up N` → `/commit N` pair. `/wrap-up N` writes or extends
> `docs/work/<scope>/task-log/task-{N}-{slug}.md`, where `<scope>`
> is derived from the current git branch, and is safe to run multiple
> times across sessions — it merges. `/commit N` reads that log,
> stages code + summary, and commits them together after showing
> the plan and waiting for confirmation. Optionally run `/review`
> (quick per-task, full before a PR) between wrap-up and commit;
> a second `/wrap-up N` can absorb the review findings.

## Task 1: Scenario runner and self-contained scenario definitions in the lab app

### Instructions

All work in this task happens in the playground lab app, a **separate
git repository** at `/home/lutz/projects/nf/playground` (currently on
`main` — create a work branch there, e.g. `lab/v2-scenarios`, and
reference its commits from this task's log; this repo only receives the
plan/log/corpus artifacts).

Goal: every conflict/edge scenario the V2 views need is reproducible
from a fresh checkout by one command, with no manual config editing.

**Two-level model.** What a remote (or the host) *declares* is baked at
build time: the bundled version of a shared package, `requiredVersion`
range, `strictVersion`, `singleton`, entry-point `skip`s in its
federation config, and the `denseChunking` build feature. What is
selectable at runtime: the `initFederation` options (`strict.*`,
`profile.latestSharedExternal`, `profile.scopeUncoveredEntrypoints`),
which remote-entry URLs the manifest lists, and any dynamic
`initRemoteEntry` calls after init.

**Serial execution model.** One scenario = one checked-in definition
folder containing everything it needs: the host's federation config,
each participating remote's federation config, the manifest, and the
init options. A runner script (`run-scenario.mjs <id>`) applies the
definition, builds host + participating remotes (esbuild — seconds),
serves the result locally, and stays up; `--all` iterates the catalog
serially. The host is rebuilt per scenario — there are no host
variants and no scenario query parameter. Re-running any earlier
scenario must reproduce its shapes (no leftover state).

**Conflict lever.** Version conflicts use a small dedicated package
(e.g. `@nf-lab/conflict-lib`) in two locally packed versions
(1.0.0/2.0.0 as `file:` tarballs wired into different participants) —
the negotiation is package-agnostic, so this exercises the same code
paths as a framework-version conflict at a fraction of the build cost.
The self-fill scenario needs secondary entry points; decide on the
ground: (a) give the conflict package an `exports` subpath and verify
the native-federation build treats it as an integrated secondary entry
point, or (b) fall back to real Angular version drift in separate
workspace installs (best-effort, most expensive part of the matrix).

**Readiness signal.** Each scenario page exposes
`window.__NF_SCENARIO_READY__`, a promise that resolves only after all
init steps of the scenario (including dynamic inits) completed, and
`window.__NF_SCENARIO_ID__` with the definition-folder name. The
capture step (Task 2) awaits the promise before reading anything.

**Scenario catalog** (stable IDs; expected registry shape inline):

- `clean-skip` — two participants bundle different conflict-lib
  versions with compatible ranges; the loser's row keeps
  `action: 'skip'` with its full participant list intact.
- `strict-split` — one losing tag with mixed participants: non-strict
  participants stay in a `skip` row, strict objectors move to a
  `scope` row of the same tag (orchestrator `apply-winner.ts:94-107`).
- `scope-isolation` — a strict objector isolated in a `scope` row; its
  copy is mapped only inside its own import-map scope.
- `self-fill` — the losing participant declares a secondary entry
  point the winner's copy does not cover (removed on the winner via
  `skip` in its federation config), with
  `profile.scopeUncoveredEntrypoints` off — the import map self-fills
  the uncovered entry from the loser's own copy
  (`generate-import-map.ts selfFillUncovered`).
- `strict-scope` — a share scope named `strict` in which every exact
  version gets `action: 'share'` by design
  (`process-remote-entries.ts:97`); multiple share rows here are NOT a
  conflict.
- `scoped` — a participant shares a package with `singleton: false`,
  producing true `ScopedVersion` rows in `scoped-externals` (a section
  no live capture has ever populated).
- `non-dense` — one remote built without `denseChunking`: its chunks
  appear as pseudo-shared externals `@nf-internal/chunk-*` with
  version `0.0.0` and `singleton: false`, routed into
  `scoped-externals` (`native-federation-core
  src/lib/core/build/bundle-shared.ts:390-413`). Together with
  `scoped` this gives both a true scoped package AND pseudo-chunk
  entries — the later reclassification rule needs both to exist.
- `dynamic-init-native` / `dynamic-init-shim` — at least one
  `initRemoteEntry` after the initial init, in default config (native
  `importmap` tags) and in shim mode (`useShimImportMap`,
  `importmap-shim` tags + `importShim` present). Dynamic inits append
  one map tag each, so the DOM ends with n+1 tags
  (`replace-in-dom.ts:8-20`).
- `dynamic-override` (optional) — a dynamic init that overrides an
  already-initialized remote: evicted copies mark affected externals
  `dirty: true` in committed state (`store-remote-entry.ts:35-44`).

### Acceptance

- **T1-AC-01** — Given a fresh checkout of the playground repo, when
  `run-scenario.mjs <id>` runs for each catalog ID, then the scenario
  builds and serves locally without manual intervention and the served
  page resolves `window.__NF_SCENARIO_READY__`.
- **T1-AC-02** — Scenario definitions are self-contained: switching
  scenarios requires no manual edits, and re-running a previously run
  ID reproduces its registry shapes (no cross-scenario leftovers).
- **T1-AC-03** — `clean-skip` and `strict-split` produce the expected
  row shapes in `__NATIVE_FEDERATION__['shared-externals']`: a `skip`
  row with the full participant list, and a losing tag split into
  `skip` + `scope` rows of the same tag (console inspection is
  acceptable at task close; Task 2 re-verifies durably).
- **T1-AC-04** — `scoped` populates `scoped-externals` with a true
  package; `non-dense` adds `@nf-internal/chunk-*` entries there.
- **T1-AC-05** — Both `dynamic-init-*` variants leave n+1 import-map
  tags of the mode's tag type in the DOM after ready.
- **T1-AC-06** — `self-fill` maps the loser's uncovered entry point
  from the loser's own copy; if the `exports`-subpath route fails,
  either the Angular-drift fallback is implemented or the task closes
  BLOCKED with documented findings.

### Key Locations

- `/home/lutz/projects/nf/playground/` — lab app (separate git repo);
  new `scenarios/<id>/` definition folders and `run-scenario.mjs`.
- `/home/lutz/projects/nf/orchestrator/` (pinned `8e5e0b3`) and
  `/home/lutz/projects/nf/native-federation-core/` (pinned `5e93131`)
  — read-only reference for expected behavior.

### Key Discoveries

- `strict.*` and `profile.*` are `initFederation` options, not build
  options; manifest contents and dynamic inits are runtime choices too.
  Everything a participant declares is baked into its build.
- Election priority: host version > `profile.latestSharedExternal` >
  least extra downloads with tear-count tiebreak
  (`determine-shared-externals.ts:126-184`). Scenarios that need a
  specific winner must arrange it via these levers (e.g. host declares
  the package to win; host stays neutral to let remotes decide).
- Under `strict.strictExternalCompatibility` a strict conflict throws
  and nothing is committed (`apply-winner.ts:73-79`) — not a capturable
  committed state, deliberately not in the catalog.
- Version rows are sorted newest-first at every commit
  (`store-remote-entry.ts:199-207`).
- Serial-runner model is a deliberate deviation from spec §7's
  "one deployment" catalog; the spec's motivation (stable IDs,
  regenerable corpus) is preserved via checked-in definitions + runner.

## Task 2: Lossless lab capture probe, raw scenario corpus, and shape-validation report

Depends on: Task 1.

### Instructions

Build a **dedicated lab capture probe** (new checked-in file, e.g.
`scripts/lab-capture-dump.js` in this repo), capture every catalog
scenario, and write the shape-validation report that round 2 of
planning consumes. The product probes stay untouched — extending them
IS the later collector-delta task and must wait for validated shapes.

The capture workflow as a whole is a deliberate **reimplementation of
the research repo's proven flow**
(`/home/lutz/nf-insghts/native-federation-devtools/`): MCP-driven
in-page eval, channel envelope, run manifest with per-file sha256,
corpus validation script. Everything around the probe is reused or
adapted from there; the one piece replaced is the projection core —
lossless clone instead of allowlist projection, because the allowlist
is exactly what made the original corpus unusable for shape
validation. When a convention question comes up (envelope field,
manifest layout, validation behavior), follow the research corpus
exemplar rather than inventing a variant.

**Probe behavior** (single snippet; the product's passive/shim split is
a passivity layering the lab does not need):

1. Await `window.__NF_SCENARIO_READY__`.
2. Clone the **entire** registry namespace global
   (`globalThis.__NATIVE_FEDERATION__`, the default `storageNamespace`)
   losslessly via JSON round-trip over all own keys — not just the four
   known repositories, so unexpected sections of future orchestrator
   versions stay visible. No allowlist, no string caps, no
   descriptor-level defensive reads: this measures our own lab app,
   not a hostile page.
3. Collect ALL `importmap` and `importmap-shim` script tags in document
   order with type + raw text — reuse the inventory block from
   `projects/collector/src/lib/passive-probe.ts:279-307` near-verbatim.
4. Where `importShim` is present, call `importShim.getImportMap()` and
   copy `imports`/`scopes`/`integrity` including integrity hash values
   — reuse the logic of
   `projects/collector/src/lib/shim-map-probe.ts` (which already keeps
   hash values; only the host-side mapper drops them, and the mapper is
   bypassed here).
5. Return an envelope: `schemaVersion: "lab-lossless-capture/1"`,
   defined as a structurally compatible sibling of the research
   corpus's `frankenstein-runtime-capture/1` — same top-level blocks
   (`page`, `collector`, `channels` with per-channel
   `availability`/`observedAt`/`data`), with
   `collector.sanitization: "lossless"` and an added `scenario` block
   (`scenarioId` from `window.__NF_SCENARIO_ID__`, orchestrator commit
   `8e5e0b3`). Keeping the block structure means `derive-fixture.mjs`
   and its channel-state logic port to the new corpus with minimal
   adaptation in round 2 instead of a rewrite.

**Capture execution.** Per scenario: run the Task-1 runner, open the
served page via the session's browser MCP, evaluate the checked-in
snippet in the page, receive the JSON, and write it to
`captures/<scenario>/<runstamp>.json`. Update `captures/README.md`
provenance (lab-data-only policy applies; SRI hashes may stay). The
snippet must remain usable unchanged from a future headless script.

**Run manifest.** Alongside the captures, write one corpus run
manifest following the research-corpus pattern
(`/home/lutz/nf-insghts/native-federation-devtools/captures/raw/frankenstein/20260724T134007Z/manifest.json`):
schema id, run id, playground + orchestrator commits, collector kind
(`browser-mcp`), sanitization (`lossless`), serving mode, and a
sha256 per capture file. This is what makes XC-01 checkable. Adapt
the research repo's `scripts/validate-frankenstein-corpus.mjs` into
`scripts/validate-lab-corpus.mjs` (hashes, schema id, expected
scenario set) instead of writing a checker from scratch.

**Shape-validation report** at `docs/work/v2/shape-validation.md`: one
row per source-derived assumption, each with verdict **confirmed** /
**deviates** (observed shape + capture file cite) / **not exercised**:

1. `SharedVersion` row model: `{ tag, host, action, remotes }` with
   participant fields `requiredVersion`, `strictVersion`, `bundle`,
   `entries`, `servedBy`, `cached`.
2. One row per `(tag, action)`; the losing declaration survives with
   its full participant list.
3. Strict split: `skip` + `scope` rows of the same tag.
4. `ScopedVersion` shape `{ tag, bundle?, entries }` — the section the
   current collector schema models wrongly.
5. `shared-chunks` written per processed remote regardless of
   negotiation outcome; bundle mapping winner-only;
   `mapping-or-exposed` registered unconditionally per remote.
6. Version rows sorted newest-first.
7. `dirty: true` in committed state after a dynamic override
   (if `dynamic-override` was built).
8. n+1 map tags after dynamic inits; document-order tag merge vs
   `importShim.getImportMap()` — pin the merge rule the future store
   must implement (open question H).
9. Provider derivation under same-origin path-prefix scopes: check
   whether most-specific-prefix matching yields a unique winner for
   every mapped file in the corpus (open question G).
10. Self-fill entries present in the import map from the loser's copy.
11. `entries`/`bundle` present with dense externals; absent in
    `non-dense` (attribution genuinely lost there).

The report ends with a short "consequences for round 2" section:
which planned assumptions of the collector delta / store hold, which
need adjustment.

### Acceptance

- **T2-AC-01** — One capture per catalog scenario exists under
  `captures/<scenario>/`, stamped with scenario ID and orchestrator
  commit, produced by runner + checked-in snippet only.
- **T2-AC-02** — Losslessness: captures contain fields the product
  allowlist drops (e.g. `bundle`, `entries`, `servedBy`, per-remote
  `integrity` where the scenario produces them), and for at least one
  scenario the captured namespace equals an in-page
  `JSON.stringify` of the global.
- **T2-AC-03** — The privacy guard (`guards/privacy-scan.spec.ts`)
  passes over the new capture files.
- **T2-AC-04** — Every assumption row 1–11 carries a verdict;
  every "deviates" cites capture file + JSON path.
- **T2-AC-05** — Open question H is answered: the report compares the
  document-order merge of DOM tags against the shim's effective map
  for `dynamic-init-shim` and states the merge rule as implementable
  pseudocode.

### Key Locations

- `scripts/lab-capture-dump.js` (new), `captures/<scenario>/`,
  `captures/README.md`, `guards/privacy-scan.spec.ts`,
  `docs/work/v2/shape-validation.md`.
- Reuse sources: `projects/collector/src/lib/passive-probe.ts:279-307`
  (tag inventory), `projects/collector/src/lib/shim-map-probe.ts`
  (shim read logic).
- Read-only reference (private research repo,
  `/home/lutz/nf-insghts/native-federation-devtools/`): run-manifest
  exemplar under `captures/raw/frankenstein/20260724T134007Z/`,
  corpus-check pattern `scripts/validate-frankenstein-corpus.mjs`,
  capture-flow notes `apps/devtools-probe/README.md`.

### Key Discoveries

- The existing frankenstein capture was produced with allowlist
  projection (`allowlist-projection-v1`) — it is NOT a lossless
  precedent; the whole point of this task is to avoid repeating that.
- The product passive probe projects in-page through a hardcoded
  old-generation schema (`passive-probe.ts:140-177`): no `bundle`,
  `entries`, `servedBy`, `pool`, no per-remote `integrity`, and
  `scoped-externals` forced through the shared schema. Its
  `maxTotalEntries: 512` cap is a global counter and could silently
  truncate chunk-heavy scenarios. Do not use it for ground truth.
- `derive-fixture.mjs` consumes `frankenstein-runtime-capture/1`
  envelopes; adapting fixture derivation to
  `lab-lossless-capture/1` belongs to a later (round-2) task, not this
  one.
- The registry global is the *default* storage namespace; the lab app
  uses the default, so an absent global means a broken scenario, not a
  renamed namespace.
- Precedent: the frankenstein corpus was itself driven via a Chrome
  DevTools MCP session (`collector.kind: "chrome-devtools-mcp"` in its
  run manifest) — the MCP-eval capture flow chosen here repeats a
  proven workflow, minus the allowlist. Its `artifacts/` directory
  (fetched remote-entry bodies) is claims-layer material, deferred to
  V3 — do not replicate it in this task.
- The research collector's reference schema
  (`packages/collector/src/runtime-schema.js` in the research repo) is
  richer than the V1 port — it has per-remote `integrity` and provider
  `bundle` — but still lacks `entries`, `servedBy`, and `pool`, and as
  an allowlist it drops unknown fields silently. Even the richest
  existing probe cannot serve as ground truth; only the projection
  core is replaced, everything around it is reused.

## Task 3: Lossless frankenstein re-capture and shape-validation extension

Depends on: Task 2 (reuses its dump snippet, run-manifest pattern, and
corpus validator).

### Instructions

Goal: close the three evidence gaps the lab corpus cannot cover — they
need a *real* federation deployment, not a fixture — before the
collector schema is fixed in the next task: (I) populated
`shared-chunks` bundle lists and the winner-only bundle mapping, (J)
`servedBy`/`pool` presence under real Angular sharing, (K) real
secondary entry points / multi-key `entries` maps. Rationale: every
`mapping-or-exposed` list in the lab corpus is empty, and
`servedBy`/`pool` never appeared under the lab's minimal sharing; the
only populated chunk evidence to date is allowlist-projected and
unusable as ground truth.

Target: the frankenstein meeting-room lab app, publicly served at
`https://lutzleonhardt.de/frankenstein-meeting-room/` (Lutz's own
deployment, listed on native-federation.com/resources). The deployed
orchestrator version is not pinned by this repo — determine it as far
as observable (registry contents, asset names) and record best-known
provenance in the manifest; do not assume `8e5e0b3`.

Capture flow — reuse, not rebuild:

- Evaluate the checked-in `scripts/lab-capture-dump.js` in the live
  page via the session's chrome-devtools MCP (`evaluate_script` with
  `filePath` writes large results truncation-free).
- The snippet awaits `window.__NF_SCENARIO_READY__`, which the live
  app does not define: make the readiness await conditional (fall back
  to a settled-page condition) without changing lab-scenario behavior;
  the envelope's `scenario` block records
  `scenarioId: "frankenstein-live"` plus a phase label.
- Capture in phases following the research-corpus exemplar
  (`/home/lutz/nf-insghts/native-federation-devtools/captures/raw/frankenstein/20260724T134007Z/`):
  at minimum the initial post-init state; a second phase after
  triggering any dynamic `initRemoteEntry` the app performs
  (observable as appended import-map tags). If the app performs none,
  one phase suffices — say so in the report.
- Write to `captures/frankenstein-live/<runstamp>.json` (envelope
  `lab-lossless-capture/1`), extend the run manifest (sha256 per file,
  collector kind `browser-mcp`, sanitization `lossless`, capture URL +
  date), update `captures/README.md` provenance (lab-data-only policy;
  own app; SRI hashes may stay), and extend
  `scripts/validate-lab-corpus.mjs` so the new captures are hash- and
  structure-checked. Live captures are not regenerable from checkouts —
  mark them deployment-dependent in the manifest (XC-01 is scoped to
  lab scenarios).

Report: extend `docs/work/v2/shape-validation.md` with rows 12–16,
same verdict scheme (confirmed / deviates with cite / not exercised):

12. Populated `shared-chunks` value shape (remote → bundle name → file
    list) and winner-only bundle mapping: losers' chunks present in
    the registry but absent from the effective map;
    `mapping-or-exposed` contents vs. exposes and lazy chunks.
13. `servedBy`/`pool` presence on participants under real sharing.
14. Multi-key `entries` maps and secondary entry points of real
    packages (e.g. `@angular/common/http`) — own-external pattern vs.
    `selfFillUncovered`.
15. Per-remote `integrity` at scale; effective-map integrity keys.
16. Provider derivation uniqueness with the real remote set (bounds of
    the closed open question G).

Update the report's consequences section: each planned collector-delta
decision (drop `servedBy`/`pool`, optional `bundle`, own scoped
schema, lazy keys, `strict`-only scopes) is confirmed or amended —
this is the direct input for planning Task 4.

### Acceptance

- **T3-AC-01** — Captures exist under `captures/frankenstein-live/`
  (one per observed phase), envelope `lab-lossless-capture/1` with a
  `frankenstein-live` scenario block and best-known deployment
  provenance in the manifest; `scripts/validate-lab-corpus.mjs` passes
  over the extended corpus.
- **T3-AC-02** — Losslessness: for at least one phase the captured
  namespace equals an in-page `JSON.stringify` of the global (same
  evidence rule as the lab corpus).
- **T3-AC-03** — `guards/privacy-scan.spec.ts` passes over the new
  capture files.
- **T3-AC-04** — Shape-validation rows 12–16 each carry a verdict with
  capture cite (or an explicit "not exercised" with the reason); the
  winner-only-mapping verdict states whether losing copies' chunks
  appear unmapped.
- **T3-AC-05** — The consequences section states, for each planned
  collector-schema decision, "holds" or the amended shape.

### Key Locations

- `scripts/lab-capture-dump.js` (conditional readiness),
  `captures/frankenstein-live/`, `captures/manifest.json`,
  `captures/README.md`, `scripts/validate-lab-corpus.mjs`,
  `guards/privacy-scan.spec.ts`, `docs/work/v2/shape-validation.md`.
- Read-only exemplar (private research repo): phase captures under
  `/home/lutz/nf-insghts/native-federation-devtools/captures/raw/frankenstein/20260724T134007Z/`
  (phase pattern, manifest fields) — allowlist-projected, superseded
  as evidence by this task.

### Key Discoveries

- The lab corpus validated the registry row shapes with the same
  orchestrator generation; this task expects volume, not new
  mechanisms — the primary unknowns are exactly I–K, but any
  registry-shape surprise found here amends the schema before Task 4
  builds on it.
- chrome-devtools MCP shares one Chromium profile between clients —
  only one client at a time; if the browser is not running, it must be
  started with the manual `webmcp-profile` command (port 9222).
- The deployed app is live and may be redeployed at any time; captures
  are point-in-time evidence, made explicit by manifest provenance
  (URL, date, sha256).
- This supersedes the former roadmap item "real-app corpus refresh":
  importing the research repo's allowlist-projected phase captures is
  off the table; the research repo stays a read-only archive (its
  `devtools-probe` extension is V3 claims/transport reference
  material).

## Task 4: Collector delta — corpus-validated schemas in probe, runtime-schema, and SnapshotV1

### Instructions

Extend the product collector to the corpus-validated registry shapes.
Two projection layers change **in lockstep** (deliberate hand-sync
discipline — probe string + host schema, no codegen): the in-page
passive probe's inline projection and the host-side re-projection in
`runtime-schema.ts` (everything crossing the eval boundary is
attacker-shaped and re-projected; keep that model).

Validated target shapes (ground truth: `captures/<scenario>/*.json`,
`captures/frankenstein-live/*.json`, verdicts in
`docs/work/v2/shape-validation.md`):

- `shared-externals`: `scope → pkg → { dirty, versions[] }`; version
  row `{ tag, host, action, remotes[] }`; participant
  `{ name, requiredVersion, strictVersion, cached, bundle?,
  entries? | file? }`. `entries` is a map (entry name → file name),
  `file` a single relative-URL string. **Exactly one of the two is
  present** — the spelling discriminates the orchestrator generation
  (`entries` = dev `8e5e0b3`, `file` = released v4). A participant
  carrying both or neither is recorded as a collection error, never
  silently normalized. `servedBy`/`pool` stay out of the schema
  (absent in both observed generations — final decision).
- `scoped-externals`: **own schema** `remote → pkg →
  { tag, bundle?, entries }` — a single object per package, no
  `versions` array, no `dirty`, no negotiation fields. (The V1 schema
  forcing this repository through the shared schema is corpus-proven
  wrong.)
- `remotes`: `{ scopeUrl, exposes[], integrity? }` — `integrity` is a
  map file name → SRI hash; hash **values are kept** and validated
  with the existing SRI validator.
- `shared-chunks`: `remote → bundleName → fileName[]`.
- All four repository keys are lazy: an absent key and a
  present-but-`{}` key are the same zero-entry observation. Any share
  scope set must project without assuming `__GLOBAL__` exists
  (`strict` can be the only scope).

`SnapshotV1` grows **additively** (no fork): the new fields, the
corrected scoped shape, an explicit `schemaVersion` stamp on exports,
a normalized participant **served-files** representation that both
spellings feed, and a surfaced generation discriminator — derived per
participant, aggregated per snapshot (v4 / dev / mixed), so
mixed-generation storage stays representable. Check the spec's
export-compat assumption (no consumer of exported snapshots depends
on the old scoped-externals schema — that section was empty in every
V1 live capture) against the actual snapshot consumers and record the
outcome in the task log.

Guardrails: the probe's global entry cap (`maxTotalEntries: 512`, a
single counter across repositories) may never truncate silently —
chunk-heavy captures must surface truncation as a collection error or
explicit flag. Privacy: `entries` values and `file` are file names
and fall under the URL sanitization rules (relative-URL branch strips
query/fragment); SRI hash values are collected by policy.

Tests: extend the collector specs with corpus-shaped vectors from
`captures/` — at least one dev-generation registry (e.g. `clean-skip`
for conflicts, `scoped` + `non-dense` for the scoped schema,
`strict-scope` for scope laziness) and the released-v4 registry
(`frankenstein-live/20260811T115536Z-01-initial.json`).

### Acceptance

- **T4-AC-01** — A dev-generation registry (`entries` spelling)
  projects with participants keeping `{ name, requiredVersion,
  strictVersion, cached, bundle?, entries }` and the
  `{ dirty, versions }` package wrapper intact.
- **T4-AC-02** — The released-v4 registry (`file` spelling,
  frankenstein-live shapes) projects with `file` accepted; both
  spellings produce the normalized served-files representation and
  the snapshot surfaces the generation discriminator.
- **T4-AC-03** — A participant carrying both spellings or neither
  yields a recorded collection error, not silent output.
- **T4-AC-04** — `scoped-externals` projects through its own
  single-object schema; an absent repository key and `{}` produce the
  same zero-entry observation; a `strict`-only scope set projects
  without `__GLOBAL__` assumptions.
- **T4-AC-05** — Per-remote `integrity` is collected with SRI hash
  values (invalid SRI rejected); `shared-chunks` collects
  `remote → bundleName → fileName[]`.
- **T4-AC-06** — Entry-cap truncation is recorded loudly (collection
  error/flag), verified with a synthetic over-cap page.
- **T4-AC-07** — Exported snapshots carry the explicit
  `schemaVersion`; the export-compat check outcome is documented.
- **T4-AC-08** — `entries` values and `file` pass URL sanitization
  (query/fragment stripped) in the collector privacy specs.
- Contributes to **XC-02**.

### Key Locations

- `projects/collector/src/lib/passive-probe.ts` (in-page projection),
  `runtime-schema.ts` (host re-projection), `snapshot-mapper.ts`,
  `privacy.ts`, `safe.ts`; specs: `snapshot-mapper.spec.ts`,
  `probe-source.spec.ts`, `edge-cases.spec.ts`.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts`; export path
  `projects/devtools-ui/src/app/shared/snapshot-export*`.
- Shape ground truth: `captures/`, `docs/work/v2/shape-validation.md`.

### Key Discoveries

- The V1 probe projects in-page through a hardcoded old-generation
  schema (no `bundle`/`entries`, no per-remote `integrity`,
  scoped-externals forced through the shared schema) — it is being
  replaced, not extended field-by-field.
- The mapper distrusts everything from the eval boundary; new fields
  go through the same `safe.ts` defensive reads + sanitization.
- The V1 mapper's `OPTIONAL_REPOSITORY_KEYS` concept generalizes to
  every repository key (all lazy, absent == `{}`).
- Multi-key `entries` maps were observed nowhere — the schema must
  allow them (map type), nothing may require them.

## Task 5: Fixture derivation from the lossless corpus

Depends on: Task 4.

### Instructions

Adapt `scripts/derive-fixture.mjs` — which currently consumes
`frankenstein-runtime-capture/1` envelopes — to the
`lab-lossless-capture/1` envelope (same top-level channel blocks
`page`/`collector`/`channels`; added `scenario` block with
`scenarioId`, and for live captures `readySource`/`phase` plus
`orchestratorCommit: null`). The channel-state derivation logic ports
with minimal adaptation — the envelope was designed as a structurally
compatible sibling for exactly this port.

Derive SnapshotV1 fixture modules:

- one per lab scenario (10) from `captures/<scenario>/<runstamp>.json`
  (dev generation, `entries` spelling),
- one `frankenstein-live` fixture from phase
  `20260811T115536Z-01-initial.json` (released v4, `file` spelling).
  The two phases are validator-enforced byte-identical — one fixture
  suffices; say so in the module docstring.

Fixtures land in `projects/devtools-bridge/src/lib/fixtures/`,
registered in `fixtures/index.ts` and the fixture snapshot provider
alongside the existing synthetic fixtures. Each module records its
provenance (capture file, run id, generation; for live: capture URL +
date, deployment-dependent).

The old allowlist-projected `frankenstein-production.fixture.ts` is
superseded as evidence: retire it in favor of the new
frankenstein-live fixture and migrate its consumers. If a consumer
needs a shape only the old fixture exercises, document that in the
task log instead of silently keeping both.

Projection follows the Task-4 SnapshotV1 (schemaVersion, served-files
normalization, generation discriminator); URL sanitization rules
unchanged (origin + path only); SRI hash handling follows the Task-4
decision (per-remote `integrity` keeps validated hash values; the
privacy scan allows SRI values only inside `integrity`-keyed maps).
The script rejects unknown envelope schemaVersions loudly, and
re-running it is deterministic (byte-identical output).

Derivation mechanism: prefer running the REAL collector pipeline
(probe eval + `mapProbeResult` over a page seeded from the capture
namespace — the pattern of `corpus-vectors.spec.ts` with
`testing/lab-corpus.ts`) over hand-mirroring the projection a third
time in the script. Task 4 left two parallel implementations (mapper +
`derive-fixture.mjs`); a corpus-driven deriver that goes through the
mapper makes fixture == pipeline output true by construction. If the
hand-written projection is kept instead, justify it in the task log.

Corpus housekeeping (maintainer legibility, folds the review of
2026-08-11 into this task):

- Retire the old `frankenstein-runtime-capture/1` evidence path end to
  end: the capture `captures/frankenstein/production-04-remote-interaction.json`,
  the old-envelope branch of `derive-fixture.mjs`, and the seed of
  `testing/fixture-pages.ts` (`buildFrankensteinPage` reads the old
  capture) either migrate to the lossless corpus or get an explicit
  legacy marker naming their remaining consumers. No silently
  coexisting envelope generations.
- Write a short maintainer map into `captures/README.md` (or a
  dedicated doc it links): (a) a versioning table — every stamp in the
  repo (`passive-probe/2`, `shim-map-probe/1`, `nf-devtools-collector/2`,
  `SnapshotV1.schemaVersion: 1`, `lab-lossless-capture/1`,
  `lab-lossless-corpus/1`, orchestrator generations dev `8e5e0b3` /
  released v4) with its meaning (wire contract vs producer version vs
  envelope id vs observed third-party generation) and when to bump;
  (b) a data-flow overview: playground → lab probe → `captures/` →
  manifest builder → corpus validator → fixture deriver → fixtures →
  fixture provider/app, naming which script reads which envelope.

### Acceptance

- **T5-AC-01** — One fixture module per lab scenario exists, derived
  by script; re-running the script reproduces byte-identical output.
- **T5-AC-02** — The frankenstein-live fixture is derived from phase
  `01-initial`, carries released-generation (`file`-spelling)
  participants, and records deployment provenance (URL, date,
  generation).
- **T5-AC-03** — All new fixtures load through the fixture snapshot
  provider; the superseded `frankenstein-production` fixture is
  removed or its remaining consumers are documented.
- **T5-AC-04** — The script fails loudly on an unknown envelope
  `schemaVersion`.
- **T5-AC-05** — Generated fixtures contain no query/fragment/userinfo
  in any URL (spec or guard evidence).
- **T5-AC-06** — The maintainer map exists: versioning table covering
  every stamp listed in the instructions, plus the script/envelope
  data-flow overview.
- **T5-AC-07** — The old `frankenstein-runtime-capture/1` path is
  retired or every remaining consumer is explicitly legacy-marked and
  named in the doc; no tool reads it undocumented.
- Contributes to **XC-02**.

### Key Locations

- `scripts/derive-fixture.mjs`;
  `projects/devtools-bridge/src/lib/fixtures/` (+ `index.ts`),
  `projects/devtools-bridge/src/lib/fixture-snapshot-provider.ts`.
- Sources: `captures/<scenario>/`, `captures/frankenstein-live/`,
  `captures/manifest.json`.
- Reuse/housekeeping surfaces:
  `projects/collector/src/testing/lab-corpus.ts` (corpus loader),
  `projects/collector/src/testing/fixture-pages.ts` (old-capture
  seed), `captures/README.md`,
  `captures/frankenstein/production-04-remote-interaction.json`.

### Key Discoveries

- Live captures have no newest-wins rule: every file under
  `captures/frankenstein-live/` is a corpus member; superseded runs
  are deleted, not shadowed.
- The envelope's `scenario` block is the discriminator between lab
  and live captures (`readySource`/`phase` exist only in live/fallback
  mode).
- The privacy guard auto-covers new files under `captures/`
  recursively; generated fixtures live outside that tree and need
  their own evidence (AC-05). Its SRI rule is structural since Task 4:
  hash values pass only inside `integrity`-keyed maps.
- The lossless envelope stores the registry under
  `channels.nativeFederationGlobals.data.namespace` — NOT under the
  old envelope's `data.repositories[key].value` shape; the port is a
  path change plus the `scenario` block.
- Task 4 shipped the corpus loader
  (`testing/lab-corpus.ts`: newest-runstamp rule, explicit phase file
  for live) and proved the capture→page→probe→mapper path in
  `corpus-vectors.spec.ts` — the natural deriver skeleton.
- `strict-scope`'s registry carries an empty `__GLOBAL__` next to
  `strict`; derived fixtures must keep it (honest observation, do not
  clean up).
- The probe's 512-entry global cap truncates chunk-heavy registries
  loudly; all corpus captures project error-free under it — a derived
  fixture with collection errors indicates a deriver bug, not corpus
  drift.

## Task 6: Normalized store — entities and ingest

Depends on: Task 5.

### Instructions

Build the V2 normalized store: one ingest of a SnapshotV1 produces
the model every V2 view will project. Suggested home: a new store
module under `projects/devtools-ui/src/app/shared/` beside the
existing V1 `snapshot-store.ts` (which keeps serving the V1 views
until round 4 replaces them).

**Core relation** (the edge list): one row per *(share scope,
package, version tag, action, participant)* carrying
`requiredVersion`, `strictVersion`, `bundle?`, `cached`, the
participant's normalized served files (already normalized by the
Task-4 mapper — the store never sees the `entries`/`file` spelling),
and the joined effective resolution (target URL + integrity
presence). Secondary entities: remotes (scopeUrl, exposes,
integrity), chunk groups (owning remote, bundle name or
pseudo-external origin, files, mapped?), import-map entries
(specifier, target, scope, integrity).

**Effective map**: implement `mergeDocumentMaps` as the map ground
truth, exactly this pinned rule (corpus-verified for imports, scopes,
and integrity):

```
mergeDocumentMaps(tags, pageBaseUrl):
  eff = { imports: {}, scopes: {}, integrity: {} }
  for tag in document order, keeping only tags of the active mode's type:
    map = JSON.parse(tag.text)
    for (specifier, target) in map.imports:
      eff.imports[specifier] = resolveUrl(target, pageBaseUrl)   // later tag wins [*]
    for (scopePrefix, scopeImports) in map.scopes:
      for (specifier, target) in scopeImports:
        eff.scopes[scopePrefix][specifier] = resolveUrl(target, pageBaseUrl)
    for (url, hash) in map.integrity:
      eff.integrity[resolveUrl(url, pageBaseUrl)] = hash
  return eff
```

The active mode comes from **observed tag types** (`importmap` =
native, `importmap-shim` = shim; zero tags of the other type is the
corpus norm). In native mode the shim's `getImportMap()` is empty and
must be ignored; in shim mode it serves as a cross-check only. An
empty shim map means "shim uninvolved", never "no map". `[*]` The
later-tag-wins collision branch is adopted from es-module-shims
semantics, not corpus-proven — cover it with a seeded unit test.

**Ingest rules:**

- Chunk reclassification from the **union** of both sources:
  (a) scoped externals whose package name starts `@nf-internal/`
  (dev non-dense) and (b) `shared-chunks` bundle lists
  (`remote → bundleName → fileName[]`; released v4 keeps chunks only
  there). Reclassified entries become chunk groups of the owning
  remote and never count as packages; true scoped packages stay
  scoped externals.
- Sort version rows `(semver tag desc, action)` in the store — the
  registry's semver order is reliable but same-tag tie order is not.
- Absent repository key == `{}` — one zero-entry accessor.
- Expose joining tolerates the literal `/./` infix (live maps join
  naively: `<remoteName>/./<moduleName>`).
- Secondary-entry externals (`pkg/subpath`) stay their own externals
  at ingest — parent linking is a Task-7 derivation.
- Snapshot provenance carried into the store: generation, capture
  timestamp, schemaVersion.

Test data: the Task-5 fixtures (both generations). Seeded unit cases
only for what no capture can show — same-specifier collision across
tags, mixed-generation participants, a snapshot with neither
spelling — each tagged as seeded (proves the store reads a shape, not
that the runtime produces it).

### Acceptance

- **T6-AC-01** — clean-skip fixture: the skip row's participants are
  intact in the edge list; strict-split fixture: the same tag yields
  distinct `skip` and `scope` rows with their own participants.
- **T6-AC-02** — frankenstein-live fixture: 20 packages, one
  participant each; the store-computed merge equals the recorded shim
  map for imports, scopes, AND integrity (absolute-URL keys).
- **T6-AC-03** — dynamic-init-shim fixture: `mergeDocumentMaps` over
  both tags reproduces the recorded `getImportMap()` exactly;
  dynamic-init-native fixture: the merge is computed from tags while
  the empty shim map is ignored.
- **T6-AC-04** — Chunk union: non-dense fixture chunks come from
  scoped-externals pseudo-externals; frankenstein-live chunks from
  `shared-chunks` (host only); the scoped fixture's true package is
  NOT reclassified; chunks never appear in package counts.
- **T6-AC-05** — Version rows sort `(semver desc, action)` regardless
  of input order; absent and `{}` repository keys are equivalent
  (scoped fixture: no shared-externals; live fixture:
  `scoped-externals: {}`).
- **T6-AC-06** — Seeded: same-specifier collision resolves later-tag
  wins; mixed-generation participants ingest per participant; an
  expose with the `/./` infix joins to its map entry.
- Contributes to **XC-02**.

### Key Locations

- New store module under `projects/devtools-ui/src/app/shared/`
  (beside `snapshot-store.ts`); `projects/devtools-bridge/src/lib/`
  types and fixtures as input.

### Key Discoveries

Variation catalog (corpus-closed; spec §3 has the full table) — every
dimension and where it is absorbed:

- Participant spelling `entries` XOR `file` → already normalized by
  the Task-4 mapper; the store consumes served files + generation
  provenance only.
- Zero entries: absent key vs `{}` → one accessor here.
- Chunk placement: scoped-externals pseudo-externals vs shared-chunks
  → union reclassification here.
- Map mode: tag type discriminates; shim map is cross-check only.
- Share scopes: `__GLOBAL__`, `strict`, `strict`-only — no scope
  assumed; strict semantics are Task-7 derivations.
- Registry order: store sorts itself.
- `mapping-or-exposed`: empty in every capture — nothing may depend
  on its contents.
- Expose specifiers: `/./` infix tolerated here.

The strict share scope pins `requiredVersion` to the exact tag at
store time (config ranges lost) — keep the scope name on rows so
Task 7 can flag it.

## Task 7: Store derivations — provider, resolution arrows, chunk attribution, badges, provenance

Depends on: Task 6.

### Instructions

All derived knowledge lives in store derivations, never in views.
Every derived field carries a provenance tag naming the rule that
produced it (detail views may surface it; Diagnostics findings cite
it).

**Provider derivation** — match each effective target URL against the
remotes' `scopeUrl` prefixes; three honest outcomes: *derived*
(exactly one most-specific match; the host `./` wins only as
least-specific fallback when no remote prefix matches beyond the page
base), *ambiguous* (multiple matches without a unique most-specific
winner — e.g. nested remote prefixes), *unattributable* (no scope
matches — CDN/foreign origin). A bare longest-prefix rule must never
let the host claim remote-prefixed files.

**Resolution arrow per participant** — skip participant → the
winner's served file; share participant and scope row → own file.

**Chunk-attribution ladder** (three honest levels; views are gated on
it in round 4):

1. Package level — participant carries `bundle` AND the owning remote
   has a `shared-chunks` bundle list: package → bundle → chunk files.
2. Remote level only — the chunk group exists as `@nf-internal/`
   pseudo-externals (dev non-dense): chunks belong to the remote,
   package attribution is explicitly "not derivable".
3. No chunk evidence — v4 remotes without bundle grouping: explicit
   absence, explained by the capability badge.

The "declared, not mapped" diff for losing copies stays
source-derived (bounded residual — no capture shows it) and must
carry the source-derived tag.

**Secondary-entry parent linking** — a `pkg/subpath` external links
to its parent package when the parent exists in the store;
name-derived and tagged as such. Must handle the real corpus
patterns: scoped (`@angular/common/http` → `@angular/common`),
multi-segment (`@angular/core/primitives/di`), file-shaped
(`@angular/core/event-dispatch-contract.min.js`), unscoped
(`rxjs/operators`); no link when the parent is absent.

**Capability badges** — per remote: dense chunking (`shared-chunks`
entry with bundle lists), SRI (`integrity` present), dense externals
(participants carry `bundle` — multi-key `entries` was observed
nowhere and must not be the marker). Per snapshot: the generation
badge (released v4 / dev / mixed) from the provenance the mapper
recorded.

**Strict-scope semantics** — in the share scope `strict` every exact
version is `share` by design: the conflict indicator (more than one
version row) must exclude that scope. `requiredVersion` there is
pinned to the exact tag at store time — flag such rows so views never
render the value as a declared range.

### Acceptance

- **T7-AC-01** — frankenstein-live fixture: 20/20 providers derived
  uniquely; each target equals `scopeUrl + servedFile`; the host
  never claims whiteboard/mermaid files.
- **T7-AC-02** — Seeded: nested remote prefixes without a unique
  most-specific winner → *ambiguous*; a foreign-origin target →
  *unattributable*.
- **T7-AC-03** — strict-split fixture: skip participant's arrow →
  winner's file, scope participant's arrow → own copy; self-fill
  fixture: the `/extra` external keeps its own share row with arrow →
  own copy AND is parent-linked to its base package.
- **T7-AC-04** — frankenstein-live subpath externals link to their
  parents (`@angular/common/http`, `rxjs/operators`,
  `@angular/core/primitives/di`, the file-shaped subpath), each
  tagged name-derived; a seeded orphan subpath yields no link.
- **T7-AC-05** — Badges: live fixture — host gets dense chunking +
  dense externals + SRI, whiteboard/mermaid SRI only; generation
  badge released v4; lab fixtures report dev.
- **T7-AC-06** — Attribution ladder: a dense fixture yields level-1
  package chunk data; the non-dense chunk group is level-2 with
  package attribution "not derivable"; a v4 remote without bundle
  grouping yields level-3 explicit absence; losing-copy "declared,
  not mapped" values carry the source-derived tag.
- **T7-AC-07** — Conflict indicator: strict-scope fixture (two share
  rows) shows NO conflict; clean-skip (two version rows in
  `__GLOBAL__`) does; strict-scope rows carry the pinned-range flag.
- **T7-AC-08** — Every derived field carries a provenance tag naming
  its rule.
- Contributes to **XC-02**.

### Key Locations

- The Task-6 store module under
  `projects/devtools-ui/src/app/shared/` (derivations layer + specs);
  fixtures from `projects/devtools-bridge/src/lib/fixtures/`.

### Key Discoveries

- Provider derivation is corpus-confirmed unique for every mapped
  file in all captures (longest prefix, host as fallback) — the
  ambiguous/unattributable outcomes exist in no capture and need
  seeded tests.
- The self-fill mechanism is "secondary as own external" (sole-
  declarer share row + top-level map entry) — the source-read
  `selfFillUncovered` participant annotation was observed in neither
  generation and must not be modeled.
- `singleton` exists only in `remoteEntry.json` bodies (V3 claims
  material), never in the runtime registry — section membership
  (shared vs scoped) is the only singleton signal.
- Nothing may depend on observing `dirty: true` passively (transient;
  committed post-override state was clean in the corpus) — if seen,
  render "pending re-election", never corruption.

## Cross-Cutting Acceptance

- **XC-01** — Every checked-in **lab scenario** capture is regenerable
  from the two checkouts alone: `run-scenario.mjs <id>` plus the
  checked-in dump snippet reproduce a semantically identical capture
  (modulo timestamps), with no manual config editing and no
  session-specific state. Live-app captures
  (`captures/frankenstein-live/`, T3) are deployment-dependent by
  nature and exempt; they carry manifest provenance (URL, date,
  sha256) instead. **Touches:** T1, T2, T3.
- **XC-02** — Both orchestrator generations flow end to end: a
  released-v4 capture (`file` spelling) and a dev-generation capture
  (`entries` spelling) each travel collector → SnapshotV1 → fixture →
  store → derivations producing equivalent projections; the
  participant spelling is visible only as generation provenance (and
  its badge) — no generation branch exists past the SnapshotV1
  mapper. **Touches:** T4, T5, T6, T7.

## Roadmap — pending re-plan (Round 4, Tasks 8+)

Not planned yet; re-run /plan when Tasks 4–7 are closed. Numbering
continues at 8. Expected shape (one line each, non-binding):

- Shell V2: tab set with Packages as default, design tokens + theme,
  capture status strip with the tag-type channel mapping (spec
  2.6/4.6).
- Packages tab: tree-table, shared participant→resolution row
  component, capability-gated chunk section (attribution ladder,
  bounded-residual tagging), strict-scope rendering rules.
- Remotes tab: per-remote projection, chunk sections with inline
  explanations, scoped-externals subsection.
- Import Map tab annotations + Diagnostics lint (registry↔map, incl.
  the interpretation caveats) + global search.
