### Task

Presentation-only polish of the Packages view from the 2026-08-19 screenshot review — toolbar filter zone with divider, `share scope:` colon, `source` → `from`, uniform group-label anatomy (FILES / DECLARED BY / CHUNKS), de-warned STRICT/pinned-scope — plus two user-approved in-session amendments (CHUNKS group break, FILES label replacing the arrow), all recorded in the frozen mock's amendment section.

### Status

DONE

All five T7.6 acceptance criteria are covered by green tests; the copy-block anatomy grew two amendments beyond the plan block (approved live from panel screenshots) and the amendment section of the frozen mock now carries seven numbered deltas. The user visually verified the result in the running panel (self-fill, strict-split, strict-scope, frankenstein toolbar screenshots).

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages.html` (modified) — All/Conflicts buttons + participant chips wrapped in a `.filter-zone`; scopes summary stays a toolbar-level sibling.
- `projects/devtools-ui/src/app/views/packages/packages.css` (modified) — `.filter-zone` styles; divider on `.participant-filter` written as LONGHAND border properties (jsdom drops shorthands containing `var()` — see Key Decisions); `.scopes-summary` right-aligned via `margin: 0 0 0 auto`.
- `projects/devtools-ui/src/app/views/packages/package-detail.html` (modified) — meta reads `share scope:` (colon); `.source-word` text `source` → `from`; three `group-label` elements: `files` (replaces the `→` glyph), `declared by`, `chunks` (one per block, pulled out of the per-claim loop); unresolved bucket untouched.
- `projects/devtools-ui/src/app/views/packages/package-detail.css` (modified) — shared `.group-label` style (10px uppercase, letter-spacing, muted); indent scheme: labels at level 0, rows 12px (`.file-line`, `.consumer-row`, `.chunk-claim`), chunk files 24px; `.unresolved-row` keeps its 8px override; `.detail-strict`/`.consumer-strict` → `--nf-color-text-muted`; `.file-arrow` and `.chunk-word` rules removed.
- `projects/devtools-ui/src/app/shared/kit/participant-row.css` (modified) — `.strict-marker` color → muted (configuration fact, not a warning); tooltip/text verbatim; visible in Remotes too (intended).
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts` (modified) — token-level color pin: `.strict-marker` color equals `.declared` color.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (modified) — extended in place: filter-zone structure + `borderLeftWidth: 1px` + `marginLeft: 'auto'` pins; `share scope: global`/`share scope: strict` text pins; `from` pins (signals head + new pooling-anchor test with `skip-registration` + mfe1 chip); word-boundary sweep `/(?<![\w-])source(?![\w-])/` over copy-block DOM; label-triple pins `['files', 'declared by', 'chunks']` as direct block children (happy path + sparse strict-split block); `→` absence pin; unresolved bucket label-free pin; token-level AC-05 color pins.
- `docs/work/resolution-model/design/packages-view-redesign-mock.md` (modified) — "Task 7.6 amendment (2026-08-19 screenshot review)" section with seven numbered deltas incl. the target block anatomy mock.

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged) and the auto-memory update (`orchestrator-registry-semantics` — dense-entries opt-in findings, outside the repo).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 7.6 block only (task isolation).
- `docs/work/resolution-model/task-log/task-7.5-packages-presentation-redesign.md` (predecessor) and grep hits of `task-7-migrate-packages-canonical.md` (kit `participant-row.*` is shared with Remotes and has its own 10-test spec).
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts` — read-only (no VM pins asserted the old wording; CROSS_SOURCE pin line ~872 is the one-copy-two-file-lines evidence).
- `projects/devtools-ui/src/app/shared/kit/participant-chip.css` — grounding for the host-chip color question (deferred to Task 7.7).
- `projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts`, `projects/devtools-bridge/src/lib/snapshot-v1.ts`, all `projects/devtools-bridge/src/lib/fixtures/*.fixture.ts` — verification of the multi-entry FILES question (see Key Decisions).
- `angular.json`, `projects/devtools-ui/src/styles.css` — test-builder/style-loading facts for the computed-style pins.

### Key Decisions

- **Amendment discipline over silent divergence:** the two in-session extensions (CHUNKS break, FILES label) were approved by the user from live panel screenshots and immediately recorded as amendment points 3/4 in the frozen mock — the mock stays the wording contract.
- **FILES replaces the arrow, deliberately:** `→` means "resolves to" in the participant-row kit (Remotes); keeping it at file-line start would give the same glyph a second meaning. Absence is pinned with a rationale comment.
- **One CHUNKS label per block:** the label moved out of the per-claim loop — multi-claim blocks no longer repeat the word; bundle heads became rows inside the group.
- **Uniform block grammar:** head + three labeled groups; labels at indent 0, group rows at 12px, chunk files at 24px; `.unresolved-row` keeps its 8px override and its own `unresolved` heading (pinned: no group label in the bucket).
- **Test-environment discovery (load-bearing for AC-05):** the `@angular/build:unit-test` builder runs Vitest + jsdom, not Karma/Chrome. jsdom returns UNRESOLVED `var(--token)` expressions from `getComputedStyle().color` — the color pins therefore compare at design-token level (muted vs. warning), which is stronger than RGB comparison. jsdom silently DROPS shorthand declarations containing `var()` (`border-left: 1px solid var(…)` → `borderLeftWidth` = `''`), so the divider is written as three longhand properties; `margin-left: auto` computes to `'auto'` and is pinned as such.
- **`source` sweep is word-boundary-scoped:** `/(?<![\w-])source(?![\w-])/` bans the standalone word but allows hyphenated statuses (`source-only`) and the `.source-word` CLASS name (template-only carrier of `from`).
- **Multi-entry FILES verified, not assumed** (user challenged the plural): the model supports several file lines per copy (`ResolvedDependencyCopy.entrypoints`, source-identity merge; VM pin `packages-view-model.spec.ts` CROSS_SOURCE `['lib-a','lib-b']`), but ALL bridge fixtures carry single-entry maps — secondaries live as separate registry keys. External orchestrator source analysis (user-relayed, 2026-08-20) resolved the open question: dense multi-entry registrations are DOUBLE opt-in (`features.denseExternals` build-side, dense format since core v4.3.0; `feature.convertFlatSharedInfo` host-side; both default false in v4.5.0/v4.6.0); default ≥4.5 builds keep separate keys, so a default capture can never witness the case. Findings persisted to auto-memory (`orchestrator-registry-semantics`). Follow-up proposed as Task 7.8 (see Open Issues).
- **Host-chip color question re-confirmed as Task 7.7 scope:** the toolbar host chip renders muted + sans + dotted underline via `.chip-host` (not a link effect); per the plan block's Key Discoveries this moves with the participant colors.

### Review Focus

- **Behavior claims:** every copy block renders as head + three labeled groups `FILES` / `DECLARED BY` / `CHUNKS` (one label each, group rows indented, sparse blocks included) with neither the standalone word `source` nor the `→` glyph anywhere in copy-block DOM; STRICT / `pinned scope` render with the muted token while `.detail-conflict`/`.pkg-conflict` keep warning tokens — verbatim tooltips throughout; the toolbar renders one left filter zone (buttons + chips, 1px divider) with the scopes summary right-aligned and unchanged filter behavior.
- **Assumptions / choices:** two approved amendments extend the plan block's AC-03/AC-04 wording (CHUNKS break, FILES label — file lines are now group content, not label-level siblings); longhand border + token-level color pins are jsdom-driven testability choices.
- **Scope notes:** kit `participant-row.css` + spec changed outside `views/packages/` (strict-marker color, shared with Remotes — full suite green); auto-memory updated outside the repo; the `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `package-detail.html` — the complete block anatomy after all three label changes; `packages.spec.ts` — the AC-04 label-triple pins and the jsdom comments explaining token-level color assertions; the mock's "Task 7.6 amendment" section — the seven deltas are the wording contract for this diff.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --include 'projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts' --watch=false` — passed on the final code state: 3 files / 63 tests (17 Packages DOM incl. one new pooling-anchor test, 36 VM unchanged, 10 kit).
- `npm test` — passed on the final code state: 34 UI files / 348 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (546 total; +1 vs. Task 7.5).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics.
- `./node_modules/.bin/prettier --check` on all changed files and `git diff --check` — clean.
- Template sweep `>source<|>\s*source\s*<` over `views/packages/*.html` — zero hits; `.file-arrow`/`.chunk-word` referenced nowhere after removal.
- Intermediate red run caught the jsdom shorthand limitation (`borderLeftWidth` `''` under `border-left: … var(…)`), verified against a standalone jsdom probe, fixed via longhand — documented in Key Decisions.
- Visual verification by the user in the running panel (screenshots 2026-08-19/20: toolbar zones + divider, self-fill / strict-split / strict-scope block anatomy with FILES/DECLARED BY/CHUNKS, muted STRICT and PINNED SCOPE).

### Acceptance Coverage

- **T7.6-AC-01 — passed:** filter-zone DOM pins (buttons + chips inside, scopes summary outside) plus computed-style pins `borderLeftWidth === '1px'` and `marginLeft === 'auto'` in the participant-filter test; the pre-existing Conflicts ∧ participant pins run unchanged.
- **T7.6-AC-02 — passed:** normalized text pins `share scope: strict` / `share scope: global` alongside the untouched configured/default tooltip pins.
- **T7.6-AC-03 — passed:** signals head pins `.source-word` text `from` with the exact-target-source tooltip intact; new pooling-anchor test pins `skip-registration` + `from` + mfe1 chip; word-boundary sweep over every copy block. Contributes: XC-06.
- **T7.6-AC-04 — passed (amended):** label-triple pin `['files', 'declared by', 'chunks']` as direct block children in the happy path AND the sparse strict-split block (one consumer row, no chunk list); `→` absence pin; unresolved bucket pinned label-free. Amendment note: the approved FILES/CHUNKS deltas supersede the AC's original "file lines … same indent level" wording — file lines are now rows inside the FILES group (mock amendment points 2–4).
- **T7.6-AC-05 — passed:** token-level color pins — `.consumer-strict` = `.consumer-declared` ≠ `.detail-conflict` (strict-split), `.detail-strict` = `.detail-scope` (strict-scope), kit `.strict-marker` = `.declared`; conflict/warning elements keep their tokens.

### Open Issues

- **Task 7.8 proposal (plan amendment pending, directly after this commit):** `synthetic-dense-entries` bridge fixture modeling the `denseExternals: true` opt-in output (one v4.5 registration, `entries` = parent + secondary, both mapped) + DOM pin for one block with two FILES lines; optional second case: metadata-signature split (separate entries under the SAME registry key). Real capture stage needs a test app with `features.denseExternals: true` (maintainer work; a default-config ≥4.5 capture cannot witness the case).
- Host-chip typography/color alignment (muted + sans + dotted underline vs. remote chips) → Task 7.7, together with stable participant colors; decide there whether the `__NF-HOST__` tooltip affordance keeps the dotted underline.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.6 staging (user-owned).
- Plan-deferred items remain deferred (consumer-row collapse, participant combobox, group-by-source toggle, consumer counts, multi-select filter).

### Context for Next Task

- **Task 7.7 (participant colors) starting points:** chip anatomy lives in `shared/kit/participant-chip.css` (`.chip`, `.chip-remote` mono/full-color, `.chip-host` muted/sans/dotted-underline + `:host-context(a)` hover rules); the host chip's "different look" observed this session is exactly this rule set, not a link effect.
- **Reusable test pattern for color work:** jsdom returns unresolved `var(--token)` strings from `getComputedStyle().color` — 7.7 can pin participant colors at token level; avoid `var()` inside shorthands in any CSS a computed-style pin must read (longhand instead), and expect `''` from unlayouted geometry properties.
- **Block anatomy is now uniform and pinned:** head + FILES/DECLARED BY/CHUNKS with the shared `.group-label` class — Task 8 (Remotes pivot) can mirror this grammar; the label-triple pin pattern (`:scope > .group-label` textContent list) is the cheap structural guard.
- **Warning-token policy is explicit:** warning colors are reserved for conflicts and honest-state warnings; configuration facts render muted (comments in `package-detail.css` / `participant-row.css` state this).
- **Dense-entries knowledge** is durably stored in auto-memory `orchestrator-registry-semantics` (double opt-in, metadata-signature grouping, first-writer-wins default) — Task 7.8 should cite it instead of re-deriving.
- `/commit 7.6` must stage the 8 modified repo files (5 × `views/packages/`, 2 × `shared/kit/participant-row.*`, 1 × design mock) plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |  2 +-
 .../design/packages-view-redesign-mock.md          | 51 +++++++++++++-
 .../src/app/shared/kit/participant-row.css         |  3 +-
 .../src/app/shared/kit/participant-row.spec.ts     |  3 +
 .../src/app/views/packages/package-detail.css      | 32 ++++-----
 .../src/app/views/packages/package-detail.html     | 11 ++--
 .../src/app/views/packages/packages.css            | 18 ++++-
 .../src/app/views/packages/packages.html           | 72 ++++++++++----------
 .../src/app/views/packages/packages.spec.ts        | 77 +++++++++++++++++++++-
 9 files changed, 209 insertions(+), 60 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M docs/work/resolution-model/design/packages-view-redesign-mock.md
 M projects/devtools-ui/src/app/shared/kit/participant-row.css
 M projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts
 M projects/devtools-ui/src/app/views/packages/package-detail.css
 M projects/devtools-ui/src/app/views/packages/package-detail.html
 M projects/devtools-ui/src/app/views/packages/packages.css
 M projects/devtools-ui/src/app/views/packages/packages.html
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
```
