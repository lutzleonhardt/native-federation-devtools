# Task 3: Lossless frankenstein re-capture and shape-validation extension

### Task

Captured the publicly deployed frankenstein meeting room
(`https://lutzleonhardt.de/frankenstein-meeting-room/`) losslessly in
two phases via the chrome-devtools MCP, closed the three lab-corpus
evidence gaps (populated `shared-chunks`, `servedBy`/`pool` under real
sharing, real secondary entry points), and extended
`docs/work/v2/shape-validation.md` with rows 12–16 plus a per-decision
consequences re-check — the direct input for planning Task 4.

### Status

DONE

### Files Modified

- `scripts/lab-capture-dump.js` (modified) — conditional readiness:
  when `__NF_SCENARIO_READY__` is undefined, fall back to a
  settled-page condition instead of recording an error; fallback-only
  scenario keys `readySource: "page-settled"` and `phase`
  (`__NF_SCENARIO_PHASE__` pickup); `orchestratorCommit: null` in
  fallback mode (live deployments are provenance, never probe-stamped).
  Lab code path and lab envelope shape byte-identical (A→A-proven).
- `captures/frankenstein-live/20260811T115536Z-01-initial.json` (new) —
  phase 1: post-init state after load. 20 shared packages, populated
  `shared-chunks`, per-remote integrity, one `importmap-shim` tag.
- `captures/frankenstein-live/20260811T115536Z-02-post-interaction.json`
  (new) — phase 2: after selecting a meeting (loads whiteboard/mermaid
  remote modules). Namespace/tags/shim map byte-identical to phase 1.
- `captures/frankenstein-live/provenance.json` (new) — hand-written
  provenance sidecar: capture URL + date, deployment-dependent flags,
  best-known orchestrator (`@softarc/native-federation-orchestrator
  ^4.0.0` via `@angular-architects/native-federation-v4 ^21.2.1`) and
  the four observables it was determined from.
- `captures/manifest.json` (modified, regenerated) — new `liveCaptures`
  block (collector, embedded provenance, per-phase files with
  runstamp/capturedAt/sha256); probe hash now pins the current probe.
- `scripts/build-lab-manifest.mjs` (modified) — scans
  `captures/frankenstein-live/`, validates `<runstamp>-<phase>.json`
  naming + scenarioId/phase stamps, embeds the provenance sidecar,
  emits the `liveCaptures` block; lab logic untouched.
- `scripts/validate-lab-corpus.mjs` (modified) — live-capture checks
  (schema, sha256, `readySource`, `orchestratorCommit === null`,
  page.url vs provenance, channels, phase set), `liveEvidence`
  predicates for rows 12–16 (observed v4 shapes, fail loudly on
  redeploy drift), cross-phase identity check, provenance
  sidecar/embed equality, stray handling for the new dir; NEW lab
  guard: lab captures must not carry fallback-mode scenario keys.
- `captures/README.md` (modified) — frankenstein-live section (phases,
  no-dynamic-init finding, re-capture recipe, XC-01 exemption), probe
  revision note (old sha `38c180ae…`, A→A neutrality evidence).
- `docs/work/v2/shape-validation.md` (modified) — header: second
  evidence source + generation caveat; rows 12–16 with verdicts and
  cites; live durable-observations section; "Consequences — Task 3
  re-check" walking every planned collector-schema decision
  (holds/amended).

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 3 block
- `docs/work/v2/task-log/task-2-lossless-capture-corpus.md` — probe/
  envelope/manifest/validator contracts, gotchas (probe-hash pin,
  privacy-regex on field names, `filePath` eval flow)
- `guards/privacy-scan.ts` + `guards/privacy-scan.spec.ts` — forbidden
  key regex and recursive capture auto-coverage (not modified)
- `captures/README.md`, `captures/manifest.json` (pre-state)
- Live page state via MCP evals (registry, import maps,
  `remoteEntry.json`, `federation.manifest.json`)
- GitHub `FrankensteinMeetingRoom` repo layout +
  `packages/shell/package.json` (WebFetch) — best-known version
- Playground repo (`lab/v2-scenarios` @ `ee90a21`) — A→A run only,
  restored afterwards

### Key Decisions

— session 2026-08-11

- **Probe-pin strategy** (briefing recommendation, executed): manifest
  pins the CURRENT probe (regeneration contract), README documents the
  old revision (`38c180ae…`) that produced the 10 lab captures, and an
  A→A re-capture of `clean-skip` with the new probe proved semantic
  identity (fallback branch unreachable in runner mode). Full lab
  re-capture rejected as unnecessary churn. Durable guard instead: the
  validator rejects lab captures carrying fallback-mode keys.
- **Fallback-only envelope keys**: `readySource`/`phase` exist ONLY in
  fallback mode, so lab envelopes stay byte-identical — chosen over an
  always-present `readySource` for A→A stability and clean generation
  separation.
