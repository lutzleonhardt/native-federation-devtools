### Task

Normalize shared and scoped registry evidence into an ordered canonical model with stable identities, explicit provenance, generation-neutral entrypoint candidates, and a one-way compatibility projection for the existing UI.

### Status

DONE

All six Task 1 acceptance criteria are covered by green automated tests.

### Files Modified

- docs/work/resolution-model/task-1-domain-model.md (new) — documents entity ownership, cardinalities, invariants, and the one-way compatibility boundary as a compact Mermaid class diagram and catalog.
- projects/devtools-ui/src/app/shared/store/resolution/model.ts (new) — defines canonical evidence records, branded IDs, provenance references, candidate URL states, diagnostics, and the aggregate model.
- projects/devtools-ui/src/app/shared/store/resolution/ids.ts (new) — creates structural JSON tuple IDs and parent-scoped equal-key ordinals without delimiter collisions or deduplication.
- projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts (new) — normalizes shared and scoped registries in source order, derives generation-neutral candidates, constructs strict candidate URLs, and emits unknown-action diagnostics.
- projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts (new) — projects canonical declarations one way into the existing sorted SharedParticipantRow shape while retaining legacy import-map lookup behavior.
- projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts (new) — covers fixture cardinalities, private registrations, generations, URL failure states, duplicate-safe identity, provenance, and diagnostics.
- projects/devtools-ui/src/app/shared/store/federation-model.ts (modified) — adds required FederationModel.registryEvidence as the canonical root for later resolution work.
- projects/devtools-ui/src/app/shared/store/ingest.ts (modified) — delegates shared-registry normalization and legacy row production to the focused resolution modules.
- projects/devtools-ui/src/app/shared/store/ingest.spec.ts (modified) — verifies canonical ingest wiring and the one-way legacy projection.

### Files Read (Context Only)

- docs/work/resolution-model/plan.md — Task 1 scope, acceptance criteria, boundaries, and handoff expectations.
- projects/devtools-bridge/src/lib/snapshot-v1.ts — raw shared/scoped registry contracts, generation spellings, and SnapshotV1 invariants.
- projects/collector/src/lib/snapshot-mapper.ts — production XOR validation and servedFiles derivation for participant spellings.
- projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts — confirms live page data always passes through mapProbeResult before Store ingest.
- projects/devtools-ui/src/app/shared/store/derived-model.ts — existing registry-election and effective-resolution concepts that must remain separate from candidates.
- projects/devtools-ui/src/app/shared/store/derivations.ts — downstream SharedParticipantRow dependencies preserved by the adapter.
- projects/devtools-ui/src/app/shared/store/merge-document-maps.ts — existing lossless URL helper and import-map merge behavior.
- projects/devtools-ui/src/app/shared/store/federation-store.ts — production Store wiring and the absence of an arbitrary JSON import boundary.
- projects/devtools-bridge/src/lib/fixtures/co-declared-share.fixture.ts — real multi-declaration evidence for the cardinality acceptance case.
- projects/devtools-bridge/src/lib/fixtures/scoped.fixture.ts — real private/scoped registrations and entrypoint evidence.
- projects/devtools-bridge/src/lib/fixtures/non-dense.fixture.ts — scoped pseudo-external evidence that must remain visible canonically even though the legacy view reclassifies it as chunks.
- angular.json — UI test/build target configuration.
- package.json — repository-wide test and guard commands.

### Key Decisions

- Canonical evidence uses flat ordered arrays plus parent/child ID references. This keeps every raw occurrence independently addressable without losing hierarchy or introducing object-key hazards.
- IDs encode typed JSON tuples and an equal-key source ordinal. Delimiter-bearing values cannot collide; ordinals distinguish evidence occurrences and never imply election or priority.
- Shared wrapper, version registration, participant declaration, private registration, and entrypoint candidate remain separate entities. In particular, dirty belongs only to SharedExternalRecord and action belongs only to VersionRegistration.
- Every canonical record and diagnostic carries snapshot-path provenance. Missing participant pool and servedBy paths are explicit missing evidence, while their canonical values remain null until witnessed raw fields exist.
- v4 file and v4.5 entries are normalized only in the canonical pass. Downstream candidates have the same specifier/file shape and no generation-dependent consumer branch.
- Candidate URL construction is strict and evidence-preserving: missing, unusable, or non-hierarchical owner scopes yield explicit null states rather than a page-base fallback.
- Candidate URLs and effective import-map bindings are different facts. The strict canonical candidate path intentionally coexists temporarily with the legacy, lossless compatibility lookup.
- All scoped-external records, including @nf-internal pseudo-externals, remain canonical PrivateRegistration evidence; the existing chunk reclassification remains confined to the legacy model.
- Existing views and derivations were not migrated. The adapter preserves raw action strings, legacy sorting, row fields, and import-map resolution while depending only on canonical records.
- The compatibility adapter reconstructs servedFiles from canonical candidates. This is value-equivalent for every official mapper-produced SnapshotV1; fabricated/custom inputs that violate the documented file XOR entries or servedFiles consistency contract are intentionally outside the compatibility guarantee.
- Domain documentation is split deliberately: the work document owns relationships and invariants, while exported TypeScript entities carry local JSDoc. Full field lists are not duplicated in prose.

### Review Focus

