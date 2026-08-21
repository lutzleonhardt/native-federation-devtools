### Task

Migrate the Remotes view (list + detail) from the legacy `DerivedFederation` surface to the canonical Store façade — the remote as a CONSUMER: declarations with claim mapping states and qualified sources, relation-reconciled consumer paths, private registrations with their full claim → resolution → copy paths, canonical bundle/chunk claims, and capture/registry wording — while preserving the list/detail layout and cross-link behavior.

### Status

DONE

All five T8 acceptance criteria are covered by green tests; the full repository suite is green. Two in-session external review rounds produced seven findings (2 HIGH, 4 MEDIUM, 1 LOW) — all seven were verified against the code/pipeline, confirmed, and fixed with seed-backed regression tests; none was rejected. The user's panel screenshot review of the Remotes view is the remaining step before `/commit 8` (deltas would be absorbed by a second `/wrap-up 8`).

### Files Modified

- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified) — canonical-façade join helpers lifted here with their second consumer (`CanonicalIndexes`, `buildCanonicalIndexes`, `copySourceRemote`, `copySourceDisplay`, `isHostRemote`, `targetFileName`) plus the qualified-source ladder (`CopySourceVm`, `copySourceVmOf`, lifted from Packages in review round 1); legacy-typed `declaredOf`/`explicitArrowOf` removed (Remotes was their last consumer — the module is now legacy-free); `ACTION_NOTES` skip/scope reworded to registry-evidence-only (review H4 + round-2 finding 2).
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts` (modified) — moved helper definitions replaced by re-exports from `view-conventions` (import sites stay stable); Packages-specific helpers (`mainClaimOf`, `parentOf`, `copyGroupIds`, …) remain.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` (modified) — local `CopySourceVm`/`copySourceVmOf` removed in favor of the shared ladder; type re-export kept for import-site stability; no behavior change (all Packages pins green throughout).
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts` (modified) — `buildRemotesVm(model, ui)` without `DerivedFederation`; list summary counts DECLARATIONS (`1 expose · 1 declaration`, plus `N private registrations` when > 0, chunk carriers excluded via projection `scoped-pseudo-external` groups); boundary note reworded to capture/registry language (no "entry never loaded"); facade re-exports the new detail types.
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts` (rewritten) — fully canonical transposed detail: `depsOf` from declarations → claims → resolutions → copies with `arrowOf` (main-claim arrow: own / qualified winner / honest none) and per-claim `sourceChipOf` (round-2 finding 1) + `depStatesOf` mapping-state chips (T7 vocabulary, specifier-prefixed for secondaries); `relationOnlyOf` surfaces claim-less `ConsumerCopyRelation`s (review H2); `scopedOf` renders true private registrations (`PrivateRegistrationId` retained, carriers excluded canonically) with `scopedClaimStateOf` grounded on `mappingState`, never `copyId` (review H3); `chunksOf` exclusively from canonical bundle claims / carrier chunk groups; `capabilitiesOf` re-grounded (chunk groups per emitter, declaration bundles, `remote.integrity`); local share-count/winner-less-election logic removed.
- `projects/devtools-ui/src/app/views/remotes/remotes.ts` (modified) — `store.derived()` dropped; model-only input.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.html` (modified) — state-chip channel (`.state-chip`) replaces the `noElection` marker; relation-only block ("resolved bindings without an own resolution claim"); chunk section switches on `bundle-claims`/`carrier-groups`/`none` with visible qualification for non-`mapped-source` claims; scoped claims render specifier, state chip, resolved file, and deviating copy tag.
- `projects/devtools-ui/src/app/views/remotes/remote-detail.css` (modified) — `.state-chip` (Packages look), `.chunk-status` (dashed = qualified), `.relation-list/-item/-binding/-note`, `.scoped-specifier`; `.dep-no-election`/`.chunk-mapped` styles removed with their elements.
- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.spec.ts` (rewritten) — 31 tests: fixture-driven AC pins (co-declared-share, clean-skip, scoped, pooling-anchor, synthetic-multi-version, strict-scope, frankenstein-live, non-dense, synthetic-empty-page) plus a seed harness with eight seeds witnessing what the corpus cannot: ambiguous-scope / host-fallback / unknown-source ladder (H1), relation-only consumer via candidate-less declaration in a shared scope (H2, incl. corpus sweep proving all fixture relations are claim-backed), private not-selected and private multi-entrypoint (H3), multi-entry differing sources and scope-action wording (round 2); purity pin on model-only input.
- `projects/devtools-ui/src/app/views/remotes/remotes.spec.ts` (rewritten) — 15 DOM tests: carried-over list/sentinel/badge/expose/click behavior re-pinned; skip fallback arrow with `(source: mfe2)` aria; co-declared `not selected` chip; scoped private path anatomy; canonical bundle-claim rendering with visible `source-only` qualification; carrier groups; seed-capable snapshot provider with the `QUALIFIER_SEED` DOM witnesses for the ambiguous-source chip and the relation-only row; wording sweep extended (`no \bloaded\b`).

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 8 block only (task isolation).
- Task logs 7.10 (predecessor; level vocabulary, capture-level grounding precedent), 6 (projection contract: three façade surfaces, `ConsumerCopyRelation`, bundle-claim qualification rules), 7 (validated consumption pattern, claim-state/qualified-source vocabulary, helper-lift guidance). Task 2.x logs matched the relevance search only on the universal-provider wording rule (not read in full).
- `shared/store/resolution/` — `projection-model.ts`, `model.ts`, `copies-model.ts`, `claims-model.ts`, `bundle-claims-model.ts`, `index.ts` (barrel), `build-canonical-projection.ts` (relation derivation — H2 verification), `derive-declaration-claims.ts` (`privateMappingState` — H3 verification), `resolve-effective-consumer-bindings.ts` (`registerClaim`/alias mechanics — H2 seed design), `derive-chunk-groups.ts` (`CHUNK_PSEUDO_PACKAGE_PREFIX`, deliberately NOT imported).
- `shared/store/derivations.ts` + `derived-model.ts` — legacy badge/attribution rules (read to re-ground capabilities; unmodified).
- `views/packages/` — `packages-vm-shared.ts`, `packages-detail-vm.ts`, `packages-chunk-vm.ts`, `packages-view-model.spec.ts` (seed harness conventions, `AMBIGUOUS_SCOPE_SEED` pattern), `package-detail.html`/`.css` (`.state-chip`/`.chunk-status` conventions).
- `shared/kit/participant-row.ts/.html` (arrow contract + aria), `shared/view-conventions.ts`, `federation-model.ts`; `devtools-bridge` fixtures `scoped.fixture.ts` (raw `scopedExternals` shape for seeds).

