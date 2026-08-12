# Task 10.5: Conflict semantics — mapped multiplicity, glyphs, view split

### Task

Addendum to Task 10 (user feedback on the shipped view): redefined the
conflict indicator from declared to MAPPED multiplicity so the badge and
the row's new mapped-copy version list speak about the same set (a clean
skip no longer warns), replaced the indistinguishable ○/◌ action glyphs
with shape-distinct ●/◆/○, split the two oversized files
(`packages-view-model.ts`, `packages.html`) along their natural seams,
and added config-origin tooltips that disambiguate the strict naming
collision (scope name vs `strictVersion` flag vs `scope` action).

### Status

DONE

### Files Modified

- `projects/devtools-ui/src/app/shared/store/derived-model.ts`
  (modified) — `PackageConflict` reshaped: `tags` →
  `declaredTags` + `mappedTags` (non-skip rows), doc states the
  mapped-multiplicity doctrine; `DerivationRule`
  `'version-multiplicity'` → `'mapped-multiplicity'`.
- `projects/devtools-ui/src/app/shared/store/derivations.ts`
  (modified) — `deriveConflicts` fills both tag lists;
  `conflict`/`strictExcluded` now key on `mappedTags.length > 1`
  (declared-only multiplicity is the election succeeding — never
  flagged).
- `projects/devtools-ui/src/app/shared/store/derivations.spec.ts`
  (modified) — T7-AC-07 describe reworked: clean-skip now asserted
  conflict-free (one mapped tag), strict-split added as the positive
  mapped-multiplicity case, strict-scope keeps `strictExcluded`;
  provenance loop expects `mapped-multiplicity`.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts`
  (rewritten) — now the FACADE only: grouping, scopes summary,
  `buildPackagesVm`, public type re-exports (spec/view imports
  unchanged); 638 → ~135 lines.
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts`
  (new) — internal seam: `PackageGroup`, `packageId`, `winnerOf`,
  `participantDisplay`, scope constants.
- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts`
  (new) — row half: `PackageRowVm` with new `versions:
  RowVersionVm[]` (mapped copies, winner first, others muted with
  own-copy tooltip; winner-less all unmuted), badge label
  `⚠ n versions mapped` counting the SAME set, `buildRows`.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts`
  (new) — detail half: negotiation/entries/integrity builders and
  detail types; `ACTION_SYMBOLS` now `share ●, scope ◆, skip ○`
  (shape-distinct; filled = mapped copy, circle = in the election,
  diamond = isolated); exports `NEGOTIATION_LEGEND` (single source
  with symbols/notes, re-exported via the facade).
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts`
  (new) — `ChunkSectionVm` + ladder-gated `buildChunkSection`,
  unchanged logic moved out of the former monolith.
- `projects/devtools-ui/src/app/views/packages/packages.html|.ts|.css`
  (modified) — view keeps toolbar + flat list (row renders the
  versions list with `.pkg-version-muted` dimming and note tooltips);
  detail pane delegates to `nf-package-detail`; detail styles moved
  out; 332 → ~110 template lines.
- `projects/devtools-ui/src/app/views/packages/package-detail.ts|.html|.css`
  (new) — dumb detail component (`detail` input, nullable → selection
  prompt): meta, entries, integrity, chunks; negotiation delegated.
- `projects/devtools-ui/src/app/views/packages/package-negotiation.ts|.html|.css`
  (new) — dumb negotiation section (versions + note inputs):
  version heads, participant rows, provider line, residual, and the
  quiet glyph legend (`NEGOTIATION_LEGEND`, notes as tooltips).
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts`
  (modified) — clean-skip asserts NO badge + single version span;
  filter test now expects `Conflicts (0)` → honest empty note on
  self-fill; new strict-split DOM test (badge wording, muted scoped
  copy + tooltip, filter keeps the package).
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts`
  (modified) — `versionSummary` assertions → `versions` arrays;
  clean-skip conflict-free; strict-split badge/versions/glyph
  assertions (◆/○); synthetic-multi-version badge added; filter
  describe split into clean-empties and mapped-keeps cases.
- `projects/devtools-ui/src/app/shared/kit/participant-row.html`
  (modified) — config-origin tooltips: the strict marker names
  `strictVersion: true`, the pinned tag names the lost
  `requiredVersion` range and the strict share scope.
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts`
  (modified) — strict-marker tooltip asserts the config-field
  reference.