- **Behavior claims:** co-declared shared evidence retains one wrapper, one version, two declarations, and two distinct owner-relative candidates; duplicate-looking evidence remains ordered and uniquely identified; missing/unusable owner scopes never acquire canonical page-relative URLs.
- **Assumptions / choices:** official SnapshotV1 values satisfy the mapper-enforced file XOR entries invariant and derive servedFiles from the selected spelling. Strict candidate construction and lenient legacy effective-map lookup remain intentionally distinct during the compatibility phase.
- **Scope notes:** no view or derivation migration occurred. Canonical private evidence includes @nf-internal pseudo-externals. The current .gitignore modification is unrelated user work and must not be staged with Task 1.
- **Read next:** projects/devtools-ui/src/app/shared/store/resolution/model.ts — verify entity ownership and relation IDs; projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts — verify source-order traversal, candidate provenance, and strict URL states; projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts — verify the dependency direction and exact legacy behavior retained.

### Test Evidence

- ./node_modules/.bin/ng test devtools-ui --include projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts --watch=false — 1 file, 5 tests passed.
- ./node_modules/.bin/ng test devtools-ui --include projects/devtools-ui/src/app/shared/store/ingest.spec.ts --watch=false — 1 file, 16 tests passed.
- npm test — rerun on 2026-08-15: 24 UI files / 239 tests, 3 bridge files / 70 tests, 6 collector files / 60 tests, and 4 guard files / 47 tests all passed.
- ./node_modules/.bin/ng build devtools-ui --configuration development — passed; development bundle generated successfully.
- ./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit — passed with no diagnostics.
- ./node_modules/.bin/prettier --check on the new resolution modules/spec and domain-model document — passed.
- git diff --check — passed.
- Manual dependency review found no view/derived imports in canonical modules and no generation branch in production candidate normalization.
- Review follow-up traced the live provider through mapProbeResult and confirmed there is currently no panel JSON importer; the LOW servedFiles residual is limited to fabricated/custom or future import inputs.

### Acceptance Coverage

- **T1-AC-01 — passed:** normalizeRegistryEvidence — corpus-backed declarations / “preserves co-declared participants as two separately addressable candidates” asserts exact wrapper/version/declaration/candidate cardinality, distinct URLs, and wrapper-only dirty.
- **T1-AC-02 — passed:** “keeps scoped externals as private registrations without shared semantics” asserts two scoped private records/candidates and absence of invented action/shareScope; it also preserves non-dense pseudo-externals canonically.
- **T1-AC-03 — passed:** “normalizes v4 and v4.5 spellings uniformly and keeps missing ownership explicit” covers v4, v4.5 single/multi-entry, mixed generation, missing owner, and unusable owner states.
- **T1-AC-04 — passed:** “is byte-stable and preserves delimiter-bearing duplicate occurrences in source order” covers repeat normalization, structural delimiter collisions, duplicate registrations/declarations/candidates, ordinals, relation IDs, and ordering.
- **T1-AC-05 — passed:** “retains an unknown raw action, emits its diagnostic, and keeps all evidence explicit” covers raw value preservation, normalized unknown, warning diagnostic, non-empty provenance, and missing pool/servedBy evidence references.
- **T1-AC-06 — passed:** ingestSnapshot — canonical registry evidence verifies model wiring and one-way rows; all Store, view, bridge, collector, and guard suites remain green, and canonical specs import no view helpers.

### Open Issues

- No blocking issues.
- Accepted LOW residual: a fabricated/custom SnapshotV1 whose servedFiles disagrees with file/entries is reprojected from canonical candidates rather than passed through verbatim. No current production or panel-import path can produce this; any future JSON importer should validate or re-normalize at its boundary.

### Context for Next Task

- normalizeRegistryEvidence(snapshot: SnapshotV1): CanonicalRegistryEvidence is the sole canonical registry normalization entry point.
- FederationModel.registryEvidence is required and contains ordered sharedExternals, versionRegistrations, participantDeclarations, privateRegistrations, entrypointCandidates, and diagnostics arrays linked by branded IDs.
- ParticipantDeclaration.pool and ParticipantDeclaration.servedBy are always null with explicit missing provenance until witnessed snapshot fields justify a schema extension; do not infer them.
- EntrypointCandidate.candidateUrl is a constructed source candidate, not an effective binding or winner. Missing/unusable remote scope states must remain null.
- IDs depend on structural parent tuples and equal-key ordinals in source order. Do not regenerate them from sorted sharedRows or interpret an ordinal semantically.
- New resolution work must consume registryEvidence directly. sharedRows is a temporary outbound adapter and must never become an input to canonical rules.
- Official mapper output guarantees file XOR entries and derives servedFiles from that spelling. A future external snapshot importer would need an explicit validation boundary; none exists today.
- Legacy scopedPackages/chunkGroups still traverse the scoped repository independently, and @nf-internal records are reclassified only there; canonical private evidence intentionally retains them.

### Git State

git diff --stat

```text
 .gitignore                                         |  2 +-
 .../src/app/shared/store/federation-model.ts       |  4 ++
 .../src/app/shared/store/ingest.spec.ts            | 15 ++++
 .../devtools-ui/src/app/shared/store/ingest.ts     | 84 +++-------------------
 4 files changed, 29 insertions(+), 76 deletions(-)
```

git status --short

```text
 M .gitignore
 M projects/devtools-ui/src/app/shared/store/federation-model.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
?? docs/work/resolution-model/task-1-domain-model.md
?? docs/work/resolution-model/task-log/
?? projects/devtools-ui/src/app/shared/store/resolution/
```

The .gitignore modification is unrelated user work and is intentionally excluded from the Task 1 file list and future staging scope.
