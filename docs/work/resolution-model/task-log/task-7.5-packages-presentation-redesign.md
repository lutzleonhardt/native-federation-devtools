### Task

Redesign the Packages presentation around resolved copies per the frozen mock (`design/packages-view-redesign-mock.md`): one block per copy (header · file lines with per-entrypoint SRI · deviation-only consumer rows · nested chunks), an `unresolved` bucket, a divergence-only diagnostics footer, a minimal name+versions list, and a single-select participant filter — presentation-only over the intact Task-7 canonical façade consumption.

### Status

DONE

All six T7.5 acceptance criteria are covered by green focused and repository-wide tests. An external (Codex) review was triaged in-session: four of six findings substantiated and fixed with new seed-backed pins, one rejected as designed, one acknowledged as commit discipline. A user-requested follow-up added the "view-model boundary" section to the model documentation.

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` (rewritten) — `PackageDetailVm` recast to `blocks: CopyBlockVm[]` / `unresolved: UnresolvedRowVm[]` / `diagnostics: AnnotationVm[]` plus detail-level `conflict` and `noCopies`; per-block: header (resolved tag / `unknown tag`, disposition map share→`shared`, scope→`isolated`+audience, else verbatim; default qualifiers and roles folded into tooltips), `CopyFileVm[]` with per-entrypoint SRI, claim-based `ConsumerRowVm[]` with deviation annotations (`skipped own <tag>`, `kept own copy`, `not selected`, `anchored`, `self-filled`), nested chunks. Review fixes: consumer rows reconcile against canonical `ConsumerCopyRelation`s (cross-package consumers render with `declared under <pkg>`, incl. the private-subject edge), isolated audience checks the block's actual consumers and drops "only" under external consumers, `offered <tag>` notes are claim-scoped. The five legacy sections (measures/negotiation/copies/integrity/chunks) and `NEGOTIATION_LEGEND`/arrow rendering removed.
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts` (rewritten) — per-copy `buildCopyChunkClaims` replaces the group-level section; `mapped-source` lists files unqualified, `source-only`/`ambiguous` keep the qualified one-liner; `showSource` mutes the chip when it equals the block source.
- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts` (rewritten) — rows reduce to name + resolved versions: `sources`/`alsoResolvedBy` removed, conflict compressed to the `⚠` glyph (rule in the tooltip), honest-empty label now `no copy` (note from `noCopyNoteOf`), unknown-tag `?` residual kept.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts` (rewritten exports/facade) — `PackagesUiState.selectedParticipant`, `PackagesVm.participants` (host first), participant narrowing combined with Conflicts (counts follow the narrowed set), participant-aware honest empty notes; new type exports for the block VM surface.
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts` (modified) — `involvedParticipantsOf` (declarers ∪ copy sources ∪ relation consumers; the filter membership rule); `CanonicalIndexes` gains `claimById` and `sharedExternalById` (review fix 1: relation reconciliation and foreign strict-scope pinning).
- `projects/devtools-ui/src/app/views/packages/packages.ts` (modified) — `selectedParticipant` signal + `toggleParticipant` (on/off/switch); review fix 3: subscribes `route.queryParamMap` (`takeUntilDestroyed`) so within-`/packages` navigation (parent link) updates the selection after component reuse; `sourceNames` helper removed.
- `projects/devtools-ui/src/app/views/packages/packages.html` (modified) — participant filter chip toggles in the toolbar; row template without tail chips/`+n`; `⚠` glyph.
- `projects/devtools-ui/src/app/views/packages/packages.css` (modified) — participant-toggle styles; tail/declarer/count styles removed.
- `projects/devtools-ui/src/app/views/packages/package-detail.ts` (modified) — drops `PackageNegotiation`; imports `ParticipantChip`/`RouterLink`/`StateBadge` only.
- `projects/devtools-ui/src/app/views/packages/package-detail.html` (rewritten) — copy blocks, `unresolved` heading + rows (state + `offered <tag>` + secondary specifier), diagnostics footer, `no resolved copies in this capture` line; cross-links kept (source/consumer chips → Remotes, `mapped` → Import Map, parent link); canonical-ID `track` keys throughout.
- `projects/devtools-ui/src/app/views/packages/package-detail.css` (rewritten) — block/file-line/consumer-row/chunk/unresolved/diagnostics styles; kv/negotiation/integrity styles removed.
- `projects/devtools-ui/src/app/views/packages/package-negotiation.ts` / `.html` / `.css` (deleted) — absorbed by the copy blocks; no external importers (verified by sweep).
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts` (rewritten) — 36 tests: the four frozen-mock cases as executable pins (frankenstein `/primitives/signals`, clean-skip, strict-split, synthetic-multi-version), co-declared/pooling-anchor/strict-scope corpus pins, seven synthetic seeds (equal-tag, multi-scope, deep subpath, ambiguous-scope, multi-entrypoint, cross-source incl. the foreign-consumer-row pin, new scope+anchor audience seed), participant-filter pins, grounded-annotation sweep, purity pin.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (rewritten) — 16 DOM tests: chip-less rows, participant filter on/off/switch, AC-01 block without legacy sections (default qualifiers only in `title` attrs), skip-annotation/no-SRI, two-block conflict header, unresolved bucket, cross-links, query-param-follow test (live `BehaviorSubject` route stub), honest-vocabulary sweep.
- `docs/resolution-data-model.md` (modified) — new section "The view-model boundary" between the big picture and the five views (user-requested): projection = pivot-neutral publication format; VM builders join/pivot and make presentation judgements only; boundary rule "groups and labels precomputed knowledge — it derives nothing new", in both directions.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble and Task 7.5 block only (task isolation).
- `docs/work/resolution-model/design/packages-view-redesign-mock.md` — the frozen layout/wording reference (read-only).
- `docs/work/resolution-model/task-log/task-7-migrate-packages-canonical.md` (predecessor); `task-5-*`/`task-6-*`/`task-3-*` via targeted `rg` only (disposition/role closed unions; projection surfaces; `effectiveConsumerResolutions` publication — the latter already covered by Task 7).
- `projects/devtools-ui/src/app/shared/store/resolution/` — `model.ts`, `copies-model.ts`, `claims-model.ts`, `projection-model.ts`, `bundle-claims-model.ts` (type surface; no derivation called).
- `projects/devtools-ui/src/app/shared/view-conventions.ts`, `shared/kit/participant-row.*`, `honest-state/state-badge.ts` — vocabulary/wording to preserve verbatim (STRICT marker, pinned-tag tooltip).
- `projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts` — raw `servedBy`/`pool` spelling for the scope+anchor seed.

