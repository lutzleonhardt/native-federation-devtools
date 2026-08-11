# Task 2: Lossless lab capture probe, raw scenario corpus, and shape-validation report

### Task

Built the lossless lab capture probe (`scripts/lab-capture-dump.js`),
captured all 10 catalog scenarios via the Task-1 runner into
`captures/<scenario>/` (envelope `lab-lossless-capture/1`), wrote the
hash-pinned run manifest plus builder and corpus validator, and produced
`docs/work/v2/shape-validation.md` — verdicts for all 11 source-derived
assumptions, including the answers to open questions H (map merge rule)
and G (provider derivation).

### Status

DONE

### Files Modified

- `scripts/lab-capture-dump.js` (new) — the checked-in probe: ONE async
  function expression, evaluated verbatim in the page (chrome-devtools
  MCP `evaluate_script` today, any headless CDP driver tomorrow). Awaits
  `__NF_SCENARIO_READY__` (20 s timeout, captures even on rejection),
  clones ALL own keys of `globalThis.__NATIVE_FEDERATION__` losslessly
  (JSON round-trip, no allowlist/caps), inventories all
  `importmap`/`importmap-shim` tags in document order (raw text +
  parsed convenience copy; adapted from `passive-probe.ts:279-307`),
  copies `importShim.getImportMap()` incl. integrity hash values
  (read pattern of `shim-map-probe.ts`). Returns the
  `lab-lossless-capture/1` envelope — structural sibling of
  `frankenstein-runtime-capture/1` (`page`, `collector`, `channels`
  with `availability`/`observedAt`/`data`, `collectionErrors`) plus a
  `scenario` block (`scenarioId`, `orchestratorCommit: 8e5e0b3`,
  `ready`, `readyError`).
- `captures/<scenario>/<runstamp>.json` (new, 10 files, ~230 kB total) —
  one lossless capture per catalog scenario (`clean-skip`,
  `strict-split`, `scope-isolation`, `strict-scope`, `scoped`,
  `non-dense`, `dynamic-init-native`, `dynamic-init-shim`,
  `dynamic-override`, `self-fill`), pretty-printed (2 spaces), exact
  eval results — no post-processing beyond formatting.
- `captures/manifest.json` (new) — run manifest
  (`lab-lossless-corpus/1`, runId `20260811T095850Z`): playground
  branch/commit, orchestrator commit, probe sha256 (drift pin),
  collector block (`chrome-devtools-mcp` / `generic-devtools` /
  `lossless`), serving block, sha256 per capture. Makes XC-01 checkable.
- `scripts/build-lab-manifest.mjs` (new) — deterministic manifest
  builder (newest runstamp per scenario, `--playground <path>`,
  default `../nf/playground`); fails on missing scenarios, scenario-ID
  mismatches, or inconsistent orchestrator commits.
- `scripts/validate-lab-corpus.mjs` (new) — corpus validator adapted
  from the research repo's `validate-frankenstein-corpus.mjs`, reduced
  to manifest-level checks (schema ids, runId format, hashes, expected
  scenario set, probe-hash drift, stray-file detection) plus envelope
  structure (`ready === true` gate, channel availability,
  `collectionErrors` empty) plus per-scenario losslessness evidence
  predicates. The research validator's deep allowlist shape checks were
  deliberately NOT ported — they would reject exactly the fields
  losslessness keeps.
- `captures/README.md` (modified) — new lab-corpus section: envelope
  summary, 4-step regeneration recipe, A→A determinism note, lab-data
  provenance; frankenstein section retitled as V1 fixture source.
- `docs/work/v2/shape-validation.md` (new) — the report round 2
  consumes: verdict per assumption row 1–11 with capture + JSON-path
  cites, additional durable observations, and 12 "consequences for
  round 2" items.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 2 block
- `docs/work/v2/task-log/task-1-scenario-runner-corpus.md` — runner
  contract, readiness contract, registry ground truth, env gotchas
