# Native Federation DevTools — Resolution Model Plan

Spec: docs/specs/native-federation-resolution-model.md
Branch scope: resolution-model (from feature/resolution-model)
External challenger: /home/lutz/Downloads/DEPENDENCY-GRAPH.md, SHA-256 5977479c34433256c89790a2ab2a3068817a11b24a39a764a480b7d486f693d3.

The work has three milestones: establish one canonical domain model, migrate the four consumers, then enforce and review the cutover. Tasks stay at independently reviewable boundaries; evidence acquisition, raw snapshot transport, and Store normalization are separate point tasks even though RM-AC-07 treats them as one ordered, traceable schema-gate chain.

YAGNI boundary: no graph UI or pool graph, no network/runtime-use instrumentation, no UI redesign except the Task 7.5 Packages presentation redesign (frozen mock: `design/packages-view-redesign-mock.md`) and the Task 7.6/7.7 presentation polish from its screenshot review, no general diagnostics rule engine, no new Playwright/Cypress/Storybook setup, and no screenshot goldens. The external challenger informs requirements but is not copied or treated as an oracle.

Tasks 2, 2.1, and 2.2 form the raw `pool`/`servedBy` schema gate. Task 2 produces evidence only; if its real witness cannot be produced, close Task 2 BLOCKED and do not start Tasks 2.1 or 2.2. Tasks 3–12 may still use null raw fields and source-backed canonical seeds, while the overall pooling acceptance remains incomplete.

> The executing agent may adjust scope and ordering based on more
> up-to-date context discovered during implementation, as long as
> each task still satisfies the sizing rules above.
>
> When a task is finished (DONE or BLOCKED), close it with the
> `/wrap-up N` → `/commit N` pair. `/wrap-up N` writes or extends
> `docs/work/<scope>/task-log/task-{N}-{slug}.md`, where `<scope>`
> is derived from the current git branch, and is safe to run multiple
> times across sessions — it merges. `/commit N` reads that log,
> stages code + summary, and commits them together after showing
> the plan and waiting for confirmation. Optionally run `/review`
> (quick per-task, full before a PR) between wrap-up and commit;
> a second `/wrap-up N` can absorb the review findings.

## Task 1: Normalize canonical registry evidence

### Instructions

- Introduce the canonical normalized evidence records and shared ID/provenance types under a focused Store resolution module:
  - one `SharedExternalRecord` per `(shareScope, packageName)`, owning `dirty`;
  - one `VersionRegistration` per stored `versions[]` element;
  - one `ParticipantDeclaration` per stored `version.remotes[]` element;
  - one separate `PrivateRegistration` per scoped-external `(ownerRemote, packageName)`;
  - derived `EntrypointCandidate` records for every recorded specifier/file pair.
- Preserve raw registry and participant order, duplicate-looking records, the original action string, and all contributing evidence. Recognized actions are `share | skip | scope`; every other action remains `unknown` and emits a diagnostic.
- Generate deterministic, collision-safe tuple IDs. Use an escaped or structural encoding plus ordinals within equal keys; never deduplicate raw records or interpret an ordinal as a winner.
- Normalize both generations once: v4 `file` uses the registry package name as specifier; v4.5 `entries` preserves all ordered key/file pairs. Downstream code must not branch on generation.
- Construct candidate URLs by resolving the owner remote's `scopeUrl` against `capture.pageUrl`, then the recorded file against that scope. A missing/unusable remote scope produces `candidateUrl: null` with an explicit state, never an arbitrary page-base fallback.
- Keep participant `pool` and `servedBy` canonically nullable. Until the raw snapshot contract contains witnessed fields, normalize them to `null`; do not infer either value.
- Preserve current UI behavior through a one-way temporary `sharedRows` compatibility projection. No existing view is migrated in this task, and no new domain rule may be implemented in that adapter.

### Acceptance

- **T1-AC-01** — `co-declared-share` normalizes to one shared-external record, one version registration, two participant declarations, and two distinct candidate URLs; `dirty` belongs only to the wrapper. **Contributes:** XC-01, XC-02.
- **T1-AC-02** — `scoped` normalizes to two private registrations with candidate records and does not invent a shared action or share scope. **Contributes:** XC-01, XC-03.
- **T1-AC-03** — v4 `file`, v4.5 single/multi-entry `entries`, and a mixed-generation seed produce the same downstream candidate shape; a missing owner scope produces a null candidate rather than a page-relative URL. **Contributes:** XC-02.
- **T1-AC-04** — Byte-identical input produces identical IDs and ordering; delimiter-bearing keys, duplicate names, duplicate registrations, and duplicate declarations cannot collide or disappear. **Contributes:** XC-02.
- **T1-AC-05** — Unknown actions remain inspectable through their raw value and diagnostic, and every normalized or derived record points to its contributing capture evidence. **Contributes:** XC-02.
- **T1-AC-06** — Existing Store and view tests remain green through the compatibility projection, while new canonical-model tests do not depend on view helpers. **Contributes:** XC-01.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/federation-model.ts`
- `projects/devtools-ui/src/app/shared/store/derived-model.ts`
- `projects/devtools-ui/src/app/shared/store/ingest.ts`
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts`
- New focused modules/specs under `projects/devtools-ui/src/app/shared/store/resolution/`

### Key Discoveries

- The current core relation `FederationModel.sharedRows: SharedParticipantRow[]` flattens declarations and is the cardinality bug being replaced.
- A participant is neither a registration nor a resolved copy. `co-declared-share` proves that one registration can contain multiple declarations and candidate files.
- Registry and import-map evidence remain separate layers; normalization must never overwrite either raw layer with a join result.

## Task 2: Capture a real pooling-anchor witness

**Dependency:** Task 1.

### Instructions

- Create a real pinned-orchestrator browser scenario in `/home/lutz/projects/nf/playground` that emits both `pool` and `servedBy` before changing any collector, bridge, or Store schema.
- Capture one canonical snapshot that records the exact field paths and serialized omission behavior, two consumers of the same tag as separate declarations, at least one explicit anchor, the effective target and comparable anchor candidate, and available bundle/chunk evidence.
- Add the canonical capture to the corpus manifest, validate the witnessed values and omissions, and keep manifest generation byte-stable.
- If the witness cannot be reproduced, document the attempted scenario and evidence in the task log, leave all product schemas unchanged, close the task BLOCKED, and do not infer fields from maintainer prose or filenames.
- Stop at the evidence boundary. Do not add Snapshot, Bridge, fixture, Store, pooling-model, or UI behavior in this task.

### Acceptance

- **T2-AC-01** — A committed real capture proves the raw `pool`/`servedBy` positions, omission behavior, independent same-tag consumers, explicit anchor, effective target, comparable candidate, and available bundle/chunk evidence, including an honest `source-only` outcome when no matching chunk list exists. **Contributes:** XC-02, XC-04.

T2-AC-02 through T2-AC-05 were retired by the approved task split. Their IDs are intentionally not reused; the remaining requirements are covered by Tasks 2.1 and 2.2.

### Key Locations

- `/home/lutz/projects/nf/playground`
- `captures/` and `captures/manifest.json`
- `scripts/build-lab-manifest.mjs`
- `scripts/validate-lab-corpus.mjs`

### Key Discoveries

- Before this task, the corpus contains 11 lab captures plus two live phases and no real `servedBy` witness.
- Pinned source supports `servedBy` as optional per consumer/member and permits self-anchors and cross-external anchor lookup. Source support is not permission to change the raw schema without a capture.
- Equal `pool` labels do not prove one connected pool, and different labels can belong to one family. Raw labels are therefore not canonical identities.
- The witnessed declarations carry `bundle: "browser-shared"`, while `shared-chunks` exposes no matching bundle list. This is positive bundle evidence plus an honest `source-only`/no-chunk-list observation, not a missing or inferred chunk file.

