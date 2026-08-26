### Task

Recount the single truth independently: a hand-authored six-witness oracle whose expected values are read from the lab captures (cited next to each expectation with capture path + `validate-lab-corpus.mjs` predicate) and proven sensitive by a participant-flattening mutation, plus a parameterized cross-view contract over the 13 corpus-derived fixtures — spec files only, no production code, no new fixtures; the DOM coverage (T11.5-AC-03) dropped by the same-day YAGNI amendment.

### Status

DONE

T11.5-AC-01 and T11.5-AC-02 are green; T11.5-AC-03 is N/A by the 2026-08-26 YAGNI amendment (decided with Lutz at task start, written into `plan.md` before implementation). Three review rounds absorbed: the briefing's own scope cut, the Codex quick review (independent selection derivation, raw-row isomorphism, amendment wording), and the CodeScene change gate (both files 10.0). Ready for `/commit 11.5`.

### Files Modified

- `projects/devtools-ui/src/app/shared/testing/witness-oracle.spec.ts` (new) — T11.5-AC-01: six witnesses (`co-declared-share`, `clean-skip`, `strict-split`, `strict-scope`, `scoped`, `frankenstein-live`) with HAND-READ expected values; every expectation carries an `evidence:` comment naming the capture (`captures/<scenario>/<stamp>.json`) and the validator predicate (`EVIDENCE[<scenario>]` message or the live-section checks). Reads only the façade (`registryEvidence`, `effectiveConsumerResolutions`, `resolutionProjection`, `remotes`, `importMapEntries`) plus `buildPackagesVm` for the strict-scope "empty `__GLOBAL__` creates no package" claim. The co-declared witness is one throwing function `assertCoDeclaredShare(model)`; `flattenParticipants` collapses the two declarers of an in-memory fixture copy into one, and the sensitivity test asserts `toThrow(/mfe2/)` — the declaration assertion fires, not a runtime error — after proving the mutation is minimal (registration row kept, one declarer gone).
- `projects/devtools-ui/src/app/shared/testing/cross-view-contract.spec.ts` (new) — T11.5-AC-02: `describe.each` over the drift guard's `derivedIds` (13, length pinned); per fixture `contextOf(id)` builds the façade once plus the four default-state VMs (`buildPackagesVm`, `buildRemotesVm`, `buildImportMapVm`, `buildGraphModel`) and lookup indexes; 17 small `it`s in six groups: displayed IDs exist canonically (per view), views agree (remotes/hosts, copies, relations, package groups, package measures re-counted from evidence), declarations never inflate (partition; canonical rows ≡ raw registry rows one-to-one in raw order; copies ≤ distinct selected targets and every mapped resolution in exactly one copy), one binding per (scope context, specifier), every recorded map row rendered exactly once, unselected candidates never a copy source (flag vs. evidence, own-source rule, entrypoints == selected targets). Helpers: `expectResolved` (labelled subset check), `evidencedSelection`, `isOwnSource`, `selectedTargetsOf`, `recountedMeasures`, `raw*` readers over `FIXTURES[id].runtime`.
- `docs/work/resolution-model/plan.md` (modified) — preamble amendment "Task 11.5 scoped down (YAGNI)"; Task-11.5 block: DOM bullet struck with pointer, break-point line marked moot, **T11.5-AC-03 → N/A** with the accurate coverage map (Remotes DOM: co-declared chip + scoped private path; Import-Map DOM: co-declared chips, scoped only in the wording sweep; Graph DOM: all three fixtures), `semantic-fields.spec.ts` removed from Key Locations, the stale Key Discovery ("co-declared-share has no VM/DOM coverage") struck and corrected.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble (both amendments) + Task 11.5 block only (task isolation).
- Task logs 11 (predecessor: façade shape, fixture-set definition, gotchas, the inherited cardinality question), 2/2.1 (grep only: `validate-lab-corpus.mjs` as the evidence-predicate source), 5 (grep only: T5-AC-01 pins the co-declared cardinalities from production output — the regression pin the oracle must be independent of), 9 (grep only: the all-`FIXTURES` uniqueness and referential-integrity sweeps as the pattern to generalize, but over `derivedIds`), 8 (grep only: existing co-declared/scoped DOM coverage).
- `scripts/validate-lab-corpus.mjs` (`EVIDENCE` blocks for the six scenarios, live section), `captures/manifest.json`, the six capture JSONs (read through a scratch probe: registry rows, declarers, import-map targets, remote names, entry counts) — the oracle's ground truth.
- `projects/devtools-bridge/src/lib/fixtures/index.ts`, `co-declared-share.fixture.ts`, `snapshot-v1.ts` (`RuntimeRepositoriesV1` shape for the mutation and the raw-row readers); `projects/collector/src/lib/fixture-drift.spec.ts` (`derivedIds`).
- `shared/store/resolution/{model,copies-model,projection-model,claims-model,bundle-claims-model,aggregate-package-measures,derive-declaration-claims}.ts` — canonical shapes, `ordinal` semantics ("occurrence among equal keys", not an index), `ownCandidateSelected` derivation, measures doctrine (shared-only headline counts).
- `views/packages/{packages-view-model,packages-row-vm,packages-vm-shared}.ts`, `views/remotes/remotes-view-model.ts`, `views/import-map/import-map-view-model.ts`, `views/graph/{graph-model,graph-types,graph-element-factories}.ts`, `shared/view-conventions.ts` (`packageId`), `shared/kit/tree-table.ts` — VM shapes, node/edge id rules, "private registrations stay with Remotes".
- `views/packages/packages.spec.ts`, `views/graph/graph.spec.ts`, `views/remotes/remotes.spec.ts`, `views/import-map/import-map.spec.ts` (harness + coverage survey behind the amendment), `views/packages/packages-view-model.spec.ts:505–530` (equal-tag seed).

