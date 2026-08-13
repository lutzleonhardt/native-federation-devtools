# Task 12: Import Map tab — annotated raw evidence view

### Task

Built the Import Map tab — the raw evidence view rendered from the store
(`importMapEntries` + `providers` + chunk joins), replacing the Task-8
placeholder: sectioned tables in map order with owner-consensus headers,
per-row attribution (package link, provider, chunk bundle) with the three
honest outcomes, the verbatim honesty caption, `/./`-tolerant select
matching — plus the user-decided closure of the Task-10 chunk-link issue
(per-file "mapped" deep links in the Packages detail over a new shared
chunk-map join) and two user-directed UX rework rounds (single-line
tables, cross-section column-width sync).

### Status

DONE

(The five accepted review findings are landed — review-fix session
2026-08-13. Ready for `/commit 12`.)

### Files Modified

- `projects/devtools-ui/src/app/shared/chunk-map-join.ts` (new) — the
  single source of the chunk cross-link: pure join chunk file ↔
  effective-map entry, reproducing the ingest's `ChunkGroup.mapped`
  resolution exactly (`resolveUrl(file, remote.resolvedScopeUrl ??
  pageUrl)`); `chunkJoinsByTarget` index. Consumed by BOTH the Packages
  chunk vm and the Import Map vm, so the two views cannot contradict
  each other by construction (the T10.5 `mappedTags` doctrine).
