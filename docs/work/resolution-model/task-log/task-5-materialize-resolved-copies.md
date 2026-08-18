### Task

Materialize resolved dependency copies from mapped effective resolutions and their claims — hierarchical source-oriented identity, separated source-disposition/effective-role/source-action axes, claim `copyId` completion, and the four-measure canonical package aggregation — as pure derivations under `resolution/`, plus the public barrel and the README model view 4.

### Status

DONE

All six Task 5 acceptance criteria are covered by green focused and repository-wide tests. An external (Codex) review was triaged in-session against the cited spec sections: all three findings were substantiated and fixed (action-derived roles, `copyId` on the claim contract, `VersionRegistration`-only headline counts), and the triage surfaced two additional spec deviations (disposition encoding, copy contract shape) that were fixed in the same pass.

### Files Modified

- `projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts` (new) — spec-§7-shaped copy contract: `ResolvedDependencyCopy` with `CopySource`, flat `ResolvedCopySourceDisposition` union, `ResolvedCopyEffectiveRole`, `entrypoints` record, grouped `resolutionContexts`, `sourceRegistrationRefs`, embedded providers/slots; plus `PackageResolutionMeasures`.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts` (new) — pure materializer over mapped resolutions reusing Task-4 `SourceMatch`es; unique-exact source grouping with URL fallback, the no-duplication merge rule, action-derived role rules with an `unclassified` backstop, and the `attachCopyIds` stage completing the claim contract.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts` (new) — corpus cardinality (co-declared-share, clean-skip, strict-split, scoped), multi-entrypoint/URL-fallback/merge identity seeds, `copyId` completion pins, disposition-vs-role separation incl. the spec's literal scope+anchor coexistence example, mapped-only boundary, and order/`cached` invariance against the mutable registry slot.
- `projects/devtools-ui/src/app/shared/store/resolution/aggregate-package-measures.ts` (new) — the four headline measures (`registrationCount`/declared tags from `VersionRegistration[]` only; copies/resolved tags plus unknowns from copies) with declaration/claim counts as supporting measures and deliberately no conflict field.
- `projects/devtools-ui/src/app/shared/store/resolution/aggregate-package-measures.spec.ts` (new) — corpus rows (clean-skip, strict-split, scoped private-only), the equal-tag-no-conflict seed with exact field-name pinning, and URL-copy unknown-tag attribution.
- `projects/devtools-ui/src/app/shared/store/resolution/index.ts` (new) — public barrel of the resolution layer in pipeline order; header names the deliberately internal modules (`ids`, `derive-registry-serving-slots`, `attribute-observed-target-providers`, `compare-sources`).
- `projects/devtools-ui/src/app/shared/store/resolution/claims-model.ts` (modified) — adds the spec-mandated `copyId: ResolvedDependencyCopyId | null` to `DeclarationResolutionClaim` (type-only import from `copies-model`).
- `projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.ts` (modified) — emits `copyId: null` at both claim construction sites; `attachCopyIds` completes the field after materialization.
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (modified) — imports the resolution API through the barrel instead of three deep imports.
- `projects/devtools-ui/src/app/shared/store/federation-model.ts` (modified) — imports canonical types through the barrel.
- `README.md` (modified) — model section grows view “4. Resolved dependency copies” (Mermaid class diagram, identity/axes/measures prose, resolution-≠-delivery boundary), the layer table gains copies/measures rows, and view 3’s claim class gains `copyId`.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — Task 5 scope, acceptance criteria, identity/axes/aggregation instructions, and the rejected `(shareScope, package, tag, targetUrl)` key.
- `docs/specs/native-federation-resolution-model.md` — §5 claim contract (`copyId`), §7 copy contract/disposition/role rules, §7.1 identity, §7.2 measures; read during the Codex-review triage and authoritative for all five fixes.
- `docs/work/resolution-model/task-log/task-4-declaration-resolution-claims.md` — claims contract, `SourceMatch` reuse instruction, deferred `copyId`, no-copy-for-blocked rule.
- `docs/work/resolution-model/task-log/task-3-effective-consumer-bindings.md` and `task-1-normalize-canonical-registry-evidence.md` — resolution four-state contract and canonical source-record IDs used as copy identity.
- `docs/work/resolution-model/task-log/task-2.2-normalize-pooling-anchors.md` — witnessed `pool`/`servedBy` matrix behind the anchor-source role.
- `projects/devtools-ui/src/app/shared/store/resolution/model.ts`, `claims-model.ts`, `ids.ts`, `derive-declaration-claims.ts`, `attribute-observed-target-providers.ts` — input contracts, surfaces, and ID construction.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.spec.ts` — seed/harness pattern mirrored by both new spec files.
- `projects/devtools-bridge/src/lib/fixtures/` (co-declared-share, clean-skip, strict-split, scoped, pooling-anchor, self-fill, dynamic-override) — corpus expectations derived from raw fixture data before writing tests.
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts` (targeted) — confirmed prefix entries without trailing-slash targets survive the merge and block in the resolver.