## Task 2.1: Preserve witnessed anchors in the raw snapshot contract

**Dependency:** Task 2.

### Instructions

- Add bounded optional strings `pool?: string` and `servedBy?: string` to the two existing collector schema mirrors, the snapshot mapper, and the Bridge `SnapshotV1` contract. Preserve absent raw keys as absent rather than synthesizing `undefined` or `null`.
- Keep `SnapshotV1.schemaVersion` at 1. Advance the current collector and injected-probe provenance markers to `/3`; the mapper accepts the matching current `passive-probe/3` contract only. Raw `/2` probe results are not persisted and must not weaken the mismatch guard. Compatibility means that already persisted `/2` `SnapshotV1` values remain readable.
- Derive the pooling-anchor fixture through the existing fixture pipeline, register it, and regenerate every corpus-derived fixture because collector provenance is part of the byte-stable output. Leave synthetic fixtures unchanged and do not add a special-case fixture generator.
- Add focused old/new round-trip and hostile-value coverage for the two new keys. One representative persisted `/2` snapshot must round-trip with both own keys absent. Reuse the existing bounded projection machinery to reject non-strings, throwing getters, and over-limit values through both schema paths; do not introduce a generalized validator framework, broad new security suite, or legacy-fixture matrix.
- Stop at the raw contract boundary. Do not normalize Store values, derive anchors, create pool identities, or add UI behavior in this task.

### Acceptance

- **T2.1-AC-01** — Both collector schema copies, the mapper, and the Bridge contract preserve the same bounded optional-string contract; raw key absence remains absence and `SnapshotV1.schemaVersion` remains 1. **Contributes:** XC-04.
- **T2.1-AC-02** — All corpus-derived fixtures are byte-stably regenerated with current `/3` provenance, the witnessed fixture is registered, and a representative persisted `/2` snapshot round-trips with `pool` and `servedBy` still absent as own keys. **Contributes:** XC-02, XC-04.
- **T2.1-AC-03** — Focused tests prove that non-string, throwing-getter, and over-limit inputs cannot leak through either schema path without breaking passivity, privacy, or prior corpus validation. **Contributes:** XC-04.

### Key Locations

- `projects/collector/src/lib/runtime-schema.ts`
- `projects/collector/src/lib/passive-probe.ts`
- `projects/collector/src/lib/constants.ts`
- `projects/collector/src/lib/snapshot-mapper.ts`
- `projects/devtools-bridge/src/lib/snapshot-v1.ts`
- `projects/devtools-bridge/src/lib/fixtures/`
- `projects/collector/src/lib/fixture-drift.spec.ts`
- `scripts/derive-fixtures.ts`
- Existing focused probe, mapper, and Bridge snapshot specs

### Key Discoveries

- The existing string projection and limits are the correct enforcement point; the two fields do not require a new validation abstraction.
- Optional raw fields are backward compatible with `SnapshotV1.schemaVersion === 1`, while `/3` emitter provenance records which collector/probe could produce them.
- Probe and mapper ship in lockstep and raw probe results are never persisted. Accepting `passive-probe/2` in the new mapper would weaken drift detection; legacy compatibility belongs at the persisted `SnapshotV1` boundary.
- The current derivation pipeline stamps every corpus-derived fixture with the current collector version, so the `/3` bump causes deliberate mechanical fixture churn. Preserve the byte-level drift guard rather than adding exceptions.
- A fixture is evidence transport, not permission to infer pooling semantics.

## Task 2.2: Normalize pooling anchors at the Store boundary

**Dependency:** Task 2.1.

### Instructions

- Populate the existing normalized declaration fields from the witnessed raw participant values at the Store boundary. Preserve raw absence in `SnapshotV1`; only normalized Store data converts absence to `null`.
- Preserve field-level evidence for present and missing values, including independent omission of `pool` and `servedBy`.
- Add focused normalization tests for present values, independent omissions, and unchanged unrelated registry semantics. Do not add a broad metamorphic test matrix.
- Keep `pool` as participant metadata and `servedBy` as a per-declaration anchor only. Derive no canonical pool ID, pool graph, universal provider, runtime-use statement, delivery claim, or UI behavior here.

### Acceptance

