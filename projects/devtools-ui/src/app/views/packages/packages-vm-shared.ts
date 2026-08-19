/**
 * Shared internals of the Packages vm builder — the canonical (share scope,
 * package) group shape and the ID-keyed store-façade indexes used by the row
 * half (`packages-row-vm.ts`), the detail half (`packages-detail-vm.ts`),
 * and the chunk half (`packages-chunk-vm.ts`). Views import from the
 * `packages-view-model.ts` facade only.
 *
 * Everything here joins the canonical read surface —
 * `model.resolutionProjection`, `model.effectiveConsumerResolutions`, and
 * `model.registryEvidence` — by ID only. Nothing re-derives resolver,
 * action, or copy semantics; the builders group and label precomputed
 * knowledge (T7).
 *
 * The cross-view vocabulary (scope constants, select ids, sentinel
 * display) lives in `shared/view-conventions.ts` since T11; the re-exports
 * keep this module's import sites stable.
 */
import { NF_HOST } from 'devtools-bridge';

import type { FederationModel } from '../../shared/store/federation-model';
import type {
  BundleClaim,
  BundleClaimId,
  ChunkGroupId,
  ChunkGroupProjection,
  ConsumerCopyRelation,
  DeclarationResolutionClaim,
  EffectiveConsumerResolution,
  EffectiveConsumerResolutionId,
  ParticipantDeclaration,
  ParticipantDeclarationId,
  PrivateRegistration,
  PrivateRegistrationId,
  ResolvedDependencyCopy,
  ResolvedDependencyCopyId,
  SharedExternalId,
  VersionRegistration,
  VersionRegistrationId,
} from '../../shared/store/resolution';

export {
  GLOBAL_SCOPE,
  STRICT_SCOPE,
  chunkFileClaim,
  packageId,
  participantDisplay,
} from '../../shared/view-conventions';
import { STRICT_SCOPE, packageId, participantDisplay } from '../../shared/view-conventions';

/** One version registration of the group with its declarations, registry order. */
export interface RegistrationGroup {
  registration: VersionRegistration;
  declarations: ParticipantDeclaration[];
}

/**
 * The canonical (share scope, package) group every Packages half consumes.
 * Groups exist per shared-external record only — an empty share scope
 * manufactures no packages, and private registrations stay with Remotes.
 */
export interface PackageGroup {
  id: string;
  scope: string;
  packageName: string;
  registrations: RegistrationGroup[];
  /**
   * Source-first attributed copies (same attribution rule as
   * `packageMeasures`): a source-identified copy joins its source's
   * external; a copy without a unique source joins each consumer registry
   * package of its share-scope contexts.
   */
  copies: ResolvedDependencyCopy[];
  /** Distinct non-null resolved tags across the group's copies, copy order. */
  resolvedTags: string[];
  /** Copies of the group without a uniquely evidenced source tag. */
  unknownTagCopyCount: number;
  /**
   * More than one distinct version RESOLVES in this share scope. Copy
   * multiplicity with one resolved tag never sets it, and the strict scope
   * shares side by side by design and never flags.
   */
  multiVersion: boolean;
}

/** ID-keyed lookups over the canonical read surface; built once per vm. */
export interface CanonicalIndexes {
  declarationById: Map<ParticipantDeclarationId, ParticipantDeclaration>;
  registrationById: Map<VersionRegistrationId, VersionRegistration>;
  privateRegistrationById: Map<PrivateRegistrationId, PrivateRegistration>;
  resolutionById: Map<EffectiveConsumerResolutionId, EffectiveConsumerResolution>;
  claimsByDeclaration: Map<ParticipantDeclarationId, DeclarationResolutionClaim[]>;
  copyById: Map<ResolvedDependencyCopyId, ResolvedDependencyCopy>;
  relationsByCopy: Map<ResolvedDependencyCopyId, ConsumerCopyRelation[]>;
  bundleClaimById: Map<BundleClaimId, BundleClaim>;
  chunkGroupById: Map<ChunkGroupId, ChunkGroupProjection>;
}

export function buildCanonicalIndexes(model: FederationModel): CanonicalIndexes {
  const projection = model.resolutionProjection;
  const claimsByDeclaration = new Map<ParticipantDeclarationId, DeclarationResolutionClaim[]>();
  for (const claim of projection.declarationResolutionClaims) {
    if (claim.subject.kind !== 'shared') {
      continue;
    }
    const declarationId = claim.subject.participantDeclarationId;
    claimsByDeclaration.set(declarationId, [
      ...(claimsByDeclaration.get(declarationId) ?? []),
      claim,
    ]);
  }
  const relationsByCopy = new Map<ResolvedDependencyCopyId, ConsumerCopyRelation[]>();
  for (const relation of projection.consumerRelations) {
    relationsByCopy.set(relation.copyId, [
      ...(relationsByCopy.get(relation.copyId) ?? []),
      relation,
    ]);
  }
  return {
    declarationById: new Map(
      model.registryEvidence.participantDeclarations.map((record) => [record.id, record]),
    ),
    registrationById: new Map(
      model.registryEvidence.versionRegistrations.map((record) => [record.id, record]),
    ),
    privateRegistrationById: new Map(
      model.registryEvidence.privateRegistrations.map((record) => [record.id, record]),
    ),
    resolutionById: new Map(
      model.effectiveConsumerResolutions.map((resolution) => [resolution.id, resolution]),
    ),
    claimsByDeclaration,
    copyById: new Map(projection.copies.map((copy) => [copy.id, copy])),
    relationsByCopy,
    bundleClaimById: new Map(projection.bundleClaims.map((claim) => [claim.id, claim])),
    chunkGroupById: new Map(projection.chunkGroups.map((group) => [group.id, group])),
  };
}

