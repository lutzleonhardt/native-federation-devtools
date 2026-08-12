# Task 11: Remotes tab — view model and view

### Task

Built the Remotes tab — the transposed per-remote projection (identity,
capability badges, remote-qualified exposes, this remote's dependency
rows, chunk-attribution ladder, scoped externals, capture-boundary
note) over a pure `buildRemotesVm` builder; lifted the cross-view
vocabulary into `shared/view-conventions.ts` with its second consumer;
then a user review round inverted the elected marker to exception
marking, replaced zero chunk counts with explicit absence claims, and
muted the own-copy arrow norm. Plus two out-of-band items: a NUL-byte
hygiene fix in `derivations.ts` (outside commit scope) and the new
Task-11.5 plan block.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/view-conventions.ts` (new) —
  cross-view vm conventions lifted from the packages modules (T10/T10.5
  vocabulary): `STRICT_SCOPE`/`GLOBAL_SCOPE`, `packageId`,
  `participantDisplay`, `ACTION_SYMBOLS`/`ACTION_NOTES`/
  `NEGOTIATION_LEGEND`, and the shared row-mapping rules `declaredOf` +
  `explicitArrowOf`. Deliberately NOT in the kit (the kit interprets no
  registry names).
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts`
  (modified) — local vocabulary removed; re-exports keep every existing
  import site stable (10.5 facade pattern).
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts`
  (modified) — consumes the shared vocabulary; `toKitArrow` is now the
  quiet-norm gate over `explicitArrowOf`; re-exports
  `NEGOTIATION_LEGEND` so the packages facade surface is unchanged.
- `projects/devtools-ui/src/app/shared/kit/participant-row.css`
  (modified) — `--nf-arrow-own-opacity` custom-property hook on
  `.arrow-own` (default 1: exception-only callers like Packages keep
  full tone; custom properties pierce emulated encapsulation).
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts`
  (new) — FACADE: left list in model order (host flag, expose/shared
  summary), `REMOTES_BOUNDARY_NOTE`, honest empty note; re-exports the
  detail types.
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts`
  (new) — detail half: identity as `KvItem[]` (scope URL as recorded +
  resolved), capability badges, exposes with remote-qualified naive-join
  specifier (live `/./` kept literal), dependency rows (always-explicit
  arrow, `noElection` exception marker with strict-scope guard), chunk
  ladder with `fileClaim` (absence claim instead of zero counts),
  true scoped externals.
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.spec.ts`
  (new) — 18 fixture-driven tests; every T11 AC mapped + purity +
  strict-scope guard + tslib absence-claim ground truth.
