### Task

Migrate the Packages view (list + detail) from the legacy `DerivedFederation` winner/provider model to the canonical Store façade — resolved-tag versions, scope-specific canonical counts, per-declaration claim states, qualified copy sources, and bundle-claim chunks — while preserving the flat master-detail structure and interaction model, plus the user-agreed reason-tooltips carrying claim/qualification notes.

### Status

DONE

All five Task 7 acceptance criteria are covered by green focused and repository-wide tests. An external (Codex) review was triaged in-session: all eight findings (7×P2, 1×P3) were substantiated and fixed with six new seed-backed regression tests; no finding was rejected.

### Files Modified

- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts` (rewritten) — canonical `PackageGroup` (registrations+declarations, source-first attributed copies, resolved tags, `multiVersion`), `CanonicalIndexes` built once over the façade, `copySourceRemote`/`copySourceDisplay`, `mainClaimOf`, shortest-existing-prefix `parentOf` (review fix: deep subpath chains keep their rows), `groupHasMappedClaim`/`noCopyNoteOf` (review fix: missing source copy ≠ missing binding), `targetFileName`, `multiVersionOf`, `copyGroupIds`; `winnerOf` and the facts-based legacy group removed; view-conventions re-exports kept.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts` (rewritten) — façade `buildPackagesVm(model, ui)` without `DerivedFederation`; groups from `registryEvidence.sharedExternals` (an empty share scope manufactures no packages), copies joined source-first, scope summary, `conflictCount` from resolved-tag multiplicity.
- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts` (rewritten) — row versions = distinct RESOLVED tags (shared-elected first, own copies muted with own-copy claim), `unknownTagged` residual chip, `noCopy: {label, note}` honest empty state, `sources` = evidenced copy-source remotes, `alsoResolvedBy` from consumer-copy relations with mapping states in the tooltip; flat rows link subpaths to their root base.
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts` (rewritten) — scope-specific `ResolutionMeasuresVm` counted from the group's canonical records (review fix: never another scope's package-wide sums); negotiation per `VersionRegistration` with per-declaration claim-state chips (selected / not selected / anchored / self-filled / blocked / not mapped / unknown / declared), arrows from resolutions, and `otherClaims` for multi-entrypoint declarations (review fix: no claim collapses away); `DetailCopyVm` with qualified sources (exact target source / explicit anchor / observed target source / ambiguous incl. `ambiguous-scope` / unknown, registry-slot comparison in the note), verbatim dispositions and roles with grounded notes, entrypoints with import-map cross-links; `registrationId`/`declarationId` as render tracking keys (review fix: equal `(tag, action)` never collides).
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts` (rewritten) — chunk section exclusively from canonical `BundleClaim`s of the group's copies (`copy.bundleClaimIds` → claims → chunk groups); only `mapped-source` presents files unqualified, `source-only`/`ambiguous` stay visibly qualified; legacy `chunk-map-join` import removed.
- `projects/devtools-ui/src/app/views/packages/packages.ts` (modified) — `store.derived()` dropped (model-only input), `providerNames` → `sourceNames`.
- `projects/devtools-ui/src/app/views/packages/packages.html` (modified) — sources chips + `alsoResolvedBy` "+n", unknown-tag `?` chip, `noCopy` note from the VM (no hardcoded tooltip claim).
- `projects/devtools-ui/src/app/views/packages/package-detail.ts` (modified) — imports `StateBadge` for ambiguous sources/claims; doc updated.
- `projects/devtools-ui/src/app/views/packages/package-detail.html` (rewritten) — new "Resolution" kv block (the four named counts + unknown tags + declaration count, each with a grounded dt tooltip), "Resolved copies" section (tag, source chip, qualifier, disposition/role facts, entrypoints), bundle-claim "Chunks" section; legacy per-file chunk→import-map links removed with the row-based join.
- `projects/devtools-ui/src/app/views/packages/package-negotiation.ts` (modified) — provider-line/residual removed; `note` input now carries the resolution note.
- `projects/devtools-ui/src/app/views/packages/package-negotiation.html` (rewritten) — canonical-ID `track` keys, state chips projected via `nfRowLinks`, `otherClaims` lines per multi-entrypoint declaration; provider and source-derived residual lines removed.
- `projects/devtools-ui/src/app/views/packages/packages.css`, `package-detail.css`, `package-negotiation.css` (modified) — styles for state chips, copy/chunk-claim blocks, claim lines, no-copy note; legacy provider/residual styles removed.
- `projects/devtools-ui/src/app/views/packages/packages-view-model.spec.ts` (rewritten) — 28 tests: corpus pins (co-declared-share, clean-skip, strict-split, strict-scope, pooling-anchor, self-fill, frankenstein-live, synthetic-multi-version) plus six synthetic seeds (equal-tag, multi-scope, deep subpath, ambiguous-scope, multi-entrypoint, cross-source convergence) and the purity pin.
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (rewritten) — 15 DOM tests: flat list, state chips, named counts, resolved multiplicity, qualified chunk claims, cross-links, honest no-copy/absence states, resolution-honest vocabulary incl. the `(source: …)` aria pin.
- `projects/devtools-ui/src/app/shared/kit/participant-row.ts` (modified) — winner-arrow aria label says `(source: …)` instead of `(provider: …)` (review fix: T7 wording; the named remote is the evidenced source, never a delivery claim). Field/class names stay internal.
- `projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts` (modified) — aria pin updated to the source wording.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble and Task 7 block only (task isolation).
- `docs/work/resolution-model/task-log/task-6-publish-canonical-projection.md` (predecessor), `task-5-materialize-resolved-copies.md`, `task-4-declaration-resolution-claims.md` — projection surface and consumption contracts, measures semantics, claim vocabulary/mapping-state precedence.
- `projects/devtools-ui/src/app/shared/store/resolution/` — `projection-model.ts`, `copies-model.ts`, `claims-model.ts`, `bundle-claims-model.ts`, `model.ts`, `aggregate-package-measures.ts`, `derive-bundle-claims.ts` (ambiguous-claim shape), `index.ts` (type-only imports; no derivation function is called from the view).
- `projects/devtools-ui/src/app/shared/store/federation-model.ts`, `federation-store.ts` — the three-surface façade contract.
- `projects/devtools-ui/src/app/shared/view-conventions.ts`, `shared/kit/participant-row.*`, `tree-table.ts`, `honest-state/state-badge.ts` — shared vocabulary and kit inputs.
- `projects/devtools-bridge/src/lib/fixtures/` (co-declared-share, clean-skip, strict-split, strict-scope, self-fill, pooling-anchor, synthetic-multi-version, dynamic-override) — corpus expectations; a temporary probe spec dumped the actual canonical projection per fixture before any pin was written (deleted afterwards).
- `projects/devtools-ui/src/app/views/remotes/`, `views/import-map/` (targeted) — confirmed they import only `shared/view-conventions`/`chunk-map-join`, never `views/packages`, so removing Packages-owned helpers breaks nothing.

### Key Decisions

- Read surface is exactly the three façade collections (`resolutionProjection`, `effectiveConsumerResolutions`, `registryEvidence`); the view builds ID-keyed `CanonicalIndexes` once per vm and joins by ID only. Type imports come through the resolution barrel; no derivation function is invoked (T7-AC-05).
- Groups exist per canonical shared-external record — Packages stays a shared-package list; private registrations remain with Remotes; an empty `__GLOBAL__` scope yields no rows (T7-AC-02).
- Copies join groups source-first, mirroring the `packageMeasures` attribution rule (source external first, else consumer registry packages of share-scope contexts) so row/detail and canonical measures can never disagree on membership.
- Conflict semantics replaced: the indicator is resolved-tag multiplicity (distinct resolved tags > 1) outside the `strict` scope; copy multiplicity with one resolved tag never flags (T7-AC-03). Wording: "⚠ N resolved versions (rule: resolved-tag-multiplicity)".
- Row muting kept as presentation hierarchy but re-derived from canonical roles: tags backed by an `ordinary-shared` copy lead; other resolved tags render muted with an own-copy claim from the copy's source and `sourceActions`.
- Mapping states map to a fixed display vocabulary (own-selected → selected, not-selected → not selected, anchored, self-filled, blocked, unmapped → not mapped, unknown; fallback stays chip-less — the arrow speaks); every state carries a grounded tooltip note (user-agreed reason-tooltip scope). Selected share declarations stay quiet (no arrow); selected scope declarations and self-anchors draw the own-copy arrow.
- The honest no-copy correction: `synthetic-multi-version` (a capture without import maps) previously rendered "2 versions mapped" from registry evidence alone; canonically it now renders zero copies, "not mapped" states, and the no-copy note — resolution honesty over legacy continuity.
- Chunk deep links dropped deliberately: per-file chunk→import-map links were built on the legacy row-based chunk join the task replaces; the canonical model records chunk files as evidence without a map join (Task-3 deferral), so files render as `available for loading` without mapped claims.
- Codex review (2026-08-19), all eight findings accepted and fixed:
  1. Equal `(tag, action)` registrations (valid via ordinals) collided on template track keys → canonical `registrationId`/`declarationId` are now the tracking keys.
  2. Detail counts came from package-name-keyed `packageMeasures` and could show another scope's sums → counts are now computed per (scope, package) group from its own canonical records; `PackageGroup.measures` removed.
  3. Longest-prefix parent linking dropped `foo/bar/baz` from the flat list → `parentOf` now picks the shortest existing prefix (by construction a base), so every subpath hangs directly under a base row.
  4. Winner-arrow aria said "provider:" → kit label now says "source:"; the only external pin was the kit's own spec (verified — Remotes pins structure only).
  5. `ambiguous-scope` attributions (`remote: null`) fell through to "unknown source" with a false "no scope prefix matches" claim → dedicated ambiguous-source branch before the fallback.
  6. The no-copy note claimed "no import-map binding" even when claims mapped to copies of other packages (cross-external convergence) → `noCopyNoteOf` distinguishes missing bindings from missing source-copy attribution, used by detail note and row tooltip alike.
  7. Multi-entrypoint declarations collapsed to one claim → `otherClaims` renders every further specifier claim with its own state and target.
  8. The ambiguity tooltip counted deduplicated `sourceRegistrationRefs` ("1 candidate … none chosen") → count dropped, wording now "several candidate sources match — none is chosen".

### Review Focus

- **Behavior claims:** Packages renders exclusively from the canonical façade — every count, tag, state, source qualifier, and chunk file chains to a canonical ID; only `mapped-source` bundle claims present chunk files unqualified, and a non-selected bundle-bearing declaration contributes nothing; requested (declared) and resolved tags never mix, and equal-tag copy multiplicity renders no conflict.
- **Assumptions / choices:** conflict indicator = resolved-tag multiplicity outside `strict` (view-level presentation, not a Task-10 diagnostic); detail counts are scope-specific group counts rather than the package-wide `packageMeasures` (review-driven; the attribution rules are identical); per-file chunk→import-map deep links intentionally dropped with the legacy join; `fallback` claims render arrow-only without a state chip.
- **Scope notes:** `shared/kit/participant-row.ts` + spec changed outside `views/packages/` (aria wording "provider:" → "source:", shared with Remotes — verified no external pin breaks). The pre-existing user-owned `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `copySourceVmOf` in `packages-detail-vm.ts` — the qualified-source ladder incl. the ambiguous-scope branch and registry-slot note; `copyGroupIds`/`parentOf`/`noCopyNoteOf` in `packages-vm-shared.ts` — attribution, shortest-prefix linking, and the two honest no-copy wordings; the seed section of `packages-view-model.spec.ts` — six synthetic seeds pin exactly the review findings.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --include '…/kit/participant-row.spec.ts' --watch=false` — passed on the final code state: 3 files / 53 tests (28 VM, 15 DOM, 10 kit).
- `npm test` — passed on the final code state: 34 UI files / 338 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (536 total). Only the existing odd-numbered Node 25 non-LTS warning.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` — passed on all changed `views/packages/` files and the two kit files.
- `git diff --check` — passed.
- Legacy-import sweep — `rg 'derived-model|derivations|chunk-map-join|winnerOf|sharedRows|store.derived|DerivedFederation' views/packages/` and a sweep for resolution derivation-function calls across `views/`: zero hits.
- Ground truth first: a temporary probe spec dumped the canonical projection (resolutions, claims, copies, relations, bundle claims, measures) for eight fixtures before pins were written; all corpus pins and all six review seeds passed on their first run.
- External Codex review triaged in-session (2026-08-19): eight findings, all substantiated and fixed; full suites ran green before and after the review round.