- **Phase filenames `<runstamp>-<phase>.json`** (deviation from
  plan-literal `<runstamp>.json`): phases self-documenting on disk,
  manifest/validator key on the parsed phase; scenario.phase must match
  the filename (builder-checked).
- **Collector kind stays `chrome-devtools-mcp`** (plan wrote
  `browser-mcp`): same driver as Task 2, keeping one manifest
  vocabulary; the plan term read as shorthand.
- **Provenance sidecar** (`provenance.json`) instead of hand-editing
  the manifest: builder embeds it, validator checks sidecar == embedded
  copy — manifest stays fully regenerable by script, non-derivable
  deployment facts stay checked in and privacy-scanned.
- **Phase 2 captured despite no dynamic init**: the app performs no
  post-init `initRemoteEntry` (all three `remoteEntry.json` fetched at
  startup; map-tag count and registry hash stable across a real module
  load). The byte-identical second phase was kept as durable,
  validator-enforced evidence that module loading does not mutate the
  registry.
- **Live evidence predicates encode observed v4 reality** (Task-2
  doctrine): populated bundle lists, `file`-not-`entries` participants,
  no `servedBy`/`pool`, empty `scoped-externals`, 29 integrity entries
  with absolute-URL shim keys, single-provider uniqueness — a redeploy
  that changes any of it fails the corpus check and points at the
  report.

### Review Focus

- **Behavior claims:**
  - Both live captures equal the in-page registry: per-phase
    `JSON.stringify(__NATIVE_FEDERATION__)` deep-equal to the captured
    namespace, zero `collectionErrors`; phases are byte-identical to
    each other (registry stability under module load) —
    validator-enforced.
  - The probe edit is lab-neutral: fresh `clean-skip` build + capture
    with the NEW probe is deep-equal to the committed old-probe capture
    modulo `capturedAt`/`observedAt`, and carries no fallback keys.
  - `node scripts/validate-lab-corpus.mjs` fails on: live hash/schema
    drift, provenance sidecar/embed divergence, missing phase
    `01-initial`, cross-phase divergence, any regression of the rows
    12–16 evidence, and lab captures with fallback-mode keys.
- **Assumptions / choices:** best-known orchestrator version comes from
  the source repo's `main` at capture date (deployment itself pins
  nothing; all four in-page observables are consistent with it);
  winner-only chunk mapping accepted as bounded residual (no deployment
  with losing bundle-bearing copies exists); phase filenames and
  collector-kind vocabulary deviate from plan literals (see decisions).
- **Scope notes:** `.claude/` untracked session tooling, not commit
  scope. Playground repo used read-only for the A→A run and restored
  (`git checkout`). No product code touched.
- **Read next:**
  - `docs/work/v2/shape-validation.md` — rows 12–16 + "Consequences —
    Task 3 re-check": THE input for the round-3 /plan; check the two
    amendments (participant `file` XOR `entries`; chunk sources union).
  - `scripts/validate-lab-corpus.mjs` (`liveEvidence`,
    `livePhaseIdentity`) — whether the durable predicates match the
    report's claims.
  - `captures/frankenstein-live/provenance.json` — whether the
    best-known-version evidence chain is convincing.

### Test Evidence

— session 2026-08-11

- **Losslessness (T3-AC-02, both phases):** second `evaluate_script`
  per phase (`JSON.stringify(__NATIVE_FEDERATION__)` via `filePath`)
  compared host-side → `EQUAL: True` for `01-initial` AND
  `02-post-interaction`; `collectionErrors: []` in both.
- **Cross-phase identity:** phase-1 namespace == phase-2 namespace,
  DOM map tag texts equal, shim maps equal (python deep-equal); interim
  in-page SHA-256 of the stringified namespace identical before/after
  the meeting click (`e27c25c5…` both times) while the network log
  showed the whiteboard/mermaid bundles loading — the interaction
  really exercised module loading.
- **Merge-rule live check:** DOM tag resolved against the page base ==
  shim map for `imports`, `scopes`, AND `integrity` (first scopes
  evidence); provider derivation `scopeUrl + file` == map target 20/20;
  shared-chunks files == `./`-scope `@nf-internal` entries 7/7;
  integrity union 29 == 29.
- **Validator:** `node scripts/build-lab-manifest.mjs` → `wrote
  captures/manifest.json (runId 20260811T095850Z, 10 captures, 2 live
  phases)`; `node scripts/validate-lab-corpus.mjs` → `corpus valid: 10
  captures + 2 live phases…`.
- **Guards (T3-AC-03):** `CI=true npm run test:guards` → 3 files,
  **32/32 passed** (up from 29 — the two live captures + provenance.json
  are auto-covered by the recursive capture scan).
- **A→A probe neutrality:** playground restored → `node
  run-scenario.mjs clean-skip` (12.5 s build) → new-probe capture →
  canonical compare vs committed `captures/clean-skip/20260811T090637Z.json`
  with timestamps stripped → **EQUAL**; scenario block has no fallback
  keys. Server stopped, playground working tree restored.
