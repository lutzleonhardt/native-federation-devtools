### Task

Publish the selected canonical artifacts through the raw-free projection: emitter-aware chunk groups, bundle claims with a `bundleClaimIds` attach stage, consumer-copy relations, completeness records, and the `CanonicalResolutionProjection` wired through ingest onto `FederationModel` — plus the user-requested docs restructure that moves the model documentation out of the README.

### Status

DONE

All six Task 6 acceptance criteria are covered by green focused and repository-wide tests. An external (Codex) review was triaged in-session against the cited spec sections: two of three P2 findings were substantiated and fixed (ambiguous-scope completeness, per-remote zero-count initialization); the third (bundle claims from scope-derived/host-fallback attribution) was rejected against spec §9 rule 1 and pinned with an adversarial test instead.

### Files Modified

- `projects/devtools-ui/src/app/shared/store/resolution/bundle-claims-model.ts` (new) — `ChunkGroupId`/`BundleClaimId`, `ChunkGroupOrigin`, emitter-aware `ChunkGroupProjection`, `BundleClaimStatus` (`mapped-source`/`source-only`/`ambiguous`), nullable `BundleClaimSource`, and the `BundleClaim` contract per spec §9.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-chunk-groups.ts` (new) — canonical chunk groups from both witnessed origins (dense `sharedChunks` repo consumed at the ingest boundary, `@nf-internal/...` pseudo-externals from canonical private registrations); structural zero-entry lists (`mapping-or-exposed`) contribute nothing; exports `CHUNK_PSEUDO_PACKAGE_PREFIX`.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-chunk-groups.spec.ts` (new) — frankenstein-live dense host groups with pinned files/provenance, non-dense pseudo groups, emitter-distinct equal filenames (T6-AC-03), determinism/sort.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-bundle-claims.ts` (new) — selected-source-only attribution (copy source claims its own bundle; dense `(sourceRemote, bundle)` groups decide `mapped-source` vs `source-only`), qualified ambiguous claims per distinct candidate `(sourceRemote, bundle)` pair with no chunk attribution, `@nf-internal/` carriers excluded, plus `attachBundleClaimIds` completing the copy contract.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-bundle-claims.spec.ts` (new) — non-selected donor prevention, secondary-declaration own-bundle contribution, pooling-anchor anchor claim (`source-only`, corpus registers no dense chunks), cold-global self-fill `mapped-source` vs named-scope `source-only`, dynamic-override corpus qualification, emitter separation, ambiguity, carrier exclusion, attach-stage completion, and the review-rejection pin (scope-derived target-only copy yields no bundle claim).
- `projects/devtools-ui/src/app/shared/store/resolution/projection-model.ts` (new) — `RemoteProjection`, `ConsumerCopyRelation(-Id)`, `CompletenessCounts`, `ConsumerResolutionIssue`, `IncompleteConsumerResolution`, `ResolutionCompleteness`, and the raw-free `CanonicalResolutionProjection` per spec §11 plus the approved claims/measures surface.
- `projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.ts` (new) — relation derivation from copies × resolution consumers enriched by attached claims, completeness aggregation (unique-binding totals, per-consumer counts incl. explicit zeros for every published remote, per-consumer issue records for both §6 ambiguity kinds), and projection assembly.
- `projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.spec.ts` (new) — exact projection shape pin (no raw/`sharedRows` surface), referential integrity of all ID chains, determinism, co-declared relation states, no-path-collapse seed, alias de-dup, four issue kinds, ambiguous-scope once-per-binding, zero-count remotes, and the pinned barrel export list (T6-AC-06).
- `projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts` (modified) — adds the spec-§7 `bundleClaimIds: BundleClaimId[]` field (type-only import cycle with `bundle-claims-model` accepted per Task-5 precedent); removes the "deliberately absent" note.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts` (modified) — emits `bundleClaimIds: []`; `attachBundleClaimIds` completes it.
- `projects/devtools-ui/src/app/shared/store/resolution/index.ts` (modified) — barrel exports for the two new model modules and three new functions in pipeline order.
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (modified) — runs the full canonical pipeline (claims → copies → `attachCopyIds` → chunk groups → bundle claims → `attachBundleClaimIds` → measures → `buildCanonicalProjection`) and publishes `resolutionProjection`; production `snapshotIdentity` is `` `${capturedAt}|${pageUrl}` ``.
- `projects/devtools-ui/src/app/shared/store/federation-model.ts` (modified) — `FederationModel.resolutionProjection: CanonicalResolutionProjection` with the raw-free doc contract.
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` (modified) — integration pins: pooling-anchor publishes the attached pipeline with consistent references and all-zero completeness; frankenstein-live host `browser-rxjs` bundle claims are `mapped-source` with the real chunk file.
- `README.md` (modified) — the ~500-line model section is replaced by a four-line pipeline summary plus a link to the new doc; the outdated community disclaimer is replaced by the official-Native-Federation statement (GitHub org + Chrome Web Store).
- `docs/resolution-data-model.md` (new) — the maintained model documentation: new "big picture" section (one-sentence purpose, four-stage flowchart Observe→Order→Derive→Publish with per-stage guarantees) followed by the five moved class-diagram views; view 5 documents relations, bundle/chunk rules, and the sharpened completeness contract.
- `docs/work/resolution-model/task-1-domain-model.md` (modified) — retargets its diagram link from the README anchor to the new doc.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble and Task 6 block only (task isolation).
- `docs/specs/native-federation-resolution-model.md` — §4.1 ID rules, §6.3 attribution ladder, §7 copy contract, §9 bundle/chunk attribution, §10.2 store migration, §11 projection interfaces, claim ledger; authoritative for the projection shape and the review triage.
- `docs/work/resolution-model/task-log/task-5-materialize-resolved-copies.md` (predecessor), `task-4-declaration-resolution-claims.md`, `task-3-effective-consumer-bindings.md` — pipeline contracts, `SourceMatch`/claim semantics, four-state resolution vocabulary, the deferred transitive chunk derivation note.
- `projects/devtools-ui/src/app/shared/store/resolution/` — `ids.ts`, `model.ts`, `claims-model.ts`, `copies-model.ts`, `materialize-resolved-copies.ts`(+spec harness), `derive-declaration-claims.ts` and `aggregate-package-measures.ts` (signatures), `attribute-observed-target-providers.ts` (ladder incl. equal-scope ambiguity), `resolve-effective-consumer-bindings.spec.ts` (blocked-entry seeds).
- `projects/devtools-ui/src/app/shared/chunk-map-join.ts` — owner-centric legacy chunk join, read as semantic reference only, deliberately unmodified.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (`sharedChunks` contract) and fixtures (frankenstein-live, non-dense, pooling-anchor, self-fill, dynamic-override, co-declared-share) — corpus bundle/chunk expectations derived from raw fixture data before writing tests.
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` — seeded-snapshot helper and blocked/missing-scope seed patterns.

### Key Decisions

- The projection carries more than the plan's minimal list: the complete attached claims surface (`declarationResolutionClaims`, `registryServingSlotClaims`, `observedTargetProviders`, `sourceComparisons`) and the `packageMeasures` (user-approved at task start). Rationale: T6-AC-04's "retains all … claims … needed by consumers", spec §10.2's mandated store exposure, and RM-CL-16's one-projection-drives-all-views. `effectiveConsumerResolutions` are deliberately NOT duplicated — projection IDs resolve against the existing canonical collection.
- Bundle attribution runs strictly through `copy.source`: selected declaration, private registration, observed-exact source, and identifiable anchor all materialize as the copy source, so §9's three channels collapse into one code path. A copy's source claims its own bundle only; a bundle of `null` claims nothing.
- `mapped-source` vs `source-only` is decided by the presence of dense `shared-chunks` groups for `(sourceRemote, bundle)`. Only `shared-chunks`-origin groups join dependency attribution; `@nf-internal/...` carriers (as pseudo chunk groups and as private-registration copies) and structural zero-entry lists stay outside it per §9 rules 7/8.
- An ambiguous-source copy emits one qualified `ambiguous` claim per distinct candidate `(sourceRemote, bundle)` pair — `source: null`, no chunk groups; ambiguity surfaces candidates and chooses none.
- Consumer-copy relations derive from copies × their member resolutions' consumers first (a claim-less binding still relates), then attached claims enrich `claimIds`/`mappingStates`; all arrays sorted distinct, IDs structural `(consumerRemote, copyId)`.
- Codex review finding "derive bundle claims from scope-derived/host-fallback observed attribution" was REJECTED: such an attribution names a remote but no source record, hence no evidenced bundle join key; borrowing the bundle of a declaration whose candidate demonstrably did not supply the target violates §9 rule 1 and the copy's own `target-only` disposition. The observed remote stays visible via the copy's embedded `ObservedTargetProvider`; the file-membership variant is the transitive chunk derivation Task 3 explicitly deferred. Pinned with an adversarial test.
- Codex review finding "ambiguous-scope missing from completeness" was ACCEPTED: both §6 ambiguity kinds now count as ambiguous source claims — ambiguous exact candidates count each affected declaration claim (IDs listed per consumer), an ambiguous scope attribution counts its single provider claim once per binding and issues `ambiguous-source` to every consumer with an explicitly empty `ambiguousClaimIds`. The prior issue filter that would have swallowed claim-less ambiguity was replaced by explicit issue construction.
- Codex review finding "byConsumer misses declaration-less remotes" was ACCEPTED: `byConsumer` is initialized with explicit zero counts for every published remote; the domain is `projection.remotes` ∪ resolution consumers (the union matters — a consumer like a missing remote can appear in resolutions without being in the remotes repo).
- Production `snapshotIdentity` is `` `${capturedAt}|${pageUrl}` ``, matching the Task-5 test convention; it only namespaces URL-identified copy IDs.
- Docs restructure (user-requested in-task): the README keeps a four-line summary plus link; the full model documentation including the new big-picture section lives in `docs/resolution-data-model.md`. Future model views extend the doc, never the README (saved as memory). The README's community/unaffiliated disclaimer was replaced — the extension moves into the official Native Federation space (GitHub org + Chrome Web Store).

### Review Focus

- **Behavior claims:** Bundle claims exist only for copy sources — a non-selected or merely scope-attributed bundle-bearing declaration donates nothing, and only registered dense chunk evidence makes a claim `mapped-source`; consumer-copy relations keyed `(consumerRemote, copyId)` retain every resolution/claim/mapping-state path; completeness counts each unique binding once, exposes both ambiguity kinds, and carries explicit zero counts for every published remote.
- **Assumptions / choices:** The projection's breadth beyond the plan list (claims surface + measures) is a deliberate, user-approved reading of T6-AC-04/§10.2/RM-CL-16; `ambiguousSourceClaims` mixes two §6 claim kinds by documented definition (declaration claims + one provider claim per scope-ambiguous binding); zero-entry chunk lists are dropped rather than represented.
- **Scope notes:** The docs restructure (`docs/resolution-data-model.md`, README slimming, task-1 design-note link) and the README affiliation statement are in-task user requests. The pre-existing user-owned `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `sourceClaim` and the ambiguous branch in `derive-bundle-claims.ts` — verify the selected-source-only rule and the carrier/zero-entry exclusions; `deriveCompleteness` in `build-canonical-projection.ts` — verify the two ambiguity paths and the remote-domain initialization; the "emits no bundle claim for a scope-derived target-only copy" test in `derive-bundle-claims.spec.ts` — it pins the rejected review finding against §9 rule 1.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/store/resolution/*.spec.ts' --include '…/ingest.spec.ts' --watch=false` — passed on the final code state: 12 files / 118 tests (three new spec files, 25 new tests total incl. review round, plus extended ingest suite; all pre-existing Task-1–5 pins stayed green through the `bundleClaimIds` contract change).
- `npm test` — passed on the final code state: 34 UI files / 337 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (535 total). Only the existing odd-numbered Node 25 non-LTS warning.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` — passed on all new/changed `resolution/*.ts`, `ingest*.ts`, `federation-model.ts`, and `docs/resolution-data-model.md`; the README diff against Prettier output shows only the two known pre-existing deviations (intro italics, repository-layout table).
- `git diff --check` — passed.
- External Codex review triaged in-session (2026-08-19): P2 ambiguous-scope completeness and P2 per-remote zero counts substantiated and fixed with new seeds; P2 observed-source bundle claims rejected against spec §9 rule 1/§6.3 with an adversarial pin instead. Full suites ran green before and after the review fixes.
- Corpus cross-check: frankenstein-live joins real host bundles (`browser-rxjs` → `chunk-PAMKM67I.js`) as `mapped-source` through ingest; the lab corpus (empty `mapping-or-exposed` lists only) stays uniformly `source-only`.

### Acceptance Coverage

- **T6-AC-01 — passed:** "lets only the selected declaration claim", "selected secondary declaration contributes only its own emitter-aware bundle", and the pooling-anchor corpus test (anchor claims its own bundle, qualified `source-only`) in `derive-bundle-claims.spec.ts`; the scope-derived rejection pin hardens the non-donation rule. Contributes to XC-01, XC-02.
- **T6-AC-02 — passed:** cold-global skip self-fill with registered chunks pins `mapped-source`; named-scope self-fill without registration pins `source-only`; the dynamic-override corpus pins every claim qualified with no chunk groups. Contributes to XC-02, XC-06.
- **T6-AC-03 — passed:** equal bundle and file names in two emitters produce two distinct chunk groups and claims referencing only the own emitter (`derive-bundle-claims.spec.ts`, `derive-chunk-groups.spec.ts`). Contributes to XC-02.
- **T6-AC-04 — passed:** the exact `Object.keys` shape pin (no raw snapshot/cache types, no `sharedRows`), referential-integrity sweep over relations/claims/chunks/copies, and the ingest integration pins prove retention of roles, dispositions, relation IDs, claims, chunks, and provenance. Contributes to XC-01, XC-05.
- **T6-AC-05 — passed:** alias binding counted once in `total` but per consumer in `byConsumer`; all four issue kinds distinct in one seed; ambiguous-scope counted once per binding and issued to every consumer; declaration-less remote pinned at explicit zero counts. Contributes to XC-03, XC-05.
- **T6-AC-06 — passed:** the barrel's runtime export list is pinned to exactly the eleven pipeline functions — no graph model/builder; new vocabulary stays resolution-honest (statuses qualify, nothing claims delivery). Contributes to XC-05, XC-06.

### Open Issues

- `unattributable` (e.g. CDN) targets carry no completeness issue by design — they are honest external URLs, not ambiguity; revisit in Task 10 if a "foreign target" diagnostic is wanted.
- The legacy chunk area (`chunk-map-join.ts`, ingest `allFilesMapped` with its `pageUrl` fallback) is untouched; it is replaced during the view migrations (Tasks 7–9) and the Task-11 cutover.
- The consumer-centric transitive chunk derivation (Task-3 deferral) remains deferred; the rejected review finding 1 is adjacent to it and documented in the rejection pin.
- The physical `resolution/` folder restructure stays deferred until after the Task-11 cutover; the barrel remains the orientation surface.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 6 staging.

### Context for Next Task

- The canonical read surface is now published: `FederationModel.resolutionProjection` (`CanonicalResolutionProjection`) plus the existing `effectiveConsumerResolutions` and `registryEvidence`. Migrated views read these three and nothing else; `sharedRows` remains only for unmigrated views until Task 11.
- Projection contents: `remotes`, `copies` (with `bundleClaimIds`), `consumerRelations`, `chunkGroups`, `bundleClaims`, the complete attached claims surface, `packageMeasures`, `completeness`. Resolution IDs resolve against `effectiveConsumerResolutions`; registry IDs against `registryEvidence`.
- A `ConsumerCopyRelation` is the per-consumer edge to a copy — use `mappingStates`/`claimIds` from it instead of re-deriving; a relation with empty `claimIds` is a legitimate claim-less binding.
- Completeness contract: `total` counts unique bindings/claims once; `byConsumer` contains EVERY published remote (explicit zeros) and overlaps by design — never sum it; filtered views must use `byConsumer` + `consumerIssues` and de-duplicate by resolution and claim ID. `ambiguousClaimIds` is empty for scope-level ambiguity.
- UI wording rule for bundle evidence: only `mapped-source` may be presented unqualified as a mapped backing chunk; `source-only` and `ambiguous` must surface their uncertainty; nothing may imply downloads or execution.
- The model documentation lives in `docs/resolution-data-model.md` (big picture + five views) — extend the doc for new views, never the README.
- `/commit 6` must stage the nine new files (`docs/resolution-data-model.md` + eight `resolution/` modules/specs), the eight modified files (`copies-model.ts`, `materialize-resolved-copies.ts`, `index.ts`, `ingest.ts`, `ingest.spec.ts`, `federation-model.ts`, `README.md`, `docs/work/resolution-model/task-1-domain-model.md`), and this log — and must NOT stage the pre-existing `.gitignore` hunk without separate user confirmation.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 README.md                                          | 428 +--------------------
 docs/work/resolution-model/task-1-domain-model.md  |   4 +-
 .../src/app/shared/store/federation-model.ts       |  12 +-
 .../src/app/shared/store/ingest.spec.ts            |  66 +++-
 .../devtools-ui/src/app/shared/store/ingest.ts     |  51 +++
 .../app/shared/store/resolution/copies-model.ts    |   8 +-
 .../src/app/shared/store/resolution/index.ts       |  11 +-
 .../resolution/materialize-resolved-copies.ts      |   2 +
 9 files changed, 152 insertions(+), 432 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M README.md
 M docs/work/resolution-model/task-1-domain-model.md
 M projects/devtools-ui/src/app/shared/store/federation-model.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
 M projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts
 M projects/devtools-ui/src/app/shared/store/resolution/index.ts
 M projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts
?? docs/resolution-data-model.md
?? projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.ts
?? projects/devtools-ui/src/app/shared/store/resolution/bundle-claims-model.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-bundle-claims.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-bundle-claims.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-chunk-groups.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-chunk-groups.ts
?? projects/devtools-ui/src/app/shared/store/resolution/projection-model.ts
```
