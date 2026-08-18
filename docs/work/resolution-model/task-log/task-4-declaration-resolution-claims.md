### Task

Build the pure claim-explanation layer — registry serving slots, declaration resolution claims, observed target attribution, source matches, and the three closed source comparisons — over canonical registry evidence and the Task-3 effective consumer resolutions, without rerunning import-map lookup and without publishing anything into the store model.

### Status

DONE

All six Task 4 acceptance criteria are covered by green focused and repository-wide tests. An external (Codex) review was triaged in-session: its one substantiated code finding (anchored declarations leaking into the ordinary explanation surfaces) is fixed and pinned; its registration-boundary thesis was rejected against the spec wording with adversarial tests added instead.

### Files Modified

- `projects/devtools-ui/src/app/shared/store/resolution/claims-model.ts` (new) — types and branded IDs for `RegistryServingSlotClaim`, `DeclarationResolutionClaim`, `SourceMatch`, `ObservedTargetProvider`, `SourceComparison` (three closed kinds, canonical left/right orientation), `ResolutionSubject`/`ResolutionDomain`, the seven-state `ClaimMappingState`, and the `ResolutionClaimsDerivation` aggregate.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-registry-serving-slots.ts` (new) — basis slot from stored order only: first declaration of a non-empty non-`scope` registration, `not-applicable` for `scope`, `empty` otherwise; never recomputed from `cached`.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-registry-serving-slots.spec.ts` (new) — corpus slots (pooling-anchor, strict-split `scope` row) plus seeded cached-later, empty, and unknown-action cases.
- `projects/devtools-ui/src/app/shared/store/resolution/attribute-observed-target-providers.ts` (new) — six-outcome attribution ladder over the complete candidate index; exact URL equality outranks scope-prefix ownership, host never outranks a matching remote, ambiguity retains all candidates and chooses none.
- `projects/devtools-ui/src/app/shared/store/resolution/attribute-observed-target-providers.spec.ts` (new) — one seeded snapshot exercising all six ladder outcomes plus the unknown outcome for non-mapped bindings (T4-AC-04).
- `projects/devtools-ui/src/app/shared/store/resolution/compare-sources.ts` (new) — comparison construction with a valid-pairing guard (invalid discriminant pairs throw), declaration- vs remote-level agreement status, and exact candidate/target status.
- `projects/devtools-ui/src/app/shared/store/resolution/compare-sources.spec.ts` (new) — deterministic IDs, orientation rejection, and the full agreement-status matrix (T4-AC-05).
- `projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.ts` (new) — the orchestrating entry point `deriveResolutionClaims`: claims per shared/private candidate, share-scope-wide anchor search (self-anchor valid), same-external non-anchored skip/share explanation surfaces, normative mapping-state precedence, independent `ownCandidateSelected`, and up to three comparisons per claim.
- `projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.spec.ts` (new) — corpus-backed states (pooling-anchor, co-declared-share, clean-skip, strict-split, strict-scope, scoped, dynamic-override) plus `source-confirmed-unobserved` seeds for self-fill, blocked, unknown, multi-entrypoint, named-scope skip, equal-tag non-union, cross-external anchor, alias convergence, dynamic override without registry explanation, surface boundaries, and traceability.
- `projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts` (modified) — expands the resolution domain to the closed claims set: each shared declaration's registry package plus every candidate specifier, and every private registration's candidate specifiers.
- `projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.spec.ts` (modified) — pins the expanded domain (secondary entrypoint and private-registration bindings per consumer context).
- `README.md` (modified) — adds the third model view “3. Declaration resolution claims” (Mermaid class diagram, mapping-state precedence list, qualification invariants), extends the layer table, and corrects the resolver-domain sentence to per-specifier grouping.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — Task 4 scope, acceptance criteria, and action-surface instructions.
- `docs/specs/native-federation-resolution-model.md` — §5–§6 claim/mapping-state/attribution/comparison semantics, §8 pooling/dynamic limits, §4.1 identity rules; authoritative for state precedence and surface scoping.
- `docs/work/resolution-model/task-log/task-3-effective-consumer-bindings.md` — resolution contract, blocked-terminal handoff constraints, eager/lazy design rule that justified the domain expansion.
- `docs/work/resolution-model/task-log/task-1-normalize-canonical-registry-evidence.md` and `task-2.2-normalize-pooling-anchors.md` — canonical record/ordinal semantics and the witnessed `pool`/`servedBy` matrix.
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts`, `ids.ts`, `model.ts`, `shared-rows-compat.ts` — canonical records, structural IDs, and the compat duplicate-coverage contract mirrored by the claims join.
- `projects/devtools-ui/src/app/shared/store/derivations.ts` and `derived-model.ts` — legacy provider/arrow rules used as semantic template only; intentionally unmodified (deleted after Tasks 7–9/11).
- `projects/devtools-ui/src/app/shared/store/ingest.ts` — resolver call site and remote scope-URL construction.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` and `fixtures/` (pooling-anchor, co-declared-share, self-fill, clean-skip, dynamic-override, strict-split, strict-scope, scoped, index) — raw contract and the real witnesses behind each corpus test.