### Key Decisions

- Ground truth first (Task-7 method): a temporary probe spec dumped the redesigned vm for nine fixture cases before any pin was written; all four frozen-mock cases materialized exactly as mocked, and all pins passed on their first run. The probe was deleted afterwards.
- Consumer-row derivation rules (claim-based): `skipped own <tag>` when the consumer's own registration action is `skip` and its claim resolves here (`fallback`/`not-selected`); `kept own copy` for `own-selected` on a `scope` registration; `anchored`/`self-filled`/`not selected` keep the T7 vocabulary; selected share declarations stay quiet (deviation-first). Claims with `copyId === null` go to the bucket; claims mapping to ANOTHER package's copy go to the diagnostics footer — the bucket never lies about resolved bindings.
- Disposition display map: `share-registration` → `shared`, `scope-registration` → `isolated` + audience; every other disposition stays verbatim and visibly qualified (e.g. `skip-registration` on the pooling-anchor copy). Default qualifiers/roles (exact target source, share-registration, ordinary-shared) fold into tooltips per the mock; non-default source qualifiers stay visible chips.
- Blocks render shared-elected first (`ordinary-shared` copies lead), replacing store order — the mock's conflict presentation depends on it.
- All/Conflicts counts follow the participant narrowing (both filters combine, buttons stay truthful); the scopes summary stays capture-global.
- Two deliberate T7-pin adaptations: "available for loading" moved from visible text to the chunk-list tooltip (deviation-first), and per-file specifier renders only when it differs from the package name.
- Codex review triage (2026-08-19), six findings: **(1) fixed** — consumer rows reconciled against canonical relations; cross-package consumers render with `declared under <pkg>` instead of disappearing (the CROSS_SOURCE seed also confirmed source-identity copy merging: one copy carries both entrypoints). **(2) fixed** — isolated audience computed against actual block consumers; new scope+anchor seed pins `mapped for mfe1` (no "only") with mfe2 `anchored`. **(3) fixed** — `queryParamMap` subscription replaces the snapshot-once read (pre-existing defect, in AC-06 scope via the parent link). **(4) fixed** — `offered <tag>` notes scoped to the claim ("this claim's binding does not resolve in this capture" / "no resolution claim is derivable for this declaration"). **(5) rejected as designed** — block-level `explicit anchor` qualifier and row-level `anchored` chips carry different subjects (source selection vs. consumer binding); hiding the non-default qualifier would violate deviation-first visibility. **(6) acknowledged** — the `.gitignore` hunk is pre-existing/user-owned and stays unstaged (commit discipline, no code change).
- The layering question ("do we still need view models?") was answered and durably documented in `docs/resolution-data-model.md` ("The view-model boundary") instead of only in conversation.

### Review Focus

