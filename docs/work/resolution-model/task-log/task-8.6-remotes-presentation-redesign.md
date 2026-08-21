### Task

Presentation-only redesign of the Remotes view around three per-claim zones (provides / consumes / unresolved) per the frozen mock: provides blocks fold the remote's own DECLARED-BY row and group secondaries name-derived, consumes rows carry the winner file `from` the colored source chip, the arrow doctrine / glyph column / action chips / legend are removed, chunks dedupe to one row per bundle with a `serves` tail, capabilities collapse to a meta line with the Task-8.5 `(config: …)` tooltips, "Scoped externals" becomes `private registrations`, and the list gains a `⚠` unresolved marker — the Task-8 canonical façade consumption, VM purity, claim-state vocabulary, and grounded tooltips stay intact.

### Status

DONE

All six T8.6 acceptance criteria are covered by green tests; the full repository suite is green. The panel screenshot review (mock amendment loop like 7.6) ran over four rounds on 2026-08-21/22 with Lutz; all agreed deltas are written into the mock as the iteration-2 amendment (items 1–12) and implemented: doctrine prose moved into tooltips, `consumes from other remotes` header with unified `none in this capture` empties, two-line secondary sub-blocks (FILES label dropped), calmed and sorted chunk rows, consumes rows rebuilt in the provides anatomy without the kit arrow, the subject-naming `own <tag> not selected` chip, bold full-color section headers (cross-view), and the selected-row host-chip contrast fix. Both deferred presentation questions from round 1 are settled. Ready for `/commit 8.6`.

### Files Modified

- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts` (rewritten) — zone partition `zonesOf`: provides blocks copy-driven (copies whose source declaration belongs to this remote, exact/anchor qualified) with folded `DeclaredDisplayVm` head (registration tooltip = `ACTION_NOTES`, T8-H4), deviation chips `isolated`+audience/`anchored`/`self-filled`/defensive `unclassified` — deliberately NO `kept own copy`; claims partitioned per claim (fold into own block / `ConsumesRowVm` with `via` / `RemoteUnresolvedRowVm` in Packages bucket grammar with `offered <tag>`); `groupSecondaries` (name-derived shortest same-scope prefix, Packages rule); chunk section deduped per (bundle, qualification) with `serves` tail; capabilities meta notes carry the T8.5 `(config: …)` strings verbatim; expose lines gain `hasIntegrity` from `remote.integrity`; identity flattened to `scopeUrl`/`resolvedScopeUrl`; divergence-only `diagnosticsOf`; exported `unresolvedDeclarationCount` for the list marker. Amendment rounds: `ConsumesRowVm` reshaped to the two-line row (`DeclaredDisplayVm` + `file`/`targetUrl`, kit `ParticipantArrow` and `toKitDeclared` removed); `own <tag> not selected` chip label (mirrors `skipped own <tag>`); `servesOf` returns the tooltip only when it adds info (truncated/suffix-shortened); chunk rows sorted listed-first (presentation order only); chunks `none` level split into short `label` + grounded `note`.
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts` (modified) — `RemoteRowVm.unresolved` (`⚠` count + note, capture-level via `unresolvedDeclarationCount`); `NEGOTIATION_LEGEND` re-export dropped; type re-exports updated to the zone VMs.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.html` (rewritten) — section order identity meta → exposes → provides → consumes (incl. relation-only sub-bucket) → unresolved → private registrations → chunks → diagnostics footer; `.group-label` headers, colon identity meta, capabilities meta line, file-line grammar with `mapped`/SRI. Amendment rounds: zone notes → `.group-label` tooltips (chunks composes `<note> (rule: <rule>)`, provides tooltip carries the offer-vs-resolution boundary), `consumes from other remotes` header, unified `none in this capture` empties with semantic classes (`.exposes-empty`/`.provides-empty`/`.consumes-empty`; relation-only veto kept — Codex 1), secondaries as two-line `.sub-block` (head + shared file-line grammar), parent FILES label dropped, chunk count only on chip-less list-less rows, serves tip affordance conditional, consumes rows rebuilt as manual two-line mini-blocks (`copy-head` + file line `from` chip, `nf-participant-row` usage removed, aria vocabulary on the file line), chunks `none` as short tip'd observation.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.ts` (modified) — imports reduced to ParticipantChip/RouterLink (ParticipantRow dropped with the manual consumes rows); legend field removed.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.css` (rewritten) — Packages-grammar channels (`.group-label`, `.copy-head`, `.copy-fact` dashed, file-line/SRI classes, `.state-chip`, `.offered-chip`, diagnostics footer) plus `.sub-row`/`.sub-glyph`. Amendment rounds: `.zone-note`/`.files-label` retired (`.deps-note` stays), `.sub-file-line` deeper indent, chunk count/serves at 11px, provides tile rail 3px + 14px gap, `.consumes-row` restyled as block mini-tile (kit-projection classes `.dep-name`/`.dep-states`/`.arrow-provider` replaced by `.source-word`/`.source-provider`, Packages source grammar), `.group-label` bold 700 + full text color.
- `projects/devtools-ui/src/app/views/remotes/remotes.html` / `remotes.css` (modified) — `⚠` `.row-warn` marker with count tooltip in the list row; boundary note moved to the heading tooltip in the populated state (empty state keeps the visible line), `.tip` affordance rule added.
- `projects/devtools-ui/src/app/views/remotes/remotes.ts` (modified) — exposes `boundaryNote = REMOTES_BOUNDARY_NOTE` for the heading tooltip.
- `projects/devtools-ui/src/app/shared/kit/participant-row.ts` / `.html` / `.css` (modified) — own-arrow branch removed from `ParticipantArrow` (winner/none stay); winner arrow renders `from` + `nfArrowSource` projection slot; new optional `declaredNote` input; CSS: `.arrow-own` dropped, `.arrow-source-word` added. NOTE: the Remotes consumes rows stopped using the kit in amendment round 3 — the winner-arrow surface is now parked in kit-demo only (allowed by the mock's implementation notes).
- `projects/devtools-ui/src/app/shared/kit/tree-table.css` (modified) — `.tree-row.selected` re-points `--nf-color-bg` to the accent: the inverted host chip (fill = muted token, text = bg token) was dark-on-dark in selected rows.
- `projects/devtools-ui/src/app/views/packages/package-detail.css` (modified) — `.group-label` bold 700 + full text color (cross-view grammar with the Remotes headers; only this one rule).
- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified) — `ACTION_SYMBOLS` and `NEGOTIATION_LEGEND` removed (Remotes was the last consumer); `ACTION_NOTES` stays as the registration-tooltip vocabulary; header docs updated.
- `projects/devtools-ui/src/app/views/kit-demo.ts` (modified) — the two own-arrow demo rows reduced (quiet norm / pinned strict without arrow).
- `docs/work/resolution-model/design/remotes-view-redesign-mock.md` (modified) — iteration-2 amendment appended (review rounds 1–4, items 1–12); settles both deferred presentation questions and records the terminology/vocabulary decisions.
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.spec.ts` (rewritten) — 37 tests: fixture pins for all six ACs plus the T8 seed harness re-shaped to zones, `MIXED_BUNDLE_SEED` (Codex 2) and the both-zones witness; `declarationOf` gained a `bundle` parameter. Amendment rounds: consumes pins re-anchored to `file`/`source.label`/`declared.note`, `own <tag> not selected` labels, serves-note conditional pins, chunk row order pin, chunks `none` label pin.
- `projects/devtools-ui/src/app/views/remotes/remotes.spec.ts` (rewritten) — 18 DOM tests: removed-elements pins, block/sub-row anatomy, from-chip link + aria, honest-empty lines, `⚠` markers, unresolved bucket, `private registrations` rename, expose SRI, capabilities meta line, ambiguous-qualifier and relation-only witnesses, wording sweep. Amendment rounds: trimmed `groupLabelsOf` + `groupLabelEl` helper, header-tooltip pins, two-line `.sub-block` anatomy, unified-empty pins per zone class (Codex-1 veto re-anchored to `.consumes-empty`), chunk-count absence + serves-affordance pins, heading-tooltip boundary pin, no-arrow + file-line aria pins, chunks-`none` tooltip pin, subject-naming chip pins.
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts` (modified) — own-arrow pins replaced by a no-own-branch pin; new pins for the `from` word, the `nfArrowSource` projection, and the `declaredNote` tooltip.

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged — re-confirmed by Codex finding 3).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 8.6 block only (task isolation).
- `docs/work/resolution-model/design/pooling-anchor-explainer.md` (grounding for the AC-03 proof case).
- Task logs 8.5 (predecessor; config strings final, verbatim copy), 8 (zone data basis, T8-H2/H4 doctrines, seed harness), 7.10 (name-derived parent rule; capture-level-claims lesson → `⚠` grounding), 7.7 (color-lookup contract, jsdom `var()` pin rules).
- `views/packages/` — `package-detail.html` (group-label/copy-head/file-line/bucket grammar; `source-word` grammar mirrored in amendment round 3), `packages-detail-vm.ts` (audience/deviation/offered wording; `not selected` context for the round-4 divergence decision), `packages-vm-shared.ts` (`parentOf` rule).
- `shared/kit/participant-row.*` (arrow contract), `shared/kit/participant-chip.*` + `tree-table.css` (host-chip contrast diagnosis), `shared/view-conventions.ts`, `shared/store/federation-model.ts`, `views/kit-demo.ts`, `src/styles.css` (theme tokens + font stack for the header-weight decision).
- `shared/store/resolution/bundle-claims-model.ts` + `derive-bundle-claims.ts` — Codex finding 2 verification.
- `devtools-bridge` fixture list; frankenstein-live fixture integrity keys; `co-declared-share`/`pooling-anchor` fixture tags (round-4 chip labels).

### Key Decisions

- **Probe-first (T8 methodology):** a temporary probe spec dumped the zone partition for ten fixture/remote cases to the scratchpad before any pin was written; all fixture pins and seeds passed first run except one deliberately-too-pessimistic note pin. The probe was deleted before commit.
- **Provides is copy-driven, claims fold per claim:** blocks exist for every copy whose source declaration belongs to this remote (exact/anchor guard kept explicit); a claim resolving to one of those copies renders nothing extra (a fact renders once), any other resolving claim becomes a consumes row — which is exactly how one declaration renders in BOTH zones (seed-witnessed).
- **Per-claim consumes rows need no chip prefixes:** with one row per claim the `via <specifier>` element carries the identity and chips stay unprefixed.
- **Registration tooltip rides the declared version:** provides heads, consumes rows, and unresolved rows carry it on their declared span. Pinned strict-scope text composes as `exact tag …; <action note>`. This is the T8-H4 landing spot — pooling-anchor pins that `skip` appears ONLY there while the block shows `anchored`.
- **Kit winner arrow: `from` + projection slot.** Angular finding: with conditional projection (`@if` around the slot content) the slot counts as filled even when the condition is false — the `ng-content` fallback never renders. (Historical: the Remotes consumes rows left the kit in amendment round 3; the finding stays documented for kit consumers.)
- **Consumes empty line vetoed by relation-only rows (Codex review 1, MEDIUM, confirmed):** fixed via `@else if (relationOnly.length === 0)`; DOM pin red-checked against the pre-fix template (re-anchored to `.consumes-empty` in the amendment — the veto witness is unchanged).
- **Chunk dedupe key is (bundle, qualification) — deliberate, documented (Codex review 2, MEDIUM, confirmed reachable):** an ambiguous candidacy is not the same fact as an exact chunk claim; merging would either hide the ambiguity or contaminate the exact row (T8-H1 doctrine). `MIXED_BUNDLE_SEED` witnesses both rows.
- **`serves` tail format:** claiming packages sorted lexicographic; ≤2 listed with the secondary shortened to its suffix, >2 compressed to `+N entries`.
- **`⚠` grounding is capture-level:** `unresolvedDeclarationCount` counts DISTINCT declarations with a candidate-less state or any claim without a (present) copy; tooltip names the count.
- **Defensive additions beyond the plan's chip list:** `unclassified` block chip and a `self-filled` consumes chip branch; both unwitnessed by fixtures.
- **Legend/symbols removed entirely:** `NEGOTIATION_LEGEND`/`ACTION_SYMBOLS` had no consumer outside Remotes — dropped from `view-conventions.ts`.
- **Out-of-scope prettier reflow reverted:** `tree-table.spec.ts` was restored via `git checkout` to keep the diff task-scoped.

— session 2026-08-22 (panel screenshot review, amendment rounds 1–4)

- **Doctrine prose is hover-only:** zone notes and the list boundary claim moved into `.group-label`/heading tooltips — permanently visible epistemology reads as noise after the first visit; the chunks `none` level keeps a visible line but shrinks to the unified empty grammar with the grounded sentence in its tooltip; the list empty state keeps the visible boundary note (load-bearing there).
- **Unified empty grammar needs semantic classes as test hooks:** all three zone empties say `none in this capture`, so the specs pin `.exposes-empty`/`.provides-empty`/`.consumes-empty` structurally; the Codex-1 red-checked veto pin was re-anchored accordingly. The capabilities meta line deliberately keeps `none recorded in this capture` (meta-line grammar, not a zone).
- **Sub-rows keep their FULL version facts — decided AGAINST inherit-by-absence (Lutz):** absence would mean "same as parent" here but "not recorded / not applicable" everywhere else; two meanings of absence are worse than repetition. The overload was solved by the two-line mini-block (head + file lines) instead, and the parent FILES label fell for one shared anatomy.
- **Chunk rows:** the count only ever claims absence, and only on chip-less rows (a qualified status chip claims the absence itself, grounded note one hover away); rows with a recorded list sort before list-less rows (presentation order only); the serves tooltip (and tip underline) renders only when it ADDS something the visible tail does not say. VM keeps producing `fileClaim`/`statusNote` — rendering decides.
- **Provides tiles:** rail 3px + 14px gap (2px/8px read as one continuous strip); the rail keeps the border token — a brighter color would compete with the accent/warning channels.
- **Consumes rows drop the kit arrow and adopt the provides anatomy (round 3):** head line + winner file `from` chip on an own file line, mirroring Packages' `source-word` grammar; the fixed aria vocabulary `resolves to X (source: Y)` moved onto the file line; `ConsumesRowVm` reshaped (`DeclaredDisplayVm`, `file`/`targetUrl`); `nf-participant-row` thereby lost its last production consumer — winner-arrow surface parked in kit-demo (mock implementation notes allow this), removal deferred as kit hygiene.
- **PROVIDES terminology stays (round 3):** renaming (e.g. `use own copy`) would misdescribe the zone — its copies are consumed by OTHER remotes too; duplicating not-selected offers into provides would break zone-membership-IS-the-resolution-statement and a-fact-renders-once. The header tooltip states the boundary: "an offered version that is not selected renders on its consumes row, never here".
- **`own <tag> not selected` chip (round 4):** next to the winner file `from <source>`, the bare `not selected` read as a statement about the ELECTED copy (Lutz misread it live). Mirrors the `skipped own <tag>` grammar. Deliberate, documented divergence from Packages' consumer rows and from private-registration claims — there the row subject IS the own thing, the bare form stays.
- **Host chip fixed on the tree-table side:** `.tree-row.selected` re-points `--nf-color-bg` to the accent — the selected-row token contract owns projected-content readability; no chip-side special case.
- **Headers bold + full text color, cross-view (round 4, two iterations):** 600 rendered as regular (system-ui without a real 600 cut), 700 was visually indistinguishable at 10px caps on Lutz' display — the effective lever is color (muted headers drowned among muted content). Applied in Remotes AND Packages (`package-detail.css`, one rule) to keep the shared `.group-label` grammar.
- **Dense capability words reviewed and KEPT as two words** (one flag, two observable facets; tooltips ground both) — closes the carried 8.5 open item.
- **VM stayed pure throughout the amendment** — every round was template/CSS/VM-presentation-field work; no zone-partition or canonical-join logic changed.

### Review Focus

- **Behavior claims:** no permanently visible doctrine prose remains — zone/boundary sentences render as tooltips only, every empty zone says `none in this capture`, and zone membership plus chips alone state where every binding resolves; consumes rows and provides blocks share one two-line anatomy (head + file lines) with NO arrow glyph anywhere, the not-selected chip naming its subject (`own <tag> not selected`); chunk rows show either their file list or a chip/count that explicitly claims absence — never both — sorted listed-first; the host chip stays legible in the selected list row.
- **Assumptions / choices:** semantic empty classes as structural test hooks; the `own <tag> not selected` wording deliberately diverges from Packages' consumer rows (documented in mock item 11); the `--nf-color-bg` re-point affects every tree-table consumer (intended — it completes the selected-row token contract); header color/weight applied cross-view to keep the `.group-label` grammar.
- **Scope notes:** kit `tree-table.css` and `views/packages/package-detail.css` touched (one rule each — contrast fix / header grammar); the frozen mock gained an appended amendment section (iteration-1 text untouched); `participant-row.*` kit changes now serve kit-demo only (production consumer removed in round 3); the `.gitignore` hunk is NOT part of this task.
- **Read next:** `zonesOf` + `groupSecondaries` in `remotes-detail-vm.ts` (the partition is the task's core claim); the consumes mini-block + chunks header in `remote-detail.html` (the amendment's structural changes); `remotes.spec.ts` unified-empty pins (verify the Codex-1 veto re-anchor convinces).

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/remotes/*.spec.ts' --watch=false` — 55 tests green on the final state (37 VM + 18 DOM).
- `npm test` — full suite green on the final state: 36 UI files / 404 tests, 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics; `prettier --check` clean on every changed file; `git diff --check` clean.
- **Probe-first:** the temporary zone probe (deleted) grounded every fixture pin; the initial 48-test VM+kit run had exactly one failure — a note pin WEAKER than the implementation, corrected to the richer wording.
- **Red-check (Codex 1):** with the template condition reverted to `@else`, exactly `renders the relation-only consumer binding of an alias scope` fails on the no-false-empty pin; green with the fix restored.
- **In-session Codex review (2026-08-21):** finding 1 (MEDIUM, contradictory consumes empty state) — confirmed, fixed + red-checked DOM pin; finding 2 (MEDIUM, dedupe key vs. "one row per bundle" claim) — confirmed reachable, resolved as deliberate two-row design with wording fix + `MIXED_BUNDLE_SEED` witness; finding 3 (LOW, `.gitignore`) — known user-owned hunk, no action. 2/2 substantive findings confirmed, none rejected.
- Angular projection finding (conditional `nfArrowSource` content suppresses the ng-content fallback) surfaced as one intermediate red DOM test and is documented in Key Decisions.