### Acceptance Coverage

- **T7-AC-01 — passed:** "renders 1 registration, 2 declarations, 2 consumer resolutions, 1 target, 1 copy" and "marks mfe1 selected and mfe2 not selected, no false multi-version or provider claim" (`packages-view-model.spec.ts`, co-declared-share) plus the DOM state-chip/arrow/`(source: mfe1)` pins (`packages.spec.ts`). Contributes to XC-03, XC-06.
- **T7-AC-02 — passed:** clean-skip 2/2/1/1, strict-split 3/2/2/2, strict-scope 2/2/2/2 pinned as named facts (VM + DOM kv block); "manufactures no packages from the empty `__GLOBAL__` scope" pins strict-scope; the multi-scope seed additionally pins scope-specific counts. Contributes to XC-03.
- **T7-AC-03 — passed:** declared ranges vs resolved tags pinned separately (strict-split); equal-tag seed pins 2 copies / 1 resolved tag / no conflict; qualified sources, dispositions, and roles pinned as distinct facts (strict-split copies, pooling-anchor anchor copy, ambiguous-scope seed). Contributes to XC-01, XC-03.
- **T7-AC-04 — passed:** frankenstein-live `browser-angular_common` pins `mapped-source` with its chunk file, tslib pins `source-only` with the explicit absence claim, `@excalidraw/excalidraw` pins claim-less honest absence, pooling-anchor `/extra` pins that the non-selected declaration donates nothing; DOM pins the qualified status chips. Contributes to XC-01, XC-06.
- **T7-AC-05 — passed:** copy/claim/bundle-claim IDs chained through the façade in VM pins; DOM tests seed selection through canonical `packageId`s; `tsc` + template compilation prove VM-only templates; the legacy/derivation sweep proves no resolver/action/copy derivation in Packages; purity pin holds. Contributes to XC-01.