- `docs/work/v2/plan.md` (modified) — new Task 10.5 block
  (instructions, AC incl. AC-04 config-origin tooltips, out-of-scope
  range-evaluator note).

### Files Read (Context Only)

- `docs/work/v2/task-log/task-10-packages-view.md` (rework context),
  `docs/work/v2/plan.md` (Task 6.5 block as the addendum pattern)
- Fixtures as ground truth: `self-fill.fixture.ts` (skip resolves
  cleanly → drops out of Conflicts),
  `synthetic-multi-version.fixture.ts` (single package — cannot serve
  the narrowing test), strict-split via screenshots + derivations
- `shared/store/semver-compare.ts` (comparator only — pins the
  out-of-scope decision on range satisfaction),
  `shared/kit/master-detail.*` (projection contract),
  `shared/kit/participant-row.ts` (signal-input style), `styles.css`
  (`view-observation` is global; `.tip`/`.mono` are per-component)

### Key Decisions

— session 2026-08-12

- **Conflict = mapped multiplicity, decided in the STORE, not the vm**:
  the indicator's home is `deriveConflicts` so Remotes/Diagnostics
  inherit the corrected semantics; the vm consumes `mappedTags`
  verbatim. Root insight (user finding): the old declared-keyed badge
  warned on clean-skip — the mechanism's cleanest success — and
  diverged from the winner-only row version. Badge and row now derive
  from the same set, so they cannot diverge by construction.
- **"mapped", not "runs"**: the badge says `n versions mapped` because
  import-map presence IS the capture evidence; execution claims would
  overreach (doctrine: capture-grounded wording). Rule renamed to
  `mapped-multiplicity` to match.
- **Muted-tag note stays verbatim**: `own copy of mfe3 (scope)` — with
  a unique winner every other mapped tag is necessarily a scope row
  (a second share row would make the election winner-less), but the
  note renders the row's verbatim action anyway instead of hardcoding
  'scope'.
- **Glyphs distinguish by shape, not fill pattern**: ○ vs ◌ differ
  only in stroke pattern — unreadable at 11px (user finding). New
  encoding ● share / ◆ scope / ○ skip carries two dimensions: filled
  = a mapped copy exists, circle = participates in the election,
  diamond = isolated. Dropping the glyphs entirely (action chip sits
  beside them) was considered and rejected — they anchor the scan.
- **Split via pure modules + dumb components, NO service** (user asked
  "split or service?"): the builder is deliberately a pure function
  (XC-06); a service would add DI ceremony without state. vm →
  facade + shared/row/detail/chunk modules (facade re-exports keep
  every import site unchanged); template → `package-detail` +
  `package-negotiation` dumb components. Kit stays untouched; the
  new components are view-level and may use RouterLink.
- **Style duplication accepted at the split**: emulated encapsulation
  means `.tip`/`.mono`/`.chip-link` must live in each component's
  css; `view-observation` stays global (styles.css).
- **Filter narrowing lost its fixture**: under mapped semantics
  self-fill has zero conflicts (its skip resolves in range), and no
  fixture mixes conflicted + clean packages. The DOM/vm filter tests
  now cover clean → honest empty note and strict-split → kept;
  narrowing to a nonempty strict subset is fixture-uncovered (open
  issue, same class as the >3-providers branch).
- **Config-origin tooltips over renames** (user-directed, second
  feedback round): the strict naming collision (share scope `strict`
  ≠ flag `strictVersion` ≠ action `scope`) is upstream API — the
  scope NAME selects the no-election semantics
  (orchestrator `shared-externals.repository.ts:95`,
  `process-remote-entries.ts:97`), so the UI disambiguates via
  provenance tooltips naming the config origin verbatim
  (`shareScope: '<name>'`, global = "no shareScope configured",
  `strictVersion: true`, pinned tag = lost `requiredVersion`).
  Toolbar scope summary keeps its verbatim-sentinel tooltip (spec-
  pinned); the detail scope line now always carries the tip
  affordance.