### Key Decisions

- Copies are driven by mapped effective resolutions only; claims enrich but never create membership, and `blocked`/`unknown`/`unmapped` attribute nothing. Task-4 `SourceMatch`es are reused verbatim — attribution is never re-derived.
- Copy identity is hierarchical per spec §7.1: unique exact-candidate subject → source-record identity (`shared-declaration`/`private-registration`); otherwise `target-url`, with the snapshot namespace living only in the copy ID (opaque `snapshotIdentity` context parameter, production value chosen by the publisher in Task 6).
- The no-duplication rule is implemented as a merge phase: a URL group whose URL is owned by exactly one materialized source joins that copy; ownership ambiguity keeps the URL copy. A source with candidates but no mapped member owns nothing (candidates alone never create a copy).
- `attachCopyIds(claims, copies)` completes the canonical claim contract as a pure second stage — chosen over mutating claims or building copies inside the claims derivation. An initial relational-index design (`indexCopyIdByClaimId`) was replaced during the Codex triage because spec §5 literally mandates the field. The resulting type-only circular import `claims-model` ↔ `copies-model` is erased at compile time and accepted.
- Effective roles derive from claim state plus source action — never from consumer counts (Codex finding): selected `share` surface → `ordinary-shared` (a single-consumer host stays ordinary-shared), `scope` own mapping → `isolated-own`, self-fill → `self-filled-source`, `servedBy` selection → `anchor-source`, private own mapping → `private-own`. `not-selected` and other unlisted states contribute nothing; a copy with no derived role falls back to `['unclassified']`. The spec's “plus a diagnostic” for unclassified sources is deferred to Task 10.
- `sourceDisposition` is the spec's flat union (`share-registration`, `skip-registration`, `scope-registration`, `private-registration`, `unknown-registration`, `ambiguous-source`, `target-only`); an earlier object encoding was replaced for contract fidelity. Dispositions derive from source records only and are pinned invariant under consumer actions.
- The copy embeds `observedTargetProviders` and `registryServingSlotClaims` per the spec interface — a deliberate deviation from Task 4's copied-evidence aversion because the spec shape wins; `bundleClaimIds` is the single omitted spec field (no bundle-claim layer exists in any task).
- `registrationCount`/`distinctDeclaredTagCount` count shared `VersionRegistration[]` only (Codex finding); private registrations are separate canonical records and never fold into headline measures. Copies attribute source-oriented: source package first, else the consumer registry packages of their contexts.
- The aggregation exposes no conflict field at all; equal-tag copy multiplicity is only visible as counts (registrations vs copies vs distinct tags), and conflict judgement stays with Task 10 diagnostics.
- A public barrel (`resolution/index.ts`) was added at the user's request as the orientation surface; outside consumers import through it. The physical folder restructure (stage subfolders) was deliberately deferred until after the Task-11 cutover, when the surviving public surface is stable.
- README documentation was extended in-task at the user's request (view 4 + copyId in view 3), keeping the maintained-diagram policy; pre-existing README Prettier deviations remain untouched.