### Open Issues

- Per-file chunk→import-map deep links are gone with the legacy join; if wanted back, they need a canonical chunk-file→map join (adjacent to the Task-3 deferred transitive chunk derivation) — candidates: Task 9 (Import Map) or Task 10.
- The legacy derived surface (`derivations.ts`, `derived-model.ts`, `chunk-map-join.ts`, `store.derived()`) remains published for Remotes/Import-Map until Tasks 8/9 and the Task-11 cutover; Packages no longer touches it.
- Kit arrow field/class names (`provider`, `.arrow-provider`) remain internal legacy naming; only the user-facing aria wording was lifted. Task 8 (Remotes migration) is the natural place to finish the kit vocabulary if desired.
- Explanations-UI follow-up (user-agreed at task start): interactive popovers / comparison views (SourceComparisons, attribution ladder, completeness issues) deliberately deferred to a post-Task-11 task or a Task-12 extension; the reason-tooltips landed in this task are the lightweight precursor.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7 staging.

### Context for Next Task

- Consumption pattern for the view migrations (validated here, reusable for Task 8 Remotes): build `CanonicalIndexes` once per vm over the three façade surfaces, join by ID only, never call resolution derivation functions; `buildXVm(model, ui)` without `DerivedFederation`.
- Reusable helpers live in `views/packages/packages-vm-shared.ts` (Packages-scoped): if Remotes needs `copySourceRemote`/`targetFileName`/state vocabulary, lift them to `shared/view-conventions.ts` rather than importing across views.
- Claim-state display vocabulary (selected / not selected / anchored / self-filled / blocked / not mapped / unknown) and the qualified-source ladder (exact target source / explicit anchor / observed target source / ambiguous / unknown) are established user-facing wording — reuse verbatim in Remotes/Import Map for consistency.
- Kit change to be aware of: winner-arrow aria now reads `resolves to X (source: Y)`; Remotes DOM tests pin only structure, but any new aria pins should use the source wording.
- Counting rule: per-view counts must be computed from the scoped group's canonical records, not from `packageMeasures` (package-name-keyed, scope-agnostic). `packageMeasures` remains correct as the package-wide canonical aggregate.
- Honest-wording rules proven here: missing source-copy attribution ≠ missing import-map binding (`noCopyNoteOf`); `ambiguous-scope` renders as ambiguity, never unknown; only `mapped-source` bundle claims present chunks unqualified.
- Render tracking must use canonical IDs (`registrationId`, `declarationId`, `claimId`, `copyId`) — `(tag, action)` and participant names legitimately repeat via ordinals.
- `/commit 7` must stage the 18 changed `views/packages/` + kit files (16 Packages files, `participant-row.ts`, `participant-row.spec.ts`) and this log — and must NOT stage the pre-existing `.gitignore` hunk without separate user confirmation.

