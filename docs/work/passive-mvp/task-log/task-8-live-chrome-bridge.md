# Task 8: Live Chrome bridge and end-to-end verification

### Task

Implemented the live Chrome bridge — `ChromeSnapshotProvider` over the
DevTools eval, environment-based DI (fixtures in dev, live provider in the
extension build), and the refined bundle check — verified end-to-end
against the unchanged Frankenstein production build **and** the live
native-federation playground; the playground surfaced two real-world
runtime-variance bugs in the collector mapper (lazily created
`scoped-externals`, removed per-remote `file` field) that were fixed
in-task.

### Status

DONE

### Files Modified

New — devtools-bridge:

- `projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts` (new) —
  live provider: promisified DevTools eval with 2 s timeout per probe,
  shim probe gated exactly like the mapper (`present: true`,
  `descriptor: 'data'`), every failure mode resolved (never rejected) into
  the mapper's honest availability states plus fixed-vocabulary bridge
  errors (`stage: 'bridge'`, codes `inspected-window-unavailable` /
  `eval-exception` / `eval-timeout`, detail `passive-probe` |
  `shim-map-probe`); exceptionInfo text is page-controlled and deliberately
  never read. Eval call sites keep the full property chain — the bundle
  check sanctions exactly the literal `inspectedWindow.eval(`.
- `projects/devtools-bridge/src/lib/chrome-snapshot-provider.spec.ts`
  (new) — T8-AC-01 with a mocked `chrome` global: success with and without
  the shim path, eval exception (incl. proof the page-controlled text is
  absent from the DTO), missing global, hanging eval (fake timers), shim
  failure with intact main result.

New — devtools-ui:

- `projects/devtools-ui/src/environments/environment.ts` (new) — dev
  environment: fixture provider; the module-eval-time `?fixture=` read
  moved here (hash-router still drops the query before lazy reads).
- `projects/devtools-ui/src/environments/environment.extension.ts` (new) —
  extension environment: `ChromeSnapshotProvider`.

Modified:

- `projects/devtools-ui/src/app/app.config.ts` (modified) —
  `SNAPSHOT_PROVIDER` factory now delegates to the environment.
- `angular.json` (modified) — production `fileReplacements` swap
  `environment.ts` → `environment.extension.ts`; fixtures thereby leave
  the packaged extension bundle (closes the carried task-6 issue).
- `projects/devtools-bridge/src/public-api.ts` (modified) — exports the
  live provider.
- `scripts/check-panel-bundle.mjs` (modified) — eval check refined to
  `/(?<!inspectedWindow\.)\beval\(/`: only the sanctioned DevTools API
  call shape passes; bare `eval(` and `window.eval(` still fail.
- `projects/collector/src/lib/snapshot-mapper.ts` (modified) — REAL-WORLD
  FIX 1: `OPTIONAL_REPOSITORY_KEYS` — an explicitly absent
  (`present: false`) `scoped-externals` is the observation "zero entries"
  and projects to `{}`; unreadable (accessor-backed) still yields
  `not-recognized`. FIX 2: external-remote `file` is optional — newer
  runtimes record `bundle` + `entries` maps instead (not collected,
  Task-7 YAGNI upheld); participants keep name/requiredVersion/strict/
  cached with `file: null`.
- `projects/collector/src/lib/snapshot-mapper.spec.ts` (modified) — three
  new tests: playground-shaped global without `scoped-externals` →
  available with `{}`; accessor-backed `scoped-externals` → still
  `not-recognized`; newer-runtime external remote without `file` →
  participant with `file: null` and proof `bundle`/`entries` values never
  cross the allowlist.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) —
  `ExternalRemoteV1.file: string | null`; `RuntimeRepositoriesV1` doc
  updated for the lazy-repository exception.
- `scripts/derive-fixture.mjs` (modified) — parity for both mapper rules;
  regenerated fixture verified byte-identical after each change.

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 8 block
- Task logs 7 (predecessor: collector API, eval flow, carried issues),
  1 (build contract, bundle check), 2 (DI contract, boundary guard),
  6 (export ≡ DTO chain, CDP techniques, env gotchas)