- Prior-round logs: `docs/work/passive-mvp/task-log/task-2-…` (captures/
  provenance policy, privacy-guard mechanics), `task-8-…` (MCP/CDP
  capture-flow precedent, runtime-variance findings)
- `projects/collector/src/lib/passive-probe.ts` (tag-inventory reuse
  source), `projects/collector/src/lib/shim-map-probe.ts` (shim read
  logic), `guards/privacy-scan.ts` + `guards/privacy-scan.spec.ts`
  (guard rules; recursive capture scan)
- Research repo (read-only):
  `captures/raw/frankenstein/20260724T134007Z/manifest.json` +
  `production/04-remote-interaction.json` (envelope/manifest exemplars),
  `scripts/validate-frankenstein-corpus.mjs` (check inventory)
- Playground repo state (`lab/v2-scenarios` @ `ee90a21`) — used, not
  modified

### Key Decisions

— session 2026-08-11

- **Browser MCP instead of a headless CDP driver script** (user
  re-plan after connecting the chrome-devtools MCP): capture flow =
  plan's literal MCP flow, matching the research-corpus precedent
  (`collector.kind: "chrome-devtools-mcp"`). The probe file stays
  driver-agnostic; the planned `capture-lab-corpus.mjs` driver was
  dropped, `build-lab-manifest.mjs` added instead (manifest assembly
  must stay regenerable without an MCP session).
- **`evaluate_script`'s `filePath` parameter** writes eval results
  directly to disk — the anticipated MCP-truncation risk (and its
  planned slice fallback) evaporated; capture files are exact eval
  results.
- **`collector.kind` lives in the manifest, NOT the envelope**
  (user-approved at CP1): the page cannot know its driver; a hardcoded
  kind would lie when the headless script reuses the file. Envelope
  carries `collector.probe` + `sanitization: "lossless"`.
- **`scenario.ready`/`readyError` kept** (user challenged, then
  agreed): in-band proof the dump is post-init committed state, and the
  validator's `ready === true` gate makes it machine-checkable;
  `readyError` is the diagnostic counterpart for capture-on-rejection.
- **Captures pretty-printed** (2 spaces, key order preserved) —
  reviewable git diffs; formatting is the only post-processing.
- **Fresh page navigation per scenario + no-store serving** instead of
  a fresh browser profile (MCP profile is persistent); A→A spot check
  validated the choice.
- **Validator evidence predicates encode OBSERVED reality, not
  hypotheses** — written after all captures existed (e.g. chunk
  pseudo-externals asserted to have NO `bundle` field; a future
  orchestrator adding one fails the corpus check loudly and points at
  the report).
- **Privacy-guard hit resolved by rename, not allowlist**: the guard
  flagged `serving.headers` (my manifest field name matched the
  forbidden-key regex) — renamed to `cacheControl`; guard stayed
  strict, no capture data was ever involved.
- **Serial per-scenario capture loop** (runner start → port-gated
  readiness wait → navigate → probe eval → in-page stringify equality
  eval → summary check → server stop) with port-free guards between
  scenarios to prevent capturing a stale server.

### Review Focus

- **Behavior claims:**
  - Every capture equals the live registry: per-scenario in-page
    `JSON.stringify(__NATIVE_FEDERATION__)` is deep-equal to the
    captured namespace (10/10), and captures carry the
    allowlist-dropped fields (`bundle`, `entries`, `requiredVersion`,
    per-remote `integrity`) — enforced durably by
    `scripts/validate-lab-corpus.mjs`.
  - The corpus is regenerable from the two checkouts alone: A→A re-run
    of `clean-skip` (full rebuild + fresh eval of the checked-in probe
    file) is semantically identical modulo
    `capturedAt`/`observedAt` — even hashed bundle filenames are
    stable.
  - `node scripts/validate-lab-corpus.mjs` fails on: hash mismatch,
    missing/stray captures, probe drift, non-ready captures, and any
    regression of the per-scenario losslessness evidence.
