import type {
  ObservedTargetProvider,
  ResolutionSubject,
  SourceMatch,
  SourceMatchOutcome,
} from './claims-model';
import { encodeRegistryIdTuple, registryEvidenceId } from './ids';
import type {
  CanonicalRegistryEvidence,
  EffectiveConsumerResolution,
  EntrypointCandidate,
  EntrypointCandidateId,
  EvidenceProvenance,
  EvidenceRef,
} from './model';

export interface ObservedTargetAttributionContext {
  /** Remote name -> normalized resolved scope root used for prefix ownership. */
  remoteScopeUrlByName: ReadonlyMap<string, string>;
  /** The host remote name; the host never outranks a matching non-host remote. */
  hostRemote: string;
}

export interface ObservedTargetAttribution {
  observedTargetProviders: ObservedTargetProvider[];
  sourceMatches: SourceMatch[];
}

/**
 * Attributes every mapped effective target through one ladder over the
 * complete candidate index: unique exact candidate, ambiguous exact
 * candidates, unique most-specific non-host scope, equally specific ambiguous
 * scopes, host fallback, then unattributable. Exact URL equality always
 * outranks scope-prefix ownership; no outcome proves runtime delivery.
 */
export function attributeObservedTargetProviders(
  evidence: CanonicalRegistryEvidence,
  resolutions: readonly EffectiveConsumerResolution[],
  context: ObservedTargetAttributionContext,
): ObservedTargetAttribution {
  const candidatesBySpecifier = new Map<string, EntrypointCandidate[]>();
  for (const candidate of evidence.entrypointCandidates) {
    const list = candidatesBySpecifier.get(candidate.specifier) ?? [];
    list.push(candidate);
    candidatesBySpecifier.set(candidate.specifier, list);
  }

  const observedTargetProviders: ObservedTargetProvider[] = [];
  const sourceMatches: SourceMatch[] = [];
  for (const resolution of resolutions) {
    const attribution = attributeResolution(resolution, candidatesBySpecifier, context);
    observedTargetProviders.push(attribution.provider);
    sourceMatches.push(attribution.sourceMatch);
  }
  return { observedTargetProviders, sourceMatches };
}

/** Resolves the subject that owns one entrypoint candidate. */
export function candidateSubject(candidate: EntrypointCandidate): ResolutionSubject {
  switch (candidate.sourceRecord.kind) {
    case 'participant-file':
    case 'participant-entry':
      return {
        kind: 'shared',
        participantDeclarationId: candidate.sourceRecord.participantDeclarationId,
      };
    case 'private-entry':
      return {
        kind: 'private',
        privateRegistrationId: candidate.sourceRecord.privateRegistrationId,
      };
  }
}

interface ResolvedAttribution {
  provider: ObservedTargetProvider;
  sourceMatch: SourceMatch;
}

function attributeResolution(
  resolution: EffectiveConsumerResolution,
  candidatesBySpecifier: ReadonlyMap<string, EntrypointCandidate[]>,
  context: ObservedTargetAttributionContext,
): ResolvedAttribution {
  if (resolution.status !== 'mapped') {
    return assemble(resolution, {
      outcome: 'unknown',
      remote: null,
      rule: 'none',
      source: null,
      candidateIds: [],
      provenance: { evidence: [] },
    });
  }

  const target = resolution.targetUrl;
  const exactMatches = (candidatesBySpecifier.get(resolution.specifier) ?? []).filter(
    (candidate) => candidate.candidateUrl !== null && candidate.candidateUrl === target,
  );
  if (exactMatches.length > 0) {
    const subjects = new Map<string, ResolutionSubject>();
    for (const candidate of exactMatches) {
      const subject = candidateSubject(candidate);
      subjects.set(encodeRegistryIdTuple([subject.kind, subjectRecordId(subject)]), subject);
    }
    const candidateIds = exactMatches.map((candidate) => candidate.id);
    const provenance: EvidenceProvenance = {
      evidence: exactMatches.flatMap((candidate) => candidate.provenance.evidence),
    };
    if (subjects.size === 1) {
      const [source] = subjects.values();
      return assemble(resolution, {
        outcome: 'exact-candidate',
        remote: exactMatches[0].ownerRemote,
        rule: 'exact-candidate',
        source,
        candidateIds,
        provenance,
      });
    }
    return assemble(resolution, {
      outcome: 'ambiguous-candidate',
      remote: null,
      rule: 'none',
      source: null,
      candidateIds,
      provenance,
    });
  }

  const matches = [...context.remoteScopeUrlByName.entries()]
    .filter(([, scopeUrl]) => target.startsWith(scopeUrl))
    .sort((a, b) => b[1].length - a[1].length || compareText(a[0], b[0]));
  const nonHost = matches.filter(([name]) => name !== context.hostRemote);
  const host = matches.find(([name]) => name === context.hostRemote);
  if (nonHost.length > 0) {
    const topLength = nonHost[0][1].length;
    const top = nonHost.filter(([, scopeUrl]) => scopeUrl.length === topLength);
    const provenance: EvidenceProvenance = {
      evidence: top.map(([name]) => scopeEvidence(name)),
    };
    if (top.length === 1) {
      return assemble(resolution, {
        outcome: 'scope-derived',
        remote: top[0][0],
        rule: 'scope-prefix-match',
        source: null,
        candidateIds: [],
        provenance,
      });
    }
    return assemble(resolution, {
      outcome: 'ambiguous-scope',
      remote: null,
      rule: 'none',
      source: null,
      candidateIds: [],
      provenance,
    });
  }
  if (host !== undefined) {
    return assemble(resolution, {
      outcome: 'host-fallback',
      remote: host[0],
      rule: 'host-fallback',
      source: null,
      candidateIds: [],
      provenance: { evidence: [scopeEvidence(host[0])] },
    });
  }
  return assemble(resolution, {
    outcome: 'unattributable',
    remote: null,
    rule: 'none',
    source: null,
    candidateIds: [],
    provenance: {
      evidence: [{ source: 'snapshot', path: ['runtime', 'remotes'], state: 'present' }],
    },
  });
}

function assemble(
  resolution: EffectiveConsumerResolution,
  outcome: {
    outcome: SourceMatchOutcome;
    remote: string | null;
    rule: ObservedTargetProvider['rule'];
    source: ResolutionSubject | null;
    candidateIds: EntrypointCandidateId[];
    provenance: EvidenceProvenance;
  },
): ResolvedAttribution {
  const providerId = registryEvidenceId(
    'observed-target-provider',
    [resolution.id, outcome.outcome],
    0,
  );
  return {
    provider: {
      id: providerId,
      resolutionId: resolution.id,
      remote: outcome.remote,
      outcome: outcome.outcome,
      rule: outcome.rule,
      provenance: outcome.provenance,
    },
    sourceMatch: {
      resolutionId: resolution.id,
      outcome: outcome.outcome,
      source: outcome.source,
      candidateIds: outcome.candidateIds,
      observedTargetProviderId: providerId,
      provenance: outcome.provenance,
    },
  };
}

function subjectRecordId(subject: ResolutionSubject): string {
  return subject.kind === 'shared'
    ? subject.participantDeclarationId
    : subject.privateRegistrationId;
}

function scopeEvidence(remoteName: string): EvidenceRef {
  return {
    source: 'snapshot',
    path: ['runtime', 'remotes', remoteName, 'scopeUrl'],
    state: 'present',
  };
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