- `projects/collector/src/lib/{passive-probe,snapshot-mapper,runtime-schema}.ts`,
  `projects/devtools-bridge/src/lib/{snapshot-provider,fixture-snapshot-provider}.ts`
  — contracts the bridge consumes
- `projects/devtools-ui/src/app/views/shared-dependencies.html` — proof no
  view renders the external-remote `file` field (fix-2 sizing)
- Research repo probe (read-only, sanctioned) — confirmed the reference
  only *reports* per-repository presence; the all-four-required rule was
  our Task-2 interpretation
- `/home/lutz/projects/FrankensteinMeetingRoom/dist/deploy` (read-only) +
  live playground page and its `remoteEntry.json` (via CDP/curl) —
  evidence base for both variance fixes
- `docs/specs/native-federation-devtools.md` (evidence layers, claims,
  shared-dependencies view) — for the user discussion on claims vs.
  registry; no spec change

### Key Decisions

- **Environment-based DI via fileReplacements** (dev = fixtures with
  `?fixture=` previews, production/extension = live provider). Side
  effect verified by bundle grep: no fixture markers in the packaged
  panel JS — fixtures are tree-shaken out (`sideEffects: false` bridge).
- **Bridge errors use a fixed vocabulary only** — eval exceptionInfo
  carries page-controlled text and never enters the DTO/export (XC-02);
  the spec proves the exception string is absent from the serialized
  snapshot.
- **Timeouts on both evals** (2 s, late callbacks ignored) — a hostile
  `getImportMap` or proxy trap can hang either probe; timeout resolves to
  the mapper's null path (carried task-7 obligation).
- **Minimal structural chrome typing inside the provider** instead of
  `@types/chrome` or an ambient global — keeps `chrome` unknown across
  `projects/`, documents exactly the consumed surface.
- **Eval call sites are full property chains** — a local alias for the
  eval function would minify to `x.eval(` and fail the refined bundle
  check; documented at the call site.
- **Variance fix 1 (user-confirmed diagnosis):** the runtime creates
  `scoped-externals` lazily — the playground has no such key. Honest-state
  reading: explicit absence (`{present: false}`) is an observation, not
  missing evidence; only that one key is optional (evidence-based), and
  unreadable stays `not-recognized`. No probe change — the allowlist
  double-maintenance was untouched.
- **Variance fix 2:** the Angular-22-era runtime replaced the external
  remote `file` field with `bundle` + `entries`. Chosen: `file` nullable,
  `bundle`/`entries` stay uncollected (no view needs them; Task-7 YAGNI
  note "re-add when a view needs it" still applies). Rejected: collecting
  the `entries` map now (DTO/schema/probe growth without a consumer).
- **derive-fixture parity maintained** for both rules; the checked-in
  fixture regenerates byte-identically, so no semantic drift between the
  script and the mapper.

### Review Focus

- **Behavior claims:**
  - In the packaged extension the panel live-captures both demonstrated
    runtime generations (Frankenstein-era with `file`, playground-era
    Angular 22.0.8 with lazy `scoped-externals` + `entries` maps);
    capture never rejects — every failure mode lands as channel states
    plus `stage: 'bridge'` errors.
  - Capture leaves the page byte-identical: sha256 digests over URL,
    import-map texts, the full `__NATIVE_FEDERATION__` serialization, and
    complete local/session storage are unchanged across both probes on
    both real targets.
  - `ng serve` behavior is unchanged (fixtures + `?fixture=` previews);
    the production bundle contains no fixture data and exactly one
    `inspectedWindow.eval(` occurrence.
- **Assumptions / choices:** only `scoped-externals` is optional
  (observed evidence, not a general repo-optionality rule); `file: null`
  semantics for newer runtimes; T8-AC-04 closed via the proven chain
  (live snapshot scans clean + task-6 byte-identity export ≡ DTO) rather
  than scanning a hand-exported panel file.