### Key Decisions

- Claims are derived per entrypoint candidate (shared and private). A candidate-less declaration yields no claim while its package binding and slot claim survive for the legacy rows; binding-without-claim is spec design and now pinned by test.
- The resolver’s group enumeration was expanded instead of adding a second lookup: Task 3’s eager-materialization rule holds exactly while the resolution domain equals the closed claims set, and Task 4 formally defined that set. `projectSharedRows` and all prior resolver tests were unaffected.
- Mapping states are computed observationally — URL evidence against action-scoped candidate surfaces — in the spec’s normative order: anchored, self-filled, own-selected, fallback, not-selected, blocked, unknown. A blocked binding stays terminal (no selection, no source, never self-filled); an unmapped or unevaluable binding yields `unknown` because the closed vocabulary has no weaker explanation.
- Self-fill and fallback surfaces are keyed at `SharedExternalRecord` level, not per registration: spec §5.2 literally scopes the skip source to “the same SharedExternalRecord”, and fallback requires the cross-registration share-row-explains-skip-row relation. Equal-tag non-union still holds because share claims never form a union at all (`own-selected` demands exact own-URL equality; anything else is `not-selected`). The external Codex review requested registration-level keys; this was rejected against the spec wording and pinned with adversarial tests instead.
- Anchored declarations (`servedBy` set) are excluded from the ordinary share/skip explanation surfaces and serve only through the anchor surface (spec §6.1/§6.2). This was the review’s substantiated finding: previously an anchored share declaration could pass as a `fallback` source; now the exact source stays observed evidence and the claim reads `not-selected` with mismatch data.
- Uniqueness replaces source-order in self-fill/fallback explanations: a source must be the unique matching subject; ambiguity falls through to `own-selected`/`not-selected` and stays visible as `ambiguous-candidate`. Nothing is ever guessed, matching the spec’s “uniquely matched/uniquely evidenced” wording.
- Anchor search is keyed by `(shareScope, anchorRemote, specifier)` across external records, so an anchor may supply the specifier as an entry of another external; consumer package (`consumerRegistryPackage`) and source stay separate fields. `servedBy === consumerRemote` remains `anchored` (precedence over `own-selected`), with `ownCandidateSelected` carrying the equality fact independently.
- Provenance design: `EvidenceRef`s remain snapshot-path pointers. Map-side traceability runs through IDs — the candidate-vs-target right side carries `resolutionId`, and the Task-3 resolution retains the deciding `mapEntry`/`blockedReason` — instead of duplicating map evidence into claims. The review asked for copied evidence; rejected as a maintenance-prone duplicate, and the ID chain is now pinned for all four binding states.
- `observedAgreementStatus` compares at declaration level for slot-vs-exact matches and at remote level for anchors and scope/host attributions; ambiguous, unattributable, and unknown attributions stay `unknown`. Comparisons are only emitted where a left-side claim exists (no slot comparison for `not-applicable`/`empty` slots or private claims), so `comparisonIds` cardinality varies 1–3 by design.
- An unknown raw action keeps its stored-order basis slot (literal plan rule; the unknown-action diagnostic already flags the row) but is excluded from skip-specific explanations; exact own-URL equality may still explain it.
- `copyId` is intentionally absent from `DeclarationResolutionClaim` until Task 5 materializes resolved dependency copies; adding an always-null field now would misstate the model.
- Nothing is wired into `FederationModel`/`ingestSnapshot` beyond the resolver-domain expansion; publication through the canonical projection is Task 6, as agreed with the user at task start.
- README documentation was added in-task at the user’s request: the claims layer became view 3 of the maintained model section, and the now-stale resolver-grouping sentence was corrected. Pre-existing README Prettier deviations remain untouched (Task-3 policy).