- **T2.2-AC-01** — Present raw values survive into normalized declarations, raw absence stays absent, and only Store normalization represents missing `pool` or `servedBy` as `null`. **Contributes:** XC-01, XC-04.
- **T2.2-AC-02** — Present and missing field provenance is retained independently for both keys without changing declaration, registration, candidate, or effective-binding cardinality. **Contributes:** XC-02, XC-03.
- **T2.2-AC-03** — No canonical pool identity, pool graph, universal provider, runtime-use statement, or delivery claim is derived from either raw value. **Contributes:** XC-01, XC-06.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/resolution/model.ts`
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts`
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts`

### Key Discoveries

- Task 1 already reserves nullable normalized `pool` and `servedBy` fields with missing-evidence records; this task only replaces those seeds with witnessed raw values.
- `pool` and `servedBy` are independently optional, so normalization must not couple their presence.
- Semantic anchor comparison belongs to Task 4, not to raw normalization.

## Task 3: Resolve effective consumer bindings

**Dependency:** Task 1.

### Instructions

- Add one pure import-map resolver that computes exactly one `EffectiveConsumerResolution` for each unique `(normalizedConsumerScopeOrMissingKey, specifier)`.
- Use a consumer remote's normalized `scopeUrl` as the lookup context at its scope root. It is not an observed importer-module URL, and modules under more specific map scopes or outside the remote scope can resolve differently. Missing consumer-scope evidence uses a deterministic per-consumer sentinel and produces `unknown`; it must never fall back to `capture.pageUrl`.
- Search every matching import-map scope from longest to shortest. At each scope, apply standards-compatible exact and valid trailing-slash prefix matching; continue to a less-specific matching scope after a key miss, then consult top-level `imports`.
- Distinguish `mapped`, `unmapped`, `blocked`, and `unknown`: a missing map channel or consumer scope is unknown; a known map and consumer scope context with no applicable import-map binding is unmapped; a matching entry that cannot produce a valid target is terminally blocked. A native-mode empty shim map is not evidence that the effective map is empty.
- Normalize the chosen target against the page URL. Mapped results retain the contributing entry; blocked results retain the matching entry plus a closed failure reason and never fall through to a less-specific rule. Keep `mergeDocumentMaps` responsible only for merging; this resolver becomes the sole lookup owner.
- Model only import-map bindings, not the browser's complete module-resolution fallback: a URL-like specifier with no applicable map entry remains `unmapped` even though the browser can resolve that URL without the map.
- Remote aliases with the same normalized consumer scope URL share one effective resolution. Preserve their separate claims later and expose a sorted, de-duplicated `consumerRemotes` context list.
- Keep the implementation as small pure functions for scope enumeration, exact/prefix match, target normalization, and resolution assembly. Do not derive actions, sources, copies, or runtime-use statements here.

### Acceptance

- **T3-AC-01** — Seed vectors pin exact-over-prefix precedence, valid prefix suffixing, non-prefix keys, longest matching scope, less-specific scope fallback, top-level fallback, and terminal blocking without fallback for unusable exact/prefix entries. **Contributes:** XC-01, XC-02.
- **T3-AC-02** — A missing map channel or consumer scope produces `unknown`; a known map/scope context with no applicable import-map binding produces `unmapped`, including a URL-like specifier whose browser fallback is outside this model; a matching unusable entry produces `blocked` with its reason; no case silently uses the page as a scope context. **Contributes:** XC-02, XC-06.
- **T3-AC-03** — Remote aliases with one normalized consumer scope URL and specifier produce one effective resolution with both consumer contexts, while distinct consumer scope URLs in `co-declared-share` produce two resolutions. **Contributes:** XC-03.
- **T3-AC-04** — Each mapped or blocked result retains the deciding map-entry provenance, and byte-identical maps and registry inputs produce deterministic IDs and ordering. **Contributes:** XC-02.
- **T3-AC-05** — Prototype-like and delimiter-bearing scope/specifier keys are resolved without collisions or inherited-property lookup. **Contributes:** XC-02, XC-04.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts`
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.spec.ts`
- `projects/devtools-ui/src/app/shared/store/ingest.ts`
- New resolver modules/specs under `projects/devtools-ui/src/app/shared/store/resolution/`

### Key Discoveries

- The current lookup in `ingest.ts` supports exact keys only and can fall back to the page URL.
- Import-map scope URLs and Native Federation share-scope names are different domains and must never be normalized into one another.
- An effective binding states what the captured map would resolve, not that the browser requested, downloaded, evaluated, or used it.

## Task 4: Explain declaration resolution claims

**Dependency:** Task 3.

### Instructions

- Build pure derivations for `RegistryServingSlotClaim`, `DeclarationResolutionClaim`, `SourceMatch`, `ObservedTargetProvider`, and the three closed `SourceComparison` kinds. These modules become the only owners of action-path, source-attribution, and mapping-state rules.
- Derive the registry serving slot from stored order: first declaration for a non-empty non-`scope` registration, `not-applicable` for `scope`, and `empty` for an empty registration. Do not recompute it from `cached` or use it as a universal per-specifier provider.
- Apply action-specific candidate surfaces:
  - `share`: first eligible non-anchored declaration per specifier within the selected registration;
  - `scope`: each declaration's own candidates;
  - named-scope `skip`: selected override union, then each consumer's own uncovered candidates;
  - global `skip`: only genuinely `unmapped` specifiers in declaration order; `blocked` is terminal and must never self-fill;
  - dynamic global paths: only the already committed surface;
  - equal tags in separate registrations never form one union.
- Attribute mapped targets using one ladder: unique exact candidate, ambiguous exact candidates, unique most-specific non-host scope, equally specific ambiguous scopes, host fallback, then unattributable. Exact equality always outranks scope ownership, and none of these outcomes proves delivery.
- Treat `servedBy` as an optional per-declaration anchor. Search anchor candidates by anchor remote plus specifier across external records within the share scope. Absence is not self-service; `servedBy === consumerRemote` is a valid self-anchor.
- Compute claim mapping state with this precedence: `anchored`, `self-filled`, `own-selected`, `fallback`, `not-selected`, `blocked`, `unknown`. Retain `ownCandidateSelected` independently. A blocked effective resolution has no target/source attribution and must never be reinterpreted as unmapped.
- Compare rather than collapse registry slot vs observed source, anchor vs observed source, and own candidate vs effective target. Canonical left/right orientation and IDs are fixed; mismatch and ambiguity remain data.
- Use direct canonical seeds for source-supported but uncaptured anchor, same-registration multi-entrypoint, skip self-fill, overlapping claim, and dynamic-path branches. Mark them `source-confirmed-unobserved` whenever no real capture supplies that evidence.

### Acceptance

- **T4-AC-01** — Tests pin the complete mapping-state precedence, including own self-anchor, own skip self-fill, shared fallback, non-selected candidate, terminal blocked binding, and unknown evidence. **Contributes:** XC-01, XC-02.
- **T4-AC-02** — Same-registration multi-entrypoint `share`, per-declaration `scope`, named/global `skip`, and dynamic committed-surface seeds follow distinct action paths; equal tags in different registrations never union. **Contributes:** XC-01, XC-03.
- **T4-AC-03** — Several overlapping declaration claims may converge on one effective binding without duplicating it, and `clean-skip`, `strict-split`, `strict-scope`, and private cases retain their raw action/domain evidence. **Contributes:** XC-03.
- **T4-AC-04** — Unique exact match, exact ambiguity, unique scope attribution, equal-prefix ambiguity, host fallback, and unattributable target are distinct deterministic outcomes; exact match wins over scope attribution. **Contributes:** XC-02.
- **T4-AC-05** — Slot, anchor, candidate, observed source, and target remain separate qualified claims with only the three valid comparison kinds and canonical orientation. **Contributes:** XC-02, XC-06.
- **T4-AC-06** — `co-declared-share` yields two claims against one target URL: the `mfe1` candidate is selected exactly and the `mfe2` candidate remains visible as not selected. **Contributes:** XC-03, XC-06.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/derivations.ts`
- `projects/devtools-ui/src/app/shared/store/derivations.spec.ts`
- `projects/devtools-ui/src/app/shared/store/derived-model.ts`
- New claim/source modules/specs under `projects/devtools-ui/src/app/shared/store/resolution/`

### Key Discoveries

- The source-defined first participant is only a qualified registry basis slot; secondary entrypoints can be supplied by later declarations.
- An exact target owner outside the action-eligible explanation set remains observed evidence and creates a mismatch rather than replacing the registry claim.
- `scope` does not by itself prove strict-version failure, and `skip` does not mean no mapped file or no chunks.

## Task 5: Materialize resolved dependency copies

**Dependency:** Task 4.

### Instructions

- Derive `ResolvedDependencyCopy` records only from mapped effective resolutions and their claims. Candidates and participant membership alone never create a copy.
- Use hierarchical source-oriented identity:
  1. a unique exact shared declaration or private registration candidate uses that source-record ID;
  2. otherwise use the normalized target URL, namespaced by snapshot identity for cross-snapshot storage.
- Keep consumer share scope/package and claim IDs in `resolutionContexts`; never duplicate or relabel an exact source copy because another consumer context or external record points to it.
- Take `resolvedTag` only from a uniquely matched source registration. A fallback consumer's declared tag cannot label another or unknown source.
- Keep source provenance and effective behavior separate:
  - `sourceDisposition` describes shared action, private source, ambiguous source, target-only, or unknown registration;
  - sorted `effectiveRoles` may coexist as ordinary-shared, isolated-own, self-filled-source, anchor-source, private-own, or unclassified;
  - `sourceActions` contains evidenced source actions, not every consumer claim's action.
- Add canonical package-level aggregation that names four different measures: registration count, distinct declared-tag count, resolved-copy count, and distinct resolved-tag count plus unknown tags. Declaration and claim counts remain separate supporting measures.
- Keep derivations pure and deterministic. Do not classify equal-tag copy fragments as a version conflict without distinct registration/tag evidence.

### Acceptance