- **Behavior claims:** the detail renders exactly one block per canonical copy with consumers as claim-grounded rows (cross-package consumers included via relations, labeled `declared under <pkg>`); the happy path shows no chips — every visible annotation is a deviation with a grounded tooltip, and default qualifiers exist only as `title` data; unresolved claims render under the bucket with claim-scoped `offered` notes, never silently and never falsely for mapped bindings.
- **Assumptions / choices:** conflict stays the T7 view-level resolved-tag-multiplicity rule (glyph on rows, labeled header in the detail); All/Conflicts counts follow the participant narrowing while the scopes summary stays global; a copy with no bundle claims renders no chunk element (mock decision "chunks are listed when present"); Codex finding 5 deliberately not applied (see Key Decisions).
- **Scope notes:** `package-negotiation.*` deleted (absorbed; sweep-verified unreferenced); `docs/resolution-data-model.md` extended outside the view surface at user request; the pre-existing `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `consumersOf` in `packages-detail-vm.ts` — the local-claim spine plus the relation reconciliation and its private-subject edge; `audienceOf`/`dispositionVmOf` — the honest "only" drop and the role-folding tooltips; the CROSS_SOURCE and SCOPE_ANCHOR seed describes in `packages-view-model.spec.ts` — they pin exactly the two HIGH review findings.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --watch=false` — passed on the final code state: 2 files / 52 tests (36 VM, 16 DOM).
- `npm test` — passed on the final code state: 34 UI files / 347 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (545 total). Only the existing odd-numbered Node 25 non-LTS warning.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics. (The spec tsconfig emits pre-existing cross-project `rootDir` TS6059 noise unrelated to this task; the Task-7 gate was the app config as well.)
- `./node_modules/.bin/prettier --check` — passed on all changed `views/packages/` files and `docs/resolution-data-model.md`; `git diff --check` — passed.
- Sweeps — legacy (`derived-model|derivations|chunk-map-join|winnerOf|sharedRows|store.derived|DerivedFederation`) and removed-vocabulary (`package-negotiation|NEGOTIATION_LEGEND|DetailVersionVm|ResolutionMeasuresVm|ChunkSectionVm|alsoResolvedBy|pkg-tail`) over `views/packages/`: zero hits; `PackageNegotiation` referenced nowhere in `projects/`.
- Ground truth first: a temporary `redesign-probe.spec.ts` dumped the redesigned vm for nine fixture cases (frankenstein signals, clean-skip, strict-split, co-declared, pooling-anchor ×2, synthetic-multi-version, self-fill, strict-scope) before pins were written; deleted before commit.
- External Codex review triaged in-session (2026-08-19): six findings — four substantiated and fixed with new pins (relation reconciliation, audience honesty via the new SCOPE_ANCHOR seed, query-param follow test, offered-note wording), one rejected with documented rationale, one acknowledged as commit discipline. Full suites ran green before and after the review round.

### Acceptance Coverage

- **T7.5-AC-01 — passed:** VM describe "frankenstein-live /primitives/signals" (one block, 21.2.12/host/`shared`, SRI-backed file, `^21.2.0` STRICT consumer, 5 chunk files, tooltip-only default qualifiers, parent link) plus DOM test "renders the signals package as one copy block without the legacy sections" (no `h3`, no visible qualifier text, `SRI ✓`, 5 `chunk-item`s). Contributes to XC-06.
- **T7.5-AC-02 — passed:** clean-skip VM/DOM pins (`skipped own 1.0.0` row annotation with grounded note, no skip section, no glyph legend) and co-declared-share pins (mfe2 as `not selected` consumer row of the single block, `unresolved` empty). Contributes to XC-03, XC-06.
- **T7.5-AC-03 — passed:** strict-split VM/DOM pins — two blocks under `⚠ 2 resolved versions` (2.0.0 `shared`/host with the mfe1 skip row first; 1.0.0 `isolated` "mapped only for mfe3" with STRICT + `kept own copy`); strict-scope side-by-side pins with pinned declared tags. Contributes to XC-03.
- **T7.5-AC-04 — passed:** synthetic-multi-version VM/DOM pins — zero blocks, "no resolved copies in this capture", bucket rows with `not mapped` states and `offered 1.2.3`/`offered 2.0.0`. Contributes to XC-06.
- **T7.5-AC-05 — passed:** row pins (name + versions only; `⚠` glyph with rule tooltip and muted non-elected version; muted `no copy` with `noCopyNoteOf`; no row chips) plus participant-filter pins (chip list host-first, narrowing, Conflicts ∧ participant combination, honest empty notes, DOM on/off/switch).
- **T7.5-AC-06 — passed:** canonical-ID chain pins (blocks ↔ projection copies, consumer `declarationId`s, distinct tracking under equal keys), the grounded-annotation sweep pin over six corpus details, cross-link DOM pins (source/consumer → Remotes, `mapped` → Import Map, parent link) including the new query-param-follow test, `tsc` + template compilation, purity pin. Contributes to XC-01.