### Review Focus

- **Behavior claims:** Every shared/private candidate yields exactly one claim whose mapping state follows the normative precedence against the already computed binding; anchored declarations explain only through the anchor surface, and an exact source outside the eligible set stays observed evidence with mismatch data instead of becoming the registry story; attribution walks the six-outcome ladder with exact equality above scope ownership and no delivery implication.
- **Assumptions / choices:** Skip explanation surfaces are external-level (spec §5.2 wording), uniqueness replaces source-order, unmapped bindings collapse to claim-state `unknown`, and map-side provenance is an ID chain to the resolution’s retained `mapEntry` rather than copied evidence.
- **Scope notes:** `resolve-effective-consumer-bindings.ts` gained the wider claim-set domain (planned evolution, not drift). README gained view 3 plus the corrected domain sentence. The pre-existing user-owned `.gitignore` hunk (`/node_modules` → `node_modules/`) is again NOT part of this task and must not be staged with Task 4.
- **Read next:** `sharedMappingState` and `indexCandidateSurfaces` in `derive-declaration-claims.ts` — verify precedence order and the anchored/external-level surface boundaries; `attributeResolution` in `attribute-observed-target-providers.ts` — verify ladder order and ambiguity handling; the “surface boundaries and traceability” describe block in `derive-declaration-claims.spec.ts` — verify the review-hardening pins match the spec sentences they cite.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/store/resolution/*.spec.ts' --watch=false` — passed on the final code state: 6 files / 51 tests (four new spec files plus extended resolver spec).
- `npm test` — passed on the final code state: 29 UI files / 292 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests (490 total). Only the existing odd-numbered Node 25 non-LTS warning was emitted.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` on all `resolution/*.ts` — passed. README: the new model section matches Prettier output; pre-existing deviations (intro italics, repository-layout table) intentionally untouched.
- `git diff --check` — passed.
- External Codex review triaged: HIGH partially accepted (anchored-surface exclusion implemented + 3 adversarial tests), MEDIUM answered with traceability tests instead of duplicated evidence, LOW (`.gitignore`) already covered by the standing staging rule; its “full repository test run not executed” blind spot was factually outdated — `npm test` ran green before and after the fixes.
- The rendered README Mermaid diagram was visually confirmed by the user.

### Acceptance Coverage

- **T4-AC-01 — passed:** `deriveResolutionClaims — corpus-backed mapping states` pins anchored incl. valid self-anchor with independent `ownCandidateSelected` (pooling-anchor) and shared fallback (clean-skip); the seeded block pins own skip self-fill and later-consumer self-fill, terminal blocked (never self-filled, no attribution), and unknown evidence. Contributes to XC-01, XC-02.
- **T4-AC-02 — passed:** seeded multi-entrypoint share (later declaration supplies `pkg/sub`; slot mismatch stays data), per-declaration `scope` (strict-split), named-scope skip (override-union fallback, own uncovered self-filled), global-skip self-fill only for genuinely unmapped, dynamic committed surface (dynamic-override fixture + no-invented-anchor seed), and equal tags in separate registrations never unioning. Contributes to XC-01, XC-03.
- **T4-AC-03 — passed:** alias-convergence seed proves one binding referenced by two claims without duplication; clean-skip/strict-split/strict-scope/scoped tests prove retained raw action (`share`/`skip`/`scope`/`private`) and domain (`share-scope` incl. `strict`, `private-owner`). Contributes to XC-03.
- **T4-AC-04 — passed:** `attributeObservedTargetProviders — attribution ladder` yields all six outcomes distinctly and deterministically from one seed, with exact-over-scope pinned and the unknown outcome for non-mapped bindings. Contributes to XC-02.
- **T4-AC-05 — passed:** `compare-sources.spec.ts` pins the three valid pairings, deterministic claim-and-kind IDs, rejection of every other discriminant pair, and the agreement matrix; slot-spec and claims-spec assert separate qualified claims with varying comparison cardinality; the traceability test chains candidate-vs-target → resolution → `mapEntry`/`blockedReason` across all four statuses. Contributes to XC-02, XC-06.
- **T4-AC-06 — passed:** `deriveResolutionClaims — co-declared share` proves two claims against one target URL: the mfe1 candidate selected exactly (`own-selected`, `ownCandidateSelected` true) and the mfe2 candidate visible as `not-selected` with a mismatch comparison. Contributes to XC-03, XC-06.

### Open Issues

- No blocking product or acceptance issues.
- The claims layer is intentionally unpublished: no `FederationModel` field, no ingest wiring, no view consumes it. Publication through the canonical projection is Task 6; materialized copies (`copyId`) are Task 5.
- Claim-state vocabulary has no dedicated state for an unmapped binding; such claims read `unknown` while the referenced resolution retains `unmapped`. Accepted closed-vocabulary consequence, documented here for Task 10 diagnostics design.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 4 staging.

### Context for Next Task

- `deriveResolutionClaims(evidence, resolutions, { remoteScopeUrlByName, hostRemote })` in `resolution/derive-declaration-claims.ts` is the sole entry point; it returns `{ registryServingSlotClaims, declarationResolutionClaims, observedTargetProviders, sourceMatches, sourceComparisons }` and throws on missing/duplicate consumer+specifier resolution coverage.
- The resolver now materializes one binding per consumer scope context and specifier over the full claims set; ingest already produces this wider collection, so Task 5/6 can join claims without touching lookup logic.
- `DeclarationResolutionClaim` carries `subject`, `consumerRemote`, `resolutionDomain`, `consumerRegistryPackage`, `specifier`, `candidateId`, `effectiveResolutionId`, `ownCandidateUrl`, `ownCandidateSelected`, `mappingState`, `sourceAction`, `comparisonIds` — and deliberately no `copyId` yet; Task 5 adds copy identity per spec §7 and should group mapped claims by evidenced emitted copy, reusing `SourceMatch` (unique exact subject) rather than re-deriving attribution.
- A `blocked` claim has no selection, source, or copy attribution — Task 5 must not manufacture a copy for it; `unknown`/`unmapped` claims likewise attribute nothing.
- All IDs are deterministic structural tuples via `registryEvidenceId` (slot: registrationId; claim: subject kind + subject ID + candidate ID; provider: resolutionId + outcome; comparison: claimId + kind); byte-equal snapshots reproduce byte-equal derivations.
- Explanation surfaces exclude anchored declarations; the anchor surface is `(shareScope, anchorRemote, specifier)` across externals. Reuse these indexes rather than rebuilding ad-hoc ones.
- Spec-anchored subtleties to respect downstream: skip explanation surfaces are external-level, ambiguity never resolves by guessing, and map-side provenance flows through `effectiveResolutionId` to the resolution’s `mapEntry`/`blockedReason`.
- `/commit 4` must stage the twelve Task-4 files (ten new `resolution/` modules/specs, the modified resolver + resolver spec, README) and must NOT stage the pre-existing `.gitignore` hunk without separate user confirmation.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 README.md                                          | 121 +++++++++++++++++++--
 .../resolve-effective-consumer-bindings.spec.ts    |  84 ++++++++++++++
 .../resolve-effective-consumer-bindings.ts         |  52 ++++++---
 4 files changed, 235 insertions(+), 24 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M README.md
 M projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts
?? projects/devtools-ui/src/app/shared/store/resolution/attribute-observed-target-providers.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/attribute-observed-target-providers.ts
?? projects/devtools-ui/src/app/shared/store/resolution/claims-model.ts
?? projects/devtools-ui/src/app/shared/store/resolution/compare-sources.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/compare-sources.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-registry-serving-slots.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/derive-registry-serving-slots.ts
```