- **Task-10 commit amended (`5645c6f` → `905a608`)**: the original
  staging list missed both environment files (shellExtras wiring),
  leaving the committed tree inconsistent (`app.ts` referenced a field
  the committed environments lacked). Amend was safe — branch has no
  upstream; both files carried pure Task-10 material.

### Review Focus

- **Behavior claims:**
  - clean-skip renders badge-free (`Conflicts (0)`, row
    `2.0.0 [mfe2] +1`); strict-split keeps `⚠ 2 versions mapped`
    with the scoped `1.0.0` dimmed and tooltip
    `own copy of mfe3 (scope)`; strict scope stays excluded.
  - The row's version list and the badge count are the same set
    (`mappedTags`) in every state, including winner-less groups
    (all tags unmuted, no privileged version).
  - Negotiation glyphs render ● (share), ◆ (scope), ○ (skip) —
    verified visually on strict-split (light dot column reads
    distinctly at 11px).
  - Every scope surface and the strict marker name their config
    origin in tooltips (`shareScope: '<name>'`, global default note,
    `strictVersion: true`, pinned = lost `requiredVersion`).
- **Assumptions / choices:** "mapped copy" continues to mean
  non-skip row (the Task-10 providers convention) — the map-join
  success of each copy remains the Entries/Integrity section's story;
  `versionSummary: string` was replaced (not kept alongside) since
  the facade re-exports made the rename atomic across specs.
- **Scope notes:** store-layer change (`PackageConflict` shape +
  rule rename) — intentional, Task 10 had pledged "no store changes"
  which is why this is a separate task; Task-10 commit amended (see
  Key Decisions). `.claude/` session tooling stays untracked.
- **Read next:**
  - `shared/store/derivations.ts` (`deriveConflicts`) — the semantic
    core: declared vs mapped tag collection and the strict exclusion.
  - `views/packages/packages-row-vm.ts` (`rowVersionsOf`) — winner
    ordering, muting rule, and the note wording ARE the new row
    contract.
  - `views/packages/packages-view-model.ts` — check the facade
    re-exports cover everything external consumers used before.

### Test Evidence

— session 2026-08-12

- **Full chain green:** `CI=true npm test` → devtools-ui **165**
  (was 159: +3 semantics/glyph tests, +2 tooltip-origin tests, one
  filter test reshaped), devtools-bridge 68, collector 58, guards 45
  — **336 tests, 0 failures**.
- **Builds:** `npm run build:extension` + `npm run check:panel-bundle`
  pass ("Extension bundle check passed (2 JS, 2 HTML files
  scanned)").
- **Visual verification (chrome-devtools MCP, dev server
  `?fixture=`):** strict-split — ●/◆/○ clearly distinct, row
  `2.0.0 · 1.0.0` with dimmed scoped tag, badge `⚠ 2 versions
  mapped`; clean-skip — no badge, `Conflicts (0)`, row
  `2.0.0 [mfe2] +1`. Dark theme screenshots; glyph shapes and
  opacity-based muting are theme-token-independent.
- **No collector/fixture changes** — corpus, probe, and ingest
  untouched; the store change is the derivation layer only.

### Acceptance Coverage

- **T10.5-AC-01** — passed: `derivations.spec.ts` (clean-skip
  conflict-free, strict-split flagged, strict-scope excluded) +
  `packages.spec.ts` DOM halves (no badge / badge wording /
  `Conflicts (0)`).
- **T10.5-AC-02** — passed: vm spec versions arrays (strict-split
  muted scoped copy with tooltip, strict-scope + synthetic all
  unmuted) + strict-split DOM test asserting the same set as the
  badge.
- **T10.5-AC-03** — passed: glyph assertions (vm spec ◆/○ +
  strict-split screenshot) + glyph-legend DOM assertions
  (`packages.spec.ts`, three items with note tooltips; legend
  verified visually); template sizes packages.html ~115,
  package-detail.html ~140, package-negotiation.html ~100; full
  chain green + bundle checks (behavior otherwise unchanged).
