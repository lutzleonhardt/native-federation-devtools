# Native Federation DevTools — V2 Plan, Round 1 (fixture-first)

Spec: docs/specs/native-federation-devtools-v2.md

Branch scope: v2

Scope: capture-first inversion of the V2 work. Round 1 (Tasks 1–2,
done): serial scenario runner in the playground lab app (separate git
repository at `/home/lutz/projects/nf/playground`) plus the lossless
10-scenario capture corpus and the shape-validation report
(`docs/work/v2/shape-validation.md`); the spec was amended in place
with its verdicts. Round 2 (Task 3): a lossless re-capture of the
public frankenstein app closes the evidence gaps the lab corpus cannot
cover (spec §7 I–K) before the collector schema is fixed. Tasks 4+
(collector delta, fixture derivation, store, derivations, shell,
views) stay deliberately NOT detailed — re-planned via /plan after
Task 3's report extension, continuing the numbering at 4 (see the
end-of-plan roadmap).

Deliberate deviation from spec §7 ("one deployment serves a catalog"):
scenarios run serially — self-contained, checked-in definition folders
plus a runner script replace the side-by-side deployment. The spec's
motivation (stable scenario IDs, regenerable regression corpus) is
preserved; cross-scenario coupling of shared remote variants and the
host-variant dimension disappear. Rebuilds are cheap (esbuild).

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

## Cross-Cutting Acceptance

- **XC-01** — Every checked-in **lab scenario** capture is regenerable
  from the two checkouts alone: `run-scenario.mjs <id>` plus the
  checked-in dump snippet reproduce a semantically identical capture
  (modulo timestamps), with no manual config editing and no
  session-specific state. Live-app captures
  (`captures/frankenstein-live/`, T3) are deployment-dependent by
  nature and exempt; they carry manifest provenance (URL, date,
  sha256) instead. **Touches:** T1, T2, T3.

## Roadmap — pending re-plan (Tasks 4+)

Not planned yet; re-run /plan against the amended spec AND the
Task-3-extended `docs/work/v2/shape-validation.md`. Numbering
continues at 4. Expected shape (one line each, non-binding):

- Collector delta: extend probe + `runtime-schema.ts` + `SnapshotV1`
  against the corpus-validated shapes (drop `servedBy`/`pool` if I/J
  confirm, optional `bundle`, own scoped schema, integrity with
  hashes, all keys lazy, `strict`-only scopes); privacy review;
  schemaVersion decision incl. the export-compat assumption check.
- Fixture derivation: `lab-lossless-capture/1` → SnapshotV1 fixture
  modules per scenario, frankenstein-live as a first-class fixture.
- Normalized store: entities + ingest (edge list, chunk
  reclassification sourced from `scoped-externals`, generation
  handling via tier-1 seeded fixtures, pinned `mergeDocumentMaps`,
  store-side `(tag desc, action)` sort).
- Store derivations: provider derivation, resolution arrows incl.
  secondary-entry parent linking, capability badges, provenance tags.
- Round 3+: shell V2 (tab set with Packages default, design tokens,
  theme, capture status strip with the corrected tag-type channel
  mapping), Packages tab + shared participant→resolution row +
  tree-table, Remotes tab, Diagnostics lint + global search +
  import-map attribution.