### Review Focus

- **Behavior claims:** Only mapped resolutions materialize copies, grouped by unique exact source else namespaced target URL, and a URL group owned by exactly one source merges instead of duplicating; effective roles derive from claim state plus source action (single-consumer selected share is `ordinary-shared`, scope own mapping is `isolated-own`) while dispositions never change from consumer behavior; `attachCopyIds` gives every mapped claim its copy and every other claim an explicit null.
- **Assumptions / choices:** `snapshotIdentity` is an opaque caller-supplied namespace (production value is a Task-6 decision); `bundleClaimIds` is omitted until a bundle-claim layer exists; the unclassified-role diagnostic is deferred to Task 10; `not-selected` claims contribute no role by closed-vocabulary reading of spec §7.
- **Scope notes:** The barrel plus the two importer switches (`ingest.ts`, `federation-model.ts`) and the README model views are in-task user-requested additions. Nothing is wired into `FederationModel`/ingest beyond import paths — publication is Task 6. The pre-existing user-owned `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `claimRole` and the merge phase in `materialize-resolved-copies.ts` — verify the action-derived role rules and the unique-owner guard; `aggregatePackageMeasures` in `aggregate-package-measures.ts` — verify shared-only registration counting and copy-package attribution; the “scope copy retains isolated-own and acts as anchor-source” test in `materialize-resolved-copies.spec.ts` — it pins the spec's literal coexistence example.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/store/resolution/*.spec.ts' --watch=false` — passed on the final code state: 8 files / 69 tests (two new spec files plus the six existing resolution suites).
- `npm test` — passed on the final code state: 31 UI files / 310 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (508 total). Only the existing odd-numbered Node 25 non-LTS warning was emitted.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` on all `resolution/*.ts` — passed. README: a full-file Prettier diff shows only the 20 pre-existing deviation lines (intro italics, repository-layout table); the new view-4 section matches Prettier output.
- `git diff --check` — passed.
- External Codex review triaged in-session against the cited spec sections: all three P2 findings substantiated and fixed (action-derived roles, claim `copyId`, `VersionRegistration`-only counts); the triage additionally surfaced and fixed the disposition-encoding and copy-contract-shape deviations. The full suite ran green before and after the review fixes.

### Acceptance Coverage

- **T5-AC-01 — passed:** “materializes one copy from one registration, two declarations, and two consumer resolutions” pins the exact co-declared-share cardinalities, one entrypoint URL, one grouped context with two claim IDs, and `ordinary-shared`. Contributes to XC-03.
- **T5-AC-02 — passed:** clean-skip (2 registrations, 2 declared tags, 1 copy), strict-split (3 registrations, 2 declared tags, 2 copies, skip registration yields none), and scoped (2 private copies) are each pinned with source, tag, disposition, and roles. Contributes to XC-03.
- **T5-AC-03 — passed:** the multi-entrypoint seed groups both mapped entrypoints of one declaration across two consumer contexts; the CDN seed pins URL identity (ID contains the snapshot namespace) with null tag/package and no source claim; the merge seed pins one copy despite a second external record targeting its URL; the pooling-anchor test pins `attachCopyIds` navigation. Contributes to XC-02, XC-03.
- **T5-AC-04 — passed:** pooling-anchor pins `skip-registration` disposition under pure anchor consumption and `ordinary-shared` for the single-consumer selected share host; the scope+anchor seed pins coexisting `['anchor-source', 'isolated-own']`; the self-fill seed pins `self-filled-source` for own and later-consumer self-fill; scoped pins `private-own`. Contributes to XC-01, XC-02.
- **T5-AC-05 — passed:** reversing declaration order (co-declared-share) and registration order (strict-split) keeps the identity/ownership/relation core equal while the registry slot moves; flipping every `cached` flag keeps copies deep-equal including provenance. Contributes to XC-02.
- **T5-AC-06 — passed:** corpus rows pin all four headline measures plus supporting counts via exact `toEqual`; the equal-tag seed (2 copies, 1 declared and 1 resolved tag) additionally pins the exact result field names, proving no conflict field exists. Contributes to XC-03.

### Open Issues

- The copy/claims/aggregation layer is intentionally unpublished: ingest neither calls `materializeResolvedCopies`/`attachCopyIds` nor stores their output; publication through the canonical projection is Task 6. Until then, `deriveResolutionClaims` output claims carry `copyId: null` by design.
- `bundleClaimIds` from spec §7 is absent because no bundle-claim layer exists in any planned task; revisit if one is added.
- The spec's “unclassified … plus a diagnostic” role clause is deferred to Task 10 diagnostics design.
- The `shared/store`/`resolution` physical restructure into stage subfolders is deferred until after the Task-11 cutover; the barrel is the interim orientation surface.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 5 staging.

### Context for Next Task

- Import everything through the barrel `resolution/index.ts`. The copy pipeline is: `materializeResolvedCopies(evidence, resolutions, claims, { snapshotIdentity })` → `ResolvedDependencyCopy[]`, then `attachCopyIds(claims.declarationResolutionClaims, copies)` → completed claims. Task 6 must publish the **attached** claims, not the raw null-`copyId` collection, and must choose the production `snapshotIdentity` (derive from capture identity; tests use `capturedAt|pageUrl`).
- `aggregatePackageMeasures(evidence, declarationResolutionClaims, copies)` returns sorted `PackageResolutionMeasures[]`; headline registration measures cover shared registrations only.
- Copy IDs are deterministic structural tuples: `['source', kind, recordId]` or `['target-url', snapshotIdentity, url]`; byte-equal snapshots reproduce byte-equal copies. All arrays are sorted; `resolutionContexts` are grouped per (resolution domain, consumer registry package) with sorted `claimIds`.
- The embedded `registryServingSlotClaims` and `observedTargetProviders` carry order-sensitive provenance paths — the registry slot may legitimately move under reordering while the identity core stays fixed; do not treat full copy deep-equality as an order-invariance oracle.
- Role and disposition vocabularies are closed spec unions; downstream views must not re-derive roles from consumer counts or treat equal-tag copy multiplicity as a conflict (Task 10 owns conflict judgement with registration/tag evidence).
- A copy proves what the captured map resolves — never that the browser requested, downloaded, or executed anything; UI wording built on copies must keep the resolution-≠-delivery boundary (“resolves to”, not “loads”).
- `/commit 5` must stage the eleven Task-5 files (six new `resolution/` modules/specs incl. the barrel, `claims-model.ts`, `derive-declaration-claims.ts`, `ingest.ts`, `federation-model.ts`, `README.md`) and must NOT stage the pre-existing `.gitignore` hunk without separate user confirmation.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 README.md                                          | 124 ++++++++++++++++++++-
 .../src/app/shared/store/federation-model.ts       |   2 +-
 .../devtools-ui/src/app/shared/store/ingest.ts     |  24 ++--
 .../app/shared/store/resolution/claims-model.ts    |   7 ++
 .../store/resolution/derive-declaration-claims.ts  |   2 +
 6 files changed, 144 insertions(+), 17 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M README.md
 M projects/devtools-ui/src/app/shared/store/federation-model.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
 M projects/devtools-ui/src/app/shared/store/resolution/claims-model.ts
 M projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.ts
?? projects/devtools-ui/src/app/shared/store/resolution/aggregate-package-measures.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/aggregate-package-measures.ts
?? projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts
?? projects/devtools-ui/src/app/shared/store/resolution/index.ts
?? projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts
```