- **T10.5-AC-04** — passed: `packages.spec.ts` (scope chip +
  detail-scope + pinned-scope tooltips on strict-scope, global
  default note on clean-skip) and `participant-row.spec.ts`
  (strict marker names `strictVersion: true`).
- **T10-AC-01 / T10-AC-07** — amended (recorded in the Task-10 spec
  headers): clean-skip is deliberately no longer a conflict; the
  filter's narrowing fixture became the honest-empty case.

### Open Issues

- Conflicts-filter narrowing to a NONEMPTY subset has no fixture
  (no capture mixes conflicted and clean packages) — same class as
  the >3-providers branch (→ Task 15 candidate).
- Range-satisfaction warning ("elected version outside a skip
  declarer's declared range") deliberately out of scope — needs a
  semver range evaluator; `semver-compare.ts` stays a comparator
  (→ Task 13 Diagnostics candidate).
- Master-pane rows can overflow horizontally with the wider badge +
  version list (pane scrolls by design; splitter lands in Task 15).
- Carried from Task 10: chunk-section Import-Map link without
  `select` (→ Task 12), movable splitter/stacking (→ Task 15),
  `kv-list` without consumer (→ Task 11/12), MV3 anchor smoke after
  Task 14, TS6059 on `ng build devtools-bridge` (since Task 4).

### Context for Next Task

Task 11 (Remotes tab) inherits the corrected conflict surface and the
split pattern:

- **`PackageConflict` now carries `declaredTags` + `mappedTags`;
  `conflict` means mapped multiplicity** (rule `mapped-multiplicity`,
  strict scope excluded). Any Remotes/Diagnostics conflict rendering
  must key on the flag, never on declared counts.
- **Row versions contract**: `PackageRowVm.versions` (winner first,
  non-winner mapped tags muted + note; winner-less all unmuted) —
  reuse the shape if Remotes lists per-package versions.
- **Glyph vocabulary is now ● share / ◆ scope / ○ skip**
  (`ACTION_SYMBOLS`, `packages-detail-vm.ts`) — keep consistent in
  any view that renders actions.
- **Split pattern for oversized views**: pure vm modules behind a
  facade (re-exports keep import sites stable) + dumb section
  components; NO services. Per-component css must duplicate `.tip`/
  `.mono`/`.chip-link` (emulated encapsulation); `view-observation`
  is global.
- **Gotcha**: with a unique winner, every other mapped tag is a scope
  row by construction (second share row ⇒ winner-less) — code that
  branches on "non-winner mapped" may rely on this but should render
  verbatim actions anyway.

### Git State

`git diff --stat` (tracked files):

```
 docs/work/v2/plan.md                               |  71 +++
 .../src/app/shared/kit/participant-row.html        |  14 +-
 .../src/app/shared/kit/participant-row.spec.ts     |   5 +-
 .../src/app/shared/store/derivations.spec.ts       |  34 +-
 .../src/app/shared/store/derivations.ts            |  22 +-
 .../src/app/shared/store/derived-model.ts          |  19 +-
 .../app/views/packages/packages-view-model.spec.ts |  70 ++-
 .../src/app/views/packages/packages-view-model.ts  | 554 +--------------------
 .../src/app/views/packages/packages.css            | 210 +-------
 .../src/app/views/packages/packages.html           | 250 +---------
 .../src/app/views/packages/packages.spec.ts        |  84 +++-
 .../devtools-ui/src/app/views/packages/packages.ts |  15 +-
 12 files changed, 340 insertions(+), 1009 deletions(-)
```

`git status --short`: the modifications above plus untracked:

```
?? projects/devtools-ui/src/app/views/packages/package-detail.css
?? projects/devtools-ui/src/app/views/packages/package-detail.html
?? projects/devtools-ui/src/app/views/packages/package-detail.ts
?? projects/devtools-ui/src/app/views/packages/package-negotiation.css
?? projects/devtools-ui/src/app/views/packages/package-negotiation.html
?? projects/devtools-ui/src/app/views/packages/package-negotiation.ts
?? projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts
?? projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
?? projects/devtools-ui/src/app/views/packages/packages-row-vm.ts
?? projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