- **T5-AC-01** — `co-declared-share` produces one registration, two declarations, two consumer resolutions, one target URL, and one resolved copy. **Contributes:** XC-03.
- **T5-AC-02** — `clean-skip` produces two registrations and two declared tags but one copy; `strict-split` produces three registrations, two declared tags, and two copies; `scoped` produces two private copies. **Contributes:** XC-03.
- **T5-AC-03** — Unique source-record identity groups all mapped entrypoints from that source across consumer contexts; URL fallback groups the same normalized target without claiming a source, and unknown source tags remain null. **Contributes:** XC-02, XC-03.
- **T5-AC-04** — Source dispositions never change because of consumer actions, while compatible effective roles coexist for scope anchors, skip anchors/self-fill, ordinary share, and private mappings. **Contributes:** XC-01, XC-02.
- **T5-AC-05** — Reversing registry-only order or changing `cached` does not change exact target ownership or copy identity for an unchanged map, though it may change the qualified registry slot. **Contributes:** XC-02.
- **T5-AC-06** — The four package counts remain separately accessible and equal-tag copy multiplicity alone does not emit a version-conflict result. **Contributes:** XC-03.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/derived-model.ts`
- `projects/devtools-ui/src/app/shared/store/derivations.ts`
- `projects/devtools-ui/src/app/shared/store/derivations.spec.ts`
- `projects/devtools-ui/src/app/shared/store/federation-store.ts`
- New copy/aggregation modules/specs under `projects/devtools-ui/src/app/shared/store/resolution/`

### Key Discoveries

- Copy identity is source-oriented; consumer package/share-scope belongs to relations, not the copy key.
- One registration can yield zero, one, or several copies; several claims and effective resolutions can converge on one copy.
- The tempting key `(shareScope, package, tag, targetUrl)` is rejected because it duplicates cross-context and cross-external anchor uses.

## Task 6: Publish selected artifacts through the canonical projection

**Dependency:** Task 5.

### Instructions

- Derive `BundleClaim`, emitter-aware `ChunkGroupId`, `ConsumerCopyRelation`, completeness records, and the raw-free `CanonicalResolutionProjection` consumed by views and any future graph.
- Attribute a bundle/chunk group only through a selected declaration, a private registration, or an explicit/observed source with a matching bundle. A declaration's raw bundle is not automatic attribution to every related resolution.
- Prevent a non-selected bundle-bearing declaration from donating chunks. Allow a same-registration secondary declaration to contribute its bundle only when it supplies the selected entrypoint.
- For an identifiable `servedBy` mapping use the anchor source. For skip self-fill, distinguish `mapped-source` from `source-only` and `ambiguous`; named/dynamic paths without registered bundle evidence stay qualified rather than reported as missing or downloaded.
- Keep equal filenames from different emitter remotes distinct. Keep `mapping-or-exposed` and legacy `@nf-internal/chunk-*` raw provenance separate from dependency chunk attribution.
- Build a raw-free projection containing remotes, copies with every source disposition/effective role, consumer-copy relations, bundle/chunk claims, and completeness totals/by-consumer/issues for unknown, unmapped, blocked, and ambiguous results.
- A consumer-copy relation is keyed by `(consumerRemote, copyId)` and retains all supporting resolution IDs, claim IDs, and mapping states. Completeness aggregation must de-duplicate shared effective resolutions.
- Do not implement graph nodes, edges, layout, filtering UI, or a second resolver. The projection must not expose `SnapshotV1`, raw repositories, or compatibility `sharedRows`.

### Acceptance

- **T6-AC-01** — A non-selected bundle-bearing declaration contributes no copy chunks, while a selected secondary declaration and an identifiable anchor contribute only their own emitter-aware bundles/chunks. **Contributes:** XC-01, XC-02.
- **T6-AC-02** — Cold-global skip self-fill with registered chunks is `mapped-source`; named/dynamic self-fill without registered bundle evidence is `source-only` or otherwise qualified. **Contributes:** XC-02, XC-06.
- **T6-AC-03** — Equal chunk filenames from different emitters produce distinct IDs and never merge. **Contributes:** XC-02.
- **T6-AC-04** — The canonical projection contains no raw snapshot/cache types or `sharedRows`, yet retains all copy roles, source dispositions, relation IDs, claims, chunks, and provenance needed by consumers. **Contributes:** XC-01, XC-05.
- **T6-AC-05** — Global and filtered completeness counts correctly expose unknown, unmapped, blocked, and ambiguous results without double-counting a binding shared by several consumer contexts. **Contributes:** XC-03, XC-05.
- **T6-AC-06** — No graph UI/model or runtime delivery/cost inference is introduced. **Contributes:** XC-05, XC-06.

### Key Locations

- `projects/devtools-ui/src/app/shared/chunk-map-join.ts`
- `projects/devtools-ui/src/app/shared/chunk-map-join.spec.ts`
- `projects/devtools-ui/src/app/shared/store/derived-model.ts`
- `projects/devtools-ui/src/app/shared/store/derivations.ts`
- New artifact/projection modules/specs under `projects/devtools-ui/src/app/shared/store/resolution/`

### Key Discoveries

- Chunk evidence follows the selected source path, not every participant row with a bundle.
- The maintainer dependency graph is a useful downstream challenger but its raw-cache builder, one-provider assumptions, and download language are deliberately not adopted.
- Future graph code may format canonical facts but must not reconstruct action, provider, copy, or chunk semantics.

## Task 7: Migrate Packages to canonical resolutions

**Dependency:** Task 6.

### Instructions

- Preserve the existing Packages list/detail structure and interaction model; do not redesign the UI.
- Rebuild Packages view models exclusively from the canonical Store façade: shared external records, registrations, declarations, claims, effective resolutions, copies, qualified sources, and bundle claims.
- Display registration count, distinct declared-tag count, resolved-copy count, and distinct resolved-tag count plus unknown tags as separate named facts. Declaration count may be shown only as a declaration count.
- Render requested versus resolved tags separately. Copy multiplicity with one resolved tag is not automatically a version conflict.
- Replace `winnerOf`, participant-based own/provider labels, non-`skip` copy counting, and row-based chunk joins. Each selected/not-selected declaration remains visible, and source wording is qualified as registry slot, explicit anchor, exact/observed target source, or unknown.
- Render chunks only from canonical `BundleClaim` records; surface `source-only` and `ambiguous` states rather than implying mapped backing chunks.
- Keep view builders small and pure, with templates consuming view-model types only. Remove the Packages-owned legacy helpers as they become unused; the known 10–12-file touchpoint is an accepted legacy exception.
- Use only resolution-honest wording: declared, mapped, resolves to, selected, not selected, anchored, available for loading.

### Acceptance

- **T7-AC-01** — Packages renders `co-declared-share` as one registration, two declarations, two consumer resolutions, one target, and one copy; it marks `mfe1` selected and `mfe2` not selected without a false multi-version or provider claim. **Contributes:** XC-03, XC-06.
- **T7-AC-02** — `clean-skip`, `strict-split`, and `strict-scope` show the canonical four counts and do not manufacture packages from an empty `__GLOBAL__` scope. **Contributes:** XC-03.
- **T7-AC-03** — Requested and resolved tags, qualified sources, source dispositions, and effective roles remain distinct; equal-tag copies alone do not render a version conflict. **Contributes:** XC-01, XC-03.
- **T7-AC-04** — Only selected canonical bundle claims contribute chunks, and uncertain claims are visibly qualified. **Contributes:** XC-01, XC-06.
- **T7-AC-05** — View-model tests and focused DOM assertions consume canonical IDs through the Store façade, templates consume only VM types, and Packages contains no resolver/action/copy derivation. **Contributes:** XC-01.

### Key Locations

- `projects/devtools-ui/src/app/views/packages/packages-view-model.ts`
- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts`
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts`
- `projects/devtools-ui/src/app/views/packages/packages-chunk-vm.ts`
- `projects/devtools-ui/src/app/views/packages/package-negotiation.ts`
- Packages templates/components/styles and their focused specs

### Key Discoveries

- Packages currently repeats winner, provider, count, conflict, and chunk semantics across several helpers.
- Existing structure is reusable; correctness requires changing the model inputs and vocabulary, not inventing a new presentation.

## Task 7.5: Redesign the Packages presentation around resolved copies

**Dependency:** Task 7.

### Instructions

- Presentation-only redesign of the Packages view; the canonical façade
  consumption, VM purity rules, claim vocabulary, and grounded
  reason-tooltips from Task 7 stay intact. Layout/wording reference is
  the frozen mock `docs/work/resolution-model/design/packages-view-redesign-mock.md`.
- Detail panel: replace the five sections (Resolution counters,
  Negotiation, Resolved copies, Integrity, Chunks) with one block per
  resolved copy. Block header: resolved tag · disposition
  (`shared`/`isolated`, isolated adds "mapped only for X") · source
  participant chip. File line(s) per entrypoint:
  `→ <file> mapped · SRI ✓` (or muted `no SRI`). Consumer rows beneath:
  participant chip + declared range + deviation annotations only
  (STRICT, `skipped own <tag>`, `kept own copy`, `not selected`,
  anchored, self-filled). Chunks nest inside their copy's block:
  `mapped-source` claims list files unqualified; `source-only`/
  `ambiguous` keep their qualified one-liner.
- Unresolved bucket: declarations whose claim is not mapped / blocked /
  unknown render under an `unresolved` heading with state and
  `offered <tag>`; a package with zero copies shows "no resolved copies
  in this capture" plus the bucket. A *not selected* declaration that
  resolves to a copy is a consumer row under that block, never
  unresolved (co-declared-share: 2 consumer resolutions, 1 copy).
- Deviation-first: default qualifiers (exact target source,
  share-registration, ordinary-shared) move into the block-header
  tooltip; no glyph legend, no glyph+word duplication; each fact
  renders once. A muted diagnostics footer appears only on divergence
  (unknown tags, offers without any consumer row).
- List: rows reduce to package name + resolved version(s); conflict rows
  show `⚠` (tooltip: resolved-tag-multiplicity rule) plus the versions
  with the non-elected one muted; honest-empty rows show muted
  `no copy` with the existing noCopyNote; participant chips leave the
  rows.
- Participant filter: single-select chips (click on / off / switch) in
  the filter zone next to All/Conflicts; both filters combine
  (Conflicts ∧ participant). VM concept is a `selectedParticipant`
  input so the widget stays swappable; no multi-select, no combobox.
- Keep cross-links (source chip → Remotes, mapped file → Import Map,
  parent/entry links) and canonical-ID render tracking. Shape the
  copy-block VM around the consumer → copy → chunk spine as a coherent
  reusable structure, but keep it Packages-scoped; lift to
  shared/view-conventions only when Remotes actually consumes it.
- The negotiation sub-component may be absorbed/removed if the copy
  blocks cover it. Components keep templateUrl/styleUrl with separate
  .html/.css files.

### Acceptance

- **T7.5-AC-01** — frankenstein-live `/primitives/signals` renders
  exactly one copy block (21.2.12, source host, mapped file with SRI,
  consumer row `^21.2.0` STRICT, 5 listed chunk files) and none of the
  removed sections; default qualifiers appear only in tooltips.
  **Contributes:** XC-06.
- **T7.5-AC-02** — clean-skip renders one block whose mfe1 row carries
  `skipped own 1.0.0` with a grounded tooltip and no separate skip
  section; co-declared-share renders mfe2 as a consumer row of the
  single block with a `not selected` state chip. **Contributes:**
  XC-03, XC-06.
- **T7.5-AC-03** — strict-split renders two copy blocks (2.0.0
  shared/host with the mfe1 skip row; 1.0.0 isolated/mfe3 "mapped only
  for mfe3" with STRICT + `kept own copy`) under a `⚠ 2 resolved
  versions` header. **Contributes:** XC-03.
- **T7.5-AC-04** — synthetic-multi-version renders zero copy blocks,
  "no resolved copies in this capture", and an `unresolved` bucket
  with not-mapped states and offered tags. **Contributes:** XC-06.
- **T7.5-AC-05** — list rows render name + version(s) only (conflict:
  `⚠` + versions; honest-empty: muted `no copy`; no participant chips);
  the single-select participant filter narrows the list to packages the
  participant is involved in and combines with the Conflicts filter.
- **T7.5-AC-06** — templates stay VM-only with canonical-ID tracking;
  every annotation keeps a grounded tooltip; source→Remotes and
  mapped→Import-Map cross-links survive the restructuring.
  **Contributes:** XC-01.

### Key Locations

- `projects/devtools-ui/src/app/views/packages/package-detail.{ts,html,css}`
- `projects/devtools-ui/src/app/views/packages/package-negotiation.{ts,html,css}` (absorb or remove)
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts`, `packages-row-vm.ts`, `packages-chunk-vm.ts`, `packages-view-model.ts`, `packages-vm-shared.ts`
- `projects/devtools-ui/src/app/views/packages/packages.{ts,html,css}` + both spec files
- `docs/work/resolution-model/design/packages-view-redesign-mock.md` (reference, read-only)