### Git State

`git diff --stat`

```text
 .gitignore                                         |    2 +-
 .../src/app/shared/kit/participant-row.spec.ts     |    2 +-
 .../src/app/shared/kit/participant-row.ts          |    8 +-
 .../src/app/views/packages/package-detail.css      |   87 +-
 .../src/app/views/packages/package-detail.html     |  232 +++--
 .../src/app/views/packages/package-detail.ts       |   12 +-
 .../src/app/views/packages/package-negotiation.css |   47 +-
 .../app/views/packages/package-negotiation.html    |   85 +-
 .../src/app/views/packages/package-negotiation.ts  |   13 +-
 .../src/app/views/packages/packages-chunk-vm.ts    |  232 ++---
 .../src/app/views/packages/packages-detail-vm.ts   |  630 +++++++++---
 .../src/app/views/packages/packages-row-vm.ts      |  207 ++--
 .../app/views/packages/packages-view-model.spec.ts | 1050 ++++++++++++++------
 .../src/app/views/packages/packages-view-model.ts  |  139 ++-
 .../src/app/views/packages/packages-vm-shared.ts   |  267 ++++-
 .../src/app/views/packages/packages.css            |    8 +
 .../src/app/views/packages/packages.html           |   18 +-
 .../src/app/views/packages/packages.spec.ts        |  224 ++---
 .../devtools-ui/src/app/views/packages/packages.ts |   35 +-
 19 files changed, 2196 insertions(+), 1102 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-ui/src/app/shared/kit/participant-row.spec.ts
 M projects/devtools-ui/src/app/shared/kit/participant-row.ts
 M projects/devtools-ui/src/app/views/packages/package-detail.css
 M projects/devtools-ui/src/app/views/packages/package-detail.html
 M projects/devtools-ui/src/app/views/packages/package-detail.ts
 M projects/devtools-ui/src/app/views/packages/package-negotiation.css
 M projects/devtools-ui/src/app/views/packages/package-negotiation.html
 M projects/devtools-ui/src/app/views/packages/package-negotiation.ts
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
