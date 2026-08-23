import type { EffectiveMap } from '../federation-model';
import { encodeRegistryIdTuple } from './ids';
import type {
  CanonicalRegistryEvidence,
  EffectiveConsumerResolution,
  EffectiveConsumerResolutionBlockedReason,
  EffectiveConsumerResolutionId,
  EffectiveConsumerResolutionUnknownReason,
  EffectiveMapEntryProvenance,
  RegistryEvidenceId,
} from './model';

export interface ResolveEffectiveConsumerBindingsContext {
  pageUrl: string;
  mapAvailable: boolean;
  effectiveMap: EffectiveMap;
  /** Consumer remote name -> normalized scope-root lookup context; absence is missing evidence. */
  consumerScopeUrlByRemote: ReadonlyMap<string, string>;
}

interface ConsumerClaimGroup {
  scopeContextKey: string;
  consumerScopeUrl: string | null;
  specifier: string;
  consumerRemotes: Set<string>;
}

interface EffectiveMapMatch {
  targetUrl: string;
  mapEntry: EffectiveMapEntryProvenance;
}

type SpecifierMapResult =
  | { state: 'matched'; match: EffectiveMapMatch }
  | {
      state: 'blocked';
      mapEntry: EffectiveMapEntryProvenance;
      blockedReason: EffectiveConsumerResolutionBlockedReason;
    }
  | { state: 'miss' };

type TargetNormalizationResult =
  | { state: 'normalized'; targetUrl: string }
  | { state: 'blocked'; blockedReason: EffectiveConsumerResolutionBlockedReason };

interface NormalizedSpecifier {
  value: string;
  asUrl: URL | null;
}

/**
 * Evaluates the import-map binding for every canonical resolution claim
 * exactly once per normalized consumer scope context (or per-consumer missing
 * sentinel) and specifier. The resolution domain is the closed claims set:
 * each shared declaration's registry package plus every candidate specifier,
 * and every private registration's candidate specifiers. Browser URL fallback
 * is deliberately outside this model.
 */
export function resolveEffectiveConsumerBindings(
  evidence: CanonicalRegistryEvidence,
  context: ResolveEffectiveConsumerBindingsContext,
): EffectiveConsumerResolution[] {
  const sharedById = new Map(evidence.sharedExternals.map((record) => [record.id, record]));
  const versionsById = new Map(
    evidence.versionRegistrations.map((registration) => [registration.id, registration]),
  );
  const candidatesById = new Map(
    evidence.entrypointCandidates.map((candidate) => [candidate.id, candidate]),
  );
  const groups = new Map<string, ConsumerClaimGroup>();

  const registerClaim = (consumerRemote: string, specifier: string): void => {
    const consumerScopeUrl = context.consumerScopeUrlByRemote.get(consumerRemote) ?? null;
    const scopeContextKey = scopeContextKeyFor(consumerRemote, consumerScopeUrl);
    const groupKey = encodeRegistryIdTuple([scopeContextKey, specifier]);
    const existing = groups.get(groupKey);

    if (existing === undefined) {
      groups.set(groupKey, {
        scopeContextKey,
        consumerScopeUrl,
        specifier,
        consumerRemotes: new Set([consumerRemote]),
      });
    } else {
      existing.consumerRemotes.add(consumerRemote);
    }
  };

  for (const declaration of evidence.participantDeclarations) {
    const registration = requireRecord(
      versionsById,
      declaration.versionRegistrationId,
      'version registration',
    );
    const shared = requireRecord(sharedById, registration.sharedExternalId, 'shared external');
    registerClaim(declaration.participant, shared.packageName);
    for (const candidateId of declaration.entrypointCandidateIds) {
      const candidate = requireRecord(candidatesById, candidateId, 'entrypoint candidate');
      registerClaim(declaration.participant, candidate.specifier);
    }
  }

  for (const privateRegistration of evidence.privateRegistrations) {
    for (const candidateId of privateRegistration.entrypointCandidateIds) {
      const candidate = requireRecord(candidatesById, candidateId, 'entrypoint candidate');
      registerClaim(privateRegistration.ownerRemote, candidate.specifier);
    }
  }

  return [...groups.values()]
    .sort(
      (a, b) =>
        compareText(a.scopeContextKey, b.scopeContextKey) || compareText(a.specifier, b.specifier),
    )
    .map((group) => assembleResolution(group, context));
}