### Key Decisions

- **Ground truth first:** a temporary probe spec dumped the canonical per-remote view (declarations, claims, states, relations, copies, bundle claims, chunk groups, completeness) for ten fixtures into scratchpad JSON before any pin was written; every fixture pin and all eight seeds passed on their first run. The probe was deleted before commit.
- **Read surface is exactly the three façade collections;** the detail joins by ID through `CanonicalIndexes` built once per vm. No resolution derivation function is called from the view.
- **Transposed arrow doctrine kept, canonically grounded:** every dependency row draws its resolution — own arrow only for an EVIDENCED own source (never from observed attribution), winner arrow to the selected copy's qualified source, honest `none` with a grounded reason. The old winner-less-election marker is gone; `synthetic-multi-version` (a capture without import maps) now honestly renders `none` + `not mapped` instead of `own` + "no single elected version".
- **Qualified-source ladder is shared, not duplicated (review H1):** `copySourceVmOf` lifted to `view-conventions.ts`; the arrow provider is the qualified display/label and non-exact qualifiers (`ambiguous source`, `observed target source`, `unknown source`) render as grounded chips. Round 2 sharpened this to PER-CLAIM chips (`sourceChipOf`, specifier-prefixed) so a secondary entrypoint's qualification cannot hide behind an exact main claim.
- **Relation-only consumers stay visible (review H2):** relations of the remote with empty `claimIds` render as their own block. Verified mechanics: `build-canonical-projection` records a relation for every consumer of a member resolution, and `registerClaim` registers consumers per DECLARATION even without candidates — so the real witness is a candidate-less declaration in a shared scope URL; a remote with no declaration at all never enters a lookup and thus never relates. A corpus sweep test pins that all fixture relations are claim-backed (the block stays invisible there).
- **Private claim states ground on `mappingState`, never on `copyId` (review H3):** `privateMappingState` provably returns `not-selected` for a mapped-elsewhere binding while the claim still carries the materialized copy's id — labeling that "own mapping" would be false. Template now also shows the claim specifier and a deviating resolved copy tag.
- **Action notes are registry evidence only (review H4 + round 2):** skip = "the registry election does not take this copy", scope = "an isolated registration outside the version election"; where the binding actually resolves is said exclusively by arrow and state chips (pooling-anchor pins the contradiction case: skip + anchored → own copy). The `kept own copy` chip note grounds in the claim's own-selected state without a universal "mapped only for" audience claim.
- **Chunk carriers identified canonically, not by name:** `@nf-internal/` pseudo packages are recognized via projection chunk groups with `origin: 'scoped-pseudo-external'` (the `CHUNK_PSEUDO_PACKAGE_PREFIX` constant stays barrel-internal; the T6-AC-06 barrel export pin remains untouched). Carriers stay out of the private list and the summary's private count.
- **Capabilities re-grounded without legacy:** dense chunking ← projection `shared-chunks` groups per emitter; dense externals ← canonical declarations with `bundle`; SRI ← `model.remotes` integrity map. All three were groundable — nothing was dropped; the frankenstein badge matrix pins identically.
- **Relation-only wording says "without an own resolution claim"** (round-2 LOW): "without an own declaration" was demonstrably wrong — the H2 witness itself carries a candidate-less declaration.
- **`explicitArrowOf`/`declaredOf` removed from `view-conventions.ts`:** Remotes was the last consumer of both legacy-typed helpers; `view-conventions` now has zero legacy imports.

