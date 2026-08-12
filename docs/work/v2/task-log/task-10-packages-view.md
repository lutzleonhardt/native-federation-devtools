# Task 10: Packages tab — view model and default view

### Task

Built the V2 default view: pure `buildPackagesVm` builder + flat
master-detail Packages view over the kit, then reshaped it through seven
user-directed feedback rounds — flat leaf list (no expansion), quiet-norm
arrows, participant chips as cross-links, sentinel display mapping
(host/global), declaration-ratio counters, the winner-less multi-share
honest state, a dev-only fixture picker, and a wider master-detail ratio
default; plan gained Task 15 (Polishment) as the collection point for
splitter/stacking.

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts`
  (new) — pure vm builder: (scope, package) grouping, conflict flag
  (`strictExcluded` never flags), All/Conflicts filter, scopes summary
  (`__GLOBAL__` → 'global' display, verbatim kept), linked-sibling
  demotion of parent-linked subpaths (depth 1, always visible), flat kit
  rows with provider chips + "+n" consumer-only declarer count (names
  and verbatim actions in the tooltip), detail vm (negotiation with grounded action
  notes, winner-only provider with all three honest outcomes,
  no-winner `negotiationNote`, entries, integrity over distinct mapped
  targets, ladder-gated chunk section with `remoteDisplay`); arrow rule:
  only the unique elected winner is quiet — skip → winner's file,
  winner-less → 'none', scope and non-elected share copies → own copy.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts`
  (new) — 21 tests, fixture-driven (clean-skip, strict-split,
  strict-scope, self-fill, non-dense, frankenstein-live,
  synthetic-multi-version); every T10 AC mapped + purity.
- `projects/devtools-ui/src/app/views/packages/packages.ts|.html|.css`
  (new) — dumb component: filter/selection signals (`select` param
  seeds selection), kit wiring (TreeTable flat, MasterDetail,
  ParticipantRow with projected chip links, StateBadge), detail pane
  with chips-as-links (`/remotes?select=…`), entries → `/import-map`,
  kv-style chunk section; rule provenance as tooltips, `source-derived`
  as the only visible tag.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (new) —
  9 DOM tests: flat list + host chips + no visible rule chips, detail
  arrows, filter, linked-sibling tooltip, cross-link hrefs, row-click
  selection, multi-share note, wording sweep, error state.
- `projects/devtools-ui/src/app/shared/kit/participant-chip.ts|.html|.css`
  (new) — participant identity chip: remotes verbatim (mono), host as
  quiet 'host' chip with the `__NF-HOST__` sentinel as tooltip;
  `:host-context(a)` link affordance (pointer + hover-accent border).
- `projects/devtools-ui/src/app/shared/kit/participant-chip.spec.ts`
  (new) — remote verbatim, host chip + tooltip.
