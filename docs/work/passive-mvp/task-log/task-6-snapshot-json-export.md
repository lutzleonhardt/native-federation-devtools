# Task 6: Snapshot JSON export

### Task

Added the shell-level snapshot JSON export (the export *is* the DTO —
verbatim serialization, Blob + anchor download, filename from sanitized page
host + capture timestamp), the adversarial-but-sanitized `synthetic-hostile`
fixture, and the export privacy guard — which was then deliberately slimmed
to its honest scope after a user-driven redundancy analysis.

### Status

DONE

### Files Modified

New — devtools-ui shared layer:

- `projects/devtools-ui/src/app/shared/snapshot-export.ts` (new) — pure
  `serializeSnapshot()` (verbatim `JSON.stringify(snapshot, null, 2)`, no
  sanitization by design) and `exportFilename()` →
  `nf-snapshot-<host>-<timestamp>.json` from `capture.pageUrl` hostname +
  `capture.capturedAt` slug, with safe-slug fallback for non-parseable URLs;
  imports the bridge type-only (see Key Decisions)
- `projects/devtools-ui/src/app/shared/snapshot-export.spec.ts` (new) —
  T6-AC-01: parse-and-deep-equal round-trip over all 8 fixtures, explicit
  schemaVersion/channel-states/errors survival, filename cases incl. both
  fallback paths
- `projects/devtools-ui/src/app/shared/snapshot-export.service.ts` (new) —
  `SnapshotExportService` (root-provided): reads `SnapshotStore.state()`
  directly (views cannot reach the snapshot through their vms — task-5
  contract), Blob + anchor download, no-op unless `captured`
- `projects/devtools-ui/src/app/shared/snapshot-export.service.spec.ts`
  (new) — spy-based download capture (`URL.createObjectURL`/`revokeObjectURL`
  stubs + anchor-click spy, FileReader readback); asserts the blob bytes are
  **byte-identical** to `serializeSnapshot()` output and the derived filename
  is used; no-op case for the error state

New — devtools-bridge:

- `projects/devtools-bridge/src/lib/fixtures/synthetic-hostile.fixture.ts`
  (new) — models a hostile page AFTER collector sanitization: URLs at the
  maximal allowed shape (origin+path, percent-encoded segment), SRI
  look-alike value (`sha256-lookalike_not_base64`), suspicious-but-legit
  names, and the only fixture with non-empty `errors` (incl. nested detail)

New — guards:

- `guards/export-privacy.spec.ts` (new) — T6-AC-02: scans the parsed output
  of the real `serializeSnapshot` for primary + hostile (literal AC anchor)
  and proves a poisoned in-memory snapshot's export is flagged in all five
  violation classes; header comment states the honest scope (see Key
  Decisions)

Modified:

- `projects/devtools-ui/src/app/app.ts` (modified) — injects
  `SnapshotExportService` for the shell button
- `projects/devtools-ui/src/app/app.html` (modified) — "Export JSON" button
  in the shell nav (right-aligned), disabled unless a snapshot is captured
- `projects/devtools-ui/src/app/app.css` (modified) — `.shell-export`
  placement (margin-left auto, centered)
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — TestBed now needs
  a `SNAPSHOT_PROVIDER` stub (App transitively injects the store); new tests:
  button disabled→enabled cycle, click delegates to the service
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) —
  registered `synthetic-hostile`
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) —
  synthetic id list + hostile facts test (all channels available, non-empty
  errors with nested detail)
- `vitest.guards.config.mts` (modified) — `devtools-bridge` resolve alias
  mirroring the tsconfig path mapping, so guards can import devtools-ui
  sources that import from the bridge

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 6 block
- `docs/work/passive-mvp/task-log/task-5-import-map-view.md` — slimmed vm
  contracts ("exporter reads `SnapshotStore.state()` directly"), env gotchas
- `docs/work/passive-mvp/task-log/task-2-snapshot-dto-fixtures.md` — privacy
  scanner, guards suite layout, fixture-growth recipe, round-trip pattern
- `projects/devtools-ui/src/app/shared/snapshot-store.ts`,
  `projects/devtools-bridge/src/lib/snapshot-v1.ts`, `guards/privacy-scan.ts`
  — the three surfaces the export builds on
- `projects/devtools-ui/src/app/views/import-map.spec.ts` — newest test
  recipe (provider stub, `settle()`)
- `projects/devtools-ui/src/app/{app.html,app.ts,app.css,app.spec.ts}`,
  `projects/devtools-bridge/src/lib/fixtures/*` — shell + fixture patterns

### Key Decisions