— session 2026-08-22 (amendment rounds 1–4)

- Each amendment round re-ran the Remotes suite green on the FIRST run after its pin updates (rounds 1–4, 55/55 each); Packages suite ran green alongside for the cross-view CSS changes (122 tests combined run).
- Final state after round 4: `npm test` full suite green (404/77/75/50), `tsc --noEmit` clean, `prettier` clean, `git diff --check` clean. Test count unchanged — pins were tightened and re-anchored inside the existing 55, no new test cases.
- Panel verification by Lutz across four screenshot rounds (frankenstein-live host/mermaid, co-declared mfe2, clean-skip, chunks levels); the final round-4 header color change and the host-chip contrast fix await one last visual confirmation after reload.

### Acceptance Coverage

- **T8.6-AC-01 — passed:** VM pins the host's five top-level blocks with folded heads (name/tag/range/STRICT), `/http`+5-core-secondary grouping, honest-empty consumes, and the deduped chunk rows (ONE `browser-angular_core` row, `serves @angular/core +5 entries`, qualified `source-only` rows); DOM pins block/sub-block anatomy plus the absence of `→ own copy`, glyphs, action chips, and legend. Contributes: XC-06.
- **T8.6-AC-02 — passed:** clean-skip mfe1 VM+DOM (consumes row `skipped own 1.0.0`, winner file from the mfe2 chip linking `/remotes?select=mfe2`, provides honest-empty) and co-declared-share mfe2 (`own 1.0.0 not selected` from mfe1). Contributes: XC-03, XC-06.
- **T8.6-AC-03 — passed:** strict-split mfe3 provides block `isolated · mapped only for mfe3` with a no-`kept own copy` sweep; pooling-anchor mfe1 provides block with the `anchored` chip while `skip` appears only in the registration tooltip, `/extra` as indented secondary; pooled mfe2 renders anchored/not-selected consumes rows. Contributes: XC-03.
- **T8.6-AC-04 — passed:** synthetic-multi-version VM+DOM — both zones honest-empty, unresolved rows `not mapped` + `offered <tag>`, list rows carry `⚠` with the count tooltip, frankenstein rows pinned marker-free.
- **T8.6-AC-05 — passed:** `MULTI_ENTRY_QUALIFIER_SEED` renders one declaration in BOTH zones with the `via`-prefixed consumes row; `AMBIGUOUS_SCOPE_SEED` (VM+DOM) produces no provides block and keeps the qualifier chip visible; host-fallback/unknown-source ladder seeds re-pinned zone-shaped. Contributes: XC-02.
- **T8.6-AC-06 — passed:** purity pin (model-only input, unmodified inputs); every annotation carries a grounded tooltip; cross-links pinned (package → /packages, from-chip → /remotes, mapped → /import-map); `private registrations` rename, capabilities one meta line, expose SRI lines. Contributes: XC-01.

