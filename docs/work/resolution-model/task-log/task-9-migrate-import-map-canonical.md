### Task

Migrate the Import Map view from the legacy `DerivedFederation`/`chunk-map-join` surface to the canonical Store façade while keeping the merged effective map as the raw pivot: every `(scope, specifier)` row renders exactly once and is annotated — via the `mapEntry` provenance of the effective consumer resolutions — with resolution IDs, declaration claims, resolved copies with qualified sources, bundle claims, canonical chunk groups, and the ingest expose join; scope-section owners become scope-URL identities; `shared/chunk-map-join.ts` is deleted with its last consumer.

### Status

DONE

All five T9 acceptance criteria are covered by green tests; the full repository suite is green. An external (Codex) review produced five findings (1 HIGH, 3 MEDIUM, 1 LOW): three confirmed and fixed (emitter-distinct chunk merging, literal NUL bytes in the row key, expose first-entry fallback), one partially confirmed and fixed (`ownCandidateSelected` + referential-integrity sweep), one resolved as a documented interpretation with honest-absence pins (unknown/unmapped). Lutz's panel screenshot review surfaced one defect (ellipsis truncating the `source-only` qualifier in the fixed 15-rem column) — fixed by wrapping instead of truncating. Ready for `/commit 9`.

### Files Modified

- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts` (rewritten) — canonical builder `buildImportMapVm(model, ui)` without `DerivedFederation`: `buildRowJoins` keys rows by the structural JSON tuple `(scope, specifier, target)` and joins mapped AND blocked resolutions via their `mapEntry` provenance; claims via `effectiveResolutionId`, copies via `copy.effectiveResolutionIds`, bundle claims via `copy.bundleClaimIds`, chunk groups via `resolveUrl(file, emitterScopeUrl)` from `projection.chunkGroups` (one `RowChunkVm` per emitter — emitter-distinct groups never merge), exposes via the ingest's `exposes[].mapTarget` (all matches, `RowExposeVm[]`). `rowSourceOf` = shared `copySourceVmOf` ladder refined with `unattributable` (observed CDN/foreign origin stays distinct from unknown); `RowClaimVm` carries the T7/T8 mapping-state vocabulary plus `ownCandidateSelected`; `packageSelectOf` = unique `packageId(shareScope, consumerRegistryPackage)` where the claim specifier IS the row specifier; `SectionOwnerVm` = scope-URL identity (`remote` / `shared-scope-url` / null — never an election); quiet norms: single own-selected claim quiet, owner-restating exact sources quiet, non-exact qualifiers (incl. self-anchor) always speak; `packageSelects`/first-row-winner/provider ladder/`chunk-map-join` usage removed.
- `projects/devtools-ui/src/app/views/import-map/import-map.ts` (modified) — `store.derived()` dropped, model-only input; `StateBadge` import removed (qualifier channel replaces the ambiguous badge).
- `projects/devtools-ui/src/app/views/import-map/import-map.html` (modified) — trailing column constant `resolution` (tooltip states the qualified-evidence contract; `served by` gone incl. tooltips); attribution cell renders source chip(s) + `.row-qualifier` (non-exact), speaking claim chips + state words, claim-less consumer chips, bundle labels with visible `source-only`/`ambiguous`, per-emitter chunk labels, expose chips, `.row-blocked`; owner block renders the identity chip or ALL remotes of a shared scope URL.
- `projects/devtools-ui/src/app/views/import-map/import-map.css` (modified) — annotation channels `.row-qualifier` (dashed = qualified), `.row-claim`/`.claim-state`, `.row-bundle`, `.row-expose`/`.expose-word`, `.row-blocked` (warning); `.row-unattributable` removed. Screenshot fix: `.cell-attr` wraps (`white-space: normal` + `overflow-wrap: anywhere`) instead of ellipsis-truncating — the ellipsis swallowed exactly the qualification that must stay visible.
- `projects/devtools-ui/src/app/shared/chunk-map-join.ts` (deleted) + `chunk-map-join.spec.ts` (deleted) — Import Map was the only production consumer; the join semantics live canonically in `buildRowJoins` (emitter scope URL base, same `resolveUrl` rule).
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts` (rewritten) — 41 tests: fixture pins for all five ACs (co-declared-share, pooling-anchor, clean-skip, scoped, strict-scope, non-dense, frankenstein-live, self-fill), the AC-02 uniqueness sweep over ALL fixtures (rendered triples ≡ `model.importMapEntries`), seed harness (`share()`, `sharedChunks` override) with seeds for CDN/outside-base unattributable, ambiguous exact candidates, alias remotes, alias specifier, blocked prefix, prefix expansion, exact-outranks-scope, scope-derived, host-fallback, shared-scope owner, owner-null, emitter-distinct chunks, two exposes on one target, unmapped honest absence; referential-integrity sweep (every annotated ID resolves against its canonical collection); carried-over order/SRI/select/caption/empty/purity pins.
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts` (rewritten) — 10 DOM tests: identity owner chip + `resolution` headers + color-contract pins, cross-link hrefs, co-declared claim chips (`selected`/`not selected`) with the one source chip, pooling-anchor `explicit anchor` + `anchored` on the consumer scope, strict-scope quiet rows with qualified bundle, `SEEDED_HONEST_OUTCOMES` (CDN unattributable, ambiguous source, blocked prefix, shared-scope-url owner with two chips), caption/empty/select/failed-capture carry-overs, wording sweep (no `served by`, no `\bloaded\b`, incl. all `[title]` attributes).

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged — unchanged from Tasks 6–8.6).

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 9 block only (task isolation).
- `docs/work/resolution-model/design/pooling-anchor-explainer.md` (read-only Key Location) — grounded the scope-owner doctrine (consumer scopes name the CONSUMER; delivery is said per row) and the anchored/`skip` semantics.
- Task logs 8.6 (predecessor; zone grammar, cutover context), 8 (migration blueprint: shared helpers, wording contracts, seed harness, probe-first), 6 (projection contract: three façade surfaces, bundle-claim qualification, completeness rules).
- `shared/view-conventions.ts` (`buildCanonicalIndexes`, `copySourceVmOf` ladder, `packageId`), `shared/store/resolution/` — `projection-model.ts`, `model.ts` (the `EffectiveMapEntryProvenance` discovery), `claims-model.ts`, `copies-model.ts`, `bundle-claims-model.ts`, `index.ts`; `derive-declaration-claims.ts` (fallback-state semantics).
- `shared/store/federation-model.ts` (`ImportMapEntryRow`, `RemoteEntity.exposes[].mapTarget` — the pre-computed expose join), `shared/store/merge-document-maps.ts` (`resolveUrl`), `shared/chunk-map-join.ts` (semantics reference before deletion), `shared/honest-state/state-badge.ts`, `views/remotes/remotes-detail-vm.ts` (cross-view mapping-state wording), `devtools-bridge` `snapshot-v1.ts` (`sharedChunks`/`ExposeV1` shapes for seeds), fixtures index.

### Key Decisions

- **Probe-first (two rounds):** round 1 dumped the canonical per-row joins for ten fixtures to the scratchpad and produced the task's key discovery — `MappedEffectiveConsumerResolution.mapEntry`/`BlockedEffectiveConsumerResolution.mapEntry` carry the exact `(scope, specifier, target)` provenance, making the row join a lossless identity join; round 2 ran the NEW vm over fixtures plus all trial seeds before any pin was written. All fixture pins and seeds passed on their first run (one selector typo aside). Probes deleted before commit.
- **Scope-section owner is a scope-URL identity, not an election:** `resolvedScopeUrl === scope` names the remote(s); a shared URL names ALL of them (`shared-scope-url`), no match names nobody. Replaces the legacy consensus-of-providers `ownerOf` and its `mixed` state; per the pooling explainer the header only identifies the consumer scope — where rows resolve is said per row.
- **Expose rows join via the ingest's `mapTarget`** (registry evidence, `/./`-tolerant, already computed) — the naive scope-prefix provider chip is gone; a row that nothing canonical references carries no annotation at all (honest absence, never a guessed owner).
- **`unattributable` refined locally, not in the shared ladder:** `copySourceVmOf` collapses CDN targets into `unknown-source`; the Import Map VM re-qualifies when the copy's observed providers evidence `unattributable`. Changing the shared ladder would alter Packages/Remotes behavior — out of scope, noted as a possible later harmonization.
- **Quiet norms (T10 doctrine, canonically re-grounded):** a single own-selected claim restates the row and stays quiet (multi-claim rows always speak, keeping T9-AC-01's multiplicity visible); sources quiet only when exact AND owner-restating — the pooling self-anchor therefore stays visible in mfe1's own scope.
- **`packageSelect` from claims:** unique `(shareScope, consumerRegistryPackage)` with claim specifier === row specifier reproduces every legacy payload (`__GLOBAL__|@angular/common/http`, `strict|@nf-lab/conflict-lib`) while alias rows, prefix rows, and private claims stay link-free.
- **Wording:** trailing column constant `resolution`; claim states reuse the cross-view vocabulary with the `fallback` note grounded in `derive-declaration-claims` (resolves to the elected shared copy); only `mapped-source` bundle claims render unqualified.
- **`chunk-map-join.ts` deleted in Task 9** (plan instruction "remove when unused"; single consumer verified) — Task 11 keeps only `derivations.ts`, `derived-model.ts`, `store.derived()`.

— session 2026-08-23 (Codex review round + panel screenshot round)

- **H1 (HIGH) unknown/unmapped — resolved as documented honest absence:** unmapped/unknown resolutions carry no `mapEntry` by definition; inventing rows would contradict the raw-pivot instruction, and their visible rendering lives in Remotes/Packages with aggregation being Task-10 diagnostics. Now explicit in the VM header + spec header, witnessed by two new pins (declared-but-unmapped `ghost` seed: no row invented, no row contaminated; `synthetic-multi-version`: unknown resolutions render the honest empty state). Alternative (visible unresolved channel in this view) offered to Lutz and deferred — would be a plan amendment.
- **H2 (MEDIUM) emitter merge — confirmed, fixed:** `chunk` → `chunks: RowChunkVm[]`, one annotation per emitter, labels merge only within an emitter, each links its own remote (T6 emitter doctrine); seed: two emitters, one scope URL, same file, different bundles → two annotations.
- **H3 (MEDIUM) provenance compression — partially confirmed, fixed:** resolution/claim/copy/bundle-claim IDs were already structural; added `RowClaimVm.ownCandidateSelected` (pinned `[true, false]` on the AC-01 row) and a referential-integrity sweep over all fixtures. Observed-provider IDs and raw `EvidenceRef`s stay deliberately out of the render-ready vm — the chain runs through the copy ID (narrower reading, documented here).
- **H4 (MEDIUM) NUL bytes — confirmed, fixed:** the row key template contained two literal 0x00 bytes (authoring error; `file` classified the TS source as `data`). Now `JSON.stringify([scope, specifier, target])` — delimiter-safe, and a null scope no longer collides with an empty-string scope.
- **H5 (LOW) expose `[0]` — confirmed, fixed:** `exposes: RowExposeVm[]`, template loops; seed with two remotes exposing onto one target pins both chips on both rows.
- **Panel round (Lutz):** `@angular/platform-browser` rendered `host …` — the legacy `text-overflow: ellipsis` on the fixed 15-rem column swallowed `browser-angular_platform_browser source-only`, i.e. exactly the mandatory qualification (the Codex residual-risk item). Fixed: the cell wraps; annotations are inline-flex units so chip and status word wrap together; `overflow-wrap: anywhere` guards single mono tokens wider than the column. Deliberate trade-off: annotated rows may grow taller.

### Review Focus

- **Behavior claims:** every rendered annotation chains through canonical IDs that resolve against the façade collections (sweep-pinned); each effective map row renders exactly once across all 21 fixtures with multiple claims annotating, never duplicating; source language is always qualified (exact/anchor/observed/ambiguous/unattributable/unknown) and the qualification can no longer be truncated away; unmapped/unknown resolutions never invent or contaminate a row; emitter-distinct chunk evidence never merges.
- **Assumptions / choices:** T9-AC-03's "unknown, unmapped … remain distinguishable" is read as distinguishable-by-honest-absence in this view (documented in both headers; a visible unresolved channel was offered and deferred to Task 10); observed-provider/`EvidenceRef` plumbing deliberately compressed to the copy-ID chain; `unattributable` refinement is view-local rather than a shared-ladder change; the `resolution` column header replaces the dynamic `served by`/`bundle` pair.
- **Scope notes:** two shared files deleted (`chunk-map-join.ts` + spec — last consumer verified by sweep); no other file outside `views/import-map/` touched; the `.gitignore` hunk is NOT part of this task.
- **Read next:** `buildRowJoins` + `rowOf` in `import-map-view-model.ts` — the mapEntry identity join and quiet rules are the task's core claims; the AC-02 uniqueness sweep and the referential-integrity sweep in `import-map-view-model.spec.ts` — they are the strongest structural guarantees; `chunkVmsOf` — verify the per-emitter grouping against the T6 doctrine.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/import-map/*.spec.ts' --watch=false` — 51 tests green on the final state (41 VM + 10 DOM).
- `npm test` — full suite green on the final state: 35 UI files / 422 tests, 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests. (UI file count −1: `chunk-map-join.spec.ts` deleted.)
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics; `prettier --check` clean on every changed file; `git diff --check` clean; `file` re-classifies the VM as UTF-8 source (H4).
- **Legacy sweep:** `rg "derived-model|derivations|chunk-map-join|sharedRows|store\.derived|DerivedFederation|winnerOf"` over `views/import-map/` — zero hits; `rg -l "chunk-map-join"` over `projects/` — zero files.
- **Probe-first:** two probe rounds (canonical joins per fixture; new-vm dumps for fixtures + trial seeds) grounded every pin; the initial 36-test VM run and the review-round 51-test run were each green on their first execution after authoring.
- **External Codex review (2026-08-23):** 5 findings triaged against code/plan — H2/H4/H5 confirmed and fixed with seed-backed regressions, H3 partially confirmed and fixed (`ownCandidateSelected` + integrity sweep), H1 resolved as a documented interpretation with two honest-absence pins; none silently dropped.
- **Panel verification (Lutz, frankenstein-live):** screenshot round caught the ellipsis truncation; CSS wrap fix applied, suites re-run green (CSS-only). Final wrapped layout awaits one reload confirmation.

