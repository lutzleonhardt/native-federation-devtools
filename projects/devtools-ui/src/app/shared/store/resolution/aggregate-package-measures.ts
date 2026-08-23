import type { DeclarationResolutionClaim } from './claims-model';
import type { PackageResolutionMeasures, ResolvedDependencyCopy } from './copies-model';
import type { CanonicalRegistryEvidence } from './model';

/**
 * Aggregates the canonical package-level measures. Registration and declared
 * tag counts describe shared registry intent — they come from
 * `VersionRegistration[]` only; private registrations are separate canonical
 * records and never fold into the headline counts. Copy and resolved-tag
 * counts describe materialized outcome, and declaration/claim counts stay
 * separate supporting measures. The aggregation never emits a
 * version-conflict statement; that judgement needs distinct registration and
 * tag evidence and belongs to diagnostics, not to counting.
 *
 * Copies attribute source-oriented: a source-identified copy counts under its
 * source package only, while a copy without a unique source counts under each
 * registry package its consumer contexts declared. A copy with neither stays
 * visible in the copy list but appears in no package row.
 */
export function aggregatePackageMeasures(
  evidence: CanonicalRegistryEvidence,
  declarationResolutionClaims: readonly DeclarationResolutionClaim[],
  copies: readonly ResolvedDependencyCopy[],
): PackageResolutionMeasures[] {
  interface Accumulator {
    registrationCount: number;
    declaredTags: Set<string>;
    copyCount: number;
    resolvedTags: Set<string>;
    unknownResolvedTagCopyCount: number;
    declarationCount: number;
    claimCount: number;
  }
  const byPackage = new Map<string, Accumulator>();
  const accumulator = (packageName: string): Accumulator => {
    let entry = byPackage.get(packageName);
    if (entry === undefined) {
      entry = {
        registrationCount: 0,
        declaredTags: new Set(),
        copyCount: 0,
        resolvedTags: new Set(),
        unknownResolvedTagCopyCount: 0,
        declarationCount: 0,
        claimCount: 0,
      };
      byPackage.set(packageName, entry);
    }
    return entry;
  };

  const packageBySharedId = new Map(
    evidence.sharedExternals.map((record) => [record.id, record.packageName]),
  );
  const packageByRegistrationId = new Map<string, string>();
  for (const registration of evidence.versionRegistrations) {
    const packageName = requirePackage(packageBySharedId, registration.sharedExternalId);
    packageByRegistrationId.set(registration.id, packageName);
    const entry = accumulator(packageName);
    entry.registrationCount += 1;
    entry.declaredTags.add(registration.tag);
  }
  for (const declaration of evidence.participantDeclarations) {
    const packageName = requirePackage(packageByRegistrationId, declaration.versionRegistrationId);
    accumulator(packageName).declarationCount += 1;
  }
  for (const claim of declarationResolutionClaims) {
    accumulator(claim.consumerRegistryPackage).claimCount += 1;
  }
  for (const copy of copies) {
    const packages =
      copy.sourcePackage !== null
        ? [copy.sourcePackage]
        : [...new Set(copy.resolutionContexts.map((context) => context.consumerRegistryPackage))];
    for (const packageName of packages) {
      const entry = accumulator(packageName);
      entry.copyCount += 1;
      if (copy.resolvedTag === null) {
        entry.unknownResolvedTagCopyCount += 1;
      } else {
        entry.resolvedTags.add(copy.resolvedTag);
      }
    }
  }

  return [...byPackage.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([packageName, entry]) => ({
      packageName,
      registrationCount: entry.registrationCount,
      distinctDeclaredTagCount: entry.declaredTags.size,
      resolvedCopyCount: entry.copyCount,
      distinctResolvedTagCount: entry.resolvedTags.size,
      unknownResolvedTagCopyCount: entry.unknownResolvedTagCopyCount,
      declarationCount: entry.declarationCount,
      claimCount: entry.claimCount,
    }));
}

function requirePackage<Key>(records: ReadonlyMap<Key, string>, id: Key): string {
  const packageName = records.get(id);
  if (packageName === undefined) {
    throw new Error(`Package aggregation references a missing parent record: ${String(id)}`);
  }
  return packageName;
}