/** Matching scopes, most-specific first, using the import-map scope applicability rule. */
function enumerateMatchingScopes(
  scopes: Readonly<Record<string, Record<string, string>>>,
  importerUrl: string,
): string[] {
  return Object.keys(scopes)
    .filter(
      (scope) => scope === importerUrl || (scope.endsWith('/') && importerUrl.startsWith(scope)),
    )
    .sort((a, b) => b.length - a.length || compareText(b, a));
}

/** Standards-style lookup through every applicable scope, then top-level imports. */
function resolveEffectiveMapMatch(
  effectiveMap: EffectiveMap,
  importerUrl: string,
  specifier: string,
  pageUrl: string,
): SpecifierMapResult {
  const normalizedSpecifier = normalizeConsumerSpecifier(specifier, importerUrl);

  for (const scope of enumerateMatchingScopes(effectiveMap.scopes, importerUrl)) {
    const result = matchSpecifierMap(
      effectiveMap.scopes[scope],
      normalizedSpecifier,
      pageUrl,
      scope,
    );
    if (result.state !== 'miss') {
      return result;
    }
  }

  return matchSpecifierMap(effectiveMap.imports, normalizedSpecifier, pageUrl, null);
}

function assembleResolution(
  group: ConsumerClaimGroup,
  context: ResolveEffectiveConsumerBindingsContext,
): EffectiveConsumerResolution {
  const base = {
    id: effectiveConsumerResolutionId(group.scopeContextKey, group.specifier),
    scopeContextKey: group.scopeContextKey,
    consumerScopeUrl: group.consumerScopeUrl,
    specifier: group.specifier,
    consumerRemotes: [...group.consumerRemotes].sort(compareText),
  };
  const unknownReasons: EffectiveConsumerResolutionUnknownReason[] = [];
  if (!context.mapAvailable || group.consumerScopeUrl === null) {
    if (!context.mapAvailable) {
      unknownReasons.push('missing-map-channel');
    }
    if (group.consumerScopeUrl === null) {
      unknownReasons.push('missing-consumer-scope');
    }
    return {
      ...base,
      status: 'unknown',
      targetUrl: null,
      mapEntry: null,
      unknownReasons,
    };
  }

  const lookup = resolveEffectiveMapMatch(
    context.effectiveMap,
    group.consumerScopeUrl,
    group.specifier,
    context.pageUrl,
  );
  if (lookup.state === 'miss') {
    return { ...base, status: 'unmapped', targetUrl: null, mapEntry: null };
  }
  if (lookup.state === 'blocked') {
    return {
      ...base,
      status: 'blocked',
      targetUrl: null,
      mapEntry: lookup.mapEntry,
      blockedReason: lookup.blockedReason,
    };
  }

  return {
    ...base,
    status: 'mapped',
    targetUrl: lookup.match.targetUrl,
    hasIntegrity: hasOwn(context.effectiveMap.integrity, lookup.match.targetUrl),
    mapEntry: lookup.match.mapEntry,
  };
}

function matchSpecifierMap(
  specifierMap: Readonly<Record<string, string>>,
  normalizedSpecifier: NormalizedSpecifier,
  pageUrl: string,
  scope: string | null,
): SpecifierMapResult {
  const exactTarget = readKey(specifierMap, normalizedSpecifier.value);
  if (exactTarget !== undefined) {
    return mapEntryResult(normalizedSpecifier.value, exactTarget, null, pageUrl, scope, 'exact');
  }

  if (normalizedSpecifier.asUrl !== null && !isSpecialUrl(normalizedSpecifier.asUrl)) {
    return { state: 'miss' };
  }

  const prefixKeys = Object.keys(specifierMap)
    .filter((key) => key.endsWith('/') && normalizedSpecifier.value.startsWith(key))
    .sort((a, b) => b.length - a.length || compareText(b, a));

  for (const key of prefixKeys) {
    return mapEntryResult(
      key,
      specifierMap[key],
      normalizedSpecifier.value.slice(key.length),
      pageUrl,
      scope,
      'prefix',
    );
  }
  return { state: 'miss' };
}

