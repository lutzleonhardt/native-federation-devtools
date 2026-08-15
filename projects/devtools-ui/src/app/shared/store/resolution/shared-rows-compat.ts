import type { ServedFileV1 } from 'devtools-bridge';

import type { EffectiveMap, EffectiveResolution, SharedParticipantRow } from '../federation-model';
import { compareSemver } from '../semver-compare';
import type { CanonicalRegistryEvidence, EntrypointCandidate, RegistryEvidenceId } from './model';

export interface SharedRowsCompatibilityContext {
  pageUrl: string;
  scopeUrlByRemote: ReadonlyMap<string, string>;
  effectiveMap: EffectiveMap;
}

/**
 * One-way temporary projection for existing views. It may reproduce existing
 * row behavior, but it must never become input to canonical resolution logic.
 */
export function projectSharedRows(
  evidence: CanonicalRegistryEvidence,
  context: SharedRowsCompatibilityContext,
): SharedParticipantRow[] {
  const sharedById = new Map(evidence.sharedExternals.map((record) => [record.id, record]));
  const versionsById = new Map(
    evidence.versionRegistrations.map((registration) => [registration.id, registration]),
  );
  const candidatesById = new Map(
    evidence.entrypointCandidates.map((candidate) => [candidate.id, candidate]),
  );

  const rows = evidence.participantDeclarations.map((declaration): SharedParticipantRow => {
    const registration = requireRecord(
      versionsById,
      declaration.versionRegistrationId,
      'version registration',
    );
    const shared = requireRecord(sharedById, registration.sharedExternalId, 'shared external');
    const importerUrl = context.scopeUrlByRemote.get(declaration.participant) ?? context.pageUrl;

    return {
      scope: shared.shareScope,
      packageName: shared.packageName,
      tag: registration.tag,
      action: registration.rawAction,
      dirty: shared.dirty,
      host: registration.host,
      participant: declaration.participant,
      requiredVersion: declaration.requiredVersion,
      strictVersion: declaration.strictVersion,
      bundle: declaration.bundle,
      cached: declaration.cached,
      servedFiles: declaration.entrypointCandidateIds.map((candidateId) =>
        toServedFile(requireRecord(candidatesById, candidateId, 'entrypoint candidate')),
      ),
      generation: declaration.generation,
      resolution: resolveCompatibilityRow(shared.packageName, importerUrl, context.effectiveMap),
    };
  });

  rows.sort(
    (a, b) =>
      compareText(a.scope, b.scope) ||
      compareText(a.packageName, b.packageName) ||
      compareSemver(b.tag, a.tag) ||
      compareText(a.action, b.action),
    // Stable sort: participants within (tag, action) keep registry order.
  );
  return rows;
}

function toServedFile(candidate: EntrypointCandidate): ServedFileV1 {
  switch (candidate.sourceRecord.kind) {
    case 'participant-file':
      return { entry: null, file: candidate.file };
    case 'participant-entry':
      return { entry: candidate.specifier, file: candidate.file };
    case 'private-entry':
      throw new Error('Private entrypoint candidate cannot project to a shared row.');
  }
}

/**
 * Existing loader-style lookup retained only for compatibility rows:
 * matching import-map scopes first, then top-level imports.
 */
function resolveCompatibilityRow(
  specifier: string,
  importerUrl: string,
  effectiveMap: EffectiveMap,
): EffectiveResolution | null {
  const scopePrefixes = Object.keys(effectiveMap.scopes)
    .filter((scopeKey) => importerUrl.startsWith(scopeKey))
    .sort((a, b) => b.length - a.length);
  for (const scopeKey of scopePrefixes) {
    const target = readKey(effectiveMap.scopes[scopeKey], specifier);
    if (target !== undefined) {
      return { targetUrl: target, hasIntegrity: hasOwn(effectiveMap.integrity, target) };
    }
  }
  const target = readKey(effectiveMap.imports, specifier);
  if (target !== undefined) {
    return { targetUrl: target, hasIntegrity: hasOwn(effectiveMap.integrity, target) };
  }
  return null;
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

function readKey(record: Record<string, string>, key: string): string | undefined {
  return hasOwn(record, key) ? record[key] : undefined;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
