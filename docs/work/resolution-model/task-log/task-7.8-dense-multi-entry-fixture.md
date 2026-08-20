### Task

Witness dense multi-entry copies end-to-end with a hand-written bridge fixture — `synthetic-dense-entries` models the double-opt-in dense format (happy case: one registration whose `entries` map carries parent + secondary → one resolved copy with both entrypoints; split case: deviating secondary metadata → two registrations under the same registry key → separate copies/blocks), pinned at store level (materialize) and DOM level (Packages plural FILES rendering).

### Status

DONE

All four T7.8 acceptance criteria are covered by green tests. No production code was needed: the store-level pins were green on first run — the pipeline (normalizer iterates the full `entries` map, source-identity grouping in the materializer, plural FILES in the VM/template) already carried the dense case correctly; it was simply never witnessed by a fixture. The user visually verified both cases in the running panel (screenshots 2026-08-20); the screenshot review produced two plan-amendment candidates (see Open Issues).

### Files Modified

- `projects/devtools-bridge/src/lib/fixtures/synthetic-dense-entries.fixture.ts` (new) — the witness fixture; header comment documents the source-verified double-opt-in provenance (build-side `features.denseExternals`, wire format since core v4.3.0; host-side `feature.convertFlatSharedInfo`; both default false in v4.5.0/v4.6.0) so the case never reads as synthetic fantasy. `@nf-lab/dense-lib`: one v4.5 registration, `entries` = parent + `/secondary`, both specifiers import-mapped. `@nf-lab/split-lib`: two registrations under one key (3.0.0 parent-only, 3.1.4 secondary-only), disjoint specifiers, each mapped to its own file.
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) — import + `'synthetic-dense-entries'` FIXTURES entry.
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (modified) — the T2-AC-02 synthetic-roster pin (an explicit id list, missed by the plan's "no count pins" claim) extended in place with the new id; test title updated.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts` (modified) — new describe "dense multi-entry witness (T7.8-AC-02, T7.8-AC-04)": happy pin (1 registration, exactly 1 copy, `entrypoints` record carries both specifiers, 1 resolution context with 2 claims, `ordinary-shared`) and split pin (2 registrations / tags under one shared-external record, 2 copies with disjoint single-specifier entrypoints — never a merged lie); local helper `registrationsOfPackage`.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (modified) — two DOM tests: happy case (one `.copy-block`, group labels `['files', 'declared by']`, two `.file-line`s, parent line specifier-free, secondary line shows `.file-specifier`, one consumer row) and split case (two blocks found by `.copy-tag`, each one FILES line, only the secondary block shows a specifier).

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 7.8 block only (task isolation).
- Task logs 7.7 (predecessor; jsdom rules, `.gitignore` caveat), 7.6 (origin of this task: plural verified but never witnessed; FILES group anatomy), 5 (copy contract: source-identity grouping, `entrypoints` record, `derive(FIXTURES[...])` harness pattern). Task 7.5 deliberately skipped — 7.6's log already records the CROSS_SOURCE VM pin.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` — the exact wire contract (`ExternalRemoteV1.entries`, `servedFiles`, generations).
- `projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts` — the real-capture counterpart (v4.5 default: secondaries as separate registry keys) the fixture shape was modeled on; `synthetic-multi-version.fixture.ts` — synthetic-fixture conventions (`satisfies`, synthetic pageUrl/collectorVersion).
- `shared/store/resolution/normalize-registry-evidence.ts` (targeted grep) — confirmed the normalizer iterates the full `entries` map into entrypoint candidates on one registration.
- `views/packages/packages-detail-vm.ts` (`blocksOf`, `showSpecifier: specifier !== group.packageName`) and `package-detail.html` FILES group — the DOM pin surface.

### Key Decisions

- **Both cases in ONE fixture:** happy and split share the snapshot (two packages) — one picker entry, one provenance header, and the split's contrast with the happy case is visible in a single capture. Modeled closely on `non-dense` (v4.5 generation, `servedFiles`, `cached: true`) but hand-written, since no default-config capture can produce dense output.
- **Split modeled as different tags, same declaring remote:** the wire format keys `versions[]` by tag, so a tag deviation provably yields two registration rows; an equal-tag signature split (deviating requiredVersion only) might collapse into one version row with two participant entries — unverifiable without a real dense build, hence the riskier modeling was rejected. Same-remote declaration is the direct consequence of densifying one remote's entry list; the two registrations serve disjoint specifiers, so no specifier is claimed twice and the import map stays contradiction-free.
- **Roster pin extended, not fought:** the plan's "no count pins to adjust" missed the T2-AC-02 synthetic-fixture roster in `snapshot-v1.spec.ts` (an explicit id list). Extending it in place is the test's purpose; round-trip, picker, and privacy/export guards were dynamic as promised.
- **`chunks` label absence pinned as correct:** the fixture carries no bundle/chunk evidence, and the template renders the CHUNKS group only when claims exist — the happy-case DOM pin asserts `['files', 'declared by']` with a rationale comment instead of forcing a three-label lie.
- **No production change:** green-on-first-run store pins prove the Task 1–6 pipeline handled dense registrations all along; this task's value is the witness plus the DOM guarantee, exactly as planned.
- **Screenshot review outcomes (2026-08-20, user-verified in panel):** the semantics were confirmed correct (no leaf for the secondary = evidence-honest, `via`-specifier row honest, `no SRI` honest, `⚠ 2 resolved versions` a true measurement). The discussion sharpened the domain vocabulary — registry key / registration / declaration / copy / entrypoint; the shareable atom is the specifier, so the left tree (registry keys) is generation-dependent while the entrypoint level is stable across flat/dense builds. `DECLARED BY` was consciously KEPT over "REGISTERED BY" (declarations are requirement statements, one registration can be co-declared by many participants; "registered" is reserved for registry bookkeeping — vocabulary triad declare/register/resolve). Presentation and diagnostics consequences were deferred to two plan-amendment candidates (see Open Issues), not patched into this task.

### Review Focus

- **Behavior claims:** the canonical pipeline materializes one dense registration with a two-entry `entries` map into exactly ONE resolved copy carrying both specifiers, and renders it as one Packages block with one FILES label and two file lines (secondary line names its specifier); a metadata-deviating secondary split into a second registration under the same registry key yields two copies and two separate blocks, never a merged one.
- **Assumptions / choices:** the split case uses a tag deviation (the plan block's own example) declared by the same remote — the structurally provable modeling; a real dense capture stays out of scope (needs a `denseExternals: true` lab build, maintainer work). The version-deviating secondary is practically exotic (secondaries ship in the parent's npm package) — the fixture witnesses the format's split mechanics, not a common production state.
- **Scope notes:** `snapshot-v1.spec.ts` roster pin extended (outside the four planned key locations, forced by the existing T2-AC-02 test); zero production files touched; the `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `synthetic-dense-entries.fixture.ts` — verify the wire shape against `snapshot-v1.ts` and the provenance header against auto-memory `orchestrator-registry-semantics`; the new describe in `materialize-resolved-copies.spec.ts` — the two cardinality pins are the task's core claim; the happy-case DOM test in `packages.spec.ts` — the plural-FILES contract Task 7.9+ will rely on.

### Test Evidence

- `./node_modules/.bin/ng test devtools-bridge --watch=false` — 3 files / 77 tests green (round-trip iterates the new fixture dynamically; one intermediate red: the T2-AC-02 roster pin, fixed by extending the roster).
- `npm run test:guards` — 4 files / 50 tests green (privacy/export guards scan the new fixture dynamically).
- `./node_modules/.bin/ng test devtools-ui --include '…/materialize-resolved-copies.spec.ts' --watch=false` — 16 tests green; the two new dense pins passed on first run (no production change needed).
- `./node_modules/.bin/ng test devtools-ui --include '…/packages.spec.ts' --watch=false` — 19 tests green (one intermediate red: expected `chunks` label — resolved as honest absence, see Key Decisions).
- `npm test` — full suite green on the final state: 36 UI files / 364 tests (+5 vs. 7.7), 3 bridge files / 77 tests (+3), 6 collector files / 75 tests, 4 guard files / 50 tests (+1).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics; `prettier --check` on all five changed files and `git diff --check` — clean.
- Visual verification by the user in the running panel (screenshots 2026-08-20): happy block with two FILES lines + secondary specifier, split as two blocks with `via`-specifier consumer row, fixture selectable in the picker without changes.

### Acceptance Coverage

- **T7.8-AC-01 — passed:** the snapshot-v1 round-trip and the picker follow the FIXTURES index dynamically (no changes needed); the synthetic-roster pin was extended in place; bridge + guard suites green over the new fixture.
- **T7.8-AC-02 — passed:** "materializes one copy carrying both entrypoints from one dense registration" pins 1 registration → 1 copy with both specifiers in `entrypoints`, 1 context / 2 claims, `ordinary-shared`.
- **T7.8-AC-03 — passed:** "renders the dense multi-entry copy as one block with two FILES lines" pins one block, one FILES label, two `.file-line`s, secondary `.file-specifier`, parent line specifier-free. Contributes: XC-06.
- **T7.8-AC-04 — passed:** store pin (2 registrations / tags under ONE shared-external record, 2 copies with disjoint entrypoints) + DOM pin (two separate blocks, only the secondary block carries a specifier).

### Open Issues

- **Plan amendment pending (directly after this commit, user-agreed 2026-08-20): new Task 7.10 — entrypoint-level presentation.** (a) Indented entrypoint sub-rows in the Packages tree for dense secondaries (muted, honest annotation — evidence is the parent's `entries` map, stronger than the name-derived linked-glyph; own registration tag on the sub-row; click selects the parent; excluded from the "All (n)" count; exact look via rendered mock like 7.5/7.6). This also makes the tree semantically stable across flat/dense generations. (b) Copy-head fact `secondary entrypoint only` when a copy's `entrypoints` do not contain the package's own specifier (grounded tooltip; fixes the "3.1.4 looks like a full split-lib version" misreading). (c) Level-vocabulary tooltips: registry key / registration / copy / entrypoint named where the UI shows them (list header "one row per registry key…", detail head, DECLARED BY group tooltip); `DECLARED BY` label stays (decision above).
- **Plan amendment pending: Task 10 block extension — finding category "package torn across entrypoint registrations"** (warning-level): one registry key, ≥2 resolved copies with disjoint entrypoint sets and different tags (same declaring participant sharpens it). Rationale text may explain the chunk-mixing risk (parent/secondary internals share build chunks), but the claimed evidence stays resolution-level (resolution ≠ delivery). Until the Task-11 cutover, the interim `resolved-tag-multiplicity` glyph and Conflicts count stay as-is (true measurement). `synthetic-dense-entries` is the ready witness for this finding.
- A real dense capture (lab app built with `features.denseExternals: true`) remains out of scope per the plan block — maintainer work for a later capture task.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.8 staging (user-owned).

### Context for Next Task

- **The plural-FILES path is now validated end-to-end** (fixture → normalize → resolve → claims → materialize → VM → DOM); Task 7.9+ and the future graph view may treat multi-entry copies as a witnessed state instead of a synthetic VM seed.
- **Fixture semantics for reuse:** `FIXTURES['synthetic-dense-entries']` — `@nf-lab/dense-lib` = happy dense (1 registration, copy with 2 entrypoints), `@nf-lab/split-lib` = densification split (2 registrations under one key, tags 3.0.0/3.1.4, disjoint specifiers). Select ids: `__GLOBAL__|@nf-lab/dense-lib`, `__GLOBAL__|@nf-lab/split-lib`. It is also the prepared witness for the planned Task-10 "torn package" finding and the Task-7.10 sub-row/head-fact pins.
- **Vocabulary contract from the review discussion:** declare (participant requirement: DECLARED BY, ranges, STRICT) / register (registry bookkeeping: keys, version rows, `entries`, "registered via parent", "registered with action skip") / resolve (outcome: copies, "resolves to", "2 resolved versions"). Task 7.10 wording and Task 10 finding texts should follow this triad; `ParticipantDeclaration`/claim naming in the model already matches.
- **Store-spec pattern:** `registrationsOfPackage(harness, pkg)` in the new describe shows how to pin per-package registration cardinality from `evidence.sharedExternals` + `versionRegistrations`; the `derive(FIXTURES[...])` harness remains the fixture-driven entry point.
- `/commit 7.8` must stage 5 repo files (new fixture, `fixtures/index.ts`, `snapshot-v1.spec.ts`, `materialize-resolved-copies.spec.ts`, `packages.spec.ts`) plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |  2 +-
 projects/devtools-bridge/src/lib/fixtures/index.ts |  2 +
 .../devtools-bridge/src/lib/snapshot-v1.spec.ts    |  3 +-
 .../resolution/materialize-resolved-copies.spec.ts | 60 ++++++++++++++++++++
 .../src/app/views/packages/packages.spec.ts        | 66 ++++++++++++++++++++++
 5 files changed, 131 insertions(+), 2 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
?? projects/devtools-bridge/src/lib/fixtures/synthetic-dense-entries.fixture.ts
```