- `projects/devtools-ui/src/app/shared/kit/participant-row.ts|.html|.css`
  (modified) — `ParticipantArrow` + `{kind:'none'; reason}` (winner-less
  honest state), `arrow` input now OPTIONAL (quiet norm draws nothing),
  new `host` input, name renders via chip inside an `nfParticipant`
  ng-content slot with fallback (callers project linked chips; kit stays
  router-free); `.declared` nowrap, `.arrow-none` styling.
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts`
  (modified) — +4 tests: winner-less arrow, quiet no-arrow, host chip,
  name-slot projection override.
- `projects/devtools-ui/src/app/shared/kit/tree-table.css` (modified) —
  selected row also re-points `--nf-color-surface`/`--nf-color-border`
  so projected chips stay readable on the accent background.
- `projects/devtools-ui/src/app/shared/kit/master-detail.css` (modified)
  — proportional master column `minmax(220px, 40%)` (was fixed 320px).
- `projects/devtools-ui/src/app/shell/fixture-picker.ts|.html|.css` (new)
  — dev-only fixture switcher in the status line: grouped select
  (captured/synthetic) over `FIXTURES`, swaps `?fixture=` via pure
  `fixtureUrl` (keeps theme + hash route) and full-reloads; navigation
  seam for tests.
- `projects/devtools-ui/src/app/shell/fixture-picker.spec.ts` (new) —
  pure URL builder, option groups, primary preselect, change → navigate.
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — `/packages`
  route target `ViewPlaceholder` → `PackagesView`.
- `projects/devtools-ui/src/app/app.ts|.html` (modified) —
  `environment.shellExtras` rendered via `NgComponentOutlet` after the
  date badge (fixture picker mount point).
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — placeholder
  sweep now excludes `/packages` (real view); + picker mount test.
- `projects/devtools-ui/src/app/views/kit-demo.ts|.html` (modified) —
  new row variants (winner-less arrow, quiet host winner), optional
  arrow + host bindings.
- `projects/devtools-ui/src/environments/environment.ts` +
  `environment.extension.ts` (modified) — new `shellExtras` list
  (`[FixturePicker]` dev / `[]` extension); fileReplacements keeps the
  picker and all fixtures out of the packaged bundle.
- `docs/work/v2/plan.md` (modified) — new Task 15 "Polishment" block
  (movable splitter, narrow-panel stacking, collection point for
  further polish; notes the 40% ratio default landed here).

### Files Read (Context Only)

- `docs/work/v2/plan.md` — preamble + Task 10 block
- `docs/work/v2/task-log/task-9-view-kit.md` (kit surface, handed-over
  arrow extension + tooltip-wording duties),
  `task-7-store-derivations.md` (derived surface + rendering
  contracts), `task-8-shell-v2-store-strip.md` (shell contracts,
  select convention, affordances); `task-5` via targeted grep
  (fixture registry ground truth)
- Store module (`federation-model.ts`, `federation-store.ts`,
  `derived-model.ts`, `derivations.ts`, `derivations.spec.ts`),
  kit sources + specs, `kit-demo.*` (reference consumer),
  `capture-status.ts` (vm pattern), `app.*`, both environment files,
  `styles.css`, `fixture-snapshot-provider.ts` (`fixtureIdFromQuery`)
- Fixtures as spec ground truth: clean-skip, self-fill, strict-split,
  strict-scope, non-dense (grep), synthetic-multi-version (its header
  comment pins the no-interpreted-winner doctrine)

### Key Decisions

— session 2026-08-12

- **Initial build per plan block, then user-directed rework** (four
  explicit decisions): the plan's expanded version/participant tree rows
  plus always-visible linked siblings created two conflicting kinds of
  "under". Final shape: **flat leaf list** (negotiation lives only in
  the detail pane), rule tags as tooltips with `source-derived` as the
  only visible chip (the one claim not backed by capture evidence),
  host/remote participant chips, exception-only arrows.
- **Quiet norm, refined three times to its final simple rule: only the
  unique elected winner stays quiet.** Every other row says where it
  resolves — skip → winner's file, winner-less → honest reason
  ('none'), scope and non-elected share copies → own copy. Winner-less
  multi-share groups additionally get a `negotiationNote` ("no single
  elected version — n versions are declared share") — actions verbatim,
  never an interpreted winner (pinned by the synthetic-multi-version
  fixture doctrine); strict scope: arrows yes, note no (the
  pinned-scope chip explains the design). The intermediate
  "share/scope always quiet" rule hid exactly the "who gets what"
  answer and was rolled back on user feedback.
- **Sentinel display mapping**: `__NF-HOST__` → 'host' chip,
  `__GLOBAL__` → 'global' — verbatim always one hover away (tooltip)
  and unchanged in data/select payloads. Applied everywhere the
  sentinels surfaced (chips, arrow provider, chunk notes via
  `remoteDisplay`, scopes summary, detail meta).
- **Linked siblings**: parent-linked subpath packages render always
  visible at depth 1 under their parent (list order re-arranged
  defensively; store sort is near-adjacent anyway) — "20 packages
  listed" stays literally true on the live fixture; `name-derived`
  moved from a visible chip into the name tooltip (AC-06 amendment).
- **Kit extensions built with their first consumer** (Task-9 doctrine):
  arrow union `'none'`, optional `arrow` input, `host` input,
  `ParticipantChip` primitive, `nfParticipant` ng-content slot with
  fallback so consumers can project router-linked chips — the kit stays
  router-free; chip link affordance via `:host-context(a)` because
  emulated encapsulation blocks consumer CSS from child templates.
- **Row tail answers "who provides / who consumes"**: chips show ONLY
  providers (participants with a mapped copy — share or scope rows; up
  to 3, beyond that a count with names tooltip); skip-only declarers
  collapse to a muted "+n" whose tooltip lists names with their
  verbatim action ("also declared by: mfe1 (skip)"). The earlier
  `share/all` ratio was rejected as cryptic (three actions don't fit
  two numbers). Wording "declarers"/"providers", never "used by"
  (banned vocabulary).
- **Cross-links**: chips ARE the links (`/remotes?select=<verbatim>`),
  no separate text links; entries link `/import-map?select=<specifier>`;
  the chunk section links `/import-map` WITHOUT select — chunk-file
  specifier semantics belong to Task 12.
- **master-detail ratio default** `minmax(220px, 40%)` now; movable
  splitter + narrow-panel stacking deliberately deferred to the new
  plan Task 15 (Polishment) as the ongoing collection point.
- **Dev fixture picker via `environment.shellExtras`** +
  `NgComponentOutlet` — same transparent fileReplacements mechanism as
  the kit-demo route (no hidden build mutation); switching swaps only
  the `?fixture=` param and full-reloads by design (the provider reads
  the id at module-evaluation time).
- **Three visual kit bugs found by screenshotting, fixed at kit level**:
  long subpath names / spaced ranges wrapped rows (`nowrap` on
  `.pkg-name` + kit `.declared`); chips on the selected accent row were
  unreadable (tree-table selected row now re-points surface/border
  tokens, extending the Task-9 muted-token fix).
- **Affordance discipline kept**: dotted underline strictly for short
  tooltip-only elements — removed again from prose sentences and linked
  names after it crept in during the rework.

### Review Focus

- **Behavior claims:**
  - The live fixture renders exactly 20 flat leaf rows (16 base + 4
    linked siblings at depth 1), no twisties, no visible rule chips or
    sentinels; host packages carry the 'host' chip with `__NF-HOST__`
    as tooltip.
  - Only the elected winner is quiet: clean-skip shows one winner arrow
    (skip row) beside a silent winner; strict-split adds "→ own copy"
    on the scoped copy; synthetic-multi-version shows the no-winner
    note plus two own-copy claims. Row tails read `[provider chips] +n`
    (strict-split: `[host] [mfe3] +1`).
  - The chunk section is strictly ladder-gated: level package (bundle +
    files + mapped count), level remote (bound stated), level none
    (explicit absence), no unique winner (honest unavailability).
- **Assumptions / choices:** `select` is read once at init, no URL
  write-back; chunk-section link carries no select payload (Task 12
  defines chunk specifiers); provider shown on the unique winner row
  only; provider-chip threshold 3 with the >3 collapse branch existing
  only in the template (no fixture exercises it); residual wording
  "n declared, not mapped" covers files, not literally "chunks".
- **Scope notes:** kit API changes (optional arrow, host input, name
  slot, new chip), tree-table/master-detail CSS, shell/env wiring for
  the picker, and the plan's Task-15 block are user-directed additions
  beyond the Task-10 plan block; plan-block deviations (no list
  expansion, name-derived as tooltip, detail-pane arrows) are the
  approved UX rework. `.claude/` untracked session tooling stays out
  of commit scope.
- **Read next:**
  - `views/packages/packages-view-model.ts` (`buildRows`,
    `toKitArrow`, `buildDetail`) — the linked-sibling demotion and the
    quiet-norm/winner-less arrow rules ARE the view semantics.
  - `shared/kit/participant-row.html` + `.ts` — whether the
    `nfParticipant` fallback slot and the optional-arrow branches match
    your reading of the kit contract.
  - `shell/fixture-picker.ts` (`fixtureUrl`, `navigate` seam) — dev-only
    navigation logic and its extension-bundle exclusion.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui 159 (incl. 21
  vm + 9 view + 6 new kit tests), devtools-bridge 68, collector 58,
  guards 45 — **330 tests, 0 failures** (286 before Task 10).
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass after every rework round.
- **Bundle-exclusion proof:** `rg 'fixture-picker|FixturePicker|
  synthetic-multi-version|frankenstein-live' dist/extension/` → zero
  hits (picker and fixtures absent from the packaged extension).