- `projects/devtools-ui/src/app/views/remotes/remotes.ts|.html|.css`
  (new) — dumb view: flat TreeTable of participant chips + summary,
  MasterDetail, `select` param seeds selection with the VERBATIM remote
  name (incl. `__NF-HOST__` sentinel), boundary note under the list.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.ts|.html|.css`
  (new) — dumb detail component; package name projected as router link
  into the kit participant-row's `nfParticipant` slot, `no single
  elected version` marker via `nfRowLinks`, glyph legend, kv-list's
  first real consumer (identity section).
- `projects/devtools-ui/src/app/views/remotes/remotes.spec.ts` (new) —
  11 DOM tests: list + boundary note, sentinel seeding + badge matrix,
  transposed skip row + package-link href, quiet winner, winner-less
  marker, scoped/non-dense split, `/./` expose, row-click selection,
  vocabulary sweep, error state.
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — `/remotes`
  route target `ViewPlaceholder` → `RemotesView`.
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — `/remotes`
  moved out of the placeholder sweep into a real-view assertion.
- `docs/work/v2/plan.md` (modified) — new Task 11.5 block (chunk-claim
  wording alignment in the Packages detail; 10.5 addendum pattern).
- `projects/devtools-ui/src/app/shared/store/derivations.ts` (modified)
  — **hygiene, outside task-11 scope**: two raw NUL bytes (invisible
  separators in internal dedup keys, lines 235/342) replaced by the
  explicit `\u0000` escape — runtime-identical, but `file(1)` no longer
  classifies the source as binary. Recommend a separate micro-commit.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 11 block (+ 10.5 block as
  addendum format reference)
- `docs/work/v2/task-log/task-10-packages-view.md` +
  `task-10.5-mapped-multiplicity.md` (direct predecessors: kit surface,
  select conventions, conflict semantics, split pattern);
  `task-7-store-derivations.md` + `task-6-normalized-store-ingest.md`
  via targeted grep (SharedRowFacts embeds the ingest row; ExposeJoin
  `/./` tolerance and honest join absence)
- Store module (`federation-model.ts`, `derived-model.ts`,
  `federation-store.ts`, `ingest.ts` scoped-externals section,
  `derivations.spec.ts` badge/ladder ground truth)
- Kit sources (`participant-row.*`, `tree-table.*`, `master-detail.*`,
  `capability-badge.*`, `kv-list.*`, `participant-chip.*`)
- Packages view as the reference consumer (facade, row/detail/chunk vm,
  `packages.ts|.html`, `package-detail.*`, `package-negotiation.*`,
  `packages.spec.ts` harness pattern)
- Fixtures as spec ground truth: frankenstein-live, clean-skip, scoped,
  non-dense, strict-scope, synthetic-multi-version, synthetic-empty-page

### Key Decisions

— session 2026-08-12

- **Always-explicit arrows in the transposed view** (user decision at
  briefing): with only one participant visible per package, a quiet row
  is ambiguous — the quiet norm needs the full negotiation in sight and
  stays a Packages-detail convention. T11-AC-02's "arrow" wording is
  satisfied literally; the arrow mapping itself is shared
  (`explicitArrowOf`), Packages gates it behind the winner check.
- **Review round (three user findings on the shipped view):**
  1. *elected chip inverted to exception marking* — the chip marked the
     NORM (every host row carried it), inverting the T10 doctrine
     ("only exceptions speak"). Now the winner-less share row carries
     `no single elected version` (existing vocabulary from the packages
     negotiation note); the elected winner is quiet. The strict scope
     NEVER raises the marker (side-by-side is design; pinned tag +
     scope chip explain it) — own spec case.
  2. *zero chunk counts → absence claims* — corpus-verified: the live
     host's chunk repo lists only 3 bundles; `browser-tslib`/
     `browser-angular_platform_browser` exist only as participant
     bundle names. `files: []` is the no-list marker (spec-pinned since
     T7), so rendering "0 chunk files" over-claimed a counted quantity;
     `fileClaim` now says "no chunk list recorded in this capture".
  3. *own-copy arrow muted* — norm visible but quiet (opacity 0.55 via
     the kit hook); skip arrows and honest 'none' states lead the scan.
- **Vocabulary lift target `shared/view-conventions.ts`, not the kit**
  — `participantDisplay` interprets the `__NF-HOST__` sentinel and the
  kit's contract is to interpret no registry names.
- **Remote-qualified expose = `${name}/${moduleName}`** — exactly the
  naive map-join specifier, so live `/./` infixes render literally
  (whiteboard/./Bootstrap) and match the map evidence.
- **`ScopedPackageRow.scope` is the remote NAME** (ingest ground
  truth), so scoped-external attribution is a plain filter — no scope
  URL matching needed.
- **kv-list kept ("extend"), not retired** — the identity section is
  its first real consumer; its external-only `href` fits the resolved
  scope URL.
- **NUL bytes were not an encoding error** — `iconv` clean (NUL is
  valid UTF-8); they were collision-proof key separators literalized as
  raw bytes. Escaping to `\u0000` preserves runtime keys exactly.
  Repo-wide sweep (`git ls-files | xargs file`): only `favicon.ico` is
  legitimately binary. Origin mechanism PROVEN by accidental
  reproduction: the first write of THIS log literalized the escape
  again — the agent tool-call pipeline parses backslash-u escape
  sequences in string payloads into raw bytes (fixed the same way,
  byte-level replace). Gotcha for agent-written files: after any write
  whose content mentions escape sequences, re-check the file with
  `grep -naP '\x00'` / `file(1)`.

### Review Focus

- **Behavior claims:**
  - frankenstein-live: three remotes in model order with the host
    marked; badge matrix host = dense chunking + dense externals + SRI,
    whiteboard/mermaid = SRI only; host detail shows 12 dependency rows
    with muted `→ own copy` arrows and NO marker (quiet norm); the
    clean-skip mfe1 row shows the full-tone arrow
    `→ _nf_lab_conflict_lib.jvcc6K1csg.js mfe2` with action chip skip.
  - No-list bundles claim "no chunk list recorded in this capture"
    (tslib, @angular/platform-browser pinned in the vm spec) — never a
    zero count; non-dense mfe3 renders 7 `@nf-internal/` groups at
    level 'remote' and an empty scoped section; scoped mfe1 renders the
    true scoped package as its own subsection.
  - Winner-less share rows (synthetic-multi-version) carry the
    `no single elected version` marker; the strict scope never does.
- **Assumptions / choices:** select payloads stay verbatim (list ids =
  remote names incl. `__NF-HOST__`); the expose "mapped" link carries
  `select=<qualified>` as best effort — Import Map matching tolerance
  is Task-12 material; no conflict indicator in the remotes list (not
  in the plan block; PackageConflict left unused here).
- **Scope notes:** `derivations.ts` NUL hygiene is OUTSIDE task-11
  scope (separate micro-commit recommended); `README.md` was modified
  in parallel outside this task — exclude from task-11 staging;
  `plan.md` gained the Task 11.5 block; the kit css opacity hook is a
  deliberate kit extension shipped with its first consumer;
  `packages-detail-vm.ts`/`packages-vm-shared.ts` shrank by the lift
  with re-exports keeping the facade surface identical.
- **Read next:**
  - `views/remotes/remotes-detail-vm.ts` (`depsOf`, `chunksOf`) — the
    always-arrow rule, the `noElection` strict-scope guard, and the
    `fileClaim` absence branch ARE the transposed semantics.
  - `shared/view-conventions.ts` — the lifted contract both views now
    share; check the re-export chain keeps the packages surface intact.
  - `views/remotes/remote-detail.html` — slot projection (package link
    in `nfParticipant`, marker in `nfRowLinks`) against the kit
    contract.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui **194**
  (was 165: +18 vm + +11 DOM tests), devtools-bridge 68, collector 58,
  guards 45 — **365 tests, 0 failures**.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass ("Extension bundle check passed (2 JS, 2 HTML files scanned)");
  `rg 'fixture-picker|FixturePicker|synthetic-multi-version|
  frankenstein-live' dist/extension/` → zero hits.