### Key Decisions

- **YAGNI cut before implementation (plan amendment, Lutz):** the block's third leg — four views × three fixtures rendered again in a new DOM spec — duplicated `remotes.spec.ts` (T8-AC-05), `import-map.spec.ts` (T9-AC-01), and `graph.spec.ts`; the "no coverage" rationale in the block's Key Discoveries was stale. Dropped via amendment rather than deferred to a Task 11.6; visual acceptance is Task 12's walkthrough. Also cut: my own briefing idea of iterating every selection to reach detail-VM IDs — the contract stays on default states (documented in the amendment).
- **Independence means the expected VALUES, not the pipeline:** both specs build the model through the production `ingestSnapshot` (specs are outside the boundary guard by design); what the oracle pins are numbers and names read by hand from the captures and cross-checked against the validator predicates, never from resolver output. Probe-first stayed allowed for orientation — and all plan cardinalities agreed with the façade on the first run (no finding).
- **Oracle as a throwing function:** `assertCoDeclaredShare(model)` serves the positive witness and the sensitivity proof alike; `toThrow(/mfe2/)` pins WHICH assertion fires under flattening. Rejected: re-counting cardinalities on the mutated model only (proves the number changes, not that the oracle catches it).
- **Two wrong contract assumptions corrected against code doctrine, not findings:** (1) `packages.participants` lists declarers involved in shared packages — a host that declares nothing is no chip (`involvedParticipantsOf`); the contract now checks each chip's host flag against the projection instead of set equality. (2) `packageMeasures.registrationCount`/`distinctDeclaredTagCount` count SHARED registrations only; private registrations are separate records (`aggregatePackageMeasures` header, `PackageResolutionMeasures` JSDoc) — `recountedMeasures` follows that.
- **Fixture set = the drift guard's definition,** re-stated verbatim (`!synthetic-`, `!exported-`) and length-pinned to 13 so contract and drift chain cannot disagree on membership.
- **Typing gotchas kept explicit:** `FIXTURES[id]` is a union of the fixture modules' literal types, not `SnapshotV1` — cast once in `contextOf`; branded IDs (`ConsumerCopyRelationId`, `EntrypointCandidateId`) are widened `as string` where a map is keyed from a plain-string VM field (graph edge id, claim candidate id).

— session 2026-08-26 (Codex quick-review round)

- **Selection derived from evidence, not read off the claim** (Codex HIGH): `evidencedSelection(claim)` = own candidate URL (`entrypointCandidates[claim.candidateId]`) equals the mapped target of `resolutionById[claim.effectiveResolutionId]`, null when either side is unavailable. The production flag `ownCandidateSelected` is now asserted AGAINST that derivation (agrees on all 13 fixtures), the own-source rule runs on the derived value (`isOwnSource`), and `copy.entrypoints` == selected targets is bidirectional (set equality, was ⊆).
- **Raw-row isomorphism replaces the (tag, action) uniqueness** (Codex MEDIUM): the uniqueness assertion contradicted the canonical model — one `VersionRegistration` per stored `versions[]` element, duplicates preserved by ordinal (Task 1, `EQUAL_TAG_SEED` in `packages-view-model.spec.ts`). Now: `sharedExternals` ≡ raw `(scope|pkg)` keys, per external `[tag, rawAction]` ≡ raw `versions[]` in order, per registration declarant names ≡ raw `remotes[].name` in order, `privateRegistrations` ≡ raw `scopedExternals`. Stronger AND independent: the anti-flattening/anti-inflation invariant measured against the raw fixture, not internal consistency.
- **Amendment wording corrected** (Codex MEDIUM): `import-map.spec.ts` touches `scoped` only in its wording sweep; the scoped private-path DOM anatomy lives in `remotes.spec.ts` (`.scoped-item`/`.scoped-tag`/`.scoped-file`) and `graph.spec.ts`. Text fixed in preamble and AC-03 line; the decision (no new DOM test) stands.
- Blind spots acknowledged as by design: default view states (amendment); no task log at review time (this file).