- **Assumptions / choices:** `collector.kind` manifest-only (envelope
  can't know its driver); pretty-printing as sanctioned formatting;
  validator intentionally shallow on repository shapes (lossless corpus
  must not be schema-filtered); newest-runstamp-wins manifest rule with
  stray-file detection as the cleanup forcing function.
- **Scope notes:** `build-lab-manifest.mjs` replaces the plan-implied
  MCP-session-only manifest assembly (regenerability); the planned
  headless driver script was consciously not built (browser MCP
  available; probe stays headless-ready). Product code untouched — as
  mandated.
- **Read next:**
  - `docs/work/v2/shape-validation.md` — THE deliverable; check the
    deviates-verdicts (rows 1, 5, 10, 11) and the row-8 merge rule
    against your expectations before round-2 planning consumes them.
  - `scripts/lab-capture-dump.js` — the probe's losslessness guarantees
    and the envelope contract.
  - `scripts/validate-lab-corpus.mjs` (`EVIDENCE` table) — whether the
    per-scenario predicates match what the report claims.

### Test Evidence

— session 2026-08-11

- **Per-scenario equality (T2-AC-02, all 10):** second
  `evaluate_script` per page (`JSON.stringify(__NATIVE_FEDERATION__)`)
  compared host-side against the captured namespace → `EQUAL: True`
  for every scenario.
- **A→A regenerability:** `clean-skip` re-built and re-captured with
  the exact checked-in probe file → deep-equal to the corpus file after
  stripping `capturedAt`/`observedAt` (verified via canonical JSON
  compare; includes identical hashed bundle filenames).
- **Validator:** `node scripts/build-lab-manifest.mjs` →
  `wrote captures/manifest.json (runId 20260811T095850Z, 10 captures)`;
  `node scripts/validate-lab-corpus.mjs` → `corpus valid: 10 captures…`.
- **Guards:** `CI=true npm run test:guards` → 3 files, **29/29 passed**
  (privacy scan auto-covers all 10 new captures + manifest;
  negative-proven mid-task: the `serving.headers` field name was
  flagged and fixed).
- **Merge-rule verification (row 8 / question H):** document-order
  merge of `dynamic-init-shim`'s two DOM tags + URL resolution against
  the page base reproduces `importShim.getImportMap()` exactly, for
  `imports` AND `integrity` (python deep-equal).
- **Shape evidence extraction:** systematic key-set analysis across all
  captures (version-row keys 18/18 `{tag, host, action, remotes}`;
  participant key-set variants; `servedBy`/`pool` grep: zero hits
  corpus-wide; shared-chunks membership per scenario; scope-uniqueness
  check for question G).
- Capture cadence: ~12 s build per conflict scenario (~75 s for
  non-dense's Angular build) + sub-second capture; full corpus run fits
  comfortably in one session.

### Acceptance Coverage

- **T2-AC-01** — passed: 10/10 captures under `captures/<scenario>/`,
  each stamped (`scenario.scenarioId`, `orchestratorCommit: 8e5e0b3`),
  produced by Task-1 runner + the checked-in probe only; enforced by
  `validate-lab-corpus.mjs` (scenario set + stamps + hashes).
- **T2-AC-02** — passed: in-page stringify equality per scenario (see
  Test Evidence); allowlist-dropped fields present where scenarios
  produce them (`bundle`/`entries` everywhere dense, `requiredVersion`
  on all participants, per-remote `integrity` in `dynamic-init-shim`) —
  durably asserted by the validator's `EVIDENCE` predicates.
- **T2-AC-03** — passed: `guards/privacy-scan.spec.ts` green over all
  new captures + manifest (29/29).
- **T2-AC-04** — passed: all 11 rows carry verdicts; every deviates row
  cites capture file + JSON path
  (`docs/work/v2/shape-validation.md`).
- **T2-AC-05** — passed: question H answered — report row 8 states the
  merge rule as implementable pseudocode, mechanically verified against
  `dynamic-init-shim`, with honestly-marked unexercised branches
  (specifier collision, scope-key normalization).
- **XC-01** (contributes) — passed for this task's half: A→A
  regeneration proven, manifest pins probe hash + commits, recipe
  documented in `captures/README.md`.

### Open Issues

- Winner-only `shared-chunks` bundle mapping is unvalidated at lossless
  fidelity — every `mapping-or-exposed` list in the lab corpus is empty;
  only allowlist-projected frankenstein evidence exists. Round-2
  planning must either accept the research-schema reading or pull the
  roadmap's lossless frankenstein re-capture forward (→ round-2 /plan).
- Merge-rule collision branch (same specifier in two map tags) not
  exercised — flagged in the report; store implementation should adopt
  "later tag wins" from es-module-shims semantics (→ store task).
- Re-capturing a scenario leaves the older runstamp as a
  validator-flagged stray — deliberate cleanup forcing function; delete
  superseded files before rebuilding the manifest (documented in
  README).

### Context for Next Task

Next step is NOT a numbered task — it is the round-2 `/plan` run
against the spec AND `docs/work/v2/shape-validation.md` (numbering
continues at 3).

- **Report contract:** rows 1–11 verdicts + "consequences for round 2"
  (12 items) are the validated ground truth for collector delta, store,
  and view planning. Highlights the plan must absorb: drop
  `servedBy`/`pool`; `bundle` optional everywhere;
  `scoped-externals` = `remote → pkg → {tag, bundle?, entries}` (own
  schema); all four repo keys lazy; chunk reclassification reads
  `scoped-externals`; `mergeDocumentMaps` pseudocode (report row 8) is
  the store's map ground truth — shim map is only authoritative in shim
  mode; nothing may depend on observing `dirty: true`; self-fill
  renders as "secondary as own external".
- **Corpus contract:** envelope `lab-lossless-capture/1`
  (`page` / `collector` / `channels{nativeFederationGlobals,
  domImportMaps, importShim}` / `collectionErrors` / `scenario`);
  namespace under
  `channels.nativeFederationGlobals.data.namespace`; manifest
  `lab-lossless-corpus/1` with per-file sha256. Fixture derivation for
  round 2 adapts `derive-fixture.mjs` channel-state logic to this
  envelope (planned as its own task).
- **Regeneration:** `node run-scenario.mjs <id>` (playground) →
  evaluate `scripts/lab-capture-dump.js` in the page → save →
  `node scripts/build-lab-manifest.mjs` →
  `node scripts/validate-lab-corpus.mjs`. Works from any CDP driver;
  chrome-devtools MCP's `evaluate_script` + `filePath` is the proven
  path.
- **Gotchas:** servers must run sandbox-disabled to be reachable;
  port-free gate between serial runner invocations (stale-server risk);
  scenario runs leave the playground workspace dirty (`git checkout`
  restores); the privacy guard's forbidden-key regex also bites
  manifest/metadata field NAMES (`headers` → renamed `cacheControl`);
  probe edits invalidate the manifest's probe hash — re-capture or
  consciously rebuild the manifest.

### Git State

`git diff --stat`:

```
 captures/README.md | 48 ++++++++++++++++++++++++++++++++++++++++++++----
 1 file changed, 44 insertions(+), 4 deletions(-)
```

`git status --short`:

```
 M captures/README.md
?? .claude/
?? captures/clean-skip/
?? captures/dynamic-init-native/
?? captures/dynamic-init-shim/
?? captures/dynamic-override/
?? captures/manifest.json
?? captures/non-dense/
?? captures/scope-isolation/
?? captures/scoped/
?? captures/self-fill/
?? captures/strict-scope/
?? captures/strict-split/
?? docs/work/v2/shape-validation.md
?? scripts/build-lab-manifest.mjs
?? scripts/lab-capture-dump.js
?? scripts/validate-lab-corpus.mjs
```

(`.claude/` is session tooling, not part of this task's commit scope.)