- **Visual verification (chrome-devtools MCP, light + dark):** all six
  AC fixtures via `?fixture=` — frankenstein-live (20 rows, chips,
  level-package chunks), clean-skip (conflict + skip arrow + residual),
  strict-split (scope/skip same tag, isolated, 1/3 ratio), strict-scope
  (pinned, no conflict), self-fill (linked `/extra`), non-dense
  (level-remote bound), synthetic-multi-version (no-winner note);
  fixture picker exercised end-to-end (switch → reload → tab kept).
  The screenshot passes caught the three kit bugs fixed above.
- **No collector/fixture/store changes** — corpus, probe, ingest, and
  derivations untouched this task.

### Acceptance Coverage

- **T10-AC-01** — passed: vm spec (conflict label, skip winner-arrow,
  quiet winner) + `packages.spec.ts` detail-arrow test. Amendment:
  participant rows render in the DETAIL pane (flat-list rework), the
  arrow claim itself is unchanged.
- **T10-AC-02** — passed: vm spec strict-split describe — distinct
  scope/skip rows for one tag (store order scope→skip), isolated label
  naming mfe3, action verbatim.
- **T10-AC-03** — passed: vm spec strict-scope describe — two share
  rows, NO conflict indicator, pinned exact tags never ranges, joined
  version summary, side-by-side arrows without the no-winner note.