- **Shell-level export button, not per-view:** the export operates on the
  whole DTO, not a view; placing it once in the nav avoids tripling the
  already-duplicated view toolbars and aligns with Task 9's shell-level
  direction.
- **Filename timestamp = `capturedAt`, not download time:** the file names
  the capture (deterministic, testable, no `Date.now()` in the pipeline).
  Slug format `20260724T135022Z` matches the capture-corpus convention.
- **The exporter never sanitizes:** T6-AC-01's deep-equal makes that
  structurally impossible — privacy must hold at the DTO level. Export is
  verbatim `JSON.stringify(snapshot, null, 2)`.
- **Hostile fixture is adversarial-but-clean and registered:** it models a
  hostile page *after* collector sanitization, so it can live in `FIXTURES`
  (a genuinely dirty fixture would rightly fail the Task-2 guard). The
  genuinely dirty case is an in-memory poisoned snapshot inside the guard
  spec. Deliberately avoided key-based false positives (e.g. no remote named
  `cookie-banner` — the key scan would flag it; known guard trade-off).
- **Guard slimmed to honest scope (user-driven):** the initial version
  scanned all 8 fixtures' exports — logically redundant, since AC-01
  (export ≡ DTO) + the Task-2 fixture guard (DTO clean) already imply
  "export clean"; a JSON round-trip cannot add data. Kept: the literal AC
  anchor (primary + hostile through the real serializer) and the poisoned
  detection test as *tool validation*. The spec's header comment states this
  openly. The measuring point's real target arrives with live collector
  output in Task 8.
- **Chain of custody for the real exporter:** guard proves serializer output
  clean; the service spec pins the blob bytes byte-identical to serializer
  output; headless e2e confirmed byte-identity of actual downloads. If the
  service ever builds its payload past the serializer, the byte-equality
  assertion goes red — the change cannot land silently.
- **Type-only bridge import + guards alias:** `snapshot-export.ts` imports
  `SnapshotV1` type-only (erased at runtime), and `vitest.guards.config.mts`
  gained a `devtools-bridge` alias so a future value import cannot break the
  node-environment guards run.

### Review Focus

- **Behavior claims:**
  - Clicking "Export JSON" downloads `nf-snapshot-<host>-<timestamp>.json`
    whose bytes parse and deep-equal the in-memory `SnapshotV1` — proven
    byte-identical in real headless Chromium for both primary and hostile
    fixtures.
  - The button is disabled until the store holds a captured snapshot;
    `exportCurrent()` is a no-op in non-captured states.
  - The export path adds no sanitization and no envelope — availability
    states and collection errors are in the file verbatim.
- **Assumptions / choices:** filename from `capturedAt` (not download time);
  shell-nav placement; "hostile" interpreted as adversarial-but-sanitized;
  T6-AC-02 acknowledged as re-measuring an implication of AC-01 + the
  fixture guard while the exporter is verbatim (honest-scope comment).
- **Scope notes:** `vitest.guards.config.mts` alias is infra beyond the
  task's key locations; `app.spec.ts` restructure was forced by the shell
  becoming data-dependent (App → exporter → store → provider token);
  `.claude/` stays untracked session tooling outside commit scope.
- **Read next:**
  - `guards/export-privacy.spec.ts` — the honest-scope comment; verify you
    agree with the slimmed coverage argument
  - `projects/devtools-ui/src/app/shared/snapshot-export.service.spec.ts` —
    the byte-equality assertion is the contract pin for the whole chain
  - `projects/devtools-bridge/src/lib/fixtures/synthetic-hostile.fixture.ts`
    — whether the boundary content matches your threat model

### Test Evidence

Implementation session 2026-08-09:

- `CI=true npm test` → devtools-ui 61/61 (11 serializer/filename + 2 service
  + 2 shell tests new), devtools-bridge 42/42 (hostile auto-extends
  round-trip/labeling + facts test), guards 18/18 (export guard after
  slimming; suite peaked at 25 before the redundant all-fixtures scan was
  removed).
- `npm run build:extension` → AOT production build + bundle check green
  (2 JS, 2 HTML scanned).
- **E2E download in real headless Chromium** (CDP via Node's built-in
  WebSocket, `Browser.setDownloadBehavior`): primary fixture → clicked the
  shell button → `nf-snapshot-127.0.0.1-20260724T135022Z.json` downloaded,
  **byte-identical** (diff) to `serializeSnapshot()` output, parses, carries
  schemaVersion/channels/errors; `/?fixture=synthetic-hostile` →
  `nf-snapshot-synthetic-fixture.example-20260809T000000Z.json` likewise
  byte-identical.
