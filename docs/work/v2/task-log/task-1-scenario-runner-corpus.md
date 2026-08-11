# Task 1: Scenario runner and self-contained scenario definitions in the lab app

### Task

Built, in the playground lab repo (separate git repository), the serial
scenario runner (`run-scenario.mjs`, incl. `--all` catalog mode) plus all
10 self-contained scenario definitions of the V2 catalog, with a CDP
verification helper — and validated every catalog registry shape against
the live orchestrator 4.6.0, including several ground-truth findings that
correct pre-run hypotheses.

### Status

DONE

### Files Modified

**All task code lives in the playground repo**
(`/home/lutz/projects/nf/playground`, branch `lab/v2-scenarios`,
commit `ee90a21` — 69 files, +1787/−31). This repo receives only this
log (split-repo setup mandated by the plan's Task 1 block).

Playground, new:

- `run-scenario.mjs` (new) — serial runner: loads/validates
  `scenarios/<id>/scenario.json`; applies federation configs for ALL four
  projects (scenario or `_defaults`); syncs the build-baked import-map
  mode (`esmsInitOptions.shimMode` in `angular.json`); generates
  `projects/host/src/main.ts` (manifest, init options, dynamic inits,
  readiness contract `__NF_SCENARIO_READY__`/`__NF_SCENARIO_ID__`, and —
  when the host participates — a lazily imported
  `scenario-host-info.ts`); cleans `.angular/cache`,
  `node_modules/.cache`, `dist`; swaps
  `node_modules/@nf-lab/conflict-lib` to the participant's declared
  version before each serial `ng build`; assembles a single-origin serve
  tree (host at `/`, remotes at `/<name>/`) and serves on :4300 with
  no-store headers. `--all` iterates the catalog via child invocations
  (identical code path), verifies each id, `--out-dir` stores dumps.
- `verify-scenario.mjs` (new) — headless-Chromium CDP inspection: awaits
  the ready promise (dumps even on rejection), then dumps the full
  `__NATIVE_FEDERATION__` registry, import-map script tags (incl.
  `integrity` blocks), rendered participant/host lines. Deliberately NOT
  the Task-2 lossless probe.
- `scenarios/README.md` (new) — usage, definition-folder layout,
  two-level model incl. the build-baked shim-mode caveat, conflict-lever
  mechanics (baseline + transient swap), full catalog table with
  validated shapes.
- `scenarios/_defaults/*.federation.config.mjs` (new) — neutral configs
  applied to non-participants every run (no cross-scenario leftovers).
- `scenarios/<id>/` (new, 10 folders) — `clean-skip`, `strict-split`,
  `scope-isolation`, `strict-scope`, `scoped`, `non-dense`,
  `dynamic-init-native`, `dynamic-init-shim` (with `integrityHashes`),
  `dynamic-override`, `self-fill`; each `scenario.json` documents the
  VALIDATED expected shapes (updated to observed reality where the
  hypothesis was wrong).
- `packages/conflict-lib/{v1,v2}/` (new) — `@nf-lab/conflict-lib`
  1.0.0/2.0.0: framework-free version-lever package (`CONFLICT_LIB_VERSION`,
  `./extra` exports subpath with `EXTRA_ENTRY_MARKER`, `.d.mts` types).
- `angular/simple/projects/mfe{1,2,3}/src/scenario-element.ts` (new) —
  vanilla custom elements `scenario-<name>` rendering the runtime
  conflict-lib version (real import, defeats `ignoreUnusedDeps`).
- `angular/simple/projects/mfe1/src/scenario-element-selffill.ts` (new) —
  imports both entry points; renders the self-fill split.
- `angular/simple/projects/mfe3/src/scenario-element-ng.{ts,html}` (new) —
  Angular-based element (createApplication + createCustomElement,
  zoneless, separate template file) for scenarios needing real Angular
  consumption (non-dense); exports its registration promise as `default`.

Playground, modified:

- `angular/simple/angular.json` — `cacheExternalArtifacts: false` for all
  targets (artifact cache is a determinism risk under the version swap);
  formatting normalized to the runner's serializer (tabs) so runner
  rewrites diff minimally.
- `angular/simple/package.json` + `pnpm-lock.yaml` —
  `"@nf-lab/conflict-lib": "file:../../packages/conflict-lib/v1"` as
  visible baseline (user-requested explicitness); the runner overwrites
  the `node_modules` copy per participant build.
- `angular/simple/projects/*/tsconfig.app.json` +
  `tsconfig.federation.json` — scenario-element files added to `files`
  (both compilations: esbuild app AND federation exposes) so they are
  type-checked.
- `angular/simple/.gitignore` — ignores the generated-transient
  `projects/host/src/scenario-host-info.ts`.

Checked-in baseline note: before committing, the scenario-applied state
was reverted (four `federation.config.mjs` + host `main.ts` via
`git checkout`, runner-managed `esmsInitOptions` key removed) — a fresh
checkout behaves like the original playground until a scenario is
applied.

This repo (native-federation-devtools):

- `docs/work/v2/task-log/task-1-scenario-runner-corpus.md` (new) — this log.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 1 block
- Prior-round logs (`docs/work/passive-mvp/task-log/`): task-8 (CDP e2e
  pattern, conflict-scenario micro-spike mandate), task-2 (corpus/fixture
  provenance policy), task-9 (env gotchas: sandbox-disabled dev servers)
- Orchestrator `8e5e0b3` (read-only reference):
  `apply-winner.ts` (skip/scope split, host precedence, entrypoint
  coverage policy), `store-remote-entry.ts` (singleton routing,
  shareScope pinning, eviction), `process-remote-entries.ts`,
  `shared-externals.repository.ts` (scopeType, dirty-on-evict),
  `replace-in-dom.ts` (append vs override), `use-default.ts` /
  `use-import-shim.ts`, `mode.contract.ts` / `config.contract.ts`,
  `global-this.storage.ts`, `init-federation.contract.ts`
- native-federation-core `5e93131`: `bundle-shared.ts:375-413`
  (chunk pseudo-externals)
- Installed `@softarc/native-federation` dist: `secondaries.js`
  (exports-scan discovery), `share-utils.js` (`share()` expansion point),
  `with-native-federation.js`, `external-config.contract.d.ts`
- `@angular-architects/native-federation`: `update-index-html.js`
  (esms-options/module-shim injection), builder `schema.json`
- Playground workspace: `angular.json`, host/mfe sources, federation
  configs, `pnpm-workspace.yaml`

### Key Decisions

— session 2026-08-10/11

- **Base workspace `angular/simple`**, not tractor-store and not a fresh
  scaffold (user-confirmed): it is effectively an empty project with the
  valuable wiring already done (federation builder, orchestrator 4.6
  matching the pinned reference, esbuild, pnpm). Tractor-store stays a
  candidate for one *realistic* Task-2 capture.
- **Vanilla custom elements; Angular only where the shape needs it**
  (user-confirmed): negotiation operates on remoteEntry metadata, module
  content is irrelevant — except `non-dense`, whose chunk shapes need
  real shared-Angular bundling (Angular-based element there).
- **conflict-lib as checked-in directories** (v1/v2) instead of npm-pack
  tarballs — same negotiation semantics, diff-able in git; deviation from
  the plan's "file: tarballs" wording. Baseline `file:` entry in
  `package.json` for visibility (user-requested); the version in
  `node_modules` is deliberately transient (runner swap per participant
  build, serial builds make this race-free).
- **Minimal sharing in conflict scenarios** (only conflict-lib shared,
  Angular bundled privately): readable registry dumps, ~12s scenario
  builds. Election levers per scenario: host precedence via
  `conflictLib.host` (host's shared copy always wins) or neutral host
  (`shared: {}` + remotes decide).
- **Host participation via lazy side module**: a static conflict-lib
  import in host `main.ts` would resolve before the import-map commit;
  the generated `scenario-host-info.ts` is imported dynamically after
  init (same pattern as the make-main-async schematic).
- **Import-map mode is build-baked AND runtime-chosen** (key discovery):
  the Angular builder defaults the host HTML to
  `type="module-shim"` + `esms-options {shimMode:true}` — es-module-shims
  then owns the module graph and only honors `importmap-shim` tags, while
  the orchestrator's default writes `importmap` tags (its own default is
  native — builder and orchestrator defaults disagree). The runner syncs
  `esmsInitOptions.shimMode` from `initOptions.shimMode` every run.
- **Determinism over speed**: `cacheExternalArtifacts: false` everywhere,
  caches cleaned per run, full config re-apply incl. `_defaults` for
  non-participants, no-store serving, fresh browser profile per verify.
- **`--all` self-orchestrates via child processes** running the exact
  single-scenario code path; `--out-dir` persists dumps — the serial
  model Task 2's capture run will reuse.
- **`share()` helper required for self-fill**: secondary-entry-point
  discovery (package.json `exports` scan) only runs through `share()`;
  plain `shared:` objects bypass it. Route (a) of T1-AC-06 works —
  no Angular-drift fallback needed.
- **`integrityHashes: true` on `dynamic-init-shim`** (user-approved
  addition beyond the plan catalog): integrity ⇒ shim is the real-world
  pairing (native enforcement still rolling out); gives the corpus
  integrity shapes in map tags and the `remotes` repo.
- **Checkpoint process**: CP1 (machinery + clean-skip) → CP2 (conflict
  matrix) → CP3 (dynamic inits) → CP4 (integrity + self-fill), each
  user-reviewed before continuing.

### Review Focus

- **Behavior claims:**
  - Fresh checkout + `pnpm install` (in `angular/simple`) +
    `node run-scenario.mjs <id>` builds and serves every catalog ID
    without manual edits; the page resolves `__NF_SCENARIO_READY__`;
    final `--all` run: **10/10 PASS** (2026-08-11).
  - Re-running a scenario reproduces its shapes byte-identically
    (A→A and A→B→A verified via deep-equal verify dumps).
  - Every `scenario.json` `expected` field describes the VALIDATED
    observed shape, including the four findings that corrected
    hypotheses (see Context for Next Task).
- **Assumptions / choices:** directories instead of npm-pack tarballs;
  minimal sharing (less "realistic" than full Angular sharing — accepted
  for shape clarity and speed); expected fields as living ground-truth
  documentation rather than aspirational spec quotes.
- **Scope notes:** all code in the separate playground repo (plan
  mandate); `angular.json` reformat is a one-time cosmetic diff;
  integrity addition and the `dynamic-override` optional scenario go
  beyond the minimum catalog (both user-approved).
- **Read next** (playground repo):
  - `run-scenario.mjs` — the apply→generate→swap→build→serve pipeline
    and its determinism measures
  - `scenarios/README.md` — catalog contract + the two-level model incl.
    the build-baked shim caveat
  - `scenarios/self-fill/scenario.json` — the observed-vs-hypothesis
    deviation that feeds the Task-2 report

### Test Evidence

— session 2026-08-10/11

- **CP1** (`clean-skip`): registry rows exactly as cataloged — 2.0.0
  `share` [mfe2], 1.0.0 `skip` [mfe1] with participant list intact;
  visual proof mfe1 bundles 1.0.0 but renders 2.0.0 (winner redirect);
  A→A re-run (full rebuild, fresh profile) → byte-identical dumps;
  ~11.5s build for host+2 remotes. Root-caused and fixed the
  builder-vs-orchestrator shim-mode mismatch (resolver error →
  `esmsInitOptions` sync).
- **CP2** (conflict matrix): 6/6 `--all` PASS. `strict-split`: same tag
  1.0.0 split into `skip` [mfe1] + `scope` [mfe3], host row 2.0.0
  `share` (`__NF-HOST__`), map scope `./mfe3/` → own copy; runtime
  mfe1=2.0.0, mfe3=1.0.0. `scope-isolation`: whole losing row `scope`.
  `strict-scope`: scope `strict` beside `__GLOBAL__`, TWO `share` rows,
  requiredVersion pinned to exact tags. `scoped`: first-ever populated
  `scoped-externals` with a true package (`{tag, bundle, entries}` per
  remote, no singleton/strictVersion fields). `non-dense`: 7
  `@nf-internal/chunk-*` (tag 0.0.0) + 10 Angular share rows.
  A→B→A: clean-skip dump after strict-split runs deep-equal to first run.
- **CP3** (dynamic inits): `dynamic-init-native` 2 `importmap` tags /
  `dynamic-init-shim` 2 `importmap-shim` tags (n=1 → n+1, zero tags of
  the other type); `dynamic-override` ends with **1** tag (override
  replaces). Incumbent-wins negotiation verified (see findings).
- **CP4**: integrity blocks in both shim map tags (file URL → sha384) +
  per-remote `integrity` maps in the `remotes` repo (empty `{}` for the
  bare host); page load proves shim enforcement passes. `self-fill`:
  map shows `@nf-lab/conflict-lib` → mfe2's copy and
  `@nf-lab/conflict-lib/extra` → mfe1's own copy; rendered
  `mfe1 · conflict-lib at runtime: 2.0.0 · extra entry: extra@1.0.0`.
- **Final catalog run** (2026-08-11): `node run-scenario.mjs --all`
  → 10/10 PASS (fresh builds, per-id verify). Dumps were captured to the
  session scratchpad (temporary — Task 2's probe recreates durable
  corpus artifacts).
- Verification method: `verify-scenario.mjs` (headless Chromium via CDP,
  awaits ready promise, full registry + map-tag dump) — the plan's
  sanctioned console-inspection level for Task-1 close.

### Acceptance Coverage

- **T1-AC-01** — passed: final `--all` run 10/10 — every catalog ID
  builds and serves from the committed state without manual
  intervention; `verify-scenario.mjs` confirms `__NF_SCENARIO_READY__`
  resolves per ID.
- **T1-AC-02** — passed: definitions are self-contained (full re-apply
  incl. `_defaults` each run); A→A byte-identical dumps; A→B→A
  deep-equal (clean-skip re-verified after strict-split builds).
- **T1-AC-03** — passed: clean-skip skip row with intact participant
  list; strict-split losing tag split into skip+scope rows of the same
  tag (CDP dumps; Task 2 re-verifies durably).
- **T1-AC-04** — passed: `scoped` populates `scoped-externals` with a
  true package (per-remote ScopedVersion rows); `non-dense` adds 7
  `@nf-internal/chunk-*` entries (tag 0.0.0).
- **T1-AC-05** — passed: both `dynamic-init-*` variants end with n+1 = 2
  tags of exactly the mode's tag type.
- **T1-AC-06** — passed via route (a): `share()` + `includeSecondaries`
  discovers the `./extra` exports subpath; the import map serves the
  loser's uncovered entry from the loser's own copy (visual + map
  evidence). No Angular-drift fallback needed.

### Open Issues

- The `selfFillUncovered` tear path (generate-import-map.ts) was NOT
  exercised: the secondary became its own external
  (`@nf-lab/conflict-lib/extra`, sole-declarer share) instead of a
  multi-entry version row — likely `denseExternals`-dependent. Feed into
  the Task-2 report / Tasks-3+ re-plan (the spec's self-fill rendering
  assumption needs this correction).
- Verify dumps from the final run live in the session scratchpad
  (temporary); durable raw captures are exactly Task 2's deliverable
  (→ Task 2).
- `/commit 1` in this repo is log-only; the code commit is playground
  `ee90a21` (split-repo per plan — commit message should say so).

### Context for Next Task

- **Runner contract (stable for Task 2):**
  `node run-scenario.mjs <id> [--port 4300] [--build-only]` and
  `--all [--out-dir D]` (serial, child-process per id, PASS/FAIL
  summary, exit code). Readiness contract: await
  `window.__NF_SCENARIO_READY__` (rejects on failure) before reading
  anything; `window.__NF_SCENARIO_ID__` = folder name. Catalog IDs are
  stable; `scenario.json.expected` fields are validated ground truth.
- **Registry ground truth established for Task 2 / the V2 spec:**
  - Host appears as `__NF-HOST__` with `host: true` on its rows.
  - `scoped-externals` is a lazy key (absent until populated — now
    proven from both directions); `ScopedVersion` rows carry only
    `{tag, bundle, entries}` (declaration's singleton/strictVersion are
    lossy).
  - `strict` share scope pins `requiredVersion` to the exact tag at
    store time (config range is lost) and sits beside `__GLOBAL__`.
  - Dynamic joiners defer to committed winners (incumbent wins even
    against a newer version; `cached:true` marks the committed copy).
  - Override re-init REPLACES map tags (1 tag) vs plain dynamic init
    APPENDS (n+1); eviction's `dirty:true` is transient — post-ready
    committed state shows `dirty:false`, i.e. passive captures will
    practically never see dirty.
  - Integrity: map tags carry an `integrity` block covering exactly the
    files that tag maps; `remotes` repo holds per-remote
    fileName→sha384 maps (empty object for a bare host).
  - `window.importShim` exists in BOTH modes (polyfill always bundled) —
    mode discriminator is the tag type, matching the task-8 probe design.
- **Two-level model refinement:** shim mode is build-baked (host HTML)
  AND runtime-chosen (orchestrator option) — a capture matrix must treat
  them as one synced dimension (`initOptions.shimMode`).
- **Gotchas:** secondary discovery only via `share()`; scenario runs
  leave the workspace dirty (configs/main.ts/angular.json —
  `git checkout` restores; `_defaults` guarantee determinism regardless);
  `pnpm install` resets conflict-lib to the v1 baseline (runner re-swaps
  per build); background dev servers must run sandbox-disabled to be
  reachable (carried from task-9); Chromium 151 honors multiple native
  import maps — older browsers would natively ignore the appended tag
  (shim scenarios unaffected).

### Git State

This repo (`feature/v2`):

```
git diff --stat: (empty)
git status --short:
?? .claude/
?? docs/work/v2/task-log/
```

(`.claude/` is session tooling, not part of this task's commit scope.)

Playground repo (`lab/v2-scenarios`):

```
ee90a21 feat: V2 scenario corpus — serial runner + 10 self-contained scenarios
git status --short: ?? .idea/  (IDE config, untracked by design)
```
