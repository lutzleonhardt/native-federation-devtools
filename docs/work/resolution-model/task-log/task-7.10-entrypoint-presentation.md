### Task

Surface the entrypoint level in the Packages view — muted sub-rows for dense secondaries under their registry-key leaf (entries-map provenance, excluded from the `All (n)` count, click selects the parent), the `secondary entrypoint only` copy-head fact, and the three level-vocabulary tooltips (All button, detail-head package name, DECLARED BY label) — visible texts and leaf semantics unchanged.

### Status

DONE

All five T7.10 acceptance criteria are covered by green tests; the full repository suite is green. An in-session Codex review surfaced one MEDIUM finding (the own-key suppression of sub-rows read the participant-FILTERED group set, so a hidden registry key produced a false `no own registry key in this capture` sub-row) — fixed with a capture-level id set and a red-checked regression test. The rendered look (muted + `entry` annotation word) is recorded in the frozen mock's amendment section; the user's panel screenshot review of the dense cases is the remaining step before `/commit 7.10` (deltas would be absorbed by a second `/wrap-up 7.10`).

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts` (modified) — `EntrypointRowVm` + `PackagesRowPayload` union; `entrypointRowsOf` derives sub-rows per leaf (trigger: copy entrypoints beyond the registry key; claim: only with own-registration entries-map evidence via `candidateById`; suppression: specifier exists as own group id ANYWHERE in the capture); `buildRows` gains the `allGroupIds: ReadonlySet<string>` parameter and emits sub-rows inside `pushPackage` (depth + 1, id `<groupId>|entry|<specifier>`), so they follow their leaf through both filters.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts` (modified) — builds `allGroupIds` from ALL groups before the participant filter (the capture-level half of the own-key check) and passes it to `buildRows`; `PackagesVm.rows` widened to `TreeTableRow<PackagesRowPayload>[]`; re-exports `EntrypointRowVm`/`PackagesRowPayload`.
- `projects/devtools-ui/src/app/views/packages/packages.ts` (modified) — `onSelect` cast widened to the payload union; both kinds carry `packageId`, so a sub-row click selects its parent with zero new logic.
- `projects/devtools-ui/src/app/views/packages/packages.html` (modified) — row template branches on `payload.kind`: sub-rows render specifier suffix + registration tag(s) + `entry` annotation with the provenance tooltip; the All button carries the level tooltip `one row per registry key of the share register` (title only, text untouched).
- `projects/devtools-ui/src/app/views/packages/packages.css` (modified) — `.entry-specifier`/`.entry-tags`/`.entry-annotation`: whole sub-row muted (`--nf-color-text-muted`), mono 11px, annotation 10px; comment states the never-looks-like-a-registry-key rule.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` (modified) — `blockOf` pushes the `secondary entrypoint only` deviation when a copy's entrypoints exist but do not contain the group's own specifier; grounded, capture-relative note names the specifiers actually served and de-claims the tag as a whole-package version.
- `projects/devtools-ui/src/app/views/packages/package-detail.html` (modified) — detail-head package name wrapped in `.detail-name-text` span with `registry key in share scope <verbatim>` tooltip; DECLARED BY label carries its tooltip on an inner `.tip` span (see Key Decisions); visible texts byte-identical.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts` (modified) — `packageRows` helper narrows to `kind === 'package'`; one linked-row pin moved to `toMatchObject` (type-driven, semantics identical); new T7.10 describe with 6 tests: verbatim sub-row payload pins incl. count exclusion, filter-follow behavior, the filtered-own-key regression (Codex MEDIUM), a multi-secondary/multi-tag seed witness, exact head-fact note pins, and the flat-generation sweep; `synthetic-dense-entries` added to the grounded-annotations corpus; header doc extended.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (modified) — 3 new DOM tests (sub-row anatomy + `All (2)` + All-button title + token-level muted pin + click-selects-parent incl. `aria-selected`; head fact verbatim title + detail-head/DECLARED BY tooltips; non-dense free of sub-rows with linked glyphs retained); the 7.8 dense happy-case test gains one `.copy-fact` absence line; header doc extended.
- `docs/work/resolution-model/design/packages-view-redesign-mock.md` (modified) — "Task 7.10 amendment (2026-08-20, entrypoint level)": sub-row anatomy mock, chosen look (muted + `entry`; brackets rejected), capture-level own-key rule, head fact, three tooltip carriers incl. the All-button decision.

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 7.10 block only (task isolation).
- Task logs 7.9 (predecessor; `candidateById`/grounded-tooltip channel, wording contract), 7.8 (origin of this task; fixture semantics, vocabulary triad, DECLARED-BY-stays decision), 7.6 (`showSpecifier`/`copy.entrypoints` groundwork, jsdom token-level pin rules, mock amendment discipline).
- `shared/kit/tree-table.ts` / `.html` — row contract (`TreeTableRow`, `selectRow` emits the row; `aria-level`/`aria-selected` bindings; `label` is aria-only — no visible list header exists, which drove the All-button carrier choice).
- `shared/store/resolution/model.ts` (targeted grep) — `EntrypointCandidate.specifier` as the normalized entries-map evidence.
- `devtools-bridge/src/lib/fixtures/synthetic-dense-entries.fixture.ts` — exact specifiers/tags/files for the verbatim pins; `non-dense.fixture.ts` (registry keys only) — confirmed flat secondaries as own keys for the AC-05 witnesses.
- `packages-vm-shared.ts`, `packages-detail-vm.ts`, `packages-view-model.ts`, `package-detail.css` — derivation surfaces and pin conventions; VM-spec `seedSnapshot`/`declarationOf`/`CROSS_SOURCE_SEED` — seed harness for the review-driven tests.
- `devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts` + task-2 log — answered the user's in-session domain question (why a skipped 1.0.0 still serves); no code impact.