- **T10-AC-04** — passed: vm spec (20 packages, host-provided
  level-'package' with bundle→chunk file, whiteboard level-'none'
  explicit absence) + DOM half (20 flat rows, host chips).
- **T10-AC-05** — passed: vm spec non-dense — level-'remote' bound
  ("package attribution not derivable", 7 groups) instead of a gap.
- **T10-AC-06** — passed: vm spec + DOM — `/extra` at depth 1 directly
  under its parent, own-copy semantics, parent link in the detail.
  Amendment: `name-derived` tag rendered as name tooltip, not a chip.
- **T10-AC-07** — passed: vm spec + DOM — Conflicts filter narrows
  (self-fill 2→1), strict-only scopes summary without `__GLOBAL__`,
  honest empty note when nothing matches.
- **T10-AC-08** — passed: vm purity spec (same input → deep-equal, no
  input mutation); template consumes vm rows only (DOM specs assert
  vm-driven rendering; XC-06 review property).
- **XC-03** (contributes) — chips/entries carry `select` cross-links;
  `/packages?select=` seeds selection (DOM-tested).
- **XC-04 / XC-05 / XC-06** (contributes) — honest absence states
  throughout; channel signaling untouched (strip owns it); pure spec'd
  builder + dumb template.

### Open Issues

- The >3-providers collapse ("n providers" + tooltip) exists only as a
  template branch — no fixture has >3 providers per package; cover with
  a seeded vm case or fixture if it ever matters (→ Task 15 candidate).
- Chunk-section Import-Map link carries no `select` — chunk-file
  specifier semantics to be defined by the Import Map view (→ Task 12).
- Movable splitter + narrow-panel stacking (→ Task 15, plan block
  added this session).
- `kv-list` kit primitive still has no real consumer (the detail pane
  hand-rolls its label/value rows because kv-list links are
  external-only) — extend or retire with Task 11/12.
- `target="_blank"`/MV3 panel behavior + anchor clicks join the pre-PR
  manual smoke after Task 14 — carried from Task 8/9.
- Orchestrator generations before the observed two remain unvalidated —
  carried from Task 6/6.5.