### Key Discoveries

- All data already exists post-Task-7: copy blocks come from
  `DetailCopyVm` + consumer relations (`effectiveConsumerResolutions`),
  chunks per copy via `copy.bundleClaimIds`, states/tooltips from
  `packages-detail-vm.ts` — this task re-groups, it derives nothing new.
- Deviation-first is the governing principle: the happy path renders
  almost nothing; chips are reserved for deviations.
- The consumer → copy → chunk spine is the shared shape for Remotes
  (Task 8 pivots it on the consumer) and a later graph view — design
  the VM types so that reuse is a lift, not a rewrite.
- Deliberately deferred (do not build): consumer-row collapse for
  ~50-remote captures, participant combobox, group-by-source list
  toggle, consumer counts in list rows, multi-select filter.

## Task 7.6: Polish the Packages presentation per the screenshot review

**Dependency:** Task 7.5.

### Instructions

- Presentation-only polish of the Packages view from the 2026-08-19
  screenshot review; canonical façade consumption, VM purity, claim
  vocabulary, and grounded tooltips stay intact. Where wording or
  layout changes, add a "Task 7.6 amendment" section to the frozen
  mock `docs/work/resolution-model/design/packages-view-redesign-mock.md`
  instead of silently diverging.
- Toolbar geometry: the All/Conflicts buttons and the participant chip
  filter form one left-hand filter zone separated by a subtle 1px
  vertical divider (`--nf-color-border`); the scopes summary moves
  right (`margin-left: auto`) — it is passive info, not a filter.
  Filter behavior and the Conflicts ∧ participant combination stay
  unchanged.
- Detail meta: render `share scope: <label>` — a colon between the
  label and the mono value; tooltips unchanged.
- Copy-block header: replace the visible word `source` with `from` for
  every disposition — reads `7.8.2 shared from [host]`,
  `1.0.0 skip-registration from [mfe1]`. The word lives template-only
  (`.source-word` in package-detail.html); VM fields and the qualifier
  vocabulary in `packages-detail-vm.ts` stay unrenamed. Non-default
  qualifier chips and the ambiguous badge render unchanged.
- Copy-block nesting: consumer rows get an uppercase group label
  `DECLARED BY` styled like the existing `CHUNKS` label (10px
  uppercase, letter-spacing, muted); file lines, the DECLARED BY
  group, and the CHUNKS group sit on the same indent level as siblings
  under the copy header (today consumers/chunks indent 16px under the
  0-indent file line and read as children of the file). The unresolved
  bucket reuses `.consumer-row` (8px padding override) and must keep
  its current appearance.
- De-warn configuration facts: `.consumer-strict` and `.detail-strict`
  (package-detail.css) plus the kit `.strict-marker`
  (shared/kit/participant-row.css, rendered by Remotes today) switch
  from `--nf-color-warning-text` to muted; STRICT / `pinned scope`
  text and tooltips stay verbatim. Warning tokens remain reserved for
  actual conflicts and honest-state warnings (`.detail-conflict`,
  `.pkg-conflict`, state badges).
- Adjust the Task 7.5 pins that assert the old wording/structure (the
  visible `source` word, the consumer-row nesting) in
  `packages.spec.ts` / `packages-view-model.spec.ts`; extend pins in
  place rather than layering duplicates.

### Acceptance

- **T7.6-AC-01** — the toolbar renders All/Conflicts and the
  participant chips as one left filter zone with a visible divider
  between them and the scopes summary right-aligned; the existing
  Conflicts ∧ participant combination pins stay green unchanged.
- **T7.6-AC-02** — the detail meta renders `share scope: <label>`
  (colon present) with the existing configured/default tooltip
  unchanged.
- **T7.6-AC-03** — the frankenstein `/primitives/signals` block head
  reads `shared from` + host chip and the pooling-anchor skip block
  reads `skip-registration from` + mfe1 chip; the standalone word
  `source` no longer appears in copy-block DOM. **Contributes:** XC-06.