### Key Decisions

- **Sub-row rule = trigger × evidence × suppression:** a sub-row exists only when (a) a group copy carries the specifier beyond the registry key (the plan's trigger), (b) an OWN registration's entries map evidences it (candidates via `candidateById` — tags come from there, NOT from `copy.resolvedTag`), and (c) no own registry key exists for the specifier. Cross-package convergence and URL-identified copies therefore never manufacture sub-rows; flat captures cannot grow any.
- **Own-key suppression is capture-level (Codex review MEDIUM, fixed):** the check runs against an `allGroupIds` set built BEFORE the participant filter, while the rendering hierarchy (`byId`, `parentOf`, linked children) deliberately stays on the filtered groups — building `byId` from all groups would make a hidden parent swallow its visible linked children. The regression was reachable with the existing `CROSS_SOURCE_SEED` + `mfe2` filter (false sub-row `lib-a` under `lib-b` claiming "no own registry key in this capture"); the new test was red-checked against the pre-fix behavior.
- **Chosen look (mock amendment, pending panel review):** muted specifier suffix + own-registration tag(s) + annotation word `entry` carrying the grounded tooltip (`registered via the entries map of <key>@<tag> — no own registry key in this capture`). Brackets rejected: they read as syntax and give the tooltip no visible carrier. No linked glyph, no versions cell — the sub-row must never look like an own registry key.
- **Select convention reused, not extended:** the sub-row payload carries the PARENT `packageId`, so the existing `onSelect` selects the parent unchanged; the sub-row id (`<groupId>|entry|<specifier>`) never equals a group id, so it can never become the selection (`aria-selected` pinned parent-true/sub-row-false).
- **All button as list-header tooltip carrier (user-approved):** the tree's `label` is aria-only — no visible list header exists; the All count is exactly the registry-key count, so the button is the semantically honest carrier. Title only, no `.tip` class (it is an interactive button, not a help affordance).
- **DECLARED BY tooltip on an inner span:** the group-label pins compare `textContent` EXACTLY, and prettier breaks long-attribute block elements onto their own lines, which (with Angular's whitespace collapsing) would leave a leading/trailing space in the text. An inner `<span class="tip" title=…>` survives prettier (inline elements keep the hugging style) and Angular drops the surrounding whitespace-only text nodes.
- **Head fact rides the existing `.copy-fact` channel** (`block.deviations`), guarded by `specifiers.length > 0` so copies without entrypoints never claim it; wording follows the triad (serves / registration / resolve) and stays capture-relative.
- **Multi-tag provenance joined in registry order** (`<key>@<tag>, <key>@<tag>`), witnessed by a seed where a second registration's entries map also carries the secondary.

### Review Focus

- **Behavior claims:** dense secondaries render as muted, indented sub-rows under their leaf with entries-map provenance, are excluded from `All (n)`, follow the leaf through both filters, and select the parent on click; the own-key suppression is capture-level, so a participant filter can never produce a false "no own registry key" claim; copies whose entrypoints lack the package's own specifier carry `secondary entrypoint only` with a grounded tooltip; the three level tooltips render with byte-identical visible texts; flat-generation trees are unchanged.
- **Assumptions / choices:** the visible anatomy (`entry` word, suffix display, tag placement) is a mock-amendment decision awaiting the panel screenshot review; sub-row tags come from own-registration evidence rather than `copy.resolvedTag`; a specifier not extending the key name would display in full (no fixture carries one).
- **Scope notes:** the mock amendment is the only change outside `views/packages/`; `packageRows` helper and one linked-row pin were adjusted for the payload union (type-driven, no semantic change); the `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `entrypointRowsOf` in `packages-row-vm.ts` — the three-part rule and the capture-level `allGroupIds` check are the task's core claim; the regression test `never turns a filtered-out own registry key into a sub-row` in `packages-view-model.spec.ts` — verify the seed really models the mixed state; the head-fact branch in `packages-detail-vm.ts` `blockOf` — verify the guard matches the AC wording.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --watch=false` — 65 tests green on first run after the initial implementation (58 pre-existing + 4 VM + 3 DOM new); 67 green after the review fixes (+ regression + multi-secondary witness).
- **Red-check of the regression test:** with the fix temporarily reverted to the filtered id set, exactly `never turns a filtered-out own registry key into a sub-row (T7.10-AC-05)` fails (the false `lib-a` sub-row under `lib-b`); green with the fix restored.
- `npm test` — full suite green on the final state: 36 UI files / 376 tests (+9 vs. 7.9), 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics.
- `prettier --check` clean on every changed file incl. the mock (one intermediate fail on the mock caught by the Codex review — formatted, and two prettier-mangled multi-line code spans reworded to quoted prose); `git diff --check` clean.
- In-session Codex review (2026-08-20): 1 MEDIUM (fixed, see Key Decisions), 2 LOW (mock formatting — fixed; `.gitignore` — known user-owned hunk, no action); blind spots addressed with the multi-secondary/multi-tag seed witness.

### Acceptance Coverage

- **T7.10-AC-01 — passed:** VM pins the two sub-row payloads verbatim (specifier, suffix, tags, provenance note, parent `packageId`) with `packageCount` staying 2, plus filter-follow pins and the multi-secondary/multi-tag seed; DOM pins 4 tree rows, `All (2)`, `aria-level` 2, muted token equality, and the verbatim provenance title.
- **T7.10-AC-02 — passed:** payload pins carry the parent group id; DOM test clicks the sub-row and asserts the parent detail renders, `aria-selected` lands on the parent row and stays `false` on the sub-row.
- **T7.10-AC-03 — passed:** exact-note VM pins (split 3.1.4 block carries the fact, split 3.0.0 and the happy dense block carry none) plus the verbatim DOM `title` pin and the `.copy-fact` absence line in the 7.8 happy-case test. Contributes: XC-06.
- **T7.10-AC-04 — passed:** DOM pins the three `title`s verbatim (All button, `.detail-name-text`, DECLARED BY inner span); every pre-existing visible-text pin runs unmodified and green.
- **T7.10-AC-05 — passed:** VM sweep over `non-dense`/`self-fill`/`frankenstein-live` (every payload `kind === 'package'`, non-dense keeps linked rows), the DOM non-dense test (no `.entry-*`, linked glyphs present), and the capture-level regression test for the filtered-own-key case.

### Open Issues

- **Panel screenshot review of the dense look pending (user step):** the chosen anatomy (muted + `entry` word) is recorded as mock amendment point 1; verify `synthetic-dense-entries` in the running panel and record any deltas in the amendment before or after `/commit 7.10` (a second `/wrap-up 7.10` absorbs them).
- The multi-tag DISPLAY join (`1.0.0 · 2.0.0` via `tags.join(' · ')`) is VM-witnessed at the array level only; the template join has no DOM pin (trivial rendering, accepted).
- The pooling-anchor skip/anchor explanation worked out in this session (skip = lost election, scoped bindings + `servedBy` pool still serve the copy, `cached: true` as the registry trace) is candidate ground text for the Task-10 findings.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.10 staging (user-owned).

### Context for Next Task

- **The tree now has two payload kinds:** `PackagesRowPayload = PackageRowVm | EntrypointRowVm` (both carry `packageId`); consumers must branch on `payload.kind`. Sub-row ids are `<groupId>|entry|<specifier>` and are never selectable ids.
- **`buildRows(groups, allGroupIds, indexes, conflictsOnly)`** — the two group arguments are deliberately different: `groups` is the filtered VIEW (hierarchy), `allGroupIds` the CAPTURE (semantic claims). Any future claim worded "in this capture" must ground on capture-level data, never on the filtered view — the Codex MEDIUM of this task is the cautionary precedent.
- **Level vocabulary is now surfaced in the UI** (registry key / registration / declaration / entrypoint); Task 8 (Remotes) and Task 10 (Diagnostics) wording should reuse these exact phrasings — the three tooltip texts are pinned verbatim in `packages.spec.ts`.
- **Gotchas:** exact `textContent` pins on labels force tooltips onto inner spans (prettier reflows block elements); prettier mangles multi-line code spans in markdown lists — use quoted prose for long tooltip texts in docs; `entrypointRowsOf` runs per rendered leaf (cheap, but a future virtualized tree should derive once).
- `/commit 7.10` must stage the 10 repo files (8 × `views/packages/`, VM spec + DOM spec included) plus the design mock and this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../design/packages-view-redesign-mock.md          |  55 ++++++
 .../src/app/views/packages/package-detail.html     |  12 +-
 .../src/app/views/packages/packages-detail-vm.ts   |  17 +-
 .../src/app/views/packages/packages-row-vm.ts      | 116 +++++++++++-
 .../app/views/packages/packages-view-model.spec.ts | 210 ++++++++++++++++++++-
 .../src/app/views/packages/packages-view-model.ts  |  16 +-
 .../src/app/views/packages/packages.css            |  19 ++
 .../src/app/views/packages/packages.html           |  85 +++++----
 .../src/app/views/packages/packages.spec.ts        | 103 +++++++++-
 .../devtools-ui/src/app/views/packages/packages.ts |  11 +-
 11 files changed, 587 insertions(+), 59 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M docs/work/resolution-model/design/packages-view-redesign-mock.md
 M projects/devtools-ui/src/app/views/packages/package-detail.html
 M projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-row-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages-view-model.ts
 M projects/devtools-ui/src/app/views/packages/packages.css
 M projects/devtools-ui/src/app/views/packages/packages.html
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages.ts
```