- `projects/devtools-ui/src/app/shared/chunk-map-join.spec.ts` (new) —
  6 tests: consistency pin (per group, every file joins an entry iff the
  ingest `mapped` flag holds) looping ALL corpus fixtures (fixtures
  without chunk groups pass vacuum-green — the pin claims "join ==
  ingest `mapped` flag for every group in the corpus"), live 7/7 chunk
  joins (specifier form, scope, SRI, bundle attribution), non-dense
  pseudo groups join onto their own specifiers, honest `entry: null`
  for unmapped files, purity, by-target index.
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts`
  (new) — pure `buildImportMapVm` (XC-06): sections in map order (GLOBAL
  IMPORTS first, then scope prefixes, first-appearance order from the
  flattened entries), scope-section owner as CONSENSUS of the rows'
  provider derivations (honest `mixed` fallback), per-row vm with
  `targetDisplay` (relative to page base; foreign origin stays absolute
  and pops), `packageSelect` (specifier = package link), the three
  honest provider outcomes with provenance notes, `providerQuiet`
  (quiet norm per owned scope section), chunk attribution via the shared
  join (`groupLabel`/`groupNoun` bundle vs chunk group), select matching
  with literal-`/./` tolerance (`collapseDotInfix`, mirrors the ingest
  expose join), `trailingLabel` for constant 4-column geometry, verbatim
  `IMPORT_MAP_CAPTION`, honest empty states for both empty-map paths.
  Review fixes landed: one neutral `emptyNote` for both mapMode-'none'
  paths, `packageSelects` keyed `${specifier}\u0000${target}` (alias
  specifiers stay link-free), `toChunkVm` aggregates multi-claim targets
  (`groupLabel` lists all bundles, `groupNoun` gains 'bundles'), neutral
  mixed-owner note.
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts`
  (new) — 21 fixture-driven tests + SEEDED cases (foreign origin,
  most-specific tie via two remotes on one scopeUrl, alias specifier on
  a shared target, chunk file claimed by two bundle lists); every T12 AC
  mapped, quiet-norm/trailing-label pins, targetDisplay pins, purity;
  builder supports `sharedExternals` (`seededParticipant`), both
  mapMode-'none' paths pinned to one neutral note, mixed-owner note
  pinned.
- `projects/devtools-ui/src/app/views/import-map/import-map.ts|.html|.css`
  (new) — dumb view: one `<table class="import-table">` per section
  (fixed layout, shared column widths → all sections width-synchronized),
  specifier cell as router link when `packageSelect` derives, SRI as
  aligned ✓ column, adaptive trailing attribution column (provider chip /
  ambiguous `StateBadge` / "unattributable" / bundle link), section
  header with owner chip, `select` read once at init, effect scrolls the
  first highlighted row into view.
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts`
  (new) — 6 DOM tests: section order + owner chip + sentinel rule +
  column discipline + relative targets, cross-link hrefs (XC-03),
  caption verbatim + mapMode-'none' empty state (neutral-note pin),
  SEEDED ambiguous badge + unattributable without guessed owner chips,
  `/./`-tolerant select highlight, honest failed-capture state.
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts`
  (modified) — `packageEntry.files` joined per file via the shared
  chunk-map join: new `fileRows: ChunkFileRowVm[]` (file, mapped
  evidence {specifier, targetUrl, hasIntegrity, select}); `mappedCount`
  now derives from the same set as the links (cannot diverge);
  `buildChunkSection` gains the `model` parameter.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` +
  `packages-view-model.ts` (modified) — thread `model` down to the chunk
  section builder.
- `projects/devtools-ui/src/app/views/packages/package-detail.html|.css`
  (modified) — chunk file rows render `<file> mapped [SRI]` with
  "mapped" as the deep link (`/import-map?select=<real specifier>`,
  title = target URL) or the honest "not mapped" observation; the naked
  group-level "open in Import Map" link is REMOVED (user decision).
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts`
  (modified) — chunk toEqual pin extended with `fileRows`; new
  cross-view roundtrip test: the packages chunk select payload resolves
  to exactly its row in `buildImportMapVm` (same join source).
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts`
  (modified) — new DOM test: per-file mapped link href/title/SRI, group
  link absent.
- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified)
  — `countClaim` gains an optional irregular-plural parameter
  (`countClaim(22, 'entry', 'entries')`); doc updated. All prior
  consumers unaffected (default `noun + 's'`).
- `projects/devtools-ui/src/app/app.routes.ts` (modified) —
  `/import-map` route target `ViewPlaceholder` → `ImportMapView`.
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — `/import-map`
  moved out of the placeholder sweep into the real-view assertion;
  Diagnostics stays the last placeholder.
- `handoff.md` (deleted this session) — temporary plan for the five
  accepted review findings; fixes landed, file removed before
  `/commit 12`.

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 12 block
- `docs/work/v2/task-log/task-11.5-chunk-claim-wording.md` +
  `task-11-remotes-view.md` (predecessors: wording home, select-payload
  senders, environment gotchas), `task-7-store-derivations.md`
  (providers contract: one derivation per unique target, candidates
  most-specific-first with host always last), `task-9-view-kit.md`
  (virtual-scroll deferral → decided here), `task-8-shell-v2-store-strip.md`
  (placeholder, select convention, affordances), `task-10-*` /
  `task-10.5-*` (re-read on user request: sentinel display, chips-are-
  links, provenance-as-tooltip, split pattern, glyphs — semantic-change
  sweep before the briefing)
- Store module (`federation-model.ts`, `derived-model.ts`, `ingest.ts`
  incl. `resolveRow`/`allFilesMapped`/`collapseDotInfix`,
  `merge-document-maps.ts` `resolveUrl` export, `derivations.spec.ts`
  seeded patterns — `seededParticipant`/`sharedExternals` reused as the
  alias-seed template in the review-fix session)
- Reference consumers: remotes view (component/vm/spec harness),
  packages detail (entries "mapped" pattern), `state-badge.*`,
  `participant-chip.ts`, kit css tokens, `styles.css`
- Fixtures as ground truth: frankenstein-live (map structure: 22 global
  + 1 scope ("./" → page base) × 7 chunk entries; sharedChunks = 3 real
  bundles = exactly those 7 files), non-dense (v4.5 pseudo groups),
  strict-scope (3-column geometry case), synthetic-empty-page
  (mapMode 'none'), synthetic-no-import-maps (importMaps: null —
  review finding 1 ground truth), clean-skip
- `docs/specs/native-federation-devtools-v2.md` §2 (during the user's
  election-semantics question: election priority host version >
  `profile.latestSharedExternal` > least extra downloads,
  `determine-shared-externals.ts:126-184`)

### Key Decisions

— session 2026-08-13

- **Shared join module instead of two per-view joins**: Task 12 defines
  the chunk-specifier semantics (carried from T10); both directions
  (packages file → map row, import-map row → owning group) consume ONE
  pure module whose resolution reproduces the ingest `mapped` flag
  exactly (spec-pinned per group over corpus fixtures). No naming
  guesses (`@nf-internal/` + basename was corpus-true but stays
  un-relied-upon) — the join is target-URL-based.
- **Per-file "mapped" links, Entries-grammar (user decision)**: the
  naked group-level "open in Import Map" link is gone; each chunk file
  row carries `mapped` (select = the joined entry's REAL specifier,
  tooltip = target URL, SRI chip) or the honest "not mapped". The
  cross-view roundtrip is pinned: payload out == row selected in
  `buildImportMapVm`.
- **UX rework round 1 (user: "optisch unruhig") — single-line tables**:
  the two-line row + annotation layout was rebuilt as one table per
  section. Noise sources removed: (1) specifier IS the package link
  (the `package <name>` annotation repeated the specifier verbatim in
  20/22 global rows), (2) `targetDisplay` relative to the page base
  (verbatim URL one hover away; foreign origin stays absolute — honest
  signal), (3) quiet-norm providers: in a scope section whose header
  names the consensus owner, owner-restating rows stay silent (T10
  "only exceptions speak"); the global section keeps the provider
  column (no norm), (4) SRI as aligned ✓ column. Expandable sections
  rejected (29 live rows; collapse would be speculative — Task 15 if
  real apps explode).
- **UX rework round 2 (user) — cross-section column sync**: fixed table
  layout with shared widths (spec 34% · target rest · SRI 3rem ·
  trailing 15rem). After the strict-scope screenshot showed broken
  geometry with conditionally dropped columns, the trailing attribution
  column now ALWAYS exists; only `trailingLabel` adapts ('served by' /
  'bundle' / both / ''). Verified numerically: identical th geometry
  across all sections in live AND strict-scope.
- **Scope-section owner = consensus, never the scope key**: ownership is
  not encoded in the map format (scope pins the perspective, not the
  provider); the header claims a remote only when ALL row providers
  agree — else the honest `mixed` state. Live: page-base scope → host
  with `hostFallback: true` (the 7 chunk targets match no remote
  prefix).
- **Select matching = collapse-`/./`-both-sides, all matches highlight,
  scroll to first** (read once at init, no URL write-back). Serves all
  three sender payload shapes: served entry name (packages entries),
  naive-join qualified specifier (remotes exposes, literal `/./`), real
  chunk specifier (packages chunk files, new).
- **No virtual scrolling (T9-carried decision point)**: live corpus =
  29 rows; CDK would be speculation. Revisit only with real-app
  evidence.
- **`countClaim` irregular-plural parameter** instead of a new literal
  ("22 entrys" bug); zero-gate note from T11.5: import-map sections are
  created on first entry only, so `countClaim(0, …)` is unreachable
  here.
- **Ambiguous note wording respects the T7 candidates contract**: the
  list is most-specific-first with the host always LAST (fallback tail,
  not part of the tie) — the note lists candidates without claiming
  they are all tied.
- **v4.5 pseudo groups label 'chunk group', not 'bundle'** (`groupNoun`)
  — a pseudo-external group carries no bundle; claiming one would
  over-state.
- **Review round (7 findings) — 5 accepted → `handoff.md`, 2 rejected
  (user decision)**: accepted: (1) empty-note over-claims observed
  absence for `importMaps: null` (HIGH — neutral wording, both none
  paths pinned), (2) target-only package join can mislink alias
  specifiers (specifier-based join + seed), (3) `toChunkVm` claims[0]
  silently first-picks multi-claim targets (list all claims — both are
  TRUE evidence, deliberately NOT an ambiguous badge), (4) mixed-owner
  note says "differs" even for n=1 (neutral wording + pin), (5)
  join-spec loops 3 of 11 fixtures while claiming corpus coverage (loop
  all). Rejected: "XC-03 demands name-as-link" (works-as-designed —
  the convention links via dedicated elements everywhere; every row
  type carries its pivot), "no-list bundles lost the import-map link"
  (deliberate user decision this session; the Entries `mapped` link
  remains the package's import-map pivot; no select target exists for
  a bundle without files).
- **Election-semantics side finding (user question)**: documented spec
  ground truth — election priority is host version >
  `profile.latestSharedExternal` > least extra downloads; range
  satisfaction plays no role in winner choice (only in per-participant
  skip/scope/error afterwards). clean-skip disproves host-priority-
  always (winner mfe2, host absent). Range-evaluator lint stays the
  Task-13 candidate.

— session 2026-08-13 (review fixes)

- **One neutral empty note for both none paths**: `mapMode 'none'`
  covers `documentMaps: []` (scan ran) AND `importMaps: null` (scan
  never ran); "the page carries no import map tags" claimed an
  observation the second path never made. The view must not
  distinguish channels (XC-05 — the strip signals them), so ONE
  neutral wording for both, pinned over both fixtures in vm + DOM.
- **Package join key = specifier + target, not target alone**: a
  package link renders only where the row's specifier IS the package
  name and the target matches the row's resolution
  (`${specifier}\u0000${target}` key); an alias specifier on the same
  target stays link-free (SEEDED pin). Strictly narrower than before —
  no corpus pin moved.
- **Multi-claim chunk label lists all bundles**: several claims on one
  target are simultaneously TRUE registry evidence (esbuild chunk in
  two bundle lists) — `groupLabel` joins the deduped bundle labels with
  ' · ', `groupNoun` says 'bundles'; deliberately NOT an ambiguous
  badge. Single-claim output stayed byte-identical (existing toEqual
  pins and the packages roundtrip untouched).
- **Mixed-owner note claims only non-derivability**: "attribution
  differs" was false for a single ambiguous row; now "no single owning
  remote derivable for this scope" (pinned in the tie seed).
- **Corpus loop accepts vacuum-green fixtures**: the join consistency
  pin runs over ALL `FIXTURES`; fixtures without chunk groups pass
  vacuously — the claim is "join == ingest `mapped` flag for every
  group in the corpus", not "every fixture has groups".
- The `\u0000` escape-literalization gotcha (T11/T12 log) struck again
  while editing the vm — raw NUL byte written instead of the 6-char
  sequence; fixed via `perl -pe 's/\x00/\\u0000/g'`, all touched files
  re-verified clean with `grep -naP '\x00'`.

### Review Focus

- **Behavior claims:**
  - frankenstein-live renders two width-synchronized tables: 22 global
    rows (mixed provider chips, host fallback for page-base targets) and
    the page-base scope section (7 chunk rows, owner chip "host", NO
    provider column, bundle links); all 29 rows carry SRI ✓; targets
    render relative to the page base with verbatim URLs as tooltips.
  - Packages detail (@angular/common): chunk file row
    `chunk-WW26EZ22.js mapped [SRI]` deep-links
    `/import-map?select=@nf-internal/chunk-WW26EZ22` and that select
    highlights exactly its row (cross-view roundtrip, pinned + clicked
    live); the claim line still reads
    `1 chunk file · 1 mapped · loaded on demand` counting the same set.
  - Hardened honesty (review fixes): both mapMode-'none' paths render
    the same neutral empty note; an alias specifier on a shared target
    gets NO package link; a chunk file claimed by two bundle lists
    names both bundles ('bundles'); the mixed-owner note claims only
    non-derivability.
- **Assumptions / choices:** owner-consensus rule for scope headers (the
  plan's "annotated with the owning remote" implemented as consensus
  with honest mixed fallback); `packageSelects` first-win by store order
  per (specifier, target) key; trailing column always present for
  geometry (empty label when nothing renders); multi-claim chunk rows
  keep `bundleName`/`pseudoPackage`/`select` from the FIRST claim (all
  claims share the owning remote in the corpus; only the label
  aggregates).
- **Scope notes:** Packages-side changes (per-file links) are the
  user-approved closure of the T10-carried chunk-specifier issue;
  `view-conventions.ts` gained the plural parameter; `.claude/` is
  untracked session tooling and stays OUT of the commit; `handoff.md`
  was deleted after the fixes landed.
- **Read next:**
  - `views/import-map/import-map-view-model.ts` (`packageSelects`,
    `toChunkVm`, `ownerOf`, `rowOf`) — the review-fix core plus the
    view semantics (consensus owner, quiet norm, targetDisplay); check
    the `\u0000` key sites render as escape sequences, not raw bytes.
  - `shared/chunk-map-join.ts` + its spec — the ONE join both views
    consume; the all-fixtures consistency pin against the ingest
    `mapped` flag is the load-bearing contract.
  - `views/packages/packages-chunk-vm.ts` (`fileRowsOf`) — per-file
    evidence rows; `mappedCount` must provably count the same set the
    links render.

### Test Evidence

— session 2026-08-13

- **Full chain green:** `CI=true npm test` → devtools-ui **230**
  (was 197: +6 join, +19 vm, +6 DOM, +1 packages roundtrip, +1 packages
  DOM, existing packages pins extended), devtools-bridge 68, collector
  58, guards 45 — **401 tests, 0 failures**. Progression during the
  session: 368 → 398 (initial view) → 400 (table redesign) → 401
  (column-geometry fix).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass ("Extension bundle check passed (2 JS, 2 HTML files scanned)");
  dev-leak sweep `rg 'fixture-picker|FixturePicker|synthetic-multi-
  version|frankenstein-live|kit-demo|KitDemo' dist/extension/` → zero
  hits.
- **Visual verification (chrome-devtools MCP, dev server on host port
  4201, dark + light):** live fixture both sections (order, owner chip,
  SRI column, relative targets); packages → chunk "mapped" click →
  import-map row highlighted + scrolled into view; remotes expose
  payload `whiteboard/./Bootstrap` and collapsed form both highlight
  exactly one row; synthetic-empty-page honest empty state; non-dense
  (mfe3 scope owner derived non-fallback, pseudo groups as 'chunk
  group'); strict-scope 3-table geometry identical after the
  trailing-column fix (th positions verified numerically via script).
- **Column-geometry proof:** evaluate_script over all `.import-table`
  th boxes — identical left/width across sections (live: spec 518 /
  target 658 / SRI 60 / trailing 252; strict-scope: all three tables
  equal).
- **NUL-byte incident (tooling, not product):** writing `handoff.md`
  literalized its own `\u0000` escapes into raw bytes (`file` → "data")
  — the exact T11 gotcha; fixed byte-level (`perl -pi -e
  's/\x00/\\u0000/g'`), re-checked clean.

— session 2026-08-13 (review fixes)

- **Full chain green after the five fixes:** devtools-ui **232**
  (+2 SEEDED: alias specifier link-free, two-bundle chunk claim),
  devtools-bridge 68, collector 58, guards 45 — **403 tests,
  0 failures**. `npm run build:extension` + `npm run
  check:panel-bundle` pass.
- **Byte-identity guard held:** single-claim chunk pins
  (`import-map-view-model.spec.ts` toEqual, packages roundtrip) and all
  corpus packageSelect pins stayed green UNCHANGED through fixes 2+3.
- **NUL sweep clean:** `grep -naP '\x00'` over the vm and all touched
  spec files after the perl fix — zero hits.

### Acceptance Coverage

- **T12-AC-01** — passed: vm spec (sections/order/countClaims, owner =
  host with hostFallback, SRI iff integrity covers the target — pinned
  against `model.effectiveMap.integrity`) + DOM (section labels, 29
  rows, 29 SRI marks, owner chip, column discipline, relative-target
  tooltip).
- **T12-AC-02** — passed: vm spec (chunk row full pin incl. bundle +
  select; package rows' select payloads; non-dense pseudo groups;
  SEEDED alias-no-link and two-bundle-claim hardening) + DOM hrefs
  (`/packages?select=__GLOBAL__|@angular/common`,
  `/remotes?select=__NF-HOST__`, bundle link) + packages-side roundtrip
  test and DOM link test; clicked live.
- **T12-AC-03** — passed: caption byte-pinned in vm + DOM on populated
  AND empty captures; both mapMode-'none' paths (`documentMaps: []` and
  `importMaps: null`) pinned to the same neutral empty note (vm fixture
  loop + DOM).
- **T12-AC-04** — passed (SEEDED): foreign origin → "unattributable"
  (vm note + DOM text, no chip); most-specific tie → ambiguous
  `StateBadge` with candidates (host last, T7 contract), scope owner
  mixed with the neutral note pinned (vm + DOM).
- **T12-AC-05** — passed: purity spec (deep-equal, inputs unmodified,
  model AND derived); templates consume vm rows only (DOM specs; XC-06
  review property).
- **XC-03** (contributes) — specifier→packages, provider/owner/bundle→
  remotes, packages chunk files→import-map; roundtrips pinned and
  clicked.
- **XC-04 / XC-05 / XC-06** (contributes) — honest outcomes throughout
  (ambiguous/unattributable/mixed/empty states); empty-note and
  mixed-owner wording channel-neutral and observation-true; pure
  spec'd builders + dumb templates.

### Open Issues

- v4.5 pseudo-group rows repeat the specifier in the bundle column
  (group identity == map specifier there) — honest but redundant
  (→ Task 15 candidate).
- Rejected review findings recorded for the record: XC-03 name-as-link
  (works-as-designed), no-list-bundle group link removed (user
  decision; Entries `mapped` link is the pivot).
- Carried: conflicts-filter nonempty-narrowing fixture + >3-providers
  branch (→ Task 15), movable splitter/stacking (→ Task 15), MV3 anchor
  smoke after Task 14, TS6059 on `ng build devtools-bridge` (since
  Task 4). Resolved this task: expose-select `/./` matching tolerance
  (T11-carried) — defined and pinned here; range-satisfaction lint
  (→ Task 13 candidate, reaffirmed by the election-semantics
  discussion). Resolved in the review-fix session: all five accepted
  review findings (see Key Decisions); `handoff.md` deleted.

### Context for Next Task

Task 13 (Diagnostics) can treat as validated: **the registry↔map join
surface is complete and single-sourced** — `shared/chunk-map-join.ts`
(chunk file ↔ entry, ingest-consistent), `derived.providers` (target →
deployment, three honest outcomes), and the flattened `importMapEntries`
render verbatim in map order. Diagnostics can cite these joins instead
of re-deriving them.

- **Select conventions (all senders now live):** `/packages?select=
  <scope>|<pkg>`, `/remotes?select=<verbatim incl. __NF-HOST__>`,
  `/import-map?select=<specifier>` with literal-`/./` tolerance
  (collapse BOTH sides); multi-match highlights all rows, scrolls to
  first; `select` is read once at init.
- **Honest-state vocabulary in the view:** provider chips (derived),
  `StateBadge ambiguous` (tie), "unattributable" text (foreign origin),
  `mixed` owner note, neutral empty-map notes — wording is
  channel-neutral and observation-true; the strip alone signals
  channel state (XC-05).
- **Election ground truth for Diagnostics lints:** winner = host
  version > `profile.latestSharedExternal` > least extra downloads
  (spec §2, `determine-shared-externals.ts:126-184`); a "winner outside
  a declarer's range" lint needs a range evaluator
  (`semver-compare.ts` is deliberately a comparator only).
- **Gotchas:** sandboxed `ss` cannot see host ports (dev server may
  still be alive on host 4201 — check with an unsandboxed command, not
  from inside the sandbox); `?fixture=`/`?theme=` belong BEFORE the
  `#`, `select=` after it; theme param is consumed by a reload race —
  navigate fresh if a screenshot looks wrong; agent-written files that
  MENTION `\u0000` escapes may get raw NUL bytes literalized — check
  with `grep -naP '\x00'` after writing; with `table-layout: fixed`,
  conditionally dropped columns break cross-table geometry — keep the
  column and adapt its label instead.

### Git State

`git diff --stat` (tracked files):

```
 projects/devtools-ui/src/app/app.routes.ts         |  3 +-
 projects/devtools-ui/src/app/app.spec.ts           | 20 +++---
 .../devtools-ui/src/app/shared/view-conventions.ts | 10 ++-
 .../src/app/views/packages/package-detail.css      |  7 ++-
 .../src/app/views/packages/package-detail.html     | 25 ++++++--
 .../src/app/views/packages/packages-chunk-vm.ts    | 72 +++++++++++++++++++---
 .../src/app/views/packages/packages-detail-vm.ts   |  4 +-
 .../app/views/packages/packages-view-model.spec.ts | 34 ++++++++++
 .../src/app/views/packages/packages-view-model.ts  |  2 +-
 .../src/app/views/packages/packages.spec.ts        | 24 ++++++++
 10 files changed, 171 insertions(+), 30 deletions(-)
```

`git status --short`: the modifications above plus untracked (after
`handoff.md` deletion):

```
?? .claude/
?? docs/work/v2/task-log/task-12-import-map-view.md
?? projects/devtools-ui/src/app/shared/chunk-map-join.spec.ts
?? projects/devtools-ui/src/app/shared/chunk-map-join.ts
?? projects/devtools-ui/src/app/views/import-map/
```

(`.claude/` is session tooling and stays OUT of the commit; this task
log and the chunk-map-join/import-map sources belong IN it.)
