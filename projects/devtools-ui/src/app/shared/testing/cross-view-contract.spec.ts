/**
 * Cross-view semantic contract (T11.5-AC-02, contributes to XC-02, XC-03).
 *
 * The same invariants over every corpus-derived fixture — the drift guard's
 * set (`projects/collector/src/lib/fixture-drift.spec.ts`), so contract and
 * drift chain never disagree on membership. Each fixture builds the four
 * default-state view models once; the contract then checks that they agree
 * with each other and with the canonical façade:
 *
 * - every displayed ID exists canonically;
 * - Packages, Remotes, Import Map, and Graph agree on remotes, copies,
 *   relations, and package groups;
 * - declarations partition into registrations without inflating them,
 *   resolutions, or copies — canonical rows are the raw registry rows;
 * - each (scope context, specifier) is bound at most once;
 * - each recorded import-map row renders exactly once;
 * - an unselected candidate never becomes a copy's source, with "selected"
 *   derived from the evidence rather than read off the claim.
 *
 * No expected value here comes from a VM snapshot — the checks are relations
 * between collections, so a fixture that violates one is a finding to
 * investigate, not a pin to refresh.
 */
import { FIXTURES, FixtureId, SnapshotV1 } from 'devtools-bridge';

import { buildGraphModel } from '../../views/graph/graph-model';
import type { GraphModel, GraphNode } from '../../views/graph/graph-types';
import { buildImportMapVm } from '../../views/import-map/import-map-view-model';
import { buildPackagesVm, packageId } from '../../views/packages/packages-view-model';
import { buildRemotesVm } from '../../views/remotes/remotes-view-model';
import { ingestSnapshot } from '../store/ingest';
import type {
  CanonicalRegistryEvidence,
  DeclarationResolutionClaim,
  PackageResolutionMeasures,
  ResolvedCopySource,
  ResolvedDependencyCopy,
  SharedExternalRecord,
  VersionRegistration,
} from '../store/resolution';

// The drift guard's definition: `synthetic-` fixtures are hand-written,
// `exported-` fixtures are verbatim panel exports — neither has a capture.
const derivedIds = (Object.keys(FIXTURES) as FixtureId[]).filter(
  (id) => !id.startsWith('synthetic-') && !id.startsWith('exported-'),
);

type RawRuntime = SnapshotV1['runtime'];

const sorted = (values: Iterable<string>): string[] => [...values].sort();

/** The members of `actual` that `universe` lacks — `[]` reads as "all resolved". */
function unresolved(actual: Iterable<string>, universe: ReadonlySet<string>): string[] {
  return sorted(new Set([...actual].filter((value) => !universe.has(value))));
}

/** Every member of `actual` exists in `universe`; the label names the failing surface. */
function expectResolved(label: string, actual: Iterable<string>, universe: ReadonlySet<string>) {
  expect([label, unresolved(actual, universe)]).toEqual([label, []]);
}

/** One fixture's façade, its four default-state view models, and lookup indexes. */
function contextOf(id: FixtureId) {
  const snapshot = FIXTURES[id] as SnapshotV1;
  const model = ingestSnapshot(snapshot);
  const evidence = model.registryEvidence;
  const resolutions = model.effectiveConsumerResolutions;
  const projection = model.resolutionProjection;
  const importMap = buildImportMapVm(model, { selected: null });
  return {
    runtime: snapshot.runtime,
    model,
    evidence,
    resolutions,
    projection,
    packages: buildPackagesVm(model, {
      filter: 'all',
      selectedParticipant: null,
      selectedId: null,
    }),
    remotes: buildRemotesVm(model, { selectedName: null }),
    importMapRows: importMap.sections.flatMap((section) =>
      section.groups.flatMap((group) => group.rows.map((row) => ({ scope: section.scope, row }))),
    ),
    graph: buildGraphModel(projection),
    mapped: resolutions.filter((resolution) => resolution.status === 'mapped'),
    canonical: {
      remotes: new Set(projection.remotes.map((remote) => remote.name)),
      copies: new Set(projection.copies.map((copy) => copy.id)),
      relations: new Set(projection.consumerRelations.map((relation) => relation.id)),
      claims: new Set(projection.declarationResolutionClaims.map((claim) => claim.id)),
      bundleClaims: new Set(projection.bundleClaims.map((claim) => claim.id)),
      chunkEmitters: new Set(projection.chunkGroups.map((group) => group.emitterRemote)),
      resolutions: new Set(resolutions.map((resolution) => resolution.id)),
      packageGroups: new Set(
        evidence.sharedExternals.map((external) =>
          packageId(external.shareScope, external.packageName),
        ),
      ),
      specifiers: new Set(evidence.entrypointCandidates.map((candidate) => candidate.specifier)),
    },
    copyById: new Map(projection.copies.map((copy) => [copy.id, copy])),
    resolutionById: new Map(resolutions.map((resolution) => [resolution.id, resolution])),
    relationById: new Map(
      projection.consumerRelations.map((relation) => [relation.id as string, relation]),
    ),
    candidateById: new Map(
      evidence.entrypointCandidates.map((candidate) => [candidate.id as string, candidate]),
    ),
  };
}
type FixtureContext = ReturnType<typeof contextOf>;