- **T7.6-AC-04** — every copy block with consumer rows renders a
  `DECLARED BY` group label parallel to `CHUNKS`; file lines, consumer
  group, and chunk group share one indent level; a sparse block
  (single consumer row, no chunk list) still renders the label.
- **T7.6-AC-05** — STRICT markers (Packages consumer rows, unresolved
  rows, kit participant-row) and `pinned scope` render muted, not
  warning-colored; conflict labels keep their warning tokens.

### Key Locations

- `projects/devtools-ui/src/app/views/packages/packages.{html,css}` (toolbar)
- `projects/devtools-ui/src/app/views/packages/package-detail.{html,css}` (meta colon, from-wording, nesting, strict colors)
- `projects/devtools-ui/src/app/shared/kit/participant-row.css` (`.strict-marker`)
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts`, `packages-view-model.spec.ts` (wording/structure pins)
- `docs/work/resolution-model/design/packages-view-redesign-mock.md` (amendment section)

### Key Discoveries

- Screenshot review findings (2026-08-19): the `source` label read as
  jargon; unlabeled consumer rows floated under file lines in sparse
  blocks; yellow STRICT read as a problem although it is a
  configuration fact; the scope summary blended into the filters.
- The visible `source` word exists only in the template; the qualifier
  labels in `packages-detail-vm.ts` feed chips/tooltips and keep their
  vocabulary.
- The STRICT tooltip wording is frozen kit vocabulary
  (view-conventions) — this is a color-only change.
- Chip-host typography/color alignment is NOT this task — it moves
  with the participant colors (Task 7.7) since both live in
  `participant-chip.*`.

## Task 7.7: Stable participant colors in the shared chip

**Dependency:** none.

### Instructions

- Align `.chip-host` with `.chip-remote` in
  `shared/kit/participant-chip.css`: `--nf-color-text` and the mono
  font instead of muted sans; keep the dotted underline + `title`
  (verbatim host name) tooltip affordance and the link hover behavior.
- Define a palette of ~8 colorblind-aware participant hues as theme
  tokens (`--nf-participant-color-1..N`) next to the existing
  `--nf-color-*` tokens in `projects/devtools-ui/src/styles.css`,
  with light/dark variants where the theme distinguishes them.
- Deterministic assignment per snapshot: sort the capture's remote
  names, index into the palette. One shared lookup owns the assignment
  (Store selector or a small shared helper consumed by the chip), so
  the identical name → color mapping holds across Packages, Remotes,
  Import Map, and participant-row without touching call sites.
- Honest threshold: assign colors ONLY when the remote count ≤ palette
  size; above it, every chip renders neutral. No recycling and no
  hashing — two remotes sharing a hue would visually claim a
  relationship that does not exist. 25–50-remote configurations are
  real; the neutral fallback is designed behavior, not an edge case.
- Render the color as a small dot inside the chip before the name.
  Not a full background (10px legibility, competes with warning
  colors) and not the chip border (collides with the hover accent
  border affordance). The host chip never carries a dot.
- The chip stays presentational: it receives or injects the lookup but
  performs no derivation of its own.

### Acceptance

- **T7.7-AC-01** — the host chip renders with the standard text color
  and mono font, keeping the dotted underline and host-name tooltip;
  inside links the hover accent still applies.
- **T7.7-AC-02** — with remote count ≤ palette size, every remote chip
  shows a color dot and the same remote name yields the identical
  color in Packages detail, Remotes, and Import Map (one deterministic
  sorted-name lookup).
- **T7.7-AC-03** — with remote count > palette size, no chip renders a
  color dot; there is no recycling code path.
- **T7.7-AC-04** — the host chip never renders a color dot regardless
  of remote count.

### Key Locations

- `projects/devtools-ui/src/app/shared/kit/participant-chip.{ts,html,css}` + spec
- `projects/devtools-ui/src/styles.css` (theme tokens)
- assignment lookup: new `shared/kit/participant-colors.ts` or a Store selector near `shared/store/`
- consuming templates (verification only): `views/packages/package-detail.html`, `views/remotes/remotes.html`, `views/import-map/import-map.html`, `shared/kit/participant-row.html`

### Key Discoveries

- The chip's hover affordance recolors the border
  (`:host-context(a:hover) .chip`) — the identity color must not use
  the border channel.
- Threshold = palette length is the honesty invariant: fewer hues than
  remotes makes unique identity coding impossible; recycled colors lie.
- Stable per-remote identity across views feeds the later graph view
  (all views pivot on consumer → copy → chunk) — design the lookup so
  a graph view can consume it unchanged.
- Task 7.5 deliberately deferred large-capture affordances
  (consumer-row collapse, participant combobox); this task's neutral
  fallback is the color-system counterpart of that decision.

## Task 7.8: Witness dense multi-entry copies with a fixture

**Dependency:** Task 7.6.

### Instructions

- Add a `synthetic-dense-entries` bridge fixture that models the only
  real path to a multi-entry registration. Source-verified context
  (orchestrator + core repos, 2026-08-20; persisted in auto-memory
  `orchestrator-registry-semantics`): the dense format is DOUBLE opt-in
  — build-side `features.denseExternals` (wire format since core
  v4.3.0) or host-side `feature.convertFlatSharedInfo` (densifies even
  ≤4.4 flat remoteEntries at fetch); both flags default to false in
  v4.5.0/v4.6.0. Default builds emit one single-entry registration per
  full specifier, which is why every existing fixture renders one file
  line per copy and secondaries live as separate registry keys.
- Happy case: one v4.5-generation registration whose `entries` map
  carries the parent package AND a secondary entrypoint (identical
  metadata signature: version, requiredVersion, strictVersion,
  singleton, shareScope), both specifiers mapped in the import map.
  The canonical pipeline must materialize ONE resolved copy carrying
  both entrypoints.
- Split case: a package where the secondary's metadata deviates (e.g.
  different version) — densification then splits into a separate
  registration under the SAME registry key; the pipeline must yield
  separate copies/blocks, never a merged lie.
- Register the fixture in the FIXTURES index; the snapshot-v1
  round-trip spec and the fixture picker follow the index dynamically
  (verified — no count pins to adjust). Document the double-opt-in
  provenance in the fixture header comment so the case never reads as
  synthetic fantasy.
- DOM-pin the plural FILES rendering in `packages.spec.ts`: one block,
  one FILES label, two file lines, the secondary line showing its
  specifier. VM-level plural support is already pinned (CROSS_SOURCE
  seed in `packages-view-model.spec.ts`) — extend pins in place, do
  not duplicate.
- OUT of scope: a real capture. It requires a lab/test app built with
  `features.denseExternals: true` — a default-config ≥4.5 capture can
  never witness the case; maintainer work for a later capture task.

### Acceptance

- **T7.8-AC-01** — the fixture round-trips through the snapshot-v1
  contract like every other fixture and is selectable in the picker
  without picker-spec changes.
- **T7.8-AC-02** — store-level pin: the happy case materializes
  exactly one resolved copy whose entrypoints record both specifiers.
- **T7.8-AC-03** — Packages DOM pin: the copy block renders one FILES
  label with two file lines; the secondary line shows its specifier.
  **Contributes:** XC-06.
- **T7.8-AC-04** — split-case pin: deviating metadata yields two
  registrations under one registry key and two separate blocks.

### Key Locations

- `projects/devtools-bridge/src/lib/fixtures/` (new fixture + `index.ts`)
- `projects/devtools-bridge/src/lib/snapshot-v1.spec.ts` (round-trip; iterates FIXTURES dynamically)
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts` (copy-level pin)
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (FILES plural DOM pin)

### Key Discoveries

- Dense grouping happens via `inferPackageFromSecondary` plus an
  identical metadata signature; the default flat path documents
  first-writer-wins when a secondary is emitted as its own package
  (generate-import-map.ts) — the fixture must model the opt-in output,
  not the default.
