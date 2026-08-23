### Task

Presentation-only redesign of the Import Map view around evidence groups per the frozen mock: within each scope section, rows regroup into the homes `EXPOSES` / signature groups (global only) / ungrouped / `CHUNK WIRING` (collapsed fold) / `UNREFERENCED` with kind precedence expose > chunk > package deciding the home only; the SRI column dies (head hoist / per-row mark), table headers drop, the `overrides global` marker is derived map-structurally, and the T9 order clause is deliberately superseded by the mock's order invariant (deterministic permutation, multiset + permutation pins) — the Task-9 canonical façade consumption, VM purity, claim vocabulary, quiet norms, and grounded tooltips stay intact.

### Status

DONE

All five T9.5 acceptance criteria are covered by green tests; the full repository suite is green. The panel screenshot review (amendment loop like 7.6/8.6) ran over three rounds on 2026-08-23 with Lutz; all agreed deltas are written into the mock as amendment items 1–5 and implemented: the `PACKAGES` home label, `from` kept (`provided from` rejected with recorded rationale), hard section separation (rule + breathing room), denser rows instead of foldable signature groups (deferred scale hatch recorded), and the fold summary compressed to `7 entries in 3 bundles` with the names one hover away. The "have we drifted too far from the import map?" question was raised and answered NO on the raw-pivot anchors (documented in the mock). Round-3 visual state awaits one final panel reload confirmation. Ready for `/commit 9.5`.

### Files Modified

- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts` (modified) — grouping layer on the T9 builder: `ImportMapSectionVm.groups: ImportMapGroupVm[]` with kinds `exposes | signature | ungrouped | chunk-wiring | unreferenced`; home derivation from the existing row-VM joins (if-chain expose > chunk > package > untyped); signature key = JSON of the deduped source set `(remoteSelect, host, qualifier)` + bundle set `(label, status, select)` (IDs/tags/notes excluded; empty signature → ungrouped); `integrityHoist` tri-state (uniform → head, mixed → rows self-mark, ungrouped always null); fixed factoring head notes (`HEAD_SOURCE_NOTES`/`HEAD_BUNDLE_NOTES` — no resolved tag, mock Decision 8); `overridesGlobal` from `importMapEntries` alone + `OVERRIDES_GLOBAL_NOTE`; `IMPORT_MAP_SECTION_CONTRACT` (section-count tooltip incl. Export JSON claim, verified against the shell exporter); `containsSelection` for fold auto-expansion; `RowChunkVm.host` (chip needs the flag — presentation field, no new join; documented step beyond the plan's "exactly `overridesGlobal`"). Amendment rounds: `packagesHead` home label on the package home's first group (count spans signature groups AND ungrouped rows); `bundleSummary` compressed to `in N bundles`/`in N chunk groups` with new `bundleSummaryNote` carrying the names (row-count order, dominant first; null for pseudo groups — a tip must add something).
- `projects/devtools-ui/src/app/views/import-map/import-map.html` (rewritten) — table grid + per-section headers die; one `ng-template` row shape for every home (context flags `hoisted`/`selfMark`/`muted`); section head reordered label → owner → count (count carries the contract tooltip); signature heads render `from` + chip + bundle + qualifier + count + SRI hoist in the middot `head-seg` grammar; fold as real `<button>` with `aria-expanded`, collapsed rows not in the DOM; visible `SRI ✓`/`no SRI` self-marks; `expose <module>` word; `overrides global` marker; chunk rows gain the emitter chip. Amendment rounds: `PACKAGES` home label before the first package-home group (both branches), `group-signature` indent class, fold summary folded into the count segment with the tip'd hover list.
- `projects/devtools-ui/src/app/views/import-map/import-map.css` (rewritten) — two-column row grid under hanging group heads; strengthened section head (8.6 channel: bold + full text color); `head-seg` middot separators; fold-button reset + glyph; muted unreferenced channel; SRI/override/tip channels (dotted = grounded one hover away); the T9 `.cell-attr` wrap workaround is moot. Amendment rounds: hard section separation (`.map-section + .map-section` rule + spacing), package-home indent grammar (label flush, groups one step, rows one deeper), dense rows (padding 0.26 → 0.14rem, line-height 1.35, group margin 0.45rem), `.head-summary.tip`.
- `projects/devtools-ui/src/app/views/import-map/import-map.ts` (modified) — fold expansion as caller-owned UI state: `foldChoices` map keyed by `JSON.stringify(section.scope)`; explicit toggle wins over `containsSelection` auto-expansion; exposes the contract/override note constants; `NgTemplateOutlet` import; scroll-to-selection effect unchanged.
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts` (rewritten) — 59 tests: T9 annotation pins carried over onto the groups shape; frankenstein GLOBAL structure pin (EXPOSES + exactly the seven mock signature groups incl. head facts), fold pins (count, summary, note, row order), non-dense one-group + wiring-with-quiet-claims pins, AC-02 as multiset equality over ALL fixtures incl. folded rows plus the property-based permutation pin (section first-appearance order, fixed home order, signature groups by first row's map position, rows in map order per home, double-build determinism), SRI completeness sweep (hoist ⇔ uniform, ungrouped never hoists), signature-equality witness (7 copies/1 group; head note tag-free, row note keeps the tag), PACKAGES-label sweep (exactly one per section with a package home, on its first group, count = all package rows), `overridesGlobal` pins (pooling both scopes, synthetic-hostile fixture witness, same-target seed negative), seeds: expose ∧ resolution overlap (home + retained annotations + visible module word), fold `/./`-tolerant selection, qualified signature heads (unattributable/ambiguous), blocked ungrouped.
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts` (rewritten) — 12 DOM tests: table/`th` absence, section-count contract tooltip, group-kind sequence `EXPOSES · PACKAGES · CHUNK WIRING`, PACKAGES head (count, kind-derivation tooltip, no SRI hoist), SRI hoist geometry (0 row marks / 9 head marks on frankenstein), fold contract (BUTTON + type + `aria-expanded`, collapsed rows out of the DOM, summary `7 entries in 3 bundles` with tip'd hover names, expand/collapse/re-collapse, emitter chip + bundle link in expanded rows), selection auto-expand + explicit-toggle-wins, co-declared claims under the factored head (source/bundle suppressed on the row), pooling anchor + `overrides global` + ungrouped self-mark, seeded honest outcomes (qualified heads, blocked ungrouped, shared-scope owner, muted unreferenced row), hostile unreferenced tail (mixed per-row SRI), caption/empty/select/failed-capture carry-overs, wording sweep (no `served by`, no `loaded`, incl. all `[title]`).
- `docs/work/resolution-model/design/import-map-view-redesign-mock.md` (modified) — screenshot-review amendments 1–3 appended (items 1–5 + the drift-question verdict); iteration-1 text untouched.

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged — unchanged from Tasks 6–9).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 9.5 block only (task isolation).
- `docs/work/resolution-model/design/import-map-view-redesign-mock.md` — the frozen layout/wording reference (order invariant, signature equality, fold contract, fixture cases); Decision 8 confirmed by Lutz at task start.
- Task logs 9 (predecessor: canonical row joins, quiet norms, wording contracts, H1/H4 gotchas), 8.6 (redesign methodology: amendment loop, header channel, doctrine-in-tooltips, `@if`-projection gotcha), 8 (targeted grep only: the `scoped-pseudo-external` precedent grounding chunk-over-package).
- `shared/view-conventions.ts` (`copySourceVmOf` ladder notes for the fixed factoring strings, `countClaim`), `shared/kit/participant-chip.ts` (chip API needs caller-provided `host`), `devtools-bridge` fixtures index, `app.html`/`snapshot-export` (Export JSON claim grounded before entering the contract tooltip).

### Key Decisions

- **Probe-first (T8/T9 methodology, file-dump variant):** a temporary probe spec dumped the new grouping for eleven fixtures to the scratchpad BEFORE any pin was written — vitest swallows `console.log`, so the probe wrote a file via `node:fs` from the jsdom env. The probe confirmed the mock exactly (frankenstein: EXPOSES + the seven signature groups in mock order; fold summary wording; non-dense one-group). Probe deleted before commit. All fixture pins and seeds were green on their first run after authoring (VM 57/57, then 69/69, 71/71 across rounds).
- **Kind derivation is an if-chain over the existing joins** (`exposes.length` → `chunks.length` → `resolutionIds.length` → untyped) — no new canonical surface; chunk-over-package follows the canonical `scoped-pseudo-external` precedent (chunk carriers identified via projection groups, never specifier names).
- **Signature key = JSON of two deduped sorted fact sets;** an empty signature renders ungrouped (blocked/claims-only rows keep the full per-row channel). Witnessed exclusions: seven whiteboard copies with distinct copy IDs and tags share one group; the head note is a fixed factoring string, the resolved tag stays row-side (mock Decision 8).
- **Permutation pin is property-based, not a re-implementation:** multiset equality + fixed home order + ascending first-row map positions for signature groups + in-home map order + double-build determinism — pins the order invariant without duplicating the grouping logic in the spec.
- **`integrityHoist` tri-state with ungrouped forced null** — makes "every row's integrity state readable from exactly one place" a sweepable structural property.
- **Fold state is caller-owned with explicit-choice-wins:** `foldChoices` map consulted before `containsSelection`, so a user can re-collapse an auto-expanded fold; `/./` tolerance is inherited from row selection (seed-pinned).
- **`RowChunkVm.host` added beyond the plan's "exactly `overridesGlobal`"** — the participant chip requires caller-decided host-ness; presentation field, no new join (documented deviation).
- **`bundleSummary` orders by row count, first appearance breaking ties** — matches the mock's visible order (`browser-angular_core` first); pseudo-package folds compress to `in N chunk groups`.
- **synthetic-hostile discovered as a real fixture witness for `overrides global`** (`sneaky-lib` global + admin-console scope, differing targets) — the marker is fixture-pinned, not only seed-pinned.

— session 2026-08-23 (panel screenshot review, amendment rounds 1–3)

- **Round 1 — `PACKAGES` home label (item 1):** the package home was the only anonymous home; one label above its FIRST group spans signature groups AND ungrouped rows (count = whole home, so blocked rows are covered and the structure never lies); renders in scope sections too (consistency over economy — revisit if the 1-row sections read as noise); no SRI hoist on the label. VM: `packagesHead` presentation field.
- **Round 1 — `provided from` rejected (item 2):** "provides" is Remotes ZONE vocabulary (copy-driven, offer-vs-resolution boundary) and "provided" asserts delivery — would break on qualified heads (`provided from · unattributable`). Bare `from` is the cross-view source-word grammar; the missing noun now comes from the PACKAGES label (`PACKAGES … from [whiteboard]` reads as a sentence).
- **Round 1 — hard section separation (item 3):** `.map-section + .map-section` fine rule + breathing room; the scope boundary must not read like a group boundary. Indent grammar: PACKAGES flush, its groups one step, their rows one deeper.
- **Round 2 — signature groups are NOT foldable (item 4):** Lutz asked for default-collapsed `from` groups; rejected together — the chunk fold is the justified exception (hash-named wiring rows with no per-row reading value), while in the package home the specifiers ARE the content and default-collapse would leave the raw pivot invisible (exactly the drift line) and break scanning. Chosen instead: density (row padding 0.26 → 0.14rem, line-height 1.35). Collapsible signature groups (default expanded) recorded as a deferred scale hatch.
- **Round 3 — fold summary counts instead of listing (item 5):** `7 entries in 3 bundles` ("in N" over "N / N" — sentence over slash, middot grammar); bundle names one hover away on the tip'd summary (tip only when it adds something — the 8.6 `serves` rule), pseudo folds say `in N chunk groups` without a tooltip.
- **Drift question ("too far from the import map?") answered NO** on the raw-pivot anchors (multiset sweep, sections ≙ `imports`/`scopes`, specifier→target rows, Export JSON verbatim); watch items recorded in the mock: lost visual map order, fold hiding recorded entries.
- **VM stayed pure throughout the amendment rounds** — every round was template/CSS/VM-presentation-field work; no canonical join or home-derivation logic changed after the probe.

### Review Focus

- **Behavior claims:** rendered triples are a multiset-equal deterministic permutation of the recorded entries in every fixture, folded rows included, and two renders are identical; every row's integrity state is readable from exactly one place (head hoist XOR self-mark — sweep-pinned); signature groups merge/split on exactly the rendered head facts (IDs, resolved tags, and notes excluded — witnessed); the fold is a real button with `aria-expanded`, collapsed rows out of the DOM while the VM stays complete, selection auto-expands `/./`-tolerantly and an explicit toggle wins; `overrides global` derives from `importMapEntries` alone.
- **Assumptions / choices:** the `PACKAGES` label also renders in 1-row scope sections (consistency over economy — flagged for the next screenshot round); `bundleSummary` orders bundles by row count; the exposes head shows a bare number (mock grammar); `RowChunkVm.host` added beyond the plan's exactly-one-field wording; the permutation pin is property-based rather than a reference re-implementation.
- **Scope notes:** only `views/import-map/` touched plus appended mock amendments; no shared/kit/canonical file changed; the `.gitignore` hunk is NOT part of this task.
- **Read next:** `groupsOf` + `signatureKeyOf` in `import-map-view-model.ts` — home derivation and signature equality are the task's core claims; the permutation + SRI-completeness sweeps in `import-map-view-model.spec.ts` — they are the supersession's replacement guarantees; the fold branch in `import-map.html` + `foldExpanded`/`toggleFold` in `import-map.ts` — the a11y contract and the explicit-choice-wins rule.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/import-map/*.spec.ts' --watch=false` — 71 tests green on the final state (59 VM + 12 DOM).
- `npm test` — full suite green on the final state: 35 UI files / 442 tests, 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests (re-run after the last amendment round).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics; `prettier --check` clean on every changed file; `git diff --check` clean.
- **Probe-first:** the temporary grouping probe (deleted) dumped eleven fixtures and confirmed every mock expectation before pinning; the initial 57-test VM suite and the 12-test DOM suite were green on their FIRST run after authoring; each amendment round re-ran the import-map suites green on the first run after its pin updates (69, 71, 71).
- **Legacy sweep:** `rg "import-table|cell-attr|cell-sri|cell-target|served by|table-layout"` over `views/import-map/` — only the wording-sweep assertions themselves match.
- **Panel verification (Lutz, three screenshot rounds):** round 1 (full view) surfaced the PACKAGES/wording/separation questions; round 2 (PACKAGES home) the fold-vs-density question; round 3 (fold head) the summary compression. All decisions implemented and re-verified by suites; the round-3 visual state awaits one final reload confirmation.

### Acceptance Coverage

- **T9.5-AC-01 — passed:** `factors the live GLOBAL section into EXPOSES plus the seven signature groups` (exact head facts incl. visible `source-only`), `hoists uniform SRI into every live head`, `keeps quiet single own-selected rows bare`, `folds the host scope into the collapsed CHUNK WIRING head with count and bundle summary` (VM) + the DOM group-head/SRI-geometry test. Contributes: XC-06.
- **T9.5-AC-02 — passed:** `renders every recorded entry exactly once — multiset equality incl. folded rows` and `renders the deterministic permutation of the recorded entries, identically twice` (ALL fixtures; section order, home order, signature first-appearance, in-home map order, double-build equality). Contributes: XC-03.
- **T9.5-AC-03 — passed:** `folds non-dense wiring rows with their quiet pseudo-external claims intact` (chunk home wins per the scoped-pseudo-external precedent), the expose ∧ resolution seed (expose home, retained annotations, visible module word), `renders hostile rows as the muted UNREFERENCED tail with no guessed annotation` (mixed per-row SRI) — VM + DOM. Contributes: XC-02.
- **T9.5-AC-04 — passed:** pooling anchors visible in both consumer scopes incl. the self-anchor, `/extra` keeps both claim chips, `overrides global` on both scope rows (plus the synthetic-hostile fixture witness and the same-target negative seed); scoped/strict-scope carry no marker; blocked/unattributable/ambiguous seeds keep their qualified language in heads or the per-row channel — VM + DOM. Contributes: XC-02, XC-06.
- **T9.5-AC-05 — passed:** fold contract DOM-pinned (real BUTTON + `type` + `aria-expanded`, collapsed head with count, expanded full rows, re-collapse, selection auto-expansion with `/./` tolerance seed + explicit-toggle-wins); carried-over select/caption/empty/wording pins (no `served by`, no `loaded`, incl. `[title]` sweep); templates stay VM-only (purity pin). Contributes: XC-01, XC-06.

### Open Issues

- Round-3 fold-head visuals (`7 entries in 3 bundles` + tip) await one final panel reload confirmation by Lutz; if unchanged, suspect a stale dev-server build.
- `PACKAGES · 1 entry` in 1-row scope sections is deliberate (consistency over economy) but flagged — first candidate for a future amendment if it reads as noise in real use.
- Deferred by mock decision (do not build without a forcing capture): collapsible signature groups (default expanded), per-row kind word, emitter-chip quiet norm inside the fold, signature groups in scope sections, sticky section nav.
- Defensively coded but unwitnessed in this view (T9 carry-overs): the `ambiguous` bundle-claim status in signature heads, the `unknown-source` qualifier, `claimlessConsumers`.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 9.5 staging (user-owned).

### Context for Next Task

- **The groups layer is pure presentation over the T9 joins** — Tasks 10/11 are structurally untouched; no view reads legacy surfaces, and the Task-11 cutover list is unchanged from the T9 log.
- **Supersession is landed:** the T9 sequence-order pin no longer exists; any future work touching row order must satisfy the multiset + permutation sweeps (property-based, in `import-map-view-model.spec.ts`).
- **Seed vocabulary extended:** expose ∧ resolution overlap, `overridesGlobal` same/different-target pairs, fold-selection with `/./` infix on a wired chunk specifier, plus the T9 harness unchanged.
- **Reusable grammar:** `head-seg` middot segments, home labels (`.group-kind`), the tip rule (dotted affordance only when the tooltip adds something), hard section separation via `.map-section + .map-section` — candidates for any future sectioned view.
- **Gotchas:** vitest swallows `console.log` — probes must write files (`node:fs` works in the jsdom env); `ng-template` reference variables are lexically visible inside nested control-flow blocks (the shared row template relies on this); the participant chip needs caller-provided `host`; run `prettier --write` before pinning text content (it reflows templates).
- `/commit 9.5` must stage 7 repo paths (6 × `views/import-map/`: `import-map-view-model.ts`, `import-map-view-model.spec.ts`, `import-map.ts`, `import-map.html`, `import-map.css`, `import-map.spec.ts`; plus the amended design mock) and this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../design/import-map-view-redesign-mock.md        |  76 +++
 .../views/import-map/import-map-view-model.spec.ts | 695 +++++++++++++++++----
 .../app/views/import-map/import-map-view-model.ts  | 388 +++++++++++-
 .../src/app/views/import-map/import-map.css        | 227 +++++--
 .../src/app/views/import-map/import-map.html       | 414 ++++++++----
 .../src/app/views/import-map/import-map.spec.ts    | 279 ++++++---
 .../src/app/views/import-map/import-map.ts         |  48 +-
 8 files changed, 1716 insertions(+), 413 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M docs/work/resolution-model/design/import-map-view-redesign-mock.md
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts
 M projects/devtools-ui/src/app/views/import-map/import-map.css
 M projects/devtools-ui/src/app/views/import-map/import-map.html
 M projects/devtools-ui/src/app/views/import-map/import-map.spec.ts
 M projects/devtools-ui/src/app/views/import-map/import-map.ts
```

### Sessions

- claude-code 81791585-04cb-43fa-9656-148179eb1287 (2026-08-23) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/81791585-04cb-43fa-9656-148179eb1287.jsonl