function nodeIds(graph: GraphModel, kind: GraphNode['kind']): string[] {
  return graph.nodes.filter((node) => node.kind === kind).map((node) => node.id);
}

function registrationsOf(
  evidence: CanonicalRegistryEvidence,
  external: SharedExternalRecord,
): VersionRegistration[] {
  return evidence.versionRegistrations.filter(
    (registration) => registration.sharedExternalId === external.id,
  );
}

function declarantsOf(evidence: CanonicalRegistryEvidence, registration: VersionRegistration) {
  return evidence.participantDeclarations
    .filter((declaration) => declaration.versionRegistrationId === registration.id)
    .map((declaration) => declaration.participant);
}

/**
 * The headline measures re-counted from the evidence. Registration and tag
 * counts describe SHARED registry intent only — private registrations are
 * separate records (`aggregatePackageMeasures` doc).
 */
function recountedMeasures(
  evidence: CanonicalRegistryEvidence,
  packageName: string,
): Pick<
  PackageResolutionMeasures,
  'packageName' | 'registrationCount' | 'declarationCount' | 'distinctDeclaredTagCount'
> {
  const registrations = evidence.sharedExternals
    .filter((external) => external.packageName === packageName)
    .flatMap((external) => registrationsOf(evidence, external));
  return {
    packageName,
    registrationCount: registrations.length,
    declarationCount: registrations.flatMap((r) => declarantsOf(evidence, r)).length,
    distinctDeclaredTagCount: new Set(registrations.map((registration) => registration.tag)).size,
  };
}

// --- Raw registry rows of the fixture, in stored order (the shape Task 1
// maps one-to-one: one registration per `versions[]` element, one
// declaration per `remotes[]` element, one private registration per
// scoped-externals entry).
function rawSharedKeys(runtime: RawRuntime): string[] {
  return Object.entries(runtime?.sharedExternals ?? {}).flatMap(([scope, packages]) =>
    Object.keys(packages).map((name) => `${scope}|${name}`),
  );
}

function rawVersionsOf(runtime: RawRuntime, external: SharedExternalRecord) {
  return runtime?.sharedExternals[external.shareScope]?.[external.packageName]?.versions ?? [];
}

function rawPrivateRows(runtime: RawRuntime): string[][] {
  return Object.entries(runtime?.scopedExternals ?? {}).flatMap(([owner, packages]) =>
    Object.entries(packages).map(([name, entry]) => [owner, name, entry.tag]),
  );
}

/**
 * "Selected" derived from the evidence, not read off the claim: the own
 * candidate URL is the target its resolution mapped to. Null when either
 * side is unavailable (no candidate URL, or no mapped target).
 */
function evidencedSelection(
  claim: DeclarationResolutionClaim,
  context: FixtureContext,
): boolean | null {
  const candidateUrl = context.candidateById.get(claim.candidateId)?.candidateUrl ?? null;
  const resolution = context.resolutionById.get(claim.effectiveResolutionId);
  if (candidateUrl === null || resolution?.status !== 'mapped') {
    return null;
  }
  return candidateUrl === resolution.targetUrl;
}