- Merge-vs-shim-map divergence surface → Task 13 material — carried
  from Task 6.
- `ng build devtools-bridge` (ng-packagr path) still fails with the
  pre-existing TS6059 rootDir errors — carried since Task 4, shipping
  path unaffected.

### Context for Next Task

Task 11 (Remotes tab) can treat as validated: **the view→vm→kit
pattern including the extended kit surface** — flat list + detail over
a pure builder, quiet-norm arrows, sentinel display mapping, chips as
cross-links, and the final action/tooltip vocabulary now live in
`packages-view-model.ts` as the reference.

- **Kit surface (extended this task):** `ParticipantChip` (`name`,
  `host`) with `:host-context(a)` link affordance; `ParticipantRow`
  gains `host`, OPTIONAL `arrow` (absent = quiet norm), arrow kind
  `'none'` (reason verbatim), and the `nfParticipant` slot (project a
  router-linked chip; fallback renders the plain chip). TreeTable rows
  work fully flat (`expandable: false` everywhere, no twisties).
- **Conventions to keep:** sentinels never as visible text —
  `__NF-HOST__` → 'host', `__GLOBAL__` → 'global', verbatim in
  tooltips; **select payloads stay verbatim** (cross-links arrive as
  `/remotes?select=__NF-HOST__` — the Remotes view must match the
  sentinel, not the display name); provenance rules as tooltips,
  `source-derived` as the only visible tag; dotted underline only on
  short tooltip-only elements, chips-in-anchors get pointer +
  hover-accent automatically.
- **Dev loop:** fixture picker in the status line switches
  `?fixture=<id>` previews (keeps tab/theme); `#/kit-demo` still shows
  all kit variants.
- **Gotchas:** consumer CSS cannot reach kit-internal elements
  (emulated encapsulation — style chips via the kit, not the view);
  `option[selected]`/`[value]` bind DOM properties, not attributes
  (query by property in specs); `URLSearchParams.set` keeps the
  existing param position; Angular strips whitespace-only text nodes
  (spacing via margins, learned in Task 9, still applies).

### Git State

`git diff --stat` (tracked files):

```
 docs/work/v2/plan.md                               | 48 ++++++++++++++
 projects/devtools-ui/src/app/app.html              |  3 +
 projects/devtools-ui/src/app/app.routes.ts         |  3 +-
 projects/devtools-ui/src/app/app.spec.ts           | 19 ++++--
 projects/devtools-ui/src/app/app.ts                |  7 +-
 .../src/app/shared/kit/master-detail.css           |  4 +-
 .../src/app/shared/kit/participant-row.css         |  8 +++
 .../src/app/shared/kit/participant-row.html        |  9 ++-
 .../src/app/shared/kit/participant-row.spec.ts     | 74 +++++++++++++++++++++-
 .../src/app/shared/kit/participant-row.ts          | 45 ++++++++++---
 .../devtools-ui/src/app/shared/kit/tree-table.css  |  7 +-
 projects/devtools-ui/src/app/views/kit-demo.html   |  1 +
 projects/devtools-ui/src/app/views/kit-demo.ts     | 21 +++++-
 .../src/environments/environment.extension.ts      |  3 +
 .../devtools-ui/src/environments/environment.ts    |  9 +++
 15 files changed, 239 insertions(+), 22 deletions(-)
```

`git status --short`: the modifications above plus untracked:

```
?? .claude/
?? projects/devtools-ui/src/app/shared/kit/participant-chip.css
?? projects/devtools-ui/src/app/shared/kit/participant-chip.html
?? projects/devtools-ui/src/app/shared/kit/participant-chip.spec.ts
?? projects/devtools-ui/src/app/shared/kit/participant-chip.ts
?? projects/devtools-ui/src/app/shell/fixture-picker.css
?? projects/devtools-ui/src/app/shell/fixture-picker.html
?? projects/devtools-ui/src/app/shell/fixture-picker.spec.ts
?? projects/devtools-ui/src/app/shell/fixture-picker.ts
?? projects/devtools-ui/src/app/views/packages/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