- **Scope notes:** collector mapper, DTO, and derive-fixture changed —
  outside the task's key locations, driven by live verification against
  the playground (plan's adjust-on-context clause); spec untouched.
- **Read next:**
  - `projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts` — the
    failure-translation and fixed-vocabulary decisions
  - `projects/collector/src/lib/snapshot-mapper.ts`
    (`OPTIONAL_REPOSITORY_KEYS` + `toExternalRemotes`) — whether the
    honest-state readings convince you
  - `scripts/check-panel-bundle.mjs` — whether the lookbehind exception
    is narrow enough for your threat model

### Test Evidence

Session 2026-08-09/10:

- `CI=true npm test` → devtools-ui 61/61, devtools-bridge 48/48 (6 new
  provider tests), collector 30/30 (3 new variance tests), guards 18/18 —
  green after each stage (bridge, DI swap, variance fix 1, variance fix 2).
- `npm run build:extension` → AOT production build + bundle check green
  (278 kB raw / 73 kB transfer).
- Bundle facts (grep over `dist/extension/panel/main-*.js`): exactly one
  `inspectedWindow.eval(`; zero occurrences of `frankenstein` /
  `synthetic-fixture.example` (fixtures tree-shaken; `__NF-HOST__` once —
  the NF_HOST constant used by views).
- **Negative tests of the refined eval check:** planted bare `eval(` →
  exit 1; planted `window.eval(` → exit 1; removed → exit 0.
- **Automated E2E harness** (headless Chromium + CDP over node's built-in
  WebSocket; session-scratchpad scripts; collector + privacy scan bundled
  via esbuild):
  - Frankenstein, served locally read-only with the base-href path mapped
    (`ln -s dist/deploy frankenstein-meeting-room; python3 -m http.server`):
    7/7 PASS — page digest byte-identical before/after both probes, all
    channels available, host + mermaid + whiteboard, react 18.3.1 `share`
    (sole provider whiteboard), 22 imports / 1 scope, zero collection
    errors, privacy scan clean.
  - Live playground (`native-federation.github.io/playground/explore/stores`):
    initially 41× `external-remote-incomplete` + (pre-fix) the
    `scoped-externals` not-recognized state from the user's screenshot;
    after both fixes 7/7 PASS — digest byte-identical, 4 remotes,
    `scopedExternals: {}`, 12 shared packages @ 22.0.8 `share`, 35-import
    effective map, zero errors, scan clean.
  - Digest method: sha256 over URL, readyState, all import-map script
    texts, `JSON.stringify(__NATIVE_FEDERATION__)`, and full local- +
    sessionStorage key/value dumps. Measurement lesson: the Frankenstein
    app writes `frankenstein:meetings` (25 kB) to localStorage once during
    startup — the harness waits for two identical consecutive samples
    before measuring, isolating probe effects from app-own writes.
- **Manual E2E (Lutz, real Chrome, unpacked `dist/extension`):**
  Frankenstein panel showed host, both remotes, the react share outcome,
  and the import map ("klappt gut"). Playground initially rendered the
  honest empty state "No Native Federation detected — global present but
  repositories missing or unreadable: scoped-externals" (screenshot) —
  the trigger for variance fix 1; after the fixes all three views
  populate on the playground (screenshots: Remotes & Exposes with 4
  remotes, Shared Dependencies with 12 packages incl. per-participant
  requirements).
- Fixture regeneration after each derive-fixture parity change:
  byte-identical (`git status` clean under `fixtures/`).

### Acceptance Coverage

- **T8-AC-01** — passed: `chrome-snapshot-provider.spec.ts` — mocked
  `chrome` global; success (± shim path) yields a conforming `SnapshotV1`,
  exceptionInfo / missing global / hanging eval yield availability states
  plus fixed-code bridge errors; never a rejection.
- **T8-AC-02** — passed (→ XC-03): guards suite green over the grown tree
  (`chrome.` only in devtools-bridge and the plain-JS extension
  bootstrap); refined bundle check negative-tested (bare and
  `window.eval(` plants fail, sanctioned call passes).
- **T8-AC-03** — passed (→ XC-01): manual panel verification by Lutz on
  the locally served, unchanged Frankenstein build (host, both remotes,
  react share outcome, import map); the digest-unchanged half is
  evidenced by the automated CDP harness against the identical served
  build — sha256 including full storage, stronger than the console
  spot-check the instructions sketched; steps and results recorded above.
- **T8-AC-04** — passed (→ XC-02): live-mapped snapshots of both real
  targets scan clean with the repo privacy scanner; the panel export is
  byte-identical to the serialized DTO by the task-6-proven chain
  (blob bytes ≡ serializer output, e2e download diff), so the export
  passes the same scan. Optional extra confirmation noted in Open Issues.

### Open Issues

- Optional AC-04 confirmation: run a physically panel-exported JSON
  through `scanForPrivacyViolations` once (the session scratchpad helper
  is ephemeral; the scanner itself is permanent in `guards/`).
- Phase-2 observation (from the claims-vs-registry discussion): the
  registry proved *complete* for the demonstrated happy paths — the
  tractor-store remoteEntry claims appear 1:1 as per-participant
  requirements. The duplicate-version / skip / override case remains
  undemonstrated (spec mandates rendering competing versions as
  "unresolved uncertainty"). Build the conflict scenario in the
  Frankenstein lab as an empirical micro-spike — what does the registry
  actually record on skip/override? — before designing the Evidence view.
- Toolbar duplication across the three view templates unchanged
  (→ Task 9, carried).
- Probe-source authoring as real `.source.js` + embed script + drift
  guard: deferred YAGNI, adopt on the first real probe edit (Phase 2,
  carried from task-7).

### Context for Next Task

- **Provider swap is invisible to views:** `SNAPSHOT_PROVIDER` resolves
  `ChromeSnapshotProvider` only in the production/extension build
  (fileReplacements); dev and tests keep fixtures. `captureSnapshot()`
  never rejects — failures arrive as channel states plus
  `errors[]` entries with `stage: 'bridge'` (codes
  `inspected-window-unavailable`, `eval-exception`, `eval-timeout`).
  Task 9's channel indicators should treat bridge-stage codes as
  capture-level conditions, distinct from per-channel states.
- **`capturedAt` is now the real bridge clock** (`new Date().toISOString()`
  at capture time); `collectorVersion` stays `nf-devtools-collector/1`.
- **Real-world channel semantics verified on two runtime generations:**
  `scopedExternals: {}` with an available channel is a legitimate
  observation on newer runtimes (not missing evidence); external-remote
  `file` may be `null` (newer runtimes) — no current view consumes it.
- **Refresh flow for Task 9:** views already re-capture via the store;
  the live provider makes every refresh a real re-eval — cheap
  (~two evals), no navigation, safe to trigger from a shell-level button.
- **Build rule:** eval call sites in the bridge must stay full property
  chains (`…devtools.inspectedWindow.eval(`) — a local alias breaks
  `check-panel-bundle.mjs`.
- **Env gotchas:** after `npm run build:extension`, reload the unpacked
  extension in Chrome before re-testing; the first selection of the panel
  tab triggers the initial capture. The CDP e2e pattern (node WebSocket,
  settle-wait before digesting, base-href path mapping for the
  Frankenstein dist) is documented in Test Evidence and cheap to rebuild.

### Git State

`git diff --stat`:

```
 angular.json                                       |  6 ++
 projects/collector/src/lib/snapshot-mapper.spec.ts | 93 ++++++++++++++++++++++
 projects/collector/src/lib/snapshot-mapper.ts      | 23 +++++-
 projects/devtools-bridge/src/lib/snapshot-v1.ts    | 13 ++-
 projects/devtools-bridge/src/public-api.ts         |  1 +
 projects/devtools-ui/src/app/app.config.ts         | 18 ++---
 scripts/check-panel-bundle.mjs                     |  5 +-
 scripts/derive-fixture.mjs                         | 18 ++++-
 8 files changed, 155 insertions(+), 22 deletions(-)
```

`git status --short`:

```
 M angular.json
 M projects/collector/src/lib/snapshot-mapper.spec.ts
 M projects/collector/src/lib/snapshot-mapper.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.ts
 M projects/devtools-bridge/src/public-api.ts
 M projects/devtools-ui/src/app/app.config.ts
 M scripts/check-panel-bundle.mjs
 M scripts/derive-fixture.mjs
?? .claude/
?? projects/devtools-bridge/src/lib/chrome-snapshot-provider.spec.ts
?? projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts
?? projects/devtools-ui/src/environments/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