- **Provenance observables:** `remoteEntry.json` shape
  `{name, shared, exposes, chunks, integrity}` with `singleton` flags;
  `federation.manifest.json` with per-remote SRI for the remoteEntry
  files; `importShim.version` 2.8.0 == source dep `^2.8.0`; Angular
  21.2.12 == `^21.2.0`.

### Acceptance Coverage

- **T3-AC-01** — passed: two phase captures under
  `captures/frankenstein-live/`, envelope `lab-lossless-capture/1`,
  `scenarioId: "frankenstein-live"` + phase labels; manifest
  `liveCaptures` block with embedded provenance;
  `validate-lab-corpus.mjs` green over the extended corpus.
- **T3-AC-02** — passed: in-page stringify equality for BOTH phases
  (plan required ≥1); enforced structurally by the validator's live
  checks + sha256 pins.
- **T3-AC-03** — passed: privacy guards 32/32 over the extended
  capture set.
- **T3-AC-04** — passed: rows 12–16 each carry verdict + cite; the
  winner-only verdict states explicitly that no losing copies exist
  whose chunks could appear unmapped (not exercised, bounded residual).
- **T3-AC-05** — passed: "Consequences — Task 3 re-check" section
  states holds/amended for every planned collector-schema decision;
  two amendments (participant `file` XOR `entries`; chunk
  reclassification union) + one new requirement (generation awareness).
- **XC-01** (touches) — live captures take the documented exemption:
  deployment-dependent, provenance + sha256 instead of regenerability;
  lab-scenario regenerability re-proven incidentally by the A→A run.

### Open Issues

- Winner-only `shared-chunks` mapping stays not-exercised at lossless
  fidelity — accepted as bounded residual (no available deployment
  produces losing bundle-bearing copies); round-3 planning should treat
  the research-schema reading as final unless a conflicting real
  deployment appears.
- Dev-generation multi-key `entries` maps remain hypothetical (v4 has
  no `entries`; all lab maps single-key) — schema must allow, nothing
  may require (→ Task 4).
- A redeploy of the live app invalidates the live captures by design —
  validator + sha256 make it loud; re-capture recipe documented in
  `captures/README.md`.

### Context for Next Task

Next step is NOT a numbered task — it is the round-3 `/plan` run
against the amended spec AND the Task-3-extended
`docs/work/v2/shape-validation.md` (numbering continues at 4).

- **Report contract:** rows 12–16 verdicts + "Consequences — Task 3
  re-check" are the validated ground truth. The two amendments the
  plan must absorb: (1) participants carry `entries` (map, dev
  `8e5e0b3`) XOR `file` (string, released v4) — the collector schema
  accepts both, and the spelling discriminates the generation;
  (2) chunk reclassification reads the UNION of `scoped-externals`
  chunk pseudo-externals (dev) and `shared-chunks` bundle lists (v4);
  `@nf-internal/` is the stable specifier marker in both. New
  requirement: fixture derivation ingests both generations;
  frankenstein-live becomes the released-generation fixture.
- **Confirmed final:** drop `servedBy`/`pool`; `bundle` optional;
  `mergeDocumentMaps` (now scopes-verified); provider derivation via
  longest scope prefix; lazy = absent OR empty (`scoped-externals: {}`
  observed live); `singleton` exists only in `remoteEntry.json`, never
  in the runtime registry.
- **Corpus contract:** manifest gained `liveCaptures` (collector,
  embedded `provenance` == sidecar, `files[{phase, path, runstamp,
  capturedAt, sha256}]`); live envelopes carry
  `scenario.readySource/phase`, `orchestratorCommit: null`.
- **Gotchas:** probe edits still invalidate the manifest probe pin
  (rebuild via `build-lab-manifest.mjs`; lab captures then need the
  README revision-note treatment or a re-capture); the playground repo
  needs sandbox-bypass for git/runner; MCP browser navigation left on
  the last-used page; privacy regex bites metadata field NAMES (sidecar
  fields were chosen to avoid it); live captures in `frankenstein-live/`
  have NO newest-wins rule — every file is a corpus member, superseded
  runs must be deleted before rebuilding the manifest.

### Git State

`git diff --stat`:

```
 captures/README.md               |  53 ++++++++-
 captures/manifest.json           |  53 ++++++++-
 docs/work/v2/shape-validation.md | 232 +++++++++++++++++++++++++++++++++++++--
 scripts/build-lab-manifest.mjs   |  75 ++++++++++++-
 scripts/lab-capture-dump.js      |  28 ++++-
 scripts/validate-lab-corpus.mjs  | 195 +++++++++++++++++++++++++++++++-
 6 files changed, 618 insertions(+), 18 deletions(-)
```

`git status --short`:

```
 M captures/README.md
 M captures/manifest.json
 M docs/work/v2/shape-validation.md
 M scripts/build-lab-manifest.mjs
 M scripts/lab-capture-dump.js
 M scripts/validate-lab-corpus.mjs
?? .claude/
?? captures/frankenstein-live/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
