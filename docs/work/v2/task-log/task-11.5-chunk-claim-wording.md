# Task 11.5: Chunk-claim wording — packages detail aligns with the remotes absence claim

### Task

Single-sourced the chunk-file claim in `shared/view-conventions.ts`
(`countClaim` + `chunkFileClaim`): the Remotes detail vm consumes the
shared builders instead of its local copies, and the Packages detail
renders the same claim — the no-list case replaces the zero-count KV
line ("0 · 0 mapped · loaded on demand") and absorbs the redundant
note below it; the positive case keeps its counts and mapped tally.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified)
  — new shared claim builders: `countClaim(count, noun)` (pluralizing
  count claim) and `chunkFileClaim(files)` (empty list → the absence
  sentence, else `countClaim(n, 'chunk file')`); doc pins the T7
  no-list marker and the T11 absence doctrine.
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts`
  (modified) — local `countClaim` copy and the absence literal removed;
  `chunksOf` consumes the shared builders. Pure lift, wording
  byte-identical (existing spec pins stayed green untouched).
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts`
  (modified) — facade re-export of `chunkFileClaim` (10.5 pattern:
  packages modules import shared vocabulary via this seam).
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts`
  (modified) — `packageEntry` gains `fileClaim: string` from the shared
  builder (additive; `files`/`mappedCount` unchanged).
- `projects/devtools-ui/src/app/views/packages/package-detail.html`
  (modified) — chunk-files KV line: no-list case renders the absence
  claim alone (no zero counts), positive case renders
  `<claim> · N mapped · loaded on demand`; the differently-worded
  `view-observation` note below the (empty) file list is removed.
  `package-detail.css` needed no change.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts`
  (modified) — @angular/common `packageEntry` pin extended with
  `fileClaim: '1 chunk file'`; new test pins the absence claim for both
  live no-list bundles (tslib `browser-tslib`,
  @angular/platform-browser `browser-angular_platform_browser`).
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts`
  (modified) — `chunkClaimOf` DOM helper (finds the chunk-files dd via
  its dt label) + two DOM tests: absence claim without zero counts and
  without a chunk list; listed bundle keeps
  `1 chunk file · 1 mapped · loaded on demand`.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 11.5 block
- `docs/work/v2/task-log/task-11-remotes-view.md` (direct predecessor:
  vocabulary home, absence doctrine, corpus facts),
  `task-10.5-mapped-multiplicity.md` (created `packages-chunk-vm.ts`;
  facade pattern), `task-7-store-derivations.md` (targeted grep:
  `files: []` as the spec-pinned no-list marker)
- `projects/devtools-bridge/src/lib/fixtures/frankenstein-live.fixture.ts`
  (tslib host row + `browser-tslib` bundle as ground truth)
- `shared/store/derivations.ts` (`deriveChunkAttribution` — the
  `?? []` join producing the no-list marker) and
  `shared/store/ingest.ts` (zero-entry bundle lists skipped at ingest —
  review verification that level-'remote' groups cannot be empty)
- `views/remotes/remote-detail.html` (fileClaim render style),
  `views/remotes/remotes-view-model.spec.ts` (existing wording pins)

### Key Decisions

— session 2026-08-12/13

- **Two builders, not one**: generic `countClaim` (Remotes keeps
  `countClaim(n, 'file')` for level-'remote' groups — that wording is
  its own) plus the gating `chunkFileClaim`. The zero-gate lives ONLY
  in `chunkFileClaim`; a caller passing 0 to `countClaim` gets a
  verbatim "0 …" claim. Corpus-safe today: ingest skips zero-entry
  bundle lists (`ingest.ts:138`), so the only reachable empty list is
  the bundle-chunk-join `?? []` — exactly the gated path.
- **AC-02 identity proof via literal pins**: both vm specs pin the
  exact claim strings ('1 chunk file', 'no chunk list recorded in this
  capture'). Deliberately NOT asserted by importing the builder into
  the expectation — that would be tautological.
- **The positive KV line gains the noun**: `1 chunk file · 1 mapped ·
  loaded on demand` (was `1 · 1 mapped · …`). Counts and mapped tally
  kept per the task block; the bare number becoming a claim is the
  point of the lift.
- **Template keeps its own `files.length > 0` branch** (duplicates the
  builder's decision): accepted because the same branch already gates
  the file list below; a vm-level `hasFiles` would remove the
  duplication (review LOW, → Task 15 polish candidate).
- **Absence-row tooltip kept**: the dd title still says "joined from
  the registry bundle-chunk lists" on the no-list row — the named
  bundle IS the join evidence; slight over-claim accepted (review LOW).

### Review Focus

- **Behavior claims:**
  - frankenstein-live packages detail: tslib and
    @angular/platform-browser render `no chunk list recorded in this
    capture` in the chunk-files KV line — no zero counts, no file
    list, no secondary note; @angular/common renders
    `1 chunk file · 1 mapped · loaded on demand` plus its file list.
  - The claim wording is byte-identical in Packages and Remotes (same
    builder; live cross-check on the remotes host detail returned
    identical strings for all three packages).
  - Behavior otherwise unchanged — Remotes is a pure lift, the store
    surface is untouched.
- **Assumptions / choices:** the positive count line gains the noun
  (wording upgrade, not just alignment); `countClaim` is exported
  ungated (zero-gate documented in `chunkFileClaim` only).
- **Scope notes:** None — 7 files, all inside the task surface;
  `.claude/` stays untracked session tooling.
- **Read next:**
  - `shared/view-conventions.ts` (`chunkFileClaim`) — the single
    source; absence literal + pluralization are the whole contract.
  - `views/packages/package-detail.html` chunk block — the KV branch
    and the removed note; check the Import Map link survives both
    branches.
  - `views/packages/packages-chunk-vm.ts` (`packageEntry`) — additive
    field; `mappedCount` logic untouched.

### Test Evidence

— session 2026-08-12/13

- **Full chain green:** `CI=true npm test` → devtools-ui **197**
  (was 194: +1 vm test, +2 DOM tests), devtools-bridge 68,
  collector 58, guards 45 — **368 tests, 0 failures**.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass ("Extension bundle check passed (2 JS, 2 HTML files scanned)").
- **Single-source sweep:** `rg` over the UI source — the claim
  literals exist only in `view-conventions.ts` plus spec pins (both vm
  specs pin identical strings).
- **Visual verification (chrome-devtools MCP, dev server
  `?fixture=frankenstein-live`):** tslib detail shows the absence
  claim in the CHUNKS kv block (bundle line kept, no note below);
  @angular/common shows `1 chunk file · 1 mapped · loaded on demand`
  + `chunk-WW26EZ22.js`. Remotes host detail cross-checked via DOM
  script: claims byte-identical for tslib / platform-browser / common.
- **Coverage review (`/review coverage`):** 7/7 files partitioned,
  ledger complete; no HIGH/MEDIUM findings; two LOW observations
  recorded as Task-15 candidates (template double-branch, absence
  tooltip). The `countClaim(0, …)` masquerade risk was checked and
  is unreachable in current data paths.

### Acceptance Coverage

- **T11.5-AC-01** — passed: vm spec ('claims chunk-list absence for
  no-list bundles…' — both live no-list bundles + @angular/common
  counts) + DOM specs ('renders the absence claim…', 'keeps counts and
  the mapped tally…'); visually confirmed on the dev server.
- **T11.5-AC-02** — passed: builders live only in
  `view-conventions.ts` (source sweep); both vm specs pin the
  identical literals; live cross-view check returned identical
  strings.
- **T11.5-AC-03** — passed: full chain 368/0 + both bundle checks;
  Remotes lift behavior-neutral (its specs untouched and green).

### Open Issues

- Template `files.length > 0` branch duplicates the builder's
  decision; a vm-level `hasFiles` or full-line claim would
  single-source the branch too (→ Task 15 polish).
- Absence-row tooltip still claims the join wording (→ Task 15
  polish, together with the branch item).
- `countClaim` has no zero-gate — add a doc line or mini-pin before
  Task 12 builds new count claims over import-map entries.
- Carried from Task 11: conflicts-filter nonempty-narrowing fixture +
  >3-providers branch (→ Task 15), movable splitter/stacking
  (→ Task 15), expose-select `/./` matching tolerance (→ Task 12),
  MV3 anchor smoke after Task 14, TS6059 on `ng build devtools-bridge`
  (since Task 4).

### Context for Next Task

Task 12 (Import Map tab) can treat as validated: **the chunk-claim
vocabulary in `view-conventions.ts` is the settled wording home** —
any file-count claim a new view renders should go through
`countClaim`/`chunkFileClaim` instead of new literals.

- **Gotcha `countClaim(0, …)`**: renders a verbatim zero claim; gate
  zero-reachable call sites (absence claim or honest empty state)
  the way `chunkFileClaim` does.
- **Select payload tolerance** (carried): `/import-map?select=` gets
  the served entry name from packages entries and the naive-join
  qualified specifier (literal `/./` infix) from remotes exposes.
- **Environment gotchas (dev-server verification):** a dev server
  started in the sandboxed Bash runs in its own network namespace —
  host Chrome (MCP, port 9222) cannot reach it; start it outside the
  sandbox on a free port (host 4200 is often occupied by the lab
  app, whose page titles itself "Device Collaboration Platform").
  With hash routing, `?fixture=` belongs BEFORE the `#`
  (`location.search`), `select=` after it (router query param):
  `http://localhost:4201/?fixture=frankenstein-live#/packages?select=…`.

### Git State

`git diff --stat`:

```
 .../devtools-ui/src/app/shared/view-conventions.ts | 17 ++++++++++++
 .../src/app/views/packages/package-detail.html     | 10 ++++---
 .../src/app/views/packages/packages-chunk-vm.ts    | 16 +++++++++--
 .../app/views/packages/packages-view-model.spec.ts | 24 ++++++++++++++++
 .../src/app/views/packages/packages-vm-shared.ts   |  1 +
 .../src/app/views/packages/packages.spec.ts        | 32 ++++++++++++++++++++++
 .../src/app/views/remotes/remotes-detail-vm.ts     | 14 ++--------
 7 files changed, 96 insertions(+), 18 deletions(-)
```

`git status --short`: the modifications above plus untracked
`.claude/` (session tooling, not part of this task's commit scope).