- All existing bridge fixtures carry single-entry `entries` maps; the
  plural FILES rendering is currently guarded only by synthetic VM
  seeds, never end-to-end.
- The Packages FILES group (Task 7.6 amendment) renders one line per
  entrypoint with the specifier shown when it differs from the package
  name — the DOM pin rides on that behavior.

## Task 8: Migrate Remotes to canonical resolutions

**Dependency:** Task 6.

### Instructions

- Preserve the existing Remotes list/detail layout and cross-link behavior.
- Project each remote as a consumer with its own declarations/private registrations, candidate, effective binding, claim mapping state, qualified source, copy relation, and canonical bundle/chunk claims.
- If a summary counts declarations, call them declarations; never relabel the count as versions, copies, or providers.
- Remove duplicated election/share-count logic and every `action !== 'skip'` source heuristic. A fallback points to the selected copy without turning its source into a universal provider.
- Send private registrations through the same candidate → claim → effective resolution → copy pipeline and retain `PrivateRegistrationId`; do not invent a shared action or scope.
- Replace delivery wording such as “entry never loaded” or “loaded on demand” with capture/registry/mapping language.
- Keep builders small and pure, templates view-model-only, and remove Remotes-owned legacy helpers as they become unused.

### Acceptance

- **T8-AC-01** — In `co-declared-share`, both remotes retain one declaration and resolve to the same effective target/copy while showing their different claim states. **Contributes:** XC-03, XC-06.
- **T8-AC-02** — In `clean-skip`, the skip consumer shows an evidenced fallback without calling the selected source a universal provider. **Contributes:** XC-01, XC-06.
- **T8-AC-03** — `scoped` renders two complete private registration → claim → resolution → copy paths with no fabricated share action/domain. **Contributes:** XC-03.
- **T8-AC-04** — Unknown, ambiguous, anchor, and not-selected evidence remains visible, and only canonical bundle claims drive chunk presentation. **Contributes:** XC-02, XC-06.
- **T8-AC-05** — VM and focused DOM tests for `co-declared-share` and `scoped` pass without local resolution/election/provider logic. **Contributes:** XC-01.

### Key Locations

- `projects/devtools-ui/src/app/views/remotes/remotes-view-model.ts`
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts`
- `projects/devtools-ui/src/app/views/remotes/remotes.ts`
- `projects/devtools-ui/src/app/views/remotes/remote-detail.ts`
- Remotes templates/styles and both focused specs

### Key Discoveries

- The current Remotes projection reconstructs share counts and provider-like outcomes independently of Packages.
- A remote is a consumer context; its declaration action is registry evidence, not its per-specifier mapping result.

## Task 9: Migrate Import Map to canonical annotations

**Dependency:** Task 6.

### Instructions

- Keep the merged effective import map as the raw pivot, preserving map order, recorded targets, scopes, integrity metadata, selection behavior, and existing `/./` tolerance.
- Render each `(scope, specifier)` map entry exactly once, annotating it with every applicable canonical effective-resolution ID, claim, exact candidate match, observed target source, copy ID, bundle claim, and provenance reference.
- Several consumers or claims may annotate one map row, but they must not duplicate the row or the atomic binding.
- Replace scope-owner, package-selection, first-row winner, provider, and chunk-map reconstruction with canonical source/copy/bundle records. Do not implement lookup or action semantics in the view.
- Qualify source language as exact candidate, scope-derived observed owner, host fallback, ambiguous, unattributable, or unknown; never shorten it to an unqualified “served by” or delivery claim.
- Keep the view-model builder pure and the template view-model-only. Remove Import-Map-owned legacy joins/helpers when unused.

### Acceptance

- **T9-AC-01** — `co-declared-share` shows one global package map row with its recorded target, two consumer claims/resolutions, one copy, and exactly one selected exact source. **Contributes:** XC-03, XC-06.
- **T9-AC-02** — Every effective `(scope, specifier)` entry in every fixture appears once and only once with its recorded target; multiple claims annotate rather than duplicate it. **Contributes:** XC-03.
- **T9-AC-03** — Alias consumers, private paths, exact/ambiguous source matches, scope ownership, host fallback, CDN/unattributable targets, unknown, unmapped, and blocked claims remain distinguishable; a blocked claim annotates its matching map row. **Contributes:** XC-02, XC-06.
- **T9-AC-04** — Exact candidate attribution outranks scope attribution, and prefix/nested-scope outcomes come from the canonical resolver rather than view-local lookup. **Contributes:** XC-01.
- **T9-AC-05** — VM and DOM tests prove canonical annotations while preserving order, integrity display, selection, and current layout. **Contributes:** XC-01.

### Key Locations

- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts`
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts`
- `projects/devtools-ui/src/app/views/import-map/import-map.ts`
- `projects/devtools-ui/src/app/views/import-map/import-map.html`
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts`
- `projects/devtools-ui/src/app/shared/chunk-map-join.ts`

### Key Discoveries

- The current Import Map view rebuilds package and chunk associations independently.
- Import Map remains the recorded mapping pivot; canonical annotations explain it without mutating or replacing the raw evidence.

## Task 10: Build canonical Diagnostics

**Dependency:** Task 6.

### Instructions

- Replace the Diagnostics placeholder with a minimal view that only formats canonical resolution status, `SourceComparison`, attribution ambiguity, and existing canonical diagnostics.
- Present registry slot vs observed source, anchor vs observed source, and candidate vs target as separate `match | mismatch | unknown` comparisons. Do not collapse disagreement or infer an “actual provider”.
- Surface mapped, unmapped, blocked, unknown, ambiguous, and partial-evidence states. Missing registry or map layers must not suppress inspectable evidence.
- Link facts to Packages, Remotes, and Import Map through the same canonical IDs and established routing/cross-link conventions.
- Keep classification and severity in canonical data; the view may format but must not reconstruct federation rules. Do not port the deferred V2 lint catalogue or introduce a rule engine.
- Use small pure VM builders and honest-state components. Keep resolution-honest vocabulary and add only the layout needed to make the canonical comparisons inspectable.

### Acceptance

- **T10-AC-01** — `co-declared-share` renders the exact selected source and the non-selected claim without false provider, version, conflict, or delivery warnings. **Contributes:** XC-03, XC-06.
- **T10-AC-02** — Seeded exact ambiguity, scope ambiguity, source mismatch, missing consumer scope, unmapped resolution, blocked binding, host fallback, and unattributable target remain distinct. **Contributes:** XC-02.
- **T10-AC-03** — Missing registry or import-map evidence renders a partial/unknown state rather than hiding the record or throwing. **Contributes:** XC-02, XC-06.
- **T10-AC-04** — Diagnostics cross-links use the same IDs exposed by the other views, and no view-local domain rule changes a comparison or severity. **Contributes:** XC-01, XC-03.
- **T10-AC-05** — Route/app tests render the real Diagnostics component instead of `ViewPlaceholder`, with focused VM and DOM coverage. **Contributes:** XC-01.

### Key Locations

- New `projects/devtools-ui/src/app/views/diagnostics/`
- `projects/devtools-ui/src/app/app.routes.ts`
- `projects/devtools-ui/src/app/app.spec.ts`
- `projects/devtools-ui/src/app/shared/honest-state/`
- Existing cross-link/routing helpers used by Packages, Remotes, and Import Map

### Key Discoveries

- Diagnostics is currently only a placeholder.
- A secondary-entry registry-slot mismatch can be expected when a later declaration supplies the selected specifier; diagnostics must remain entrypoint-aware.

## Task 11: Enforce the single-truth cutover

**Dependency:** Task 10.

### Instructions

