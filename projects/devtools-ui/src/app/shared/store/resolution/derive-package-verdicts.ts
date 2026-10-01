import { compareSemver } from '../semver-compare';
import { satisfiesRange } from '../semver-range';
import type { DeclarationResolutionClaim } from './claims-model';
import type { ResolvedDependencyCopy } from './copies-model';
import { registryEvidenceId } from './ids';
import type {
  CanonicalRegistryEvidence,
  ParticipantDeclaration,
  SharedExternalId,
  VersionRegistration,
} from './model';
import type {
  DeclarationVerdict,
  DeclarationVerdictRecord,
  PackageScopeVerdicts,
  VersionStatus,
  VersionVerdict,
} from './verdict-model';

const STRICT_SCOPE = 'strict';

export function derivePackageVerdicts(
  evidence: CanonicalRegistryEvidence,
  claims: readonly DeclarationResolutionClaim[],
  copies: readonly ResolvedDependencyCopy[],
): PackageScopeVerdicts[] {
  const registrationById = new Map(evidence.versionRegistrations.map((r) => [r.id, r]));
  const declarationById = new Map(evidence.participantDeclarations.map((d) => [d.id, d]));
  const copyById = new Map(copies.map((copy) => [copy.id, copy]));

  const copiesByExternal = new Map<SharedExternalId, ResolvedDependencyCopy[]>();
  for (const copy of copies) {
    const externals = new Set(
      copy.sourceRegistrationRefs
        .filter((ref) => ref.kind === 'shared')
        .map((ref) => registrationById.get(ref.id)?.sharedExternalId)
        .filter((id): id is SharedExternalId => id !== undefined),
    );
    for (const external of externals) {
      copiesByExternal.set(external, [...(copiesByExternal.get(external) ?? []), copy]);
    }
  }
  const claimsByDeclaration = new Map<string, DeclarationResolutionClaim[]>();
  for (const claim of claims) {
    if (claim.subject.kind !== 'shared') continue;
    const id = claim.subject.participantDeclarationId;
    claimsByDeclaration.set(id, [...(claimsByDeclaration.get(id) ?? []), claim]);
  }

  return evidence.sharedExternals.map((external) => {
    const registrations = external.versionRegistrationIds.map((id) => registrationById.get(id)!);
    const strict = external.shareScope === STRICT_SCOPE;
    const elected = strict ? undefined : registrations.find((r) => r.action === 'share');
    const electedTag = elected?.tag ?? null;
    const scopeCopies = copiesByExternal.get(external.id) ?? [];

    const runsTagOf = (declaration: ParticipantDeclaration): string | null => {
      const own = claimsByDeclaration.get(declaration.id) ?? [];
      const claim =
        own.find((c) => c.specifier === external.packageName && c.copyId !== null) ??
        own.find((c) => c.copyId !== null);
      return claim?.copyId ? (copyById.get(claim.copyId)?.resolvedTag ?? null) : null;
    };

    const declarations: DeclarationVerdictRecord[] = registrations.flatMap((registration) =>
      registration.participantDeclarationIds.map((id, index) => {
        const declaration = declarationById.get(id)!;
        const acceptsElected =
          electedTag === null ? null : satisfiesRange(electedTag, declaration.requiredVersion);
        return {
          declarationId: declaration.id,
          participant: declaration.participant,
          tag: registration.tag,
          verdict: verdictOf(registration, declaration, index, electedTag, acceptsElected),
          acceptsElected,
          runsTag: runsTagOf(declaration),
        };
      }),
    );

    const tags = [...new Set(registrations.map((r) => r.tag))].sort((a, b) => compareSemver(b, a));
    const versions: VersionVerdict[] = tags.map((tag) => {
      const rows = registrations.filter((r) => r.tag === tag);
      const tagCopies = scopeCopies.filter((copy) => copy.resolvedTag === tag);
      const status: VersionStatus = rows.some((r) => r.action === 'share')
        ? 'shared'
        : rows.some((r) => r.action === 'scope')
          ? 'scoped'
          : tagCopies.length > 0
            ? 'partly-loaded'
            : 'not-loaded';
      return {
        tag,
        status,
        registrationIds: rows.map((r) => r.id),
        declarationIds: rows.flatMap((r) => r.participantDeclarationIds),
        copyIds: tagCopies.map((copy) => copy.id),
      };
    });

    return {
      id: registryEvidenceId(
        'package-scope-verdicts',
        [external.shareScope, external.packageName],
        external.ordinal,
      ),
      sharedExternalId: external.id,
      shareScope: external.shareScope,
      packageName: external.packageName,
      electedTag,
      electedDeclarationId: elected?.participantDeclarationIds[0] ?? null,
      versions,
      declarations,
    };
  });
}

function verdictOf(
  registration: VersionRegistration,
  declaration: ParticipantDeclaration,
  index: number,
  electedTag: string | null,
  acceptsElected: boolean | null,
): DeclarationVerdict {
  switch (registration.action) {
    // The mapping publishes the first participant's file (`remotes[0]`).
    case 'share':
      return index === 0 ? 'provides' : 'same-version';
    case 'scope':
      return 'own-copy';
    case 'skip':
      if (electedTag === null) return 'unknown';
      if (registration.tag === electedTag) return 'same-version';
      if (acceptsElected === true) return 'reuses-shared';
      // A strict range that rejects the elected tag is stored as `scope`, so a strict `skip` here
      // is a row the resolver rules do not explain.
      if (acceptsElected === false && !declaration.strictVersion) return 'out-of-range';
      return 'unknown';
    default:
      return 'unknown';
  }
}