- **Visual verification (chrome-devtools MCP, dev server `?fixture=`,
  dark + light):** live list + host detail (badges, quiet elected rows,
  muted arrows, level-package chunks incl. both absence claims) +
  whiteboard (SRI only, `/./` expose with mapped link, level-none);
  clean-skip mfe1 (skip arrow to winner file); non-dense mfe3
  (7 `@nf-internal` level-remote groups, no scoped section); scoped
  mfe1 (scoped-externals subsection); synthetic-multi-version calendar
  (`no single elected version` marker). Cross-link roundtrip clicked:
  remotes host detail → rxjs package link → Packages with rxjs
  selected.
- **NUL fix evidence:** before — `file` = "data",
  `grep -naP '\x00'` hit lines 235/342, `iconv` exit 0; after —
  `file` = "JavaScript source, UTF-8 text", zero NUL matches, 194 UI
  tests unchanged. Repo sweep: only `favicon.ico` non-text.

### Acceptance Coverage

- **T11-AC-01** — passed: vm spec (3 remotes model order + host flag;
  live badge matrix host/whiteboard/mermaid) + DOM (list chips + badge
  labels via sentinel select).
- **T11-AC-02** — passed: vm spec clean-skip mfe1 (single dep, own
  declaration + winner arrow + package select) / mfe2 (quiet winner) +
  synthetic winner-less + strict-scope guard; DOM package-link href +
  single dep row. Amendment (review round): the briefing's elected
  marker was inverted to the `noElection` exception marker — AC wording
  ("own declaration + arrow with a package link") unaffected.
- **T11-AC-03** — passed: vm spec scoped mfe1 (true scoped package) +
  non-dense mfe3 (level-'remote', 7 groups, scoped empty) + DOM halves.
