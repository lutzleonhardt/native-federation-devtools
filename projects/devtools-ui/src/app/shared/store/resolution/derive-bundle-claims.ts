import type { BundleClaim, BundleClaimSource, ChunkGroupProjection } from './bundle-claims-model';
import type { ResolutionClaimsDerivation } from './claims-model';
import type { ResolvedDependencyCopy } from './copies-model';
import { CHUNK_PSEUDO_PACKAGE_PREFIX } from './derive-chunk-groups';
import { encodeRegistryIdTuple, registryEvidenceId } from './ids';
import type { CanonicalRegistryEvidence, EvidenceRef } from './model';

/**
 * Derives each copy's bundle claims. Attribution follows the selected source
 * only: a copy's uniquely evidenced declaration or private registration
 * claims its own bundle, an identifiable anchor is that copy's source
 * already, and non-selected bundle-bearing participants donate nothing. An
 * ambiguous-source copy surfaces every candidate `(sourceRemote, bundle)`
 * pair as a qualified claim without chunk attribution; a target-only copy
 * carries no bundle evidence at all. Legacy `@nf-internal/...` chunk
 * carriers keep their raw provenance and never claim as dependency sources.
 */
export function deriveBundleClaims(
  evidence: CanonicalRegistryEvidence,
  claims: ResolutionClaimsDerivation,
  copies: readonly ResolvedDependencyCopy[],
  chunkGroups: readonly ChunkGroupProjection[],
): BundleClaim[] {
  const declarationsById = new Map(
    evidence.participantDeclarations.map((declaration) => [declaration.id, declaration]),
  );
  const privatesById = new Map(
    evidence.privateRegistrations.map((registration) => [registration.id, registration]),
  );
  const candidatesById = new Map(
    evidence.entrypointCandidates.map((candidate) => [candidate.id, candidate]),
  );
  const sourceMatchByResolution = new Map(
    claims.sourceMatches.map((sourceMatch) => [sourceMatch.resolutionId, sourceMatch]),
  );
  // Only dense `shared-chunks` groups join dependency attribution;
  // pseudo-external groups stay separate raw provenance.
  const denseGroupsByEmitterBundle = new Map<string, ChunkGroupProjection[]>();
  for (const group of chunkGroups) {
    if (group.origin !== 'shared-chunks' || group.bundleName === null) {
      continue;
    }
    const key = encodeRegistryIdTuple([group.emitterRemote, group.bundleName]);
    const list = denseGroupsByEmitterBundle.get(key) ?? [];
    list.push(group);
    denseGroupsByEmitterBundle.set(key, list);
  }

  const bundleClaims: BundleClaim[] = [];
  for (const copy of copies) {
    if (copy.source.kind === 'shared-declaration') {
      const declaration = requireRecord(
        declarationsById,
        copy.source.declarationId,
        'participant declaration',
      );
      if (declaration.bundle !== null) {
        bundleClaims.push(
          sourceClaim(copy, {
            source: { kind: 'shared', declarationId: declaration.id },
            sourceRecordId: declaration.id,
            sourceRemote: declaration.participant,
            bundle: declaration.bundle,
            sourceEvidence: declaration.provenance.evidence,
          }),
        );
      }
      continue;
    }
    if (copy.source.kind === 'private-registration') {
      const registration = requireRecord(
        privatesById,
        copy.source.registrationId,
        'private registration',
      );
      if (
        registration.bundle !== null &&
        !registration.packageName.startsWith(CHUNK_PSEUDO_PACKAGE_PREFIX)
      ) {
        bundleClaims.push(
          sourceClaim(copy, {
            source: { kind: 'private', registrationId: registration.id },
            sourceRecordId: registration.id,
            sourceRemote: registration.ownerRemote,
            bundle: registration.bundle,
            sourceEvidence: registration.provenance.evidence,
          }),
        );
      }
      continue;
    }
    if (copy.sourceDisposition !== 'ambiguous-source') {
      continue;
    }
    // Ambiguity retains all candidate sources and chooses none: no chunk
    // groups attribute, and every distinct (sourceRemote, bundle) stays visible.
    const pairs = new Map<string, { sourceRemote: string; bundle: string; refs: EvidenceRef[] }>();
    for (const resolutionId of copy.effectiveResolutionIds) {
      const sourceMatch = sourceMatchByResolution.get(resolutionId);
      if (sourceMatch?.outcome !== 'ambiguous-candidate') {
        continue;
      }
      for (const candidateId of sourceMatch.candidateIds) {
        const candidate = requireRecord(candidatesById, candidateId, 'entrypoint candidate');
        const candidateSource = candidateBundleSource(candidate.sourceRecord);
        if (candidateSource === null) {
          continue;
        }
        const key = encodeRegistryIdTuple([candidateSource.sourceRemote, candidateSource.bundle]);
        const pair = pairs.get(key) ?? { ...candidateSource, refs: [] };
        pair.refs.push(...candidateSource.refs);
        pairs.set(key, pair);
      }
    }
    const sortedPairs = [...pairs.entries()]
      .sort(([a], [b]) => compareText(a, b))
      .map(([, pair]) => pair);
    for (const pair of sortedPairs) {
      bundleClaims.push({
        id: registryEvidenceId(
          'bundle-claim',
          [copy.id, 'ambiguous', pair.sourceRemote, pair.bundle],
          0,
        ),
        copyId: copy.id,
        source: null,
        sourceRemote: pair.sourceRemote,
        bundle: pair.bundle,
        chunkGroupIds: [],
        status: 'ambiguous',
        provenance: { evidence: pair.refs },
      });
    }
  }
  return bundleClaims.sort((a, b) => compareText(a.id, b.id));

  interface SourceClaimFacts {
    source: BundleClaimSource;
    sourceRecordId: string;
    sourceRemote: string;
    bundle: string;
    sourceEvidence: EvidenceRef[];
  }

  function sourceClaim(copy: ResolvedDependencyCopy, facts: SourceClaimFacts): BundleClaim {
    const groups =
      denseGroupsByEmitterBundle.get(encodeRegistryIdTuple([facts.sourceRemote, facts.bundle])) ??
      [];
    const chunkGroupIds = groups.map((group) => group.id).sort(compareText);
    return {
      id: registryEvidenceId(
        'bundle-claim',
        [copy.id, facts.source.kind, facts.sourceRecordId, facts.bundle],
        0,
      ),
      copyId: copy.id,
      source: facts.source,
      sourceRemote: facts.sourceRemote,
      bundle: facts.bundle,
      chunkGroupIds,
      status: chunkGroupIds.length > 0 ? 'mapped-source' : 'source-only',
      provenance: {
        evidence: [
          ...facts.sourceEvidence,
          ...groups.flatMap((group) => group.provenance.evidence),
        ],
      },
    };
  }

  function candidateBundleSource(
    sourceRecord: (typeof evidence.entrypointCandidates)[number]['sourceRecord'],
  ): { sourceRemote: string; bundle: string; refs: EvidenceRef[] } | null {
    if (sourceRecord.kind === 'private-entry') {
      const registration = requireRecord(
        privatesById,
        sourceRecord.privateRegistrationId,
        'private registration',
      );
      if (
        registration.bundle === null ||
        registration.packageName.startsWith(CHUNK_PSEUDO_PACKAGE_PREFIX)
      ) {
        return null;
      }
      return {
        sourceRemote: registration.ownerRemote,
        bundle: registration.bundle,
        refs: registration.provenance.evidence,
      };
    }
    const declaration = requireRecord(
      declarationsById,
      sourceRecord.participantDeclarationId,
      'participant declaration',
    );
    if (declaration.bundle === null) {
      return null;
    }
    return {
      sourceRemote: declaration.participant,
      bundle: declaration.bundle,
      refs: declaration.provenance.evidence,
    };
  }
}

/**
 * Completes the copy contract after bundle-claim derivation: every copy
 * references its own claims and copies without any stay an explicit empty list.
 */
export function attachBundleClaimIds(
  copies: readonly ResolvedDependencyCopy[],
  bundleClaims: readonly BundleClaim[],
): ResolvedDependencyCopy[] {
  const idsByCopy = new Map<string, BundleClaim['id'][]>();
  for (const bundleClaim of bundleClaims) {
    const list = idsByCopy.get(bundleClaim.copyId) ?? [];
    list.push(bundleClaim.id);
    idsByCopy.set(bundleClaim.copyId, list);
  }
  return copies.map((copy) => ({
    ...copy,
    bundleClaimIds: [...(idsByCopy.get(copy.id) ?? [])].sort(compareText),
  }));
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function requireRecord<Key, RecordType>(
  records: ReadonlyMap<Key, RecordType>,
  id: Key,
  label: string,
): RecordType {
  const record = records.get(id);
  if (record === undefined) {
    throw new Error(`Bundle-claim derivation references a missing ${label}: ${String(id)}`);
  }
  return record;
}