### Acceptance Coverage

- **T9-AC-01 — passed:** `shows the recorded target with two consumer claims and one exact source` (VM, co-declared-share: one row, mfe1 `selected`/`ownCandidateSelected: true` + mfe2 `not selected`/`false`, one copy, exact source mfe1, package link) and the co-declared DOM test (both claim chips + one source chip). Contributes: XC-03, XC-06.
- **T9-AC-02 — passed:** the uniqueness sweep pins rendered (scope, specifier, target) triples ≡ recorded `importMapEntries` for ALL fixtures; co-declared/self-fill/pooling pin multi-resolution rows annotating one row. Contributes: XC-03.
- **T9-AC-03 — passed:** scoped (private paths, quiet norm), pooling-anchor (anchor visible on both consumer scopes incl. self-anchor), clean-skip (fallback vs. selected), frankenstein exposes; seeds for CDN + outside-base `unattributable`, ambiguous exact candidates, alias remotes/specifier, blocked prefix (`a blocked claim annotates its matching map row`), shared-scope owner; unknown/unmapped distinguishable by honest absence (two pins; documented reading). Contributes: XC-02, XC-06.
- **T9-AC-04 — passed:** exact-outranks-scope seed (candidate in a foreign scope stays the exact source), scope-derived and host-fallback stay qualified, prefix expansion carries the canonical resolver outcome (`for 'util/x'` on the `util/` row, no view-local lookup; legacy sweep as structural guard). Contributes: XC-01.
- **T9-AC-05 — passed:** carried-over order/SRI/select(`/./`)/caption/empty pins in both suites; four-column geometry pinned via DOM headers; purity pin (model-only input, unmodified). Contributes: XC-01.