- Verification gotchas hit and resolved: stale task-5 dev server occupied
  4300 (`fuser -k`); Chromium blocks a *second* automatic download from the
  same origin without a user gesture (browser policy, not a product issue —
  real clicks are gestures; fresh browser per download for testing); the CDP
  *browser* connection must stay open until `downloadProgress: completed` —
  it owns the download-behavior override; `pkill -f <pattern>` killed its own
  shell when the pattern appeared in the command line — use
  `fuser -k <port>/tcp`.

### Acceptance Coverage

- **T6-AC-01** — passed: `snapshot-export.spec.ts` (round-trip deep-equal
  over all 8 fixtures; explicit schemaVersion/availability/errors
  assertions), `snapshot-export.service.spec.ts` (blob bytes ≡ serializer
  output, derived filename), plus byte-identical e2e downloads (primary +
  hostile) in headless Chromium.
- **T6-AC-02** — passed (→ XC-02): `guards/export-privacy.spec.ts` — primary
  + hostile exports scan clean; poisoned export flagged in all five violation
  classes. Honest scope recorded: with a verbatim exporter this is implied by
  AC-01 + the Task-2 fixture guard; the test is kept as the literal AC anchor
  and detector validation for Task 8's live captures.

### Open Issues

- The export privacy measuring point must be re-aimed at *live collector
  output* once real capture exists — that is where it starts guarding a real
  risk surface (→ Task 8).
- Fixtures currently ship inside the production extension bundle via the
  `FixtureSnapshotProvider` wiring; decide whether they leave the bundle when
  the live provider swaps in (→ Task 8).
- Plan-level observation: T6-AC-02 as formulated re-measures an implication
  of T6-AC-01 + XC-02 — worth remembering when writing Phase-2 ACs.
- Toolbar duplication across the three view templates unchanged (→ Task 9,
  carried from task-5).

### Context for Next Task

- **Export API (devtools-ui/shared):** `serializeSnapshot(snapshot): string`
  (verbatim 2-space JSON) and `exportFilename(snapshot): string` in
  `snapshot-export.ts`; `SnapshotExportService` (`canExport()`,
  `exportCurrent()`, root-provided) drives the shell button.
- **Validated for Task 7 (collector port):** any conforming `SnapshotV1`
  serializes losslessly through the export path — round-trip proven over all
  8 fixtures including nested error detail. The port only has to produce a
  conforming DTO; no export-side mapping exists.
- **Fixture registry now has 8 ids;** `synthetic-hostile` is the only
  errors-bearing fixture (non-empty `errors` with nested detail) — useful
  for error-path UI work later.
- **The app shell is now data-dependent:** any spec instantiating `App`
  needs a `SNAPSHOT_PROVIDER` (stub pattern at the top of `app.spec.ts`).
- **Guards suite can consume ui sources:** `vitest.guards.config.mts` maps
  `devtools-bridge` to the library source; `export-privacy.spec.ts` is the
  precedent for relative imports from `projects/devtools-ui/`.
- **Env gotchas (extends the task-5 list):** stale dev servers on 4300
  (`fuser -k 4300/tcp`); for CDP download tests keep the browser WS open
  until the download completes, expect one automatic download per origin
  without a gesture, and never `pkill -f` a pattern contained in your own
  command line.

### Git State

`git diff --stat`:

```
 projects/devtools-bridge/src/lib/fixtures/index.ts |  2 +
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    | 17 ++++++-
 projects/devtools-ui/src/app/app.css               |  5 ++
 projects/devtools-ui/src/app/app.html              |  9 ++++
 projects/devtools-ui/src/app/app.spec.ts           | 55 +++++++++++++++++++++-
 projects/devtools-ui/src/app/app.ts                |  8 +++-
 vitest.guards.config.mts                           | 10 ++++
 7 files changed, 101 insertions(+), 5 deletions(-)
```

`git status --short`:

```
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-ui/src/app/app.css
 M projects/devtools-ui/src/app/app.html
 M projects/devtools-ui/src/app/app.spec.ts
 M projects/devtools-ui/src/app/app.ts
 M vitest.guards.config.mts
?? .claude/
?? guards/export-privacy.spec.ts
?? projects/devtools-bridge/src/lib/fixtures/synthetic-hostile.fixture.ts
?? projects/devtools-ui/src/app/shared/snapshot-export.service.spec.ts
?? projects/devtools-ui/src/app/shared/snapshot-export.service.ts
?? projects/devtools-ui/src/app/shared/snapshot-export.spec.ts
?? projects/devtools-ui/src/app/shared/snapshot-export.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