/** True when `source` is the claim's own declaration or private registration. */
function isOwnSource(
  source: ResolvedCopySource | undefined,
  claim: DeclarationResolutionClaim,
): boolean {
  if (claim.subject.kind === 'shared') {
    return (
      source?.kind === 'shared-declaration' &&
      source.declarationId === claim.subject.participantDeclarationId
    );
  }
  return (
    source?.kind === 'private-registration' &&
    source.registrationId === claim.subject.privateRegistrationId
  );
}

function selectedTargetsOf(copy: ResolvedDependencyCopy, context: FixtureContext): string[] {
  return copy.effectiveResolutionIds.flatMap((resolutionId) => {
    const resolution = context.resolutionById.get(resolutionId);
    return resolution?.status === 'mapped' ? [resolution.targetUrl] : [];
  });
}

describe('cross-view contract (T11.5-AC-02)', () => {
  it('runs over the twelve lab scenarios plus the live capture', () => {
    expect(derivedIds).toHaveLength(13);
    expect(derivedIds).toContain('co-declared-share');
    expect(derivedIds).toContain('frankenstein-live');
  });

  describe.each(derivedIds)('%s', (id) => {
    const context = contextOf(id);
    const { evidence, resolutions, projection, packages, remotes, importMapRows, graph } = context;
    const { canonical, mapped } = context;

    describe('displays only IDs that exist canonically', () => {
      it('in Packages', () => {
        // Package rows are shared-external groups, entrypoint rows name
        // registry entries.
        const rows = packages.rows.map((row) => row.payload);
        expectResolved(
          'package rows',
          rows.flatMap((row) => (row.kind === 'package' ? [row.packageId] : [])),
          canonical.packageGroups,
        );
        expectResolved(
          'entrypoint rows',
          rows.flatMap((row) => (row.kind === 'entrypoint' ? [row.specifier] : [])),
          canonical.specifiers,
        );
        expectResolved(
          'participant chips',
          packages.participants.map((chip) => chip.name),
          canonical.remotes,
        );
      });

      it('in Remotes', () => {
        expectResolved(
          'remote rows',
          remotes.rows.map((row) => row.payload.name),
          canonical.remotes,
        );
      });

      it('in the Import Map', () => {
        const rows = importMapRows.map(({ row }) => row);
        expectResolved(
          'sources',
          rows.flatMap((r) => r.sources.map((s) => s.copyId)),
          canonical.copies,
        );
        expectResolved(
          'claims',
          rows.flatMap((r) => r.claims.map((c) => c.claimId)),
          canonical.claims,
        );
        expectResolved(
          'bundles',
          rows.flatMap((r) => r.bundles.map((b) => b.bundleClaimId)),
          canonical.bundleClaims,
        );
        expectResolved(
          'resolutions',
          rows.flatMap((r) => r.resolutionIds),
          canonical.resolutions,
        );
        expectResolved(
          'chunk emitters',
          rows.flatMap((r) => r.chunks.map((c) => c.emitterRemote)),
          canonical.chunkEmitters,
        );
        expectResolved(
          'exposes',
          rows.flatMap((r) => r.exposes.map((e) => e.remote)),
          canonical.remotes,
        );
        expectResolved(
          'claim consumers',
          rows.flatMap((r) => r.claims.map((c) => c.consumer)),
          canonical.remotes,
        );
        expectResolved(
          'claimless consumers',
          rows.flatMap((r) => r.claimlessConsumers.map((c) => c.consumer)),
          canonical.remotes,
        );
      });

      it('in the Graph', () => {
        // Nodes come from remotes and copies, edges from relations.
        expectResolved('remote nodes', nodeIds(graph, 'remote'), canonical.remotes);
        expectResolved('dependency nodes', nodeIds(graph, 'dependency'), canonical.copies);
        expectResolved(
          'edges',
          graph.edges.map((edge) => edge.id),
          canonical.relations,
        );
        expectResolved(
          'edge sources',
          graph.edges.map((edge) => edge.sourceId),
          canonical.remotes,
        );
        expectResolved(
          'edge targets',
          graph.edges.map((edge) => edge.targetId),
          canonical.copies,
        );
        expectResolved('dropped relations', graph.droppedRelationIds, canonical.relations);
        const nodeKeys = new Set(graph.nodes.map((node) => node.key));
        expectResolved(
          'bundle edge dependencies',
          graph.bundleEdgeRefs.map((ref) => ref.dependencyKey),
          nodeKeys,
        );
        expectResolved(
          'bundle edge chunks',
          graph.bundleEdgeRefs.map((ref) => ref.chunkKey),
          nodeKeys,
        );
      });
    });

    describe('agrees across views', () => {
      it('on remotes and hosts', () => {
        const remoteNames = sorted(canonical.remotes);
        expect(sorted(context.model.remotes.map((remote) => remote.name))).toEqual(remoteNames);
        expect(remotes.remoteCount).toBe(remoteNames.length);
        expect(sorted(remotes.rows.map((row) => row.payload.name))).toEqual(remoteNames);
        expect(sorted(nodeIds(graph, 'remote'))).toEqual(remoteNames);

        const hosts = new Set(
          projection.remotes.filter((remote) => remote.isHost).map((remote) => remote.name),
        );
        expect(
          sorted(remotes.rows.filter((row) => row.payload.host).map((row) => row.payload.name)),
        ).toEqual(sorted(hosts));
        // Participant chips list the declarers involved in shared packages —
        // a host that declares nothing is no chip — but a chip's host flag
        // is the projection's.
        expect(packages.participants.map((chip) => [chip.name, chip.host])).toEqual(
          packages.participants.map((chip) => [chip.name, hosts.has(chip.name)]),
        );
      });

      it('on copies — the unfiltered graph draws every copy, once', () => {
        const dependencyIds = nodeIds(graph, 'dependency');
        expect(sorted(dependencyIds)).toEqual(sorted(canonical.copies));
        expect(new Set(dependencyIds).size).toBe(dependencyIds.length);
      });

      it('on relations — each is exactly one edge or one reported drop', () => {
        expect(
          sorted([...graph.edges.map((edge) => edge.id), ...graph.droppedRelationIds]),
        ).toEqual(sorted(canonical.relations));
        // An edge joins exactly its relation's ends.
        expect(graph.edges.map((edge) => [edge.id, edge.sourceId, edge.targetId])).toEqual(
          graph.edges.map((edge) => {
            const relation = context.relationById.get(edge.id);
            return [edge.id, relation?.consumerRemote, relation?.copyId];
          }),
        );
        for (const relation of projection.consumerRelations) {
          expectResolved(`${relation.id} consumer`, [relation.consumerRemote], canonical.remotes);
          expectResolved(`${relation.id} copy`, [relation.copyId], canonical.copies);
          expectResolved(
            `${relation.id} resolutions`,
            relation.effectiveResolutionIds,
            canonical.resolutions,
          );
          expectResolved(`${relation.id} claims`, relation.claimIds, canonical.claims);
        }
      });

      it('on package groups — one per shared-external record, nothing more', () => {
        const packageRowIds = packages.rows.flatMap((row) =>
          row.payload.kind === 'package' ? [row.payload.packageId] : [],
        );
        expect(sorted(packageRowIds)).toEqual(sorted(canonical.packageGroups));
        expect(packages.packageCount).toBe(canonical.packageGroups.size);
        expect(packages.scopes.reduce((count, scope) => count + scope.packageCount, 0)).toBe(
          canonical.packageGroups.size,
        );
      });

      it('on package measures — the aggregates re-count from the evidence', () => {
        for (const measure of projection.packageMeasures) {
          const { packageName, registrationCount, declarationCount, distinctDeclaredTagCount } =
            measure;
          expect({
            packageName,
            registrationCount,
            declarationCount,
            distinctDeclaredTagCount,
          }).toEqual(recountedMeasures(evidence, packageName));
        }
      });
    });

    describe('lets declarations partition into registrations without inflating them', () => {
      it('every declaration belongs to exactly one registration, every registration owns one or more', () => {
        const owned = evidence.versionRegistrations.flatMap(
          (registration) => registration.participantDeclarationIds,
        );
        expect(new Set(owned).size).toBe(owned.length);
        expect(sorted(owned)).toEqual(sorted(evidence.participantDeclarations.map((d) => d.id)));
        expect(
          evidence.versionRegistrations.filter((r) => r.participantDeclarationIds.length === 0),
        ).toEqual([]);
        const registrationById = new Map(evidence.versionRegistrations.map((r) => [r.id, r]));
        for (const declaration of evidence.participantDeclarations) {
          expect(
            registrationById.get(declaration.versionRegistrationId)?.participantDeclarationIds,
          ).toContain(declaration.id);
        }
      });

      it('canonical rows are the raw registry rows, one-to-one and in raw order', () => {
        // A second declarer never adds a row; an equal-tag/equal-action
        // duplicate row never folds away (Task 1 preserves it by ordinal).
        expect(
          evidence.sharedExternals.map(
            (external) => `${external.shareScope}|${external.packageName}`,
          ),
        ).toEqual(rawSharedKeys(context.runtime));
        for (const external of evidence.sharedExternals) {
          const rawRows = rawVersionsOf(context.runtime, external);
          const registrations = registrationsOf(evidence, external);
          expect(registrations.map((r) => [r.tag, r.rawAction])).toEqual(
            rawRows.map((row) => [row.tag, row.action]),
          );
          expect(registrations.map((r) => declarantsOf(evidence, r))).toEqual(
            rawRows.map((row) => row.remotes.map((remote) => remote.name)),
          );
        }
        expect(
          evidence.privateRegistrations.map((r) => [r.ownerRemote, r.packageName, r.tag]),
        ).toEqual(rawPrivateRows(context.runtime));
      });

      it('copies never exceed the distinct selected targets; every mapped resolution lands in exactly one copy', () => {
        expect(projection.copies.length).toBeLessThanOrEqual(
          new Set(mapped.map((resolution) => resolution.targetUrl)).size,
        );
        const bound = projection.copies.flatMap((copy) => copy.effectiveResolutionIds);
        expect(new Set(bound).size).toBe(bound.length);
        expect(sorted(bound)).toEqual(sorted(mapped.map((resolution) => resolution.id)));
      });
    });

    it('binds each (scope context, specifier) at most once', () => {
      const bindings = resolutions.map(
        (resolution) => `${resolution.scopeContextKey} ${resolution.specifier}`,
      );
      expect(new Set(bindings).size).toBe(bindings.length);
      expect(canonical.resolutions.size).toBe(resolutions.length);
    });

    it('renders every recorded import-map row exactly once', () => {
      const triple = (scope: string | null, specifier: string, target: string) =>
        JSON.stringify([scope, specifier, target]);
      const recorded = context.model.importMapEntries.map((entry) =>
        triple(entry.scope, entry.specifier, entry.target),
      );
      const recordedKeys = context.model.importMapEntries.map((entry) =>
        JSON.stringify([entry.scope, entry.specifier]),
      );
      expect(new Set(recordedKeys).size).toBe(recordedKeys.length);

      const rendered = importMapRows.map(({ scope, row }) =>
        triple(scope, row.specifier, row.target),
      );
      expect(sorted(rendered)).toEqual(sorted(recorded));

      // A mapped resolution is annotated on exactly one row.
      const annotated = importMapRows.flatMap(({ row }) => row.resolutionIds);
      expect(new Set(annotated).size).toBe(annotated.length);
      expectResolved(
        'mapped resolutions',
        mapped.map((r) => r.id),
        new Set(annotated),
      );
    });

    describe('never promotes an unselected candidate to a copy source', () => {
      const claims = projection.declarationResolutionClaims;

      it('the claim flag agrees with the evidence', () => {
        const decidable = claims.filter((claim) => evidencedSelection(claim, context) !== null);
        expect(decidable.map((claim) => [claim.id, claim.ownCandidateSelected])).toEqual(
          decidable.map((claim) => [claim.id, evidencedSelection(claim, context)]),
        );
      });

      it('an unselected candidate never sources the copy its claim resolves to', () => {
        const offenders = claims.filter(
          (claim) =>
            claim.copyId !== null &&
            evidencedSelection(claim, context) === false &&
            isOwnSource(context.copyById.get(claim.copyId)?.source, claim),
        );
        expect(offenders.map((claim) => claim.id)).toEqual([]);
      });

      it("a copy's entrypoints are exactly its selected targets", () => {
        expect(
          projection.copies.map((copy) => [
            copy.id,
            sorted(new Set(Object.values(copy.entrypoints))),
          ]),
        ).toEqual(
          projection.copies.map((copy) => [
            copy.id,
            sorted(new Set(selectedTargetsOf(copy, context))),
          ]),
        );
      });
    });
  });
});
