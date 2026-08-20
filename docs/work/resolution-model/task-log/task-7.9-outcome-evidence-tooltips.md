### Task

Ground the three DECLARED BY outcome tags in the Packages detail (`skipped own <tag>`, `kept own copy`, `not selected`) with tooltips naming the consumer's own registered file as evidence — capture-relative wording, file claimed only when the claim's candidate evidence carries it, tooltip-only (visible DOM unchanged).

### Status

DONE

All three T7.9 acceptance criteria are covered by green tests; the full repository suite is green. The task block's conditional ("extending the normalization is in scope if the raw declaration `file` is not preserved") resolved to the small path: the file IS canonically preserved — not as a field on `ParticipantDeclaration`, but via `entrypointCandidateIds` → `EntrypointCandidate.file`, and every claim carries `candidateId`. The store directory was not touched; the only missing piece was a `candidateById` lookup in the view-shared indexes.

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts` (modified) — `CanonicalIndexes` gains `candidateById: Map<EntrypointCandidateId, EntrypointCandidate>`, built from `model.registryEvidence.entrypointCandidates` exactly like the sibling registryEvidence maps.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` (modified) — new helper `evidencedOwnFilesOf` (files of the given claims' own candidates, deduplicated, joined in claim order — covers dense multi-claim rows); `consumerDeviationsOf` gains the `indexes` parameter and grounds the three outcome notes in the evidenced file(s), with the outcome-only wording as the no-evidence fallback (nothing invented). Both call sites (local consumer rows and cross-package/foreign rows) pass the indexes.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts` (modified) — clean-skip and strict-split note pins updated to the new grounded wording (expected pin maintenance, labels unchanged); new T7.9-AC-01 pin for the co-declared `not selected` note incl. capture-relative clause; new T7.9-AC-02 describe (co-declared model with `entrypointCandidates` emptied at the vm boundary → outcome note without a file name); header doc comment extended with the T7.9 coverage line.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (modified) — one NEW DOM test pinning the skip chip's rendered `title` attribute verbatim (file + tag) and the visible chip text staying the label alone; all pre-existing DOM pins untouched (the T7.9-AC-03 proof).

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 7.9 block only (task isolation).
- Task logs 7.8 (predecessor; vocabulary triad declare/register/resolve, dense fixture semantics, `.gitignore` caveat), 4 (claim contract: `candidateId`/`ownCandidateUrl`, mapping states triggering the outcomes), 7.5 (origin of `consumerDeviationsOf`, the AnnotationVm-note-as-title tooltip channel, both consumer-row call sites).
- `shared/store/resolution/model.ts` — verified the canonical declaration surface: `ParticipantDeclaration.entrypointCandidateIds` → `EntrypointCandidate.file` (source kinds `participant-file`/`participant-entry`); `shared/store/resolution/index.ts` — barrel exports (`export type * from './model'`).
- `shared/store/resolution/claims-model.ts` (targeted grep) — `DeclarationResolutionClaim.candidateId: EntrypointCandidateId`.
- `views/packages/package-detail.html` — confirmed the `[title]="deviation.note"` rendering channel; template untouched.
- `devtools-bridge/src/lib/fixtures/clean-skip.fixture.ts`, `strict-split.fixture.ts`, `co-declared-share.fixture.ts` — the witnessed own-file names for the exact-note pins (all three: `_nf_lab_conflict_lib.JF7uEdSVsN.js`).

### Key Decisions

- **No normalization change:** the plan block's conditional was checked first and answered in code — the raw declaration file survives normalization as `EntrypointCandidate.file` reachable from both the declaration and the claim. Extending `ParticipantDeclaration` with a redundant `file` field was rejected as a duplicate of existing canonical evidence.
- **Evidence path claim → candidate:** the file is resolved per OUTCOME-TRIGGERING claim (`claim.candidateId` → `candidateById`), not from the declaration's full candidate list — a dense declaration may hold candidates whose claims did not produce the outcome, and naming those would overclaim. Multiple distinct files (dense multi-claim rows) join deterministically in claim order.
- **Wording per outcome (capture-relative, vocabulary triad respected):** `not selected` → `own copy <file> is registered but not selected in this capture — the binding resolves to this copy; a different composition may select it` (the plan-block example plus the standalone-deployability clause; never "dead weight"); `skipped own <tag>` → `own copy <file> (<tag>) is registered with action skip — …` (tag kept because the fallback wording carried it); `kept own copy` → `own copy <file> is registered with action scope — the consumer keeps it, …`. The no-file fallbacks keep the prior sentences (`not selected` was minimally reworded from "not the effective target" to "not selected in this capture" for capture-relativity).
- **Empty-string guard:** `evidencedOwnFilesOf` treats `file === ''` as no evidence (the normalizer's `unusable-file` candidate state can carry empty spellings) — the tooltip never renders `own copy  is registered…`.
- **AC-02 seeded at the vm boundary:** the no-evidence case is not producible by ingesting any well-formed fixture (the pipeline always carries candidates), so the test rebuilds the co-declared model with `registryEvidence.entrypointCandidates: []` and asserts the file-less note. This pins the vm contract ("claim the file ONLY when evidence carries it") independent of normalizer internals.
- **Existing note pins updated, not preserved:** T7.9-AC-03 freezes the visible DOM text only; the two VM pins on the old note wording (clean-skip, strict-split) were consciously moved to the new grounded text. The `kept own copy` glossary short-form in `shared/view-conventions.ts` belongs to another surface (action glossary) and stays untouched.
- **Screenshot review (2026-08-20, split-case plausibility):** the user challenged whether the strict-split-style dense split (parent 3.0.0 / secondary 3.1.4, same remote) is real-world possible. Assessment: not via npm/package.json (secondaries ship in the parent's package), but reachable via NF configuration (secondary listed as its own shared entry with deviating pinned version), nested-package.json publisher errors, or stale partial rebuilds — the registry records declared metadata, not node_modules truth. Confirms the state is diagnosis-worthy (Task-10 torn-package finding), not a fixture fantasy.

### Review Focus

- **Behavior claims:** each of the three outcome tags renders a tooltip naming the consumer's own registered file exactly when the outcome-triggering claims' candidates are part of the canonical evidence; with the evidence absent the tooltip states the outcome alone; the visible DOM (chip labels, block structure) is byte-identical to Task 7.8's state.
- **Assumptions / choices:** file evidence flows per triggering claim (not per declaration) — see Key Decisions; the `''`-file guard treats empty spellings as absence; the no-file `not selected` fallback wording changed slightly (capture-relative) — a vm-level wording change, not a DOM one.
- **Scope notes:** `packages-vm-shared.ts` gained only the index; store/, template, and CSS untouched; the pre-existing `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `evidencedOwnFilesOf` + the three note branches in `packages-detail-vm.ts` — verify the triggering-state filters match the label conditions above them; the T7.9-AC-02 describe in `packages-view-model.spec.ts` — verify the seeded absence is honest (model spread, no pipeline re-run); the new DOM test in `packages.spec.ts` — the verbatim `title` pin is the AC-01 DOM half.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --watch=false` — 2 files / 58 tests green on first run after the change (55 pre-existing + 2 VM + 1 DOM new; the two updated note pins prove the production wiring).
- `npm test` — full suite green on the final state: 36 UI files / 367 tests (+3 vs. 7.8), 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics.
- `./node_modules/.bin/prettier --check` on all four changed files — clean; `git diff --check` — clean.
- Repository-wide sweep for the retired note wordings (`own copy 1.0.0 is registered`, `keeps its own copy, mapped only`, `not the effective target`) — remaining hits are only the intended fallback in `packages-detail-vm.ts` and the out-of-scope glossary in `view-conventions.ts`.

### Acceptance Coverage

- **T7.9-AC-01 — passed:** exact-note VM pins on all three witnessing fixtures — clean-skip (`skipped own 1.0.0`, file + tag), strict-split (`kept own copy`), co-declared-share (`not selected`, the plan-block example incl. capture-relative clause) — plus the new DOM test pinning the rendered `title` verbatim. Contributes: XC-06.
- **T7.9-AC-02 — passed:** "renders the outcome note without a file name when no candidate evidence exists" — co-declared model with emptied `entrypointCandidates` yields the file-less note; no invented evidence.
- **T7.9-AC-03 — passed:** zero template/CSS changes; every pre-existing `packages.spec.ts` DOM pin runs unmodified and green (the one addition is a new test, not an edit); visible chip labels pinned unchanged.

### Open Issues

- The dense multi-file join path in `evidencedOwnFilesOf` (one row, ≥2 triggering claims with distinct files) has no fixture witness — `synthetic-dense-entries` produces no not-selected dense row. Acceptable: the join is deterministic; a witness would fall out of the Task-10 torn-package work if needed.
- Before writing the Task-10 torn-package finding text, verify against `@softarc/native-federation` source how the build tools derive secondary-entrypoint versions (parent package.json vs. per-entrypoint metadata) — the split-case plausibility assessment above is toolchain knowledge, not source-verified.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.9 staging (user-owned).

### Context for Next Task

- **The tooltip channel is now the validated grounded-evidence path:** `AnnotationVm.note` → `[title]` with file-level evidence resolved via `claim.candidateId` → `indexes.candidateById` → `EntrypointCandidate.file`. Task 7.10 (entrypoint sub-rows, `secondary entrypoint only` head fact, level-vocabulary tooltips) should reuse `candidateById` and the same evidence rule instead of re-deriving files from raw data.
- **`evidencedOwnFilesOf(claims, indexes)`** in `packages-detail-vm.ts` is the reusable primitive: pass only the claims that ground the statement being made; it returns a joined display string or null (absence = say the outcome alone).
- **Wording contract:** an unselected own copy is capture-relative ("a different composition may select it") — never dead weight, no byte/delivery claims; the declare/register/resolve triad continues to hold in all three notes ("registered with action …", "the binding resolves …").
- **Gotcha:** `consumerDeviationsOf` has TWO call sites (local rows and cross-package/foreign rows around lines 481/535) — any future signature change must update both; the foreign path passes unfiltered subject claims, which is correct because the outcome filters re-select by mapping state.
- `/commit 7.9` must stage the four `views/packages/` files plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |  2 +-
 .../src/app/views/packages/packages-detail-vm.ts   | 56 +++++++++++++++++++---
 .../app/views/packages/packages-view-model.spec.ts | 46 +++++++++++++++++-
 .../src/app/views/packages/packages-vm-shared.ts   |  6 +++
 .../src/app/views/packages/packages.spec.ts        | 14 ++++++
 5 files changed, 115 insertions(+), 9 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
```