/**
 * Source remote of a copy — the participant/owner of its uniquely evidenced
 * source record; null for URL-identified copies (no source claim is made).
 */
export function copySourceRemote(
  copy: ResolvedDependencyCopy,
  indexes: CanonicalIndexes,
): string | null {
  switch (copy.source.kind) {
    case 'shared-declaration':
      return indexes.declarationById.get(copy.source.declarationId)?.participant ?? null;
    case 'private-registration':
      return indexes.privateRegistrationById.get(copy.source.registrationId)?.ownerRemote ?? null;
    case 'target-url':
      return null;
  }
}

/** Display form of a copy's source remote; null when no source is evidenced. */
export function copySourceDisplay(
  copy: ResolvedDependencyCopy,
  indexes: CanonicalIndexes,
): string | null {
  const remote = copySourceRemote(copy, indexes);
  return remote === null ? null : participantDisplay(remote);
}

export function isHostRemote(name: string | null): boolean {
  return name === NF_HOST;
}

/**
 * The declaration's claim for the group's own package specifier, else its
 * first claim (secondary-entrypoint declarations claim subpath specifiers).
 */
export function mainClaimOf(
  declaration: ParticipantDeclaration,
  packageName: string,
  indexes: CanonicalIndexes,
): DeclarationResolutionClaim | null {
  const claims = indexes.claimsByDeclaration.get(declaration.id) ?? [];
  return claims.find((claim) => claim.specifier === packageName) ?? claims[0] ?? null;
}

/**
 * Base package the group's name extends (`name-derived`): the SHORTEST
 * same-scope prefix that exists as a group. The shortest existing prefix has
 * no existing prefix itself, so every linked subpath — however deep — hangs
 * directly under a base row and the flat two-level list loses no package.
 */
export function parentOf(
  group: PackageGroup,
  byId: ReadonlyMap<string, PackageGroup>,
): PackageGroup | null {
  let index = group.packageName.indexOf('/');
  while (index > 0 && index < group.packageName.length - 1) {
    const candidate = byId.get(packageId(group.scope, group.packageName.slice(0, index)));
    if (candidate !== undefined && candidate !== group) {
      return candidate;
    }
    index = group.packageName.indexOf('/', index + 1);
  }
  return null;
}

/** Whether any declaration claim of the group resolves to a canonical copy. */
export function groupHasMappedClaim(group: PackageGroup, indexes: CanonicalIndexes): boolean {
  return group.registrations.some(({ declarations }) =>
    declarations.some((declaration) =>
      (indexes.claimsByDeclaration.get(declaration.id) ?? []).some(
        (claim) => claim.copyId !== null,
      ),
    ),
  );
}

/**
 * Honest wording for a group without any attributed copy: only when no claim
 * maps at all is the import map the reason — bindings can legitimately
 * resolve to copies attributed to OTHER packages (cross-external anchor,
 * converging specifiers), and that must not read as a missing binding.
 */
export function noCopyNoteOf(group: PackageGroup, indexes: CanonicalIndexes): string {
  return groupHasMappedClaim(group, indexes)
    ? 'no source copy is attributed to this package — its bindings resolve to copies of other packages'
    : 'declared, but no import-map binding resolves this package in this capture';
}

/** Display file name of a target URL — its last path segment (query/hash stripped). */
export function targetFileName(targetUrl: string): string {
  const withoutQuery = targetUrl.split(/[?#]/, 1)[0];
  const segments = withoutQuery.split('/').filter((segment) => segment.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : targetUrl;
}

/** Whether the group flags resolved-version multiplicity (never in `strict`). */
export function multiVersionOf(scope: string, resolvedTags: string[]): boolean {
  return scope !== STRICT_SCOPE && resolvedTags.length > 1;
}

/**
 * Groups a copy to its Packages rows, source-first (the `packageMeasures`
 * attribution rule): a shared-declaration source joins its external's
 * (scope, package); private-registration sources stay out of the shared
 * list; a copy without a unique source joins each consumer registry package
 * of its share-scope resolution contexts.
 */
export function copyGroupIds(
  copy: ResolvedDependencyCopy,
  indexes: CanonicalIndexes,
  knownGroupIds: ReadonlySet<string>,
  groupIdBySharedExternal: ReadonlyMap<SharedExternalId, string>,
): string[] {
  if (copy.source.kind === 'shared-declaration') {
    const declaration = indexes.declarationById.get(copy.source.declarationId);
    const registration =
      declaration === undefined
        ? undefined
        : indexes.registrationById.get(declaration.versionRegistrationId);
    const groupId =
      registration === undefined
        ? undefined
        : groupIdBySharedExternal.get(registration.sharedExternalId);
    return groupId === undefined ? [] : [groupId];
  }
  if (copy.source.kind === 'private-registration') {
    return [];
  }
  const ids = new Set<string>();
  for (const context of copy.resolutionContexts) {
    if (context.resolutionDomain.kind !== 'share-scope') {
      continue;
    }
    const id = packageId(context.resolutionDomain.name, context.consumerRegistryPackage);
    if (knownGroupIds.has(id)) {
      ids.add(id);
    }
  }
  return [...ids];
}