- Remove the remaining temporary `SharedParticipantRow`/`sharedRows` compatibility projection and obsolete winner, arrow, provider, conflict, count, and participant-based chunk derivations after all four views use the canonical Store façade. This final deletion should be mechanical because each view task removes its own legacy dependencies.
- Add a compact hand-authored witness oracle whose expected values are independent of production resolver/builders and cite the validated evidence:
  - `co-declared-share`: 1 registration, 2 declarations, 2 consumer-scope resolutions, 1 target, 1 copy, 1 exact selected source;
  - `clean-skip`: 2 registrations, 2 declared tags, 1 copy;
  - `strict-split`: 3 registrations, 2 declared tags, 2 copies;
  - `strict-scope`: named scope independent, empty `__GLOBAL__` creates no package;
  - `scoped`: 2 private registration → resolution → copy paths;
  - `frankenstein-live`: 3 remotes, 22 global and 7 scoped import-map entries.
- Run a parameterized semantic contract over every corpus-derived fixture (currently 12): every displayed ID exists canonically; views agree on IDs/counts/targets/relations; declarations do not inflate registrations/resolutions/copies; each map row appears once; each scope-context/specifier has at most one binding; unselected candidates never become selected copies.
- Add focused DOM coverage proving the semantic fields render for `co-declared-share`, private `scoped`, and the dense live fixture. Expected values must not be generated from canonical production code or full VM snapshots.
- Add an architecture guard with a seeded failing case. View models may consume only canonical types/the Store façade and must not import `SnapshotV1`, raw repositories, ingest, resolution algorithms, `SharedParticipantRow`, or `sharedRows`. Guard the affected resolution UI against forbidden delivery/cost vocabulary.
- Keep the existing capture validator and fixture-drift chain green. Run the full UI, bridge, collector, guard, extension-build, and panel-bundle checks.
- Do not add a production oracle API, second resolver, new browser-test framework, or pixel/snapshot-golden system.

### Acceptance

- **T11-AC-01** — Repository and architecture-guard searches find no `SharedParticipantRow`, `sharedRows`, or old participant-based resolution semantics in production consumers; a seeded forbidden import makes the guard fail. **Contributes:** XC-01.
- **T11-AC-02** — The independent six-witness matrix matches the exact stated cardinalities and a deliberate participant-flattening mutation breaks `co-declared-share`. **Contributes:** XC-03.
- **T11-AC-03** — All 12 corpus-derived fixtures satisfy the cross-view ID/count/target/relation contract, one-binding invariant, exact map-row count, and unselected-candidate rule. **Contributes:** XC-02, XC-03.
- **T11-AC-04** — Focused DOM tests expose the contracted fields for `co-declared-share`, `scoped`, and `frankenstein-live`. **Contributes:** XC-03.
- **T11-AC-05** — Forbidden delivery/cost terms are absent from the affected resolution UI and a seeded wording violation makes the guard fail. **Contributes:** XC-06.
- **T11-AC-06** — Corpus validation, fixture drift, full `npm test`, `npm run build:extension`, and `npm run check:panel-bundle` pass; the raw-free projection boundary remains intact. **Contributes:** XC-04, XC-05.

### Key Locations

- `projects/devtools-ui/src/app/shared/store/federation-model.ts`
- `projects/devtools-ui/src/app/shared/store/derivations.ts`
- `projects/devtools-ui/src/app/shared/testing/` or a focused new fixture-contract location
- Existing Packages, Remotes, Import Map, and Diagnostics VM/DOM specs
- `guards/` and `vitest.guards.config.mts`
- `scripts/validate-lab-corpus.mjs`
- `scripts/derive-fixtures.mjs`
- `scripts/build-extension.mjs`
- `scripts/check-panel-bundle.mjs`

### Key Discoveries

- Capture validation and fixture drift already prove raw reproduction, but not Store interpretation or rendered view consistency.
- `co-declared-share` currently has no coverage in the six Packages/Remotes/Import-Map VM and DOM specs, which allowed the flattening bug to remain green.
- This task is the spec-required test-focused exception: the durable outcome is an independent semantic oracle plus an enforceable architecture boundary, not generic after-the-fact stabilization.

## Task 12: Record fixture UX acceptance

**Dependency:** Task 11.

### Instructions

- Use the existing `?fixture=` picker; do not build a new fixture browser or screenshot framework.
- Create `docs/work/resolution-model/fixture-walkthrough.md` as the durable review record. For each of the six evidence witnesses, record the exact fixture URL, screenshot reference supplied by the maintainer, reviewed views, expected terms/counts/cross-links, verdict, and any focused follow-up.
- Review only the relevant Packages, Remotes, Import Map, and Diagnostics states for each witness. Check terminology, selected/not-selected distinction, shared canonical IDs/cross-links, hierarchy, clipping, and visible unknown/ambiguous states.
- Treat screenshots as UX evidence, not the semantic oracle. Do not commit screenshots as pixel goldens unless separately requested.
- Keep this task review-only. Small copy/layout defects may be fixed with focused assertions in the same task; larger semantic or redesign findings become new planned follow-ups rather than expanding this acceptance task.

### Acceptance

- **T12-AC-01** — The walkthrough records a review status and reproducible fixture URL for `co-declared-share`, `clean-skip`, `strict-split`, `strict-scope`, `scoped`, and `frankenstein-live`. **Contributes:** XC-06.
- **T12-AC-02** — Each reviewed case records counts/terms, selected/not-selected treatment, canonical cross-links, visual hierarchy/clipping, unknown/ambiguous rendering, screenshot reference, and verdict.
- **T12-AC-03** — No unresolved semantic or visual contradiction remains across the four views; larger discoveries are represented by explicit follow-up tasks rather than hidden in the walkthrough.
- **T12-AC-04** — No Playwright, Cypress, Storybook, pixel-golden, or production semantic-oracle infrastructure is added. **Contributes:** XC-06.

### Key Locations

- `docs/work/resolution-model/fixture-walkthrough.md`
- `projects/devtools-ui/src/app/shell/fixture-picker.ts`
- `projects/devtools-ui/src/app/shell/fixture-picker.html`
- Focused view templates/styles/specs only if a small walkthrough finding requires a fix

### Key Discoveries

- The existing picker already lists captured and synthetic fixtures while preserving theme and route state.
- Maintainer-pasted screenshots are sufficient for this deliberate manual review; semantic correctness belongs to the independent automated fixture contract.

## Cross-Cutting Acceptance

- **XC-01** — Raw normalization, effective lookup, claim/source explanation, copy identity, and chunk attribution each have one canonical owner; views only project Store data and no production consumer uses `sharedRows` after cutover. **Touches:** T1, T2.2, T3, T4, T5, T6, T7, T7.5, T8, T9, T10, T11.
- **XC-02** — Every derived candidate, claim, resolution, source attribution, comparison, copy, relation, and chunk claim has deterministic collision-safe identity plus complete evidence/rule provenance; unknown and ambiguous evidence remains representable. **Touches:** T1, T2, T2.1, T2.2, T3, T4, T5, T6, T8, T9, T10, T11.
- **XC-03** — Packages, Remotes, Import Map, and Diagnostics share canonical IDs and cardinalities: declarations never become registrations/copies, claims never duplicate bindings, and the four package counts keep their distinct meanings. **Touches:** T1, T2.2, T3, T4, T5, T6, T7, T7.5, T8, T9, T10, T11.
- **XC-04** — Old/new snapshot compatibility, hostile-page safety, privacy/passivity, all 12 lab captures plus two live phases, and byte-stable fixture derivation survive the migration. **Touches:** T2, T2.1, T2.2, T3, T11.
- **XC-05** — The resolution phase exports one raw-free canonical projection with consumer-copy relations, selected artifact claims, and filterable completeness; it implements no graph UI and permits no downstream raw-data resolver. **Touches:** T6, T11.
- **XC-06** — All product text distinguishes declaration/mapping/selection from request, download, execution, cache hit, or wire cost, and the final manual fixture walkthrough confirms the distinction is understandable and visible. **Touches:** T2.2, T3, T4, T6, T7, T7.5, T7.6, T8, T9, T10, T11, T12.