— session 2026-08-26 (CodeScene change gate)

- **Gate cleared by decomposition, behavior-neutral:** the four large `it`s (cc 10–20, 73–89 lines, module mean 4.8) became 17 small `it`s per fixture in six `describe` groups plus pure helpers (`contextOf`, `expectResolved`, `nodeIds`, `registrationsOf`, `declarantsOf`, `recountedMeasures`, `raw*`, `evidencedSelection`, `isOwnSource`, `selectedTargetsOf`). Same assertions, same fixtures; `cs review` scores both files 10.0. Side effect: failures now name the surface (`['bundle edge chunks', [...]]`, `[copy.id, targets]`) instead of a bare `[]`.

### Review Focus

- **Behavior claims:** (1) the six witnesses' cardinalities hold exactly as the plan states them, read from the captures — `witness-oracle.spec.ts` is 7/7 and its flattening mutation makes the co-declared function throw on the missing `mfe2`; (2) on every corpus-derived fixture the canonical registry evidence is the raw registry one-to-one in raw order, every mapped resolution lands in exactly one copy, every (scope context, specifier) is bound once, every recorded import-map row renders once, and the four default-state views agree with the projection on remotes, copies, relations, and package groups — `cross-view-contract.spec.ts`, 222 tests; (3) `ownCandidateSelected` equals the evidence-derived selection on all 13 fixtures, and no copy is sourced by a declaration whose own candidate the map did not select.
- **Assumptions / choices:** "2 consumer-scope resolutions" read as two `EffectiveConsumerResolution` records for `@nf-lab/conflict-lib` (`consumerRemotes` mfe1/mfe2); "1 exact selected source" as source = mfe1's declaration with `share-registration` disposition and claims `{mfe1: true, mfe2: false}`; strict-scope "creates no package" checked canonically (no `__GLOBAL__` external) AND on the Packages VM (`scopes == [['strict', 1]]`); the flag check skips claims with no candidate URL or no mapped target rather than pinning the null convention; contract on default UI states only.
- **Scope notes:** `plan.md` amended (YAGNI cut + wording fix) — may be committed with the task; no production, fixture, or doc-site file touched; the boundary/vocabulary guards do not scan `shared/testing/` (specs), so nothing there is guard-relevant.
- **Read next:** `witness-oracle.spec.ts` `assertCoDeclaredShare` + `flattenParticipants` (the sensitivity proof and every cited number) — then `cross-view-contract.spec.ts` `evidencedSelection`/`isOwnSource` (the one place the contract judges the resolver's own flag) and the raw-row block (`rawSharedKeys`/`rawVersionsOf`/`rawPrivateRows` against `registrationsOf`/`declarantsOf`).

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/testing/*.spec.ts' --watch=false` — first run: oracle 7/7 green on the first try (every plan cardinality agrees with the façade), contract 78/86 with one wrong assumption (host chips); after the two doctrine corrections 86/86.
- **Sensitivity proof (T11.5-AC-01):** `breaks under a participant-flattening mutation of co-declared-share` — the mutated model ingests with `['1.0.0 share']` / `['mfe1']`, and `assertCoDeclaredShare` throws with `mfe2` in the message (`toThrow(/mfe2/)`).
- `npm test` — full chain green: UI 38 files / 569 tests (483 + 86), bridge 3 / 79, collector 6 / 75 (incl. `fixture-drift.spec.ts`), guards 6 / 66.
- `prettier --check` on both new files clean; `git diff --check` clean.

— session 2026-08-26 (Codex quick-review round)

- Pair after the three fixes: 86/86 (one intermediate TS error — `FIXTURES[id]` literal union vs. `SnapshotV1` — fixed by the cast). `npm test` green again: 569 / 79 / 75 / 66.

— session 2026-08-26 (CodeScene change gate)

- Pair after decomposition: 2 files / 229 tests (7 + 222 = 1 + 13 × 17). `npm test` — UI 38 / 712, bridge 3 / 79, collector 6 / 75, guards 6 / 66. `prettier --check` clean, `git diff --check` clean.
- `cs review` (outside the sandbox — the license check needs `api.codescene.io`): `cross-view-contract.spec.ts` 10.0 ✅, `witness-oracle.spec.ts` 10.0 ✅ (was 7.76 with four Complex/Large Method findings and module mean 4.8 > 4).

### Acceptance Coverage

- **T11.5-AC-01 — passed:** `witness-oracle.spec.ts` — six witnesses with the exact stated cardinalities (co-declared-share 1/2/2/1/1/1 exact source, clean-skip 2 registrations / 2 tags / 1 copy, strict-split 3 / 2 / 2, strict-scope one `strict` external and no `__GLOBAL__` package, scoped 2 private registration → resolution → copy paths, frankenstein-live 3 remotes / 22 global / 7 scoped entries) and the flattening mutation breaks the co-declared witness. Contributes: XC-03.
- **T11.5-AC-02 — passed:** `cross-view-contract.spec.ts` — all 13 corpus-derived fixtures satisfy the cross-view ID/count/target/relation contract, the raw-row isomorphism, the one-binding invariant, the exact map-row count, and the unselected-candidate rule (evidence-derived). Contributes: XC-02, XC-03.
- **T11.5-AC-03 — N/A:** dropped by the 2026-08-26 YAGNI amendment; DOM coverage of the three fixtures exists in `remotes.spec.ts` (T8-AC-05), `import-map.spec.ts` (T9-AC-01), `graph.spec.ts` — ID kept visible.

### Open Issues

- The contract runs on default view states; detail VMs (Packages/Remotes selection) are pinned only by their per-view suites — deliberate (amendment). Revisit only if a cross-view drift confined to a detail model ever surfaces.
- `evidencedSelection` compares URLs verbatim; if the resolver ever normalizes candidate/target URLs differently (e.g. query stripping), the flag check turns red — that is the intended alarm, investigate before touching the contract.
- `cs review` cannot run inside the sandbox (license endpoint); run it with the sandbox bypass or from the host shell.

### Context for Next Task

- **Task 12 (fixture UX acceptance) starts on a doubly validated truth:** the guards (Task 11) lock the boundary; the oracle + contract (this task) prove that the four views agree with each other and with the raw captures on every corpus fixture. The walkthrough can concentrate on how things LOOK, not whether the numbers are right; the Diagnostics column stays deferred (Task 10).
- **Where the semantic facts are pinned now:** hand-read cardinalities → `witness-oracle.spec.ts` (`evidence:` comments cite capture + predicate); structural invariants over all 13 fixtures → `cross-view-contract.spec.ts` (`contextOf` is the one place the VMs are built — extend there if a fifth view joins, e.g. Diagnostics).
- **Run commands:** pair — `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/testing/*.spec.ts' --watch=false`; chain — `npm test`; code health — `CS_DISABLE_VERSION_CHECK=1 cs review <file>` outside the sandbox.
- **Gotchas:** `FIXTURES[id]` needs `as SnapshotV1` for a uniform raw shape; branded IDs vs. string map keys (`as string` on the map side); `VersionRegistration.ordinal` is the occurrence among equal keys, not the array index — rely on array order (raw order is retained) when zipping with raw rows; `packageMeasures` headline counts are shared-only; `packages.participants` are involved declarers, not all remotes.
- `/commit 11.5` stages 4 paths: the two new specs under `projects/devtools-ui/src/app/shared/testing/`, `docs/work/resolution-model/plan.md` (amendment), and this log.

### Git State

`git diff --stat`

```text
 docs/work/resolution-model/plan.md | 32 +++++++++++++++++++++++++++-----
 1 file changed, 27 insertions(+), 5 deletions(-)
```

`git status --short`

```text
 M docs/work/resolution-model/plan.md
?? projects/devtools-ui/src/app/shared/testing/
```

(untracked: `projects/devtools-ui/src/app/shared/testing/witness-oracle.spec.ts` 297 lines, `cross-view-contract.spec.ts` 533 lines, and this log)

### Sessions

- claude-code af4985a6-1e8b-436c-a699-c78640bb2645 (2026-08-26) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/af4985a6-1e8b-436c-a699-c78640bb2645.jsonl
- codex 01a03ef2-741d-72a2-9b8b-1200f4af39d2 (2026-08-26) — transcript: /home/lutz/.codex/sessions/2026/08/26/rollout-2026-08-26T18-41-11-01a03ef2-741d-72a2-9b8b-1200f4af39d2.jsonl