- **T11-AC-04** — passed: vm spec whiteboard expose (qualified
  `whiteboard/./Bootstrap`, absolute mapTarget) + host honest-empty +
  DOM.
- **T11-AC-05** — passed: boundary-note wording spec (capture claim,
  never error) + DOM render; purity spec (deep-equal, inputs
  unmodified); templates consume vm rows only (DOM specs; XC-06 review
  property).
- **XC-03** (contributes) — `/remotes?select=` seeds verbatim (DOM);
  package links `/packages?select=<scope>|<pkg>`, expose links
  `/import-map?select=<qualified>`; roundtrip clicked live.
- **XC-04 / XC-05 / XC-06** (contributes) — honest absence states
  throughout (capabilities, exposes, deps, chunks, boundary); channel
  signaling untouched; pure spec'd builders + dumb templates.

### Open Issues

- Packages detail still renders the no-list bundle as
  "0 · 0 mapped · loaded on demand" + differently-worded note — wording
  alignment via shared claim builders (→ Task 11.5, plan block added
  this session).
- `derivations.ts` NUL hygiene fix sits in the working tree — land as
  its own micro-commit, not inside the task-11 commit (user decision at
  commit time).
- `README.md` modified outside this task — exclude from task-11
  staging.
- Expose "mapped" link `select=<qualified>` matching tolerance (`/./`
  infix) to be defined by the Import Map view (→ Task 12).
- Carried: conflicts-filter nonempty-narrowing fixture + >3-providers
  branch (→ Task 15), movable splitter/stacking (→ Task 15), MV3
  anchor smoke after Task 14, TS6059 on `ng build devtools-bridge`
  (since Task 4).

### Context for Next Task

Task 12 (Import Map tab) can treat as validated: **the transposed
view→vm→kit pattern and the bidirectional cross-link roundtrip**
(`/packages?select=` ↔ `/remotes?select=` incl. sentinel matching).

- **Select payloads arriving at `/import-map?select=`** come from TWO
  senders now: packages entries send the served entry name
  (`@nf-lab/conflict-lib`), remotes exposes send the naive-join
  qualified specifier (`whiteboard/./Bootstrap`). Matching should
  tolerate the literal `/./` infix (ingest already does on the join
  side); the packages chunk-section link still carries NO select.
- **`shared/view-conventions.ts` is the vocabulary home** — sentinel
  display, glyphs + legend, select-id builders, `declaredOf`,
  `explicitArrowOf`. Task 11.5 will add the chunk-claim builders there;
  new views consume it instead of redefining wording.
- **Kit surface:** unchanged except the `--nf-arrow-own-opacity` hook
  (default 1). The `nfParticipant` slot happily hosts non-participant
  identities (remotes projects package links); `nfRowLinks` carries
  trailing markers.
- **Inputs ready for Task 12:** `importMapEntries` (flattened effective
  map with scope + integrity) and `providers` (per-target derivation)
  are untouched store surface since Task 6/7.
- **Gotchas:** custom properties pierce emulated encapsulation (the
  sanctioned way to tune kit visuals per view); `file(1)` classifying a
  source file as "data" means embedded NUL, not bad UTF-8 — check with
  `grep -naP '\x00'` before suspecting encoding.

### Git State

`git diff --stat` (tracked files):

```
 README.md                                          | 91 +++++++++++++++++++++-
 docs/work/v2/plan.md                               | 48 ++++++++++++
 projects/devtools-ui/src/app/app.routes.ts         |  3 +-
 projects/devtools-ui/src/app/app.spec.ts           | 10 ++-
 .../src/app/shared/kit/participant-row.css         |  3 +
 .../src/app/shared/store/derivations.ts            |  4 +-
 .../src/app/views/packages/packages-detail-vm.ts   | 61 ++++-----------
 .../src/app/views/packages/packages-vm-shared.ts   | 25 +++---
 8 files changed, 175 insertions(+), 70 deletions(-)
```

(`README.md` is a parallel user edit, `derivations.ts` the out-of-band
hygiene fix — both outside task-11 staging scope.)

`git status --short`: the modifications above plus untracked:

```
?? .claude/
?? projects/devtools-ui/src/app/shared/view-conventions.ts
?? projects/devtools-ui/src/app/views/remotes/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