function mapEntryResult(
  entrySpecifier: string,
  entryTarget: string,
  suffix: string | null,
  pageUrl: string,
  scope: string | null,
  match: 'exact' | 'prefix',
): Exclude<SpecifierMapResult, { state: 'miss' }> {
  const mapEntry: EffectiveMapEntryProvenance = {
    source: 'effective-import-map',
    scope,
    specifier: entrySpecifier,
    target: entryTarget,
    match,
  };
  const target = normalizeMappedTarget(entryTarget, suffix, pageUrl);
  if (target.state === 'blocked') {
    return { state: 'blocked', mapEntry, blockedReason: target.blockedReason };
  }
  return {
    state: 'matched',
    match: { targetUrl: target.targetUrl, mapEntry },
  };
}

/** Normalizes an exact target or safely appends one valid package-prefix suffix. */
function normalizeMappedTarget(
  entryTarget: string,
  suffix: string | null,
  pageUrl: string,
): TargetNormalizationResult {
  let normalizedTarget: URL;
  try {
    normalizedTarget = new URL(entryTarget, pageUrl);
  } catch {
    return { state: 'blocked', blockedReason: 'invalid-target-url' };
  }
  if (suffix === null) {
    return { state: 'normalized', targetUrl: normalizedTarget.href };
  }
  if (!normalizedTarget.href.endsWith('/')) {
    return { state: 'blocked', blockedReason: 'prefix-target-missing-trailing-slash' };
  }

  let resolved: URL;
  try {
    resolved = new URL(suffix, normalizedTarget);
  } catch {
    return { state: 'blocked', blockedReason: 'invalid-prefix-expansion' };
  }
  if (!resolved.href.startsWith(normalizedTarget.href)) {
    return { state: 'blocked', blockedReason: 'prefix-target-backtracking' };
  }
  return { state: 'normalized', targetUrl: resolved.href };
}

function normalizeConsumerSpecifier(specifier: string, importerUrl: string): NormalizedSpecifier {
  if (!isUrlLikeSpecifier(specifier)) {
    return { value: specifier, asUrl: null };
  }
  try {
    const asUrl = new URL(specifier, importerUrl);
    return { value: asUrl.href, asUrl };
  } catch {
    return { value: specifier, asUrl: null };
  }
}

function isUrlLikeSpecifier(specifier: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(specifier) ||
    specifier.startsWith('/') ||
    specifier.startsWith('./') ||
    specifier.startsWith('../')
  );
}

function isSpecialUrl(url: URL): boolean {
  return ['ftp:', 'file:', 'http:', 'https:', 'ws:', 'wss:'].includes(url.protocol);
}

function scopeContextKeyFor(consumerRemote: string, consumerScopeUrl: string | null): string {
  return consumerScopeUrl === null
    ? encodeRegistryIdTuple(['missing-scope-context', consumerRemote])
    : encodeRegistryIdTuple(['scope-context', consumerScopeUrl]);
}

function effectiveConsumerResolutionId(
  scopeContextKey: string,
  specifier: string,
): EffectiveConsumerResolutionId {
  return `effective-consumer-resolution:${encodeRegistryIdTuple([
    scopeContextKey,
    specifier,
  ])}` as EffectiveConsumerResolutionId;
}

function requireRecord<IdKind extends string, RecordType>(
  records: ReadonlyMap<RegistryEvidenceId<IdKind>, RecordType>,
  id: RegistryEvidenceId<IdKind>,
  label: string,
): RecordType {
  const record = records.get(id);
  if (record === undefined) {
    throw new Error(`Canonical evidence references a missing ${label}: ${id}`);
  }
  return record;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function readKey(record: Readonly<Record<string, string>>, key: string): string | undefined {
  return hasOwn(record, key) ? record[key] : undefined;
}

function hasOwn(record: Readonly<Record<string, unknown>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
