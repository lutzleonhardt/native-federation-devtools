# Native Federation DevTools

A read-only Chrome DevTools extension for inspecting [Native Federation](https://native-federation.com)
applications: remotes and exposes, shared-dependency resolution, and the
effective import map — with honest evidence states instead of guesses.

> Community project. Not officially affiliated with Native Federation.

**Status:** pre-release, under active development. The Packages and Remotes
tabs are implemented; Import Map and Diagnostics currently render placeholders.

## Why

In a micro-frontend setup with mixed framework versions, the interesting
questions are hard to answer from the outside: *Which version of
`@angular/core` won? Who provided it? Why did this remote end up with its own
copy?* The negotiation happens once at startup and then disappears into the
import map. This extension reads the result back out and explains it.

## What it shows

**Packages** — per-package negotiation detail: every candidate version with
its outcome (shared, scoped, or skipped), the requesting participant and its
range, strict requirements, and which participant provides the mapped entry.
Conflicts are listed separately. Includes SRI coverage and chunk mapping where
the capture provides it.

**Remotes** — the same data from each participant's point of view: exposes
with their mapped targets, the remote's own dependency declarations and where
each one resolves, capability evidence (SRI, dense chunking), chunk
attribution, and scoped externals.

Any snapshot can be exported as JSON, which doubles as a reproducible bug
report.

In progress: **Import Map** (the effective map with attribution per row),
**Diagnostics** (registry↔map lint), and global search. The data layer behind
them is in place — the views are not.

## Design constraints

**Read-only by construction.** The extension inspects without invoking getters
or triggering side effects — it never mutates the application it is pointed
at. This is enforced by tests in `guards/`, not by convention.

**Explicit about what it cannot know.** Where the runtime data proves
resolution but not intent, the UI says so instead of inferring. Derived values
are labelled (`source-derived`); missing chunk evidence is stated rather than
silently omitted.

**No permissions.** The manifest requests none — no host permissions, no
content scripts. The panel talks to the inspected page through the DevTools
API only.

## Resolution data model

One captured `SnapshotV1` becomes one `FederationModel`. The Store keeps the
captured registry declarations, remote scope URLs, and import-map evidence
separate until `resolveEffectiveConsumerBindings` joins them. The diagrams show
the resolution-relevant part of that model in four focused views maintained
next to each other: captured registry evidence first, effective resolution
second, declaration-claim explanations third, materialized resolved copies
fourth.

| Layer                  | Snapshot source                                         | Store representation            |
| ---------------------- | ------------------------------------------------------- | ------------------------------- |
| Registry declarations  | `runtime.sharedExternals` and `runtime.scopedExternals` | `CanonicalRegistryEvidence`     |
| Consumer scope context | `runtime.remotes`                                       | `RemoteEntity[]`                |
| Import-map rules       | `importMaps.documentMaps`                               | `EffectiveMap`                  |
| Canonical result       | The three inputs above plus `channels.domImportMaps`    | `EffectiveConsumerResolution[]` |
| Claim explanations     | Registry evidence plus canonical results                | `ResolutionClaimsDerivation`    |
| Resolved copies        | Mapped canonical results plus their claims              | `ResolvedDependencyCopy[]`      |
| Package measures       | Registry evidence, claims, and resolved copies          | `PackageResolutionMeasures[]`   |
| Existing view contract | Registry evidence plus canonical results                | `SharedParticipantRow[]`        |

### 1. Registry evidence

This view answers _who declared what?_ `CanonicalRegistryEvidence` stores the
records as flat, ordered arrays. The arrows show their logical parent/child ID
relationships; no winner or effective file is selected here.

```mermaid
classDiagram
  direction LR

  class FederationModel {
    +CanonicalRegistryEvidence registryEvidence
  }
  class CanonicalRegistryEvidence {
    +SharedExternalRecord[] sharedExternals
    +VersionRegistration[] versionRegistrations
    +ParticipantDeclaration[] participantDeclarations
    +PrivateRegistration[] privateRegistrations
    +EntrypointCandidate[] entrypointCandidates
    +RegistryEvidenceDiagnostic[] diagnostics
  }
  class SharedExternalRecord {
    +string shareScope
    +string packageName
    +boolean dirty
  }
  class VersionRegistration {
    +string tag
    +string rawAction
    +RegistrationAction action
    +boolean host
  }
  class ParticipantDeclaration {
    +string participant
    +string requiredVersion
    +boolean strictVersion
    +string? pool
    +string? servedBy
  }
  class PrivateRegistration {
    +string ownerRemote
    +string packageName
    +string tag
  }
  class EntrypointCandidate {
    +string specifier
    +string file
    +string? candidateUrl
    +CandidateUrlState candidateUrlState
  }
  class RegistryEvidenceDiagnostic {
    +string code
    +string message
    +string rawValue
  }
  class EvidenceRef {
    +"snapshot" source
    +PathSegment[] path
    +EvidenceState state
  }

  FederationModel "1" *-- "1" CanonicalRegistryEvidence : registryEvidence
  CanonicalRegistryEvidence "1" *-- "0..*" SharedExternalRecord : shared roots
  CanonicalRegistryEvidence "1" *-- "0..*" PrivateRegistration : private roots
  CanonicalRegistryEvidence "1" *-- "0..*" RegistryEvidenceDiagnostic : diagnostics

  SharedExternalRecord "1" --> "0..*" VersionRegistration : ordered IDs
  VersionRegistration "1" --> "0..*" ParticipantDeclaration : ordered IDs
  ParticipantDeclaration "1" --> "0..*" EntrypointCandidate : ordered IDs
  PrivateRegistration "1" --> "0..*" EntrypointCandidate : ordered IDs

  CanonicalRegistryEvidence ..> EvidenceRef : every record cites snapshot paths
```

### 2. Effective consumer resolution

This view answers _where would that declaration resolve at the consumer's
scope root?_ The package name, consumer, normalized remote scope URL, and
effective import map meet only in `EffectiveConsumerResolution`. The scope URL
is a lookup context, not an observed importer-module URL.

```mermaid
classDiagram
  direction LR

  class FederationModel {
    +CanonicalRegistryEvidence registryEvidence
    +EffectiveMap effectiveMap
    +RemoteEntity[] remotes
    +EffectiveConsumerResolution[] effectiveConsumerResolutions
    +SharedParticipantRow[] sharedRows
  }
  class CanonicalRegistryEvidence {
    +SharedExternalRecord[] sharedExternals
    +ParticipantDeclaration[] participantDeclarations
  }
  class SharedExternalRecord {
    +string packageName
  }
  class ParticipantDeclaration {
    +string participant
  }
  class RemoteEntity {
    +string name
    +string resolvedScopeUrl
  }
  class EffectiveMap {
    +Map imports
    +Map scopes
    +Map integrity
  }
  class EffectiveConsumerResolution {
    +string id
    +string scopeContextKey
    +string? consumerScopeUrl
    +string specifier
    +ResolutionStatus status
    +string[] consumerRemotes
    +string? targetUrl
    +boolean? hasIntegrity
    +EffectiveMapEntryProvenance? mapEntry
    +BlockedReason? blockedReason
    +UnknownReason[]? unknownReasons
  }
  class EffectiveMapEntryProvenance {
    +string? scope
    +string specifier
    +string target
    +MatchKind match
  }
  class SharedParticipantRow {
    <<compatibility projection>>
    +string participant
    +string packageName
    +EffectiveResolution? resolution
  }

  FederationModel "1" *-- "1" CanonicalRegistryEvidence : registryEvidence
  FederationModel "1" *-- "0..*" EffectiveConsumerResolution : canonical results
  CanonicalRegistryEvidence "1" --> "0..*" SharedExternalRecord : package claims
  CanonicalRegistryEvidence "1" --> "0..*" ParticipantDeclaration : consumer claims

  SharedExternalRecord ..> EffectiveConsumerResolution : package specifier
  ParticipantDeclaration "1..*" --> "1" EffectiveConsumerResolution : consumer claim
  RemoteEntity --> EffectiveConsumerResolution : consumer scope context
  EffectiveMap --> EffectiveConsumerResolution : scoped exact / prefix lookup
  EffectiveConsumerResolution "1" o-- "0..1" EffectiveMapEntryProvenance : mapped or blocked

  ParticipantDeclaration "1" ..> "1" SharedParticipantRow : registry context
  EffectiveConsumerResolution "1" ..> "1..*" SharedParticipantRow : resolution projection
```

Read the first two views from evidence to result: `normalizeRegistryEvidence`
retains every captured declaration and its snapshot paths; `mergeDocumentMaps`
normalizes the document tags into one `EffectiveMap`; remote scope URLs provide
the scope-root lookup context. The resolver evaluates one binding per scope
context and specifier — every declaration's registry package plus each
candidate specifier, including private registrations — and records exactly one
honest outcome. Modules under a more specific map scope or outside the remote
scope can resolve differently:

- `mapped` means a matching, valid import-map binding supplies the normalized
  target.
- `unmapped` means the map and consumer scope context are known, but no
  applicable import-map binding exists.
- `blocked` means a matching binding exists, but its target is unusable (for
  example an invalid URL or prefix expansion); the entry and exact reason are
  retained.
- `unknown` means the map channel or consumer scope evidence is missing.

`SharedParticipantRow` is only a one-way projection for existing views. It is
never input to canonical resolution. A mapped result describes what the
captured map would bind — not the browser's complete URL fallback behavior, nor
what it requested, downloaded, or executed. In particular, a URL-like
specifier without a matching map entry remains `unmapped` here even though the
browser can resolve that URL without an import-map binding. The
registry-specific rationale and invariants remain in the
[Task 1 design notes](docs/work/resolution-model/task-1-domain-model.md), without
another copy of the diagrams.

### 3. Declaration resolution claims

This view answers _how does each declaration explain the computed binding?_
Every shared or private entrypoint candidate creates one
`DeclarationResolutionClaim` against the already computed
`EffectiveConsumerResolution`; several claims may point at the same binding
without duplicating it. The layer is a pure derivation
(`deriveResolutionClaims`) over the two views above; a later task publishes its
output on the store model.

```mermaid
classDiagram
  direction LR

  class VersionRegistration {
    +string tag
    +RegistrationAction action
  }
  class ParticipantDeclaration {
    +string participant
    +string? servedBy
  }
  class PrivateRegistration {
    +string ownerRemote
  }
  class EntrypointCandidate {
    +string specifier
    +string? candidateUrl
  }
  class EffectiveConsumerResolution {
    +ResolutionStatus status
    +string? targetUrl
  }
  class RegistryServingSlotClaim {
    +SlotStatus status
    +ParticipantDeclarationId? declarationId
  }
  class DeclarationResolutionClaim {
    +string consumerRemote
    +string consumerRegistryPackage
    +string specifier
    +string? ownCandidateUrl
    +boolean? ownCandidateSelected
    +ClaimMappingState mappingState
    +SourceAction sourceAction
    +ResolvedDependencyCopyId? copyId
  }
  class ObservedTargetProvider {
    +string? remote
    +SourceMatchOutcome outcome
    +AttributionRule rule
  }
  class SourceMatch {
    +SourceMatchOutcome outcome
    +ResolutionSubject? source
  }
  class SourceComparison {
    +SourceComparisonKind kind
    +QualifiedSourceClaim left
    +QualifiedSourceClaim right
    +ComparisonStatus status
  }

  VersionRegistration "1" --> "1" RegistryServingSlotClaim : stored-order basis slot
  ParticipantDeclaration "1" --> "0..*" DeclarationResolutionClaim : one per candidate
  PrivateRegistration "1" --> "0..*" DeclarationResolutionClaim : one per candidate
  EntrypointCandidate "1" --> "1" DeclarationResolutionClaim : own candidate
  DeclarationResolutionClaim "1..*" --> "1" EffectiveConsumerResolution : explains binding
  EffectiveConsumerResolution "1" --> "1" ObservedTargetProvider : attribution ladder
  EffectiveConsumerResolution "1" --> "1" SourceMatch : observed source
  DeclarationResolutionClaim "1" *-- "1..3" SourceComparison : slot / anchor / candidate
  SourceComparison ..> RegistryServingSlotClaim : left registry claim
  SourceComparison ..> ObservedTargetProvider : right observed source
```

`mappingState` explains the claim with one normative precedence; the
independent `ownCandidateSelected` flag records exact own-candidate equality
separately:

- `anchored` — `servedBy` is present and the target matches an anchor
  candidate of that remote within the share scope, across external records;
  `servedBy === consumerRemote` is a valid self-anchor.
- `self-filled` — a `skip` claim resolves to the unique matching `skip`
  candidate of the same shared external (its own declaration or the first
  filler of the entry).
- `own-selected` — the target exactly equals the claim's own candidate URL.
- `fallback` — a `skip` claim resolves to the unique matching `share` source
  of the same shared external; the raw action is retained.
- `not-selected` — an own candidate exists, the target differs, and no rule
  above explains it (the visible `mfe2` claim in `co-declared-share`).
- `blocked` — the binding is terminally blocked: nothing is selected and no
  source is attributed.
- `unknown` — map, consumer scope, candidate URL, source match, or
  explanation is missing or ambiguous.

The observed side stays qualified: exact candidate equality outranks
scope-prefix ownership, the host never outranks a matching remote, and
ambiguity retains all candidates instead of choosing one. Comparisons never
collapse the sides — only `slot-vs-observed`, `anchor-vs-observed`, and
`candidate-vs-target` exist, with the registry-side claim always on the left —
and a mismatch is data, not permission to overwrite either fact. No mapping
state or attribution outcome proves that anything was requested, downloaded,
or executed.

### 4. Resolved dependency copies

This view answers _which materially resolved instances of a dependency exist,
and who uses them?_ Only `mapped` effective resolutions and their claims
materialize a `ResolvedDependencyCopy` — candidates and participant membership
alone never do. Sharing success reads as convergence: many registrations,
declarations, and claims may end in one copy, and one registration can yield
zero, one, or several copies. The layer is a pure derivation
(`materializeResolvedCopies`, `aggregatePackageMeasures`) over the views
above; a later task publishes its output on the store model.

```mermaid
classDiagram
  direction LR

  class VersionRegistration {
    +string tag
    +RegistrationAction action
  }
  class ParticipantDeclaration {
    +string participant
  }
  class PrivateRegistration {
    +string ownerRemote
  }
  class EffectiveConsumerResolution {
    +ResolutionStatus status
    +string? targetUrl
  }
  class SourceMatch {
    +SourceMatchOutcome outcome
    +ResolutionSubject? source
  }
  class DeclarationResolutionClaim {
    +ClaimMappingState mappingState
    +ResolvedDependencyCopyId? copyId
  }
  class ResolvedDependencyCopy {
    +ResolvedCopySource source
    +string? sourcePackage
    +string? resolvedTag
    +ResolvedCopySourceDisposition sourceDisposition
    +SourceAction[] sourceActions
    +ResolvedCopyEffectiveRole[] effectiveRoles
    +Map entrypoints
    +SourceRegistrationRef[] sourceRegistrationRefs
  }
  class ResolvedCopyResolutionContext {
    +ResolutionDomain resolutionDomain
    +string consumerRegistryPackage
    +ClaimId[] claimIds
  }
  class PackageResolutionMeasures {
    +string packageName
    +int registrationCount
    +int distinctDeclaredTagCount
    +int resolvedCopyCount
    +int distinctResolvedTagCount
    +int unknownResolvedTagCopyCount
  }

  SourceMatch ..> ResolvedDependencyCopy : unique exact subject keys the copy
  ParticipantDeclaration "1" --> "0..1" ResolvedDependencyCopy : source-record identity
  PrivateRegistration "1" --> "0..1" ResolvedDependencyCopy : source-record identity
  VersionRegistration ..> ResolvedDependencyCopy : resolvedTag and sourceDisposition
  EffectiveConsumerResolution "1..*" --> "0..1" ResolvedDependencyCopy : mapped members only
  ResolvedDependencyCopy "1" *-- "0..*" ResolvedCopyResolutionContext : consumer uses
  ResolvedCopyResolutionContext "1" --> "1..*" DeclarationResolutionClaim : claim IDs
  DeclarationResolutionClaim "0..*" --> "0..1" ResolvedDependencyCopy : copyId
  ResolvedDependencyCopy "0..*" ..> "1" PackageResolutionMeasures : outcome counts
```

Copy identity is hierarchical and source-oriented. A resolution whose target
uniquely and exactly matches one source's candidate takes that source-record
identity — the shared `ParticipantDeclaration` or `PrivateRegistration` —
grouping every mapped entrypoint of that source across all consumer contexts.
Anything else groups by the normalized target URL — the copy ID namespaces
that identity by snapshot — without claiming a source. Consumer share scope,
package, and claim IDs live only in `resolutionContexts`; an exact source copy
is never duplicated or relabeled because another consumer context or external
record points at one of its URLs. `resolvedTag` comes only from the uniquely
matched source registration — a URL-identified copy keeps it `null` rather
than borrowing a consumer's declared tag. After materialization,
`attachCopyIds` completes the claim contract: a mapped claim references its
copy through `copyId`, and unmapped, blocked, and unknown claims carry an
explicit `null`.

Source provenance and effective behavior stay separate axes:

- `sourceDisposition` says where the copy's bytes come from —
  `share-registration`, `skip-registration`, or `scope-registration` from the
  unique source's raw action, `private-registration`, `unknown-registration`,
  `ambiguous-source`, or `target-only` when nothing but the URL is evidenced.
  Consumer actions never change it.
- `effectiveRoles` (sorted, coexisting) derive from the attached claim and
  action evidence, never from consumer counts: a selected `share` surface
  contributes `ordinary-shared` even with a single consumer, a `scope`
  declaration's own mapping contributes `isolated-own`, a selected skip
  self-fill source `self-filled-source`, selection through an explicit
  `servedBy` `anchor-source`, a private registration's own mapping
  `private-own`, and a copy no closed rule explains stays `unclassified`.
- `sourceActions` lists evidenced source actions only, never every consumer
  claim's action.

`PackageResolutionMeasures` keeps four package-level counts deliberately
separate — shared version registrations and their distinct declared tags
describe intent (private registrations are separate canonical records and
never fold into these), resolved copies and distinct resolved tags (plus
unknown-tag copies) describe outcome — with declaration and claim counts as
supporting measures. The aggregation has
no conflict field: equal-tag copy multiplicity alone is never reported as a
version conflict; that judgement needs distinct registration and tag evidence
and belongs to diagnostics. As everywhere in this model, a copy proves what
the captured map resolves, not that the browser requested, downloaded, or
executed the target.

## Install (development build)

```bash
npm install
npm run build:extension
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select the built extension directory. Open DevTools on any Native
Federation application; the panel appears as a new tab.

## Development

```bash
npm start        # dev panel in the browser, with fixtures
npm test         # UI, bridge, collector, and guard suites
```

The dev panel can replay captured scenarios without a running application via
`?fixture=<id>` — strict share scopes, split versions across remotes, scope
isolation, dynamic initialization, and a live capture of a deployed
Angular/React host.

## Repository layout

| Path | Contents |
| --- | --- |
| `extension/` | MV3 manifest and DevTools page |
| `projects/` | collector, bridge, and UI libraries |
| `captures/` | raw runtime captures and the corpus manifest |
| `guards/` | invariant tests, including the privacy scan |
| `docs/` | specs and validation reports |
| `scripts/` | capture, fixture derivation, and build tooling |

Captures are lab data of this project's own scenario runner and its own
deployed demo application only — never third-party pages. See
[`captures/README.md`](captures/README.md) for the corpus policy, provenance,
and regeneration steps.

The product boundary is defined in
[`docs/specs/native-federation-devtools.md`](docs/specs/native-federation-devtools.md).

## License

MIT