### Review Focus

- **Behavior claims:** Remotes renders exclusively from the canonical façade — every count, state, source qualifier, private path, and chunk line chains to a canonical ID; ambiguity/observed/unknown source attributions stay visibly qualified per claim and never collapse into "no evidenced source"; claim-less consumer relations surface instead of disappearing; action tooltips never assert a mapping outcome.
- **Assumptions / choices:** the arrow stays main-claim-only while secondaries speak through prefixed chips (design choice, round-2-reviewed); the list summary includes true private registrations but not chunk carriers; `level: 'none'` chunk wording distinguishes "no chunk lists recorded" from "recorded but unclaimed" (latter is an unwitnessed edge branch); relation-only rows render package/tag/source/bindings without a /packages cross-link (relations carry no share-scope select id).
- **Scope notes:** `view-conventions.ts`, `packages-vm-shared.ts`, and `packages-detail-vm.ts` changed outside `views/remotes/` — helper lifts plus the two `ACTION_NOTES` rewordings (both consumed by Remotes only); Packages behavior is unchanged and all its pins ran green throughout. The `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `sourceChipOf` + the per-claim loop in `remotes-detail-vm.ts` `depsOf` — the round-2 per-claim qualification rule; `relationOnlyOf` and the `RELATION_ONLY_SEED` test — verify the claim-less-relation mechanics and the corpus sweep; `scopedClaimStateOf` — the `mappingState`-grounding with the `PRIVATE_NOT_SELECTED_SEED` witness.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/remotes/*.spec.ts' --watch=false` — 46 tests green on the final state (31 VM + 15 DOM); after the initial migration the suite was 34, review round 1 added 8 (seeds for H1/H2/H3 + DOM witnesses + H4 pins), round 2 added 2 plus 2 reworded-pin updates.
- `npm test` — full suite green on the final state: 36 UI files / 393 tests (+12 vs. task 7.10's 381), 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests. Packages (67) stayed green through the helper lifts.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics; `prettier --check` clean on every changed file; `git diff --check` clean.
- **Legacy sweep:** `rg "derived-model|derivations|chunk-map-join|winnerOf|sharedRows|store\.derived|DerivedFederation|!== 'skip'"` over `views/remotes/`, `views/packages/`, and `view-conventions.ts` — zero code hits (two doc-comment mentions only). Import Map is now the last legacy consumer before the Task-11 cutover.
- **External review round 1** (4 findings: H1 HIGH qualified-source collapse, H2 HIGH invisible consumer relations, H3 MEDIUM `copyId`≠own-mapping, H4 MEDIUM skip-tooltip mapping claim) — each verified against code and pipeline sources before fixing; all confirmed, fixed, and pinned with seeds. **Round 2** (3 findings: per-claim source chips, scope-note mapping claim, relation wording) — all confirmed and fixed the same way. 7/7 total, none rejected.
- Probe-first methodology: all fixture pins and all eight synthetic seeds (ambiguous-scope, host-fallback, unknown-source, relation-only, private not-selected, private multi-entry, multi-entry qualifier, scope action) passed on their first run against the pinned expectations.

### Acceptance Coverage

- **T8-AC-01 — passed:** `keeps one declaration per remote, same effective copy, different claim states` (VM, co-declared-share: distinct declaration IDs, mfe1 own arrow vs. mfe2 winner arrow onto mfe1's file + `not selected` chip) and the DOM co-declared test. Contributes: XC-03, XC-06.
- **T8-AC-02 — passed:** clean-skip VM pins (skip → winner arrow `_nf_lab_conflict_lib.jvcc6K1csg.js`/`mfe2`, chip-less fallback, registry-only action note; share → own arrow) and the DOM skip-row test with the `(source: mfe2)` aria pin. Contributes: XC-01, XC-06.
- **T8-AC-03 — passed:** scoped VM test pins both remotes' complete registration → claim → resolution → copy paths with retained `PrivateRegistrationId` and an exact `Object.keys` shape pin (no action/scope field exists); DOM scoped-path test. Contributes: XC-03.
- **T8-AC-04 — passed:** pooling-anchor anchor visibility on both sides, `/extra` not-selected, synthetic-multi-version honest none/not-mapped, strict-scope pinned tags; the H1 ladder seeds (ambiguous-scope/host-fallback/unknown) keep every qualification visible; chunk sections pinned from canonical bundle claims only (frankenstein `mapped-source` vs. `source-only` VM+DOM, non-dense carrier groups, whiteboard honest absence). Contributes: XC-02, XC-06.
- **T8-AC-05 — passed:** DOM tests for co-declared-share and scoped; purity pin on model-only input; `tsc` + template compilation; the zero-hit legacy/derivation sweep proves no local resolution/election/provider logic. Contributes: XC-01.

### Open Issues

- **Panel screenshot review pending (user step):** verify the Remotes view in the running panel — list summaries, state chips, chunk qualification, scoped paths. The seed-only presentations (qualifier chips, relation-only block) exist in tests only; fixtures show the normal cases. Deltas → second `/wrap-up 8` before or after `/commit 8`.
- The `level: 'none'` branch "chunk lists are recorded but no resolved copy claims them" is defensively coded but unwitnessed (no fixture/seed produces it; accepted).
- Relation-only rows have no /packages cross-link (relations carry no share-scope group id); if wanted, Task 10 could derive a select id from the copy's resolution contexts.
- The pooling-anchor skip/anchor explanation from the 7.10 session remains candidate ground text for Task-10 findings (carried forward).
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 8 staging (user-owned).

### Context for Next Task

- **Import Map (Task 9) is the last legacy consumer** — it still reads `chunk-map-join`/`sharedRows`-derived data; after its migration, Task 11 can remove `derivations.ts`, `derived-model.ts`, `chunk-map-join.ts`, and `store.derived()`.
- **Shared canonical helpers now live in `shared/view-conventions.ts`:** `buildCanonicalIndexes`/`CanonicalIndexes`, `copySourceRemote/Display`, `isHostRemote`, `targetFileName`, and the qualified-source ladder `copySourceVmOf`/`CopySourceVm`. Task 9 should consume these — never import across views; `packages-vm-shared.ts` re-exports them for Packages-internal stability.
- **Established wording contracts:** action notes are registry-evidence-only; mapping outcomes are said by arrows/state chips; ambiguity renders as ambiguity (never "unknown", never "no evidenced source"); only `mapped-source` bundle claims present files unqualified; capture-relative phrasing throughout ("in this capture").
- **Alias/relation mechanics (H2 findings, reusable for Tasks 9–11):** consumers enter lookups per declaration (even candidate-less) — a remote without any declaration never appears in `consumerRemotes`; relations with empty `claimIds` are the canonical claim-less bindings. The corpus contains none; seeds must construct them.
- **Seed harness for Remotes** (`seedSnapshot`/`declarationOf` in `remotes-view-model.spec.ts`, mirroring the Packages conventions, plus `scopedExternals` support and the DOM-side seed-capable `FixtureSnapshotProvider`) — reusable pattern for Task 9/10 edge-case witnesses.
- **Gotchas:** Angular collapses inter-element whitespace — DOM matching on composed row text needs element-level selectors (`.mono` equality, not substring-with-space); `privateMappingState` returns `unknown` (not `unmapped`) for target-less private lookups; `ConsumerCopyRelation.claimIds` are enriched per `claim.consumerRemote`, so "claim-backed" is always consumer-local.
- `/commit 8` must stage the 10 repo files (7 × `views/remotes/`, `view-conventions.ts`, `packages-vm-shared.ts`, `packages-detail-vm.ts`) plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../devtools-ui/src/app/shared/view-conventions.ts | 280 ++++++-
 .../src/app/views/packages/packages-detail-vm.ts   | 113 +--
 .../src/app/views/packages/packages-vm-shared.ts   | 143 +---
 .../src/app/views/remotes/remote-detail.css        |  46 +-
 .../src/app/views/remotes/remote-detail.html       | 108 ++-
 .../src/app/views/remotes/remotes-detail-vm.ts     | 651 ++++++++++++---
 .../app/views/remotes/remotes-view-model.spec.ts   | 886 +++++++++++++++++----
 .../src/app/views/remotes/remotes-view-model.ts    |  65 +-
 .../src/app/views/remotes/remotes.spec.ts          | 274 ++++++-
 .../devtools-ui/src/app/views/remotes/remotes.ts   |   5 +-
 11 files changed, 1957 insertions(+), 616 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-ui/src/app/shared/view-conventions.ts
 M projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts
 M projects/devtools-ui/src/app/views/remotes/remote-detail.css
 M projects/devtools-ui/src/app/views/remotes/remote-detail.html
 M projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-view-model.spec.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts
 M projects/devtools-ui/src/app/views/remotes/remotes.spec.ts
 M projects/devtools-ui/src/app/views/remotes/remotes.ts
```
