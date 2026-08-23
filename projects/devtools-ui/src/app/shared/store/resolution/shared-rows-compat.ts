import type { ServedFileV1 } from 'devtools-bridge';

import type { EffectiveResolution, SharedParticipantRow } from '../federation-model';
import { compareSemver } from '../semver-compare';
import type {
  CanonicalRegistryEvidence,
  EffectiveConsumerResolution,
  EntrypointCandidate,
  RegistryEvidenceId,
} from './model';

export interface SharedRowsCompatibilityContext {
  effectiveConsumerResolutions: readonly EffectiveConsumerResolution[];
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
  const resolutionsByConsumer = indexResolutionsByConsumer(context.effectiveConsumerResolutions);

  const rows = evidence.participantDeclarations.map((declaration): SharedParticipantRow => {
    const registration = requireRecord(
      versionsById,
      declaration.versionRegistrationId,
      'version registration',
    );
    const shared = requireRecord(sharedById, registration.sharedExternalId, 'shared external');
    const effectiveResolution = requireConsumerResolution(
      resolutionsByConsumer,
      declaration.participant,
      shared.packageName,
    );

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
      resolution: projectEffectiveResolution(effectiveResolution),
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

function indexResolutionsByConsumer(
  resolutions: readonly EffectiveConsumerResolution[],
): ReadonlyMap<string, ReadonlyMap<string, EffectiveConsumerResolution>> {
  const byConsumer = new Map<string, Map<string, EffectiveConsumerResolution>>();
  for (const resolution of resolutions) {
    for (const consumerRemote of resolution.consumerRemotes) {
      let bySpecifier = byConsumer.get(consumerRemote);
      if (bySpecifier === undefined) {
        bySpecifier = new Map();
        byConsumer.set(consumerRemote, bySpecifier);
      }
      if (bySpecifier.has(resolution.specifier)) {
        throw new Error(
          `Multiple effective resolutions for consumer ${consumerRemote} and specifier ${resolution.specifier}`,
        );
      }
      bySpecifier.set(resolution.specifier, resolution);
    }
  }
  return byConsumer;
}

function requireConsumerResolution(
  resolutionsByConsumer: ReadonlyMap<string, ReadonlyMap<string, EffectiveConsumerResolution>>,
  consumerRemote: string,
  specifier: string,
): EffectiveConsumerResolution {
  const resolution = resolutionsByConsumer.get(consumerRemote)?.get(specifier);
  if (resolution === undefined) {
    throw new Error(
      `Missing effective resolution for consumer ${consumerRemote} and specifier ${specifier}`,
    );
  }
  return resolution;
}

function projectEffectiveResolution(
  resolution: EffectiveConsumerResolution,
): EffectiveResolution | null {
  switch (resolution.status) {
    case 'mapped':
      return { targetUrl: resolution.targetUrl, hasIntegrity: resolution.hasIntegrity };
    case 'unmapped':
    case 'blocked':
    case 'unknown':
      return null;
  }
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