### Open Issues

- Final visual confirmation of the wrapped resolution column (post-fix reload) by Lutz; if annotations still truncate, suspect a stale dev-server build.
- Defensively coded but unwitnessed: the `unknown-source` qualifier (same-origin-outside-base canonically yields `unattributable`), `claimlessConsumers` (claims exist even for candidate-less declarations — not seedable at the claim layer), and the `ambiguous` bundle-claim status in this view.
- If a visible unresolved/unmapped channel is wanted in the Import Map view, that is a plan amendment — natural home: Task 10 diagnostics (completeness surface already exists on the projection).
- `copySourceVmOf`'s unknown/unattributable collapse in Packages/Remotes could be harmonized with the Import Map's refinement later (deliberately not touched here).
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 9 staging (user-owned).

### Context for Next Task

- **The Task-11 cutover is unblocked:** no view reads `store.derived()`/`DerivedFederation`/`sharedRows`-derived joins anymore; `chunk-map-join.ts` is already gone. Task 11 removes `derivations.ts`, `derived-model.ts`, `store.derived()` (and the ingest's legacy `allFilesMapped`/`sharedRows` compatibility per its own block).
- **Row-join pattern reusable for Diagnostics (Task 10):** `mapEntry` provenance is the lossless map-row identity; `rowKey` is a structural JSON tuple; unmapped/unknown resolutions are reachable via `effectiveConsumerResolutions` filtered by status and via `resolutionProjection.completeness` — that is where an unresolved surface belongs.
- **Seed vocabulary extended:** the import-map harness supports `sharedChunks` overrides (emitter-distinct witnesses) and multi-expose remotes; `share()` builds multi-package global externals. `SEEDED_HONEST_OUTCOMES` (DOM) bundles CDN/ambiguous/blocked/shared-scope in one snapshot.
- **Wording contracts upheld:** no `served by`, no `loaded`, only `mapped-source` unqualified, capture-relative phrasing, doctrine prose in tooltips; the `resolution` column tooltip states the contract.
- **Gotchas:** authoring can smuggle literal NUL bytes into template literals (H4) — `file`/`git diff --check` don't catch it, `rg` then treats the source as binary; `text-overflow: ellipsis` on annotation cells is doctrine-hostile (it truncates qualifications first); conditional projection/`@if` gotchas from T8.6 remain relevant for kit consumers.
- `/commit 9` must stage 8 repo paths (6 × `views/import-map/`: `import-map-view-model.ts`, `import-map-view-model.spec.ts`, `import-map.ts`, `import-map.html`, `import-map.css`, `import-map.spec.ts`; 2 deletions: `shared/chunk-map-join.ts`, `shared/chunk-map-join.spec.ts`) plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../src/app/shared/chunk-map-join.spec.ts          | 117 ---
 .../devtools-ui/src/app/shared/chunk-map-join.ts   |  75 --
 .../views/import-map/import-map-view-model.spec.ts | 799 ++++++++++++++-------
 .../app/views/import-map/import-map-view-model.ts  | 717 ++++++++++++------
 .../src/app/views/import-map/import-map.css        |  43 +-
 .../src/app/views/import-map/import-map.html       | 101 ++-
 .../src/app/views/import-map/import-map.spec.ts    | 287 ++++++--
 .../src/app/views/import-map/import-map.ts         |  19 +-
 9 files changed, 1438 insertions(+), 722 deletions(-)
```

`git status --short`

```text
 M .gitignore
 D projects/devtools-ui/src/app/shared/chunk-map-join.spec.ts
 D projects/devtools-ui/src/app/shared/chunk-map-join.ts
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts
 M projects/devtools-ui/src/app/views/import-map/import-map.css
 M projects/devtools-ui/src/app/views/import-map/import-map.html
 M projects/devtools-ui/src/app/views/import-map/import-map.spec.ts
 M projects/devtools-ui/src/app/views/import-map/import-map.ts
```