### Open Issues

- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.5 staging (user-owned).
- Codex finding 5 (anchored renders at block and row level) rejected as designed — revisit only if the pooling-anchor block reads too noisy in real captures.
- No live/visual check was performed (fixture-driven DOM tests only); optional follow-up via the chrome-devtools profile before the Task-12 fixture UX acceptance.
- Plan-deferred items remain deferred: consumer-row collapse for ~50-remote captures, participant combobox, group-by-source list toggle, consumer counts in rows, multi-select filter.
- The spec tsconfig's cross-project `rootDir` TS6059 noise is pre-existing and untouched.

### Context for Next Task

- The consumer → copy → chunk spine now has concrete VM shapes (`CopyBlockVm`, `ConsumerRowVm`, `UnresolvedRowVm`, `AnnotationVm`, `DeclaredVm` in `packages-detail-vm.ts`) designed for the Task-8 Remotes pivot (consumer-first) — lift them (and the deviation-derivation rules) to `shared/view-conventions.ts` only when Remotes actually consumes them, per the plan's reuse rule.
- `CanonicalIndexes` (packages-vm-shared) now also carries `claimById` and `sharedExternalById`; `involvedParticipantsOf` is the participant-membership rule (declarers ∪ copy sources ∪ relation consumers).
- Established display vocabulary added by this task (reuse verbatim): `shared` / `isolated` / `mapped only for X` / `mapped for X` (external consumers present) / `skipped own <tag>` / `kept own copy` / `declared under <pkg>` / `offered <tag>` / `unresolved` / `no copy`; STRICT marker and pinned-tag tooltip wording taken verbatim from the kit.
- Consumer rows are claim-grounded and relation-reconciled — Remotes must follow the same rule: a consumer edge missing from local claims but present in `consumerRelations` is real and must render, labeled honestly.
- Gotcha for Remotes: `RemotesView` likely shares the snapshot-once `queryParamMap` pattern this task fixed for Packages — check and apply the subscription pattern there if Remotes gains within-view cross-links.
- Copy identity merges by unique source: one declaration owning several entrypoints yields ONE copy with several file lines (pinned in the CROSS_SOURCE describe) — do not expect one copy per specifier.
- The layering doctrine is now citable: `docs/resolution-data-model.md` § "The view-model boundary" (builders group and label precomputed knowledge, never derive; missing facts belong in the model).
- `/commit 7.5` must stage the 15 modified + 3 deleted `views/packages/` files, `docs/resolution-data-model.md`, and this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 docs/resolution-data-model.md                      |  34 +-
 .../src/app/views/packages/package-detail.css      | 197 +++--
 .../src/app/views/packages/package-detail.html     | 364 +++++----
 .../src/app/views/packages/package-detail.ts       |  13 +-
 .../src/app/views/packages/package-negotiation.css | 101 ---
 .../app/views/packages/package-negotiation.html    |  64 --
 .../src/app/views/packages/package-negotiation.ts  |  27 -
 .../src/app/views/packages/packages-chunk-vm.ts    | 100 +--
 .../src/app/views/packages/packages-detail-vm.ts   | 763 ++++++++++-------
 .../src/app/views/packages/packages-row-vm.ts      |  69 +-
 .../app/views/packages/packages-view-model.spec.ts | 901 ++++++++++++---------
 .../src/app/views/packages/packages-view-model.ts  | 112 ++-
 .../src/app/views/packages/packages-vm-shared.ts   |  37 +
 .../src/app/views/packages/packages.css            |  42 +-
 .../src/app/views/packages/packages.html           |  40 +-
 .../src/app/views/packages/packages.spec.ts        | 288 ++++---
 .../devtools-ui/src/app/views/packages/packages.ts |  34 +-
 18 files changed, 1780 insertions(+), 1408 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M docs/resolution-data-model.md
 M projects/devtools-ui/src/app/views/packages/package-detail.css
 M projects/devtools-ui/src/app/views/packages/package-detail.html
 M projects/devtools-ui/src/app/views/packages/package-detail.ts
 D projects/devtools-ui/src/app/views/packages/package-negotiation.css
 D projects/devtools-ui/src/app/views/packages/package-negotiation.html
 D projects/devtools-ui/src/app/views/packages/package-negotiation.ts
 M projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-row-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages-view-model.ts
 M projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts
 M projects/devtools-ui/src/app/views/packages/packages.css
 M projects/devtools-ui/src/app/views/packages/packages.html
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages.ts
```