### Open Issues

- The final round-4 visuals (header full-text-color/bold, host-chip contrast in the selected row) are test-verified but await one last panel reload confirmation by Lutz; if headers still render unchanged, suspect a stale dev-server build, not the CSS.
- `participant-row`'s winner-arrow surface (`from` + `nfArrowSource` + `declaredNote`) is production-orphaned since amendment round 3 (kit-demo only) — removal is a kit-hygiene candidate for a later task, deliberately not this one.
- The positive diagnostics-footer case (`unknown states: N`) and the `unknown tags` branch are defensively coded but unwitnessed; the silent norm is pinned — same acceptance as T8's `level: 'none'` branch. Likewise the `self-filled` consumes chip, the `unclassified` block chip, and the chunks `none claimed in this capture` variant (recorded-but-unclaimed lists).
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 8.6 staging (user-owned; Codex finding 3 concurs).

### Context for Next Task

- **Task 9 (Import Map) is now the last legacy consumer** — unchanged from T8; after its migration Task 11 removes `derivations.ts`, `derived-model.ts`, `chunk-map-join.ts`, and `store.derived()`.
- **Zone grammar is reusable and amendment-refined:** doctrine sentences live in `.group-label` tooltips (visible zone notes are gone); empty zones say `none in this capture` with per-zone semantic classes; honest-empty lines cover whole zones (a sub-bucket row vetoes them); qualified claims never merge with exact claims; `via <specifier>` identifies secondary-specifier rows; outcome chips name their subject when the winner is visible on the same row (`own <tag> not selected`). Task 9/10 findings should reuse these exact patterns.
- **Consumes rows and provides blocks share one anatomy** (head line + indented file lines, `from` + chip in Packages `source-word` grammar) — no arrows anywhere in Remotes; the fixed aria vocabulary `resolves to X (source: Y)` rides the consumes file line.
- **Kit contract:** `ParticipantArrow` is winner/none only and now kit-demo-only — no production view renders arrows. Gotcha (still relevant for kit consumers): conditionally projected slot content (`@if`) suppresses the ng-content fallback. `.tree-row.selected` re-points `--nf-color-text-muted`/`--nf-color-surface`/`--nf-color-border`/`--nf-color-bg` — any inverted chip projected into rows relies on the bg re-point.
- **`view-conventions.ts` no longer exports `NEGOTIATION_LEGEND`/`ACTION_SYMBOLS`;** `ACTION_NOTES` is the single registry-action vocabulary and renders as tooltips only. Future action presentation must not reintroduce visible action chips (T8-H4/T8.6 doctrine).
- **`.group-label` is bold + full text color in BOTH detail views** — keep that grammar for any new view sections.
- **Seed additions:** `declarationOf(name, entries, bundle?)` seeds dense-externals declarations; `MIXED_BUNDLE_SEED` is the mixed-qualification chunk witness — reusable for Diagnostics work.
- `/commit 8.6` must stage 20 paths: 10 × `views/remotes/` (incl. `remotes.ts`), 4 × `shared/kit/participant-row.*`, `shared/kit/tree-table.css`, `shared/view-conventions.ts`, `views/kit-demo.ts`, `views/packages/package-detail.css`, the amended design mock, and this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../design/remotes-view-redesign-mock.md           | 120 +++
 .../src/app/shared/kit/participant-row.css         |  18 +-
 .../src/app/shared/kit/participant-row.html        |  17 +-
 .../src/app/shared/kit/participant-row.spec.ts     |  71 +-
 .../src/app/shared/kit/participant-row.ts          |  40 +-
 .../devtools-ui/src/app/shared/kit/tree-table.css  |   4 +
 .../devtools-ui/src/app/shared/view-conventions.ts |  24 +-
 projects/devtools-ui/src/app/views/kit-demo.ts     |  10 +-
 .../src/app/views/packages/package-detail.css      |   6 +-
 .../src/app/views/remotes/remote-detail.css        | 262 +++++-
 .../src/app/views/remotes/remote-detail.html       | 483 ++++++++--
 .../src/app/views/remotes/remote-detail.ts         |  20 +-
 .../src/app/views/remotes/remotes-detail-vm.ts     | 985 +++++++++++++++------
 .../app/views/remotes/remotes-view-model.spec.ts   | 946 ++++++++++++--------
 .../src/app/views/remotes/remotes-view-model.ts    |  28 +-
 .../devtools-ui/src/app/views/remotes/remotes.css  |  19 +-
 .../devtools-ui/src/app/views/remotes/remotes.html |   9 +-
 .../src/app/views/remotes/remotes.spec.ts          | 430 ++++++---
 .../devtools-ui/src/app/views/remotes/remotes.ts   |  10 +-
 20 files changed, 2544 insertions(+), 960 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M docs/work/resolution-model/design/remotes-view-redesign-mock.md
 M projects/devtools-ui/src/app/shared/kit/participant-row.css
 M projects/devtools-ui/src/app/shared/kit/participant-row.html
 M projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts
 M projects/devtools-ui/src/app/shared/kit/participant-row.ts
 M projects/devtools-ui/src/app/shared/kit/tree-table.css
 M projects/devtools-ui/src/app/shared/view-conventions.ts
 M projects/devtools-ui/src/app/views/kit-demo.ts
 M projects/devtools-ui/src/app/views/packages/package-detail.css
 M projects/devtools-ui/src/app/views/remotes/remote-detail.css
 M projects/devtools-ui/src/app/views/remotes/remote-detail.html
 M projects/devtools-ui/src/app/views/remotes/remote-detail.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-view-model.spec.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts
 M projects/devtools-ui/src/app/views/remotes/remotes.css
 M projects/devtools-ui/src/app/views/remotes/remotes.html
 M projects/devtools-ui/src/app/views/remotes/remotes.spec.ts
 M projects/devtools-ui/src/app/views/remotes/remotes.ts
?? docs/work/resolution-model/task-log/task-8.6-remotes-presentation-redesign.md
```
