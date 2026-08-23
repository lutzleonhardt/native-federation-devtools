# Task 1: Evidence-first resolution domain model

This model keeps captured declarations intact before any resolution policy is applied. It separates source evidence, entrypoint candidates, and later effective bindings, while retaining `SharedParticipantRow` as an outbound compatibility shape for existing consumers.

## Domain relationships

The complete, current relationship diagrams are maintained together in
[Resolution data model](../../resolution-data-model.md). This
task document remains the detailed catalog of the registry-evidence subset and
its invariants; it does not define a separate model view.

Containment collections are ordered sequences, not mathematical sets. Their `0..*` cardinality deliberately permits empty, repeated, and otherwise unusual captured shapes without normalization loss.

## Catalog

### `SharedExternalRecord`

The evidence wrapper for one captured `(shareScope, packageName)` shared-external record. It alone owns the wrapper-level `dirty` flag and preserves the captured sequence of version registrations.

### `VersionRegistration`

One captured version registration under a shared record, owning `tag`, `host`, and the action classification. It retains the raw action token even when that token is unknown, and contains participant declarations in their original order.

### `ParticipantDeclaration`

One participant's declaration within a version registration, including its version requirement, strictness, cache/bundle/generation facts, nullable `pool`/`servedBy` evidence, and ordered entrypoint candidates. It describes what that participant declared; it does not establish which candidate became effective.

### `PrivateRegistration`

One captured private/scoped registration, kept separate from the shared version-and-participant hierarchy because it has different source semantics. Its entry map becomes an ordered, evidence-addressable sequence of entrypoint candidates without being folded into shared rows.

### `EntrypointCandidate`

One normalized specifier/file pair offered by a participant or private registration, together with its evidence reference, explicit URL-construction state, and optional URL candidate. For v4 declarations the registry package name supplies the specifier; v4.5 and private entry maps retain every ordered key/file pair.

### `EvidenceRef` and `Diagnostic`

`EvidenceRef` points back to a structural snapshot path, including array indexes, and marks present or explicitly missing evidence. Entity IDs carry the parent-scoped equal-key ordinal that disambiguates duplicate-looking records. A `Diagnostic` records an unsupported shape, preserves the relevant raw value, and cites evidence references instead of silently dropping or rewriting the declaration.

### `SharedParticipantRow` compatibility projection

Existing consumers continue to receive a flattened row projected from a participant declaration plus its version and wrapper context. The projection is strictly one-way: domain records never read from, retain, or link back through compatibility rows.

## Invariants

1. **Raw order and duplicates are evidence.** Version registrations, participant declarations, and entrypoint candidates retain capture order and duplicate occurrences; normalization must not sort, coalesce, or deduplicate them.
2. **`dirty` is wrapper-only.** It belongs to `SharedExternalRecord` and is copied only when producing a compatibility row; it is not a property of registrations, participants, or candidates.
3. **Action is registration-only and lossless.** Only `VersionRegistration` classifies an action. An unknown token remains available as `rawAction`, uses the explicit unknown classification, and produces a diagnostic rather than being coerced to a known action.
4. **A candidate URL is not an effective binding.** `candidateUrl` describes one possible entrypoint derived from captured spelling and base information; it must never be treated as proof that the import-map or runtime selected it.
5. **Participant attribution is nullable and uninferred.** `ParticipantDeclaration.pool` and `ParticipantDeclaration.servedBy` remain `null` unless direct evidence supplies them; package names, participant names, scope membership, URL prefixes, and winner election are not substitutes for evidence.
6. **Compatibility has no back-edge.** `SharedParticipantRow` is an output adapter for existing consumers. New domain or resolution logic must not use a compatibility row as input or identity.
7. **Identity is structural, stable, and non-semantic.** IDs encode typed tuples plus the source-order ordinal within an equal key. Delimiters and control characters cannot collide, and an ordinal distinguishes evidence occurrences without declaring a winner.
8. **Provenance is part of the contract.** Every canonical record, derived candidate, and normalization diagnostic cites its contributing snapshot paths; explicit absence is represented as missing evidence rather than an invented value.

## Review guard

The next task may treat the aggregate boundaries, ordered cardinalities, evidence references, nullable attribution, and one-way compatibility direction above as fixed. It must not treat an entrypoint candidate as an effective binding or recover source structure from flattened rows.
