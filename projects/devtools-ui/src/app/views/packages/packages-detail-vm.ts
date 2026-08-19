/**
 * Detail half of the Packages vm builder — canonical resolution measures,
 * negotiation (version registrations with per-declaration claim states and
 * arrows), resolved copies with qualified sources, integrity, and the
 * bundle-claim chunk section (via `packages-chunk-vm.ts`).
 *
 * Claim doctrine (T7): every declaration stays visible with its canonical
 * mapping state — selected, not selected, anchored, self-filled, blocked,
 * not mapped, unknown — and the arrow says where the consumer binding
 * resolves. Source wording is qualified (registry slot, explicit anchor,
 * exact/observed target source, unknown); reasons ride along as tooltips.
 * Nothing here implies requests, downloads, or execution.
 */
import type { DeclaredVersion, ParticipantArrow } from '../../shared/kit/participant-row';
import type {
  DeclarationResolutionClaim,
  EffectiveConsumerResolution,
  ParticipantDeclaration,
  ResolvedCopyEffectiveRole,
  ResolvedCopySourceDisposition,
  ResolvedDependencyCopy,
  VersionRegistration,
} from '../../shared/store/resolution';
import { ACTION_NOTES, ACTION_SYMBOLS } from '../../shared/view-conventions';
import { ChunkSectionVm, buildChunkSection } from './packages-chunk-vm';
import {
  CanonicalIndexes,
  GLOBAL_SCOPE,
  PackageGroup,
  STRICT_SCOPE,
  copySourceRemote,
  isHostRemote,
  mainClaimOf,
  noCopyNoteOf,
  parentOf,
  participantDisplay,
  targetFileName,
} from './packages-vm-shared';

export { NEGOTIATION_LEGEND } from '../../shared/view-conventions';

/** Canonical four-count measures plus the honest residuals (named facts). */
export interface ResolutionMeasuresVm {
  registrations: number;
  declaredTags: number;
  resolvedCopies: number;
  resolvedTags: number;
  /** Copies without a uniquely evidenced source tag; 0 renders nothing. */
  unknownTagCopies: number;
  /** Supporting measure — a declaration count, nothing more. */
  declarations: number;
}

/** Canonical claim state of one declaration, with its grounded reason. */
export interface ParticipantStateVm {
  label:
    | 'selected'
    | 'not selected'
    | 'anchored'
    | 'self-filled'
    | 'blocked'
    | 'not mapped'
    | 'unknown'
    | 'declared';
  note: string;
}

/**
 * One further specifier claim of a multi-entrypoint declaration — every
 * claim stays visible, no state is collapsed into the main specifier.
 */
export interface DetailClaimVm {
  /** Canonical claim ID (render tracking key). */
  claimId: string;
  specifier: string;
  state: ParticipantStateVm | null;
  /** Resolved target file of the claim's binding; null when not mapped. */
  target: string | null;
}

export interface DetailParticipantVm {
  /** Canonical declaration ID (render tracking key — names can repeat). */
  declarationId: string;
  name: string;
  host: boolean;
  declared: DeclaredVersion;
  strict: boolean;
  /** Canonical claim state; null only for the quiet fallback arrow rows. */
  state: ParticipantStateVm | null;
  /** Where the consumer binding resolves; null = quiet selected norm. */
  arrow: ParticipantArrow | null;
  /** Claims of the declaration's OTHER specifiers (multi-entrypoint). */
  otherClaims: DetailClaimVm[];
  /** `select` payload for the /remotes cross-link. */
  remoteSelect: string;
}

export interface DetailVersionVm {
  /** Canonical registration ID (render tracking key — `(tag, action)` can repeat). */
  registrationId: string;
  symbol: string;
  tag: string;
  action: string;
  actionNote: string;
  isolated: { audience: string } | null;
  participants: DetailParticipantVm[];
}

/** One mapped entrypoint of a resolved copy (specifier → effective target). */
export interface CopyEntrypointVm {
  specifier: string;
  /** Display file name of the target (last URL segment). */
  file: string;
  targetUrl: string;
  hasIntegrity: boolean;
  /** `select` payload for the /import-map cross-link. */
  importMapSelect: string;
}

/** Qualified source wording of one resolved copy (T7 vocabulary). */
export interface CopySourceVm {
  /** Display form of the source remote; null when no source is evidenced. */
  display: string | null;
  host: boolean;
  /** `select` payload for the /remotes cross-link; null without a remote. */
  remoteSelect: string | null;
  qualifier:
    | 'exact-target-source'
    | 'explicit-anchor'
    | 'observed-target-source'
    | 'ambiguous-source'
    | 'unknown-source';
  label: string;
  note: string;
}

/** One resolved dependency copy of the package (canonical projection). */
export interface DetailCopyVm {
  /** Canonical copy ID (structural tuple; tooltip/debug data). */
  copyId: string;
  /** Tag of the uniquely matched source registration; null stays honest. */
  resolvedTag: string | null;
  source: CopySourceVm;
  /** Canonical source disposition, verbatim, with its grounded note. */
  disposition: { label: string; note: string };
  /** Canonical effective roles, verbatim, with grounded notes. */
  roles: { label: string; note: string }[];
  entrypoints: CopyEntrypointVm[];
}

export interface PackageDetailVm {
  packageId: string;
  packageName: string;
  scope: string;
  /** Display form of the scope — the `__GLOBAL__` sentinel reads as 'global'. */
  scopeDisplay: string;
  scopeLabel: string | null;
  strictScope: boolean;
  parent: { packageName: string; packageId: string; rule: 'name-derived' } | null;
  /** Canonical resolution counts of THIS (share scope, package) group. */
  measures: ResolutionMeasuresVm;
  /** Honest no-copy state: declared, but nothing resolves; null otherwise. */
  resolutionNote: string | null;
  negotiation: DetailVersionVm[];
  copies: DetailCopyVm[];
  /** Over the distinct resolved target URLs of this package's copies. */
  integrity: { withIntegrity: number; mappedTargets: number };
  chunks: ChunkSectionVm | null;
  /** Why the chunk section is absent when `chunks` is null. */
  chunksUnavailable: string | null;
}

const DISPOSITION_NOTES: Record<ResolvedCopySourceDisposition, string> = {
  'share-registration': 'the evidenced source is registered with action share',
  'scope-registration': 'the evidenced source is registered with action scope — an isolated copy',
  'skip-registration':
    'the evidenced source is registered with action skip — its copy still serves the binding',
  'private-registration': 'the evidenced source is a private (scoped) registration',
  'target-only': 'only the resolved target URL is evidenced — no source record matches',
  'ambiguous-source': 'several candidate sources match this target — none is chosen',
  'unknown-registration': 'the source registration carries an unrecognized action',
};

const ROLE_NOTES: Record<ResolvedCopyEffectiveRole, string> = {
  'ordinary-shared': 'the selected shared copy of its share scope',
  'isolated-own': 'mapped only for its own declarers',
  'self-filled-source': 'fills its consumer’s binding without an applicable shared source',
  'anchor-source': 'selected through an explicit servedBy anchor',
  'private-own': 'a private registration’s own mapping',
  unclassified: 'no closed rule explains this copy',
};

/**
 * Qualified source wording of one copy: explicit anchor when the copy
 * serves through `servedBy`, exact target source for a uniquely evidenced
 * record, observed target source for scope-prefix attribution, ambiguous
 * and unknown stay qualified. The registry-slot comparison rides along in
 * the note when slot evidence exists.
 */
function copySourceVmOf(copy: ResolvedDependencyCopy, indexes: CanonicalIndexes): CopySourceVm {
  const remote = copySourceRemote(copy, indexes);
  const display = remote === null ? null : participantDisplay(remote);
  const base = { display, host: isHostRemote(remote), remoteSelect: remote };

  let vm: CopySourceVm;
  if (copy.source.kind !== 'target-url') {
    if (copy.effectiveRoles.includes('anchor-source')) {
      vm = {
        ...base,
        qualifier: 'explicit-anchor',
        label: 'explicit anchor',
        note: 'selected through an explicit servedBy anchor of the registry evidence',
      };
    } else {
      vm = {
        ...base,
        qualifier: 'exact-target-source',
        label: 'exact target source',
        note: 'uniquely evidenced source record — its candidate URL matches the resolved target exactly',
      };
    }
  } else if (copy.sourceDisposition === 'ambiguous-source') {
    vm = {
      ...base,
      qualifier: 'ambiguous-source',
      label: 'ambiguous source',
      note: 'several candidate sources match this target — none is chosen',
    };
  } else if (
    copy.observedTargetProviders.some((provider) => provider.outcome === 'ambiguous-scope')
  ) {
    // Scope-level ambiguity chooses no remote (`remote: null`) — it must
    // stay a qualified ambiguity, never fall through to "unknown source".
    vm = {
      ...base,
      qualifier: 'ambiguous-source',
      label: 'ambiguous source',
      note: 'equally specific remote scope prefixes match this target — none is chosen',
    };
  } else {
    const observed = copy.observedTargetProviders.find(
      (provider) =>
        provider.remote !== null &&
        (provider.outcome === 'scope-derived' || provider.outcome === 'host-fallback'),
    );
    if (observed !== undefined) {
      vm = {
        display: participantDisplay(observed.remote!),
        host: isHostRemote(observed.remote),
        remoteSelect: observed.remote,
        qualifier: 'observed-target-source',
        label: 'observed target source',
        note:
          observed.outcome === 'host-fallback'
            ? 'attributed by scope-prefix match with the host as least-specific fallback — not an exact candidate match'
            : 'attributed by scope-prefix match — not an exact candidate match',
      };
    } else {
      vm = {
        ...base,
        qualifier: 'unknown-source',
        label: 'unknown source',
        note: 'only the resolved URL is evidenced — no source record or scope prefix matches',
      };
    }
  }

  const slots = copy.registryServingSlotClaims.filter((slot) => slot.status === 'basis-slot');
  if (slots.length > 0 && copy.source.kind === 'shared-declaration') {
    const declarationId = copy.source.declarationId;
    const matches = slots.some((slot) => slot.declarationId === declarationId);
    vm = {
      ...vm,
      note: `${vm.note}; ${
        matches
          ? 'matches the registry serving slot'
          : 'the registry serving slot names another declaration'
      }`,
    };
  }
  return vm;
}

/** State + arrow of one declaration from its canonical main claim. */
function participantResolution(
  declaration: ParticipantDeclaration,
  registration: VersionRegistration,
  claim: DeclarationResolutionClaim | null,
  indexes: CanonicalIndexes,
): { state: ParticipantStateVm | null; arrow: ParticipantArrow | null } {
  if (claim === null) {
    return {
      state: {
        label: 'declared',
        note: 'declaration without entrypoint candidates — no resolution claim derivable',
      },
      arrow: null,
    };
  }
  const resolution: EffectiveConsumerResolution | undefined = indexes.resolutionById.get(
    claim.effectiveResolutionId,
  );
  const copy = claim.copyId === null ? undefined : indexes.copyById.get(claim.copyId);
  const targetFile = resolution?.status === 'mapped' ? targetFileName(resolution.targetUrl) : null;
  const sourceRemote = copy === undefined ? null : copySourceRemote(copy, indexes);

  switch (claim.mappingState) {
    case 'own-selected':
      return {
        state: {
          label: 'selected',
          note: 'this declaration’s own candidate URL is the effective target of its consumer binding',
        },
        arrow: registration.action === 'scope' ? { kind: 'own' } : null,
      };
    case 'anchored': {
      const anchor = declaration.servedBy;
      const anchorDisplay = anchor === null ? 'unknown' : participantDisplay(anchor);
      const self = anchor !== null && anchor === declaration.participant;
      return {
        state: {
          label: 'anchored',
          note: `explicit servedBy anchor: ${anchorDisplay} — the binding resolves through the anchor's copy`,
        },
        arrow: self
          ? { kind: 'own' }
          : targetFile === null
            ? { kind: 'none', reason: 'anchored binding without a mapped target' }
            : { kind: 'winner', target: targetFile, provider: anchorDisplay },
      };
    }
    case 'self-filled':
      return {
        state: {
          label: 'self-filled',
          note: 'no applicable shared source — the consumer’s own copy fills the binding',
        },
        arrow: { kind: 'own' },
      };
    case 'fallback':
      return {
        state: null,
        arrow:
          targetFile === null
            ? { kind: 'none', reason: 'binding without a mapped target' }
            : {
                kind: 'winner',
                target: targetFile,
                provider:
                  sourceRemote === null ? 'unknown source' : participantDisplay(sourceRemote),
              },
      };
    case 'not-selected':
      return {
        state: {
          label: 'not selected',
          note: 'declared, but the consumer binding resolves to another copy',
        },
        arrow:
          targetFile === null
            ? { kind: 'none', reason: 'binding without a mapped target' }
            : {
                kind: 'winner',
                target: targetFile,
                provider:
                  sourceRemote === null ? 'unknown source' : participantDisplay(sourceRemote),
              },
      };
    case 'blocked': {
      const reason =
        resolution?.status === 'blocked' ? resolution.blockedReason : 'blocked import-map entry';
      return {
        state: {
          label: 'blocked',
          note: `the matching import-map entry terminally blocks this binding (${reason})`,
        },
        arrow: { kind: 'none', reason: `blocked import-map entry (${reason})` },
      };
    }
    case 'unknown': {
      if (resolution?.status === 'unmapped') {
        return {
          state: {
            label: 'not mapped',
            note: 'no applicable import-map binding for this specifier in this capture',
          },
          arrow: { kind: 'none', reason: 'no import-map binding' },
        };
      }
      if (resolution?.status === 'unknown') {
        return {
          state: {
            label: 'unknown',
            note: `required evidence missing: ${resolution.unknownReasons.join(', ')}`,
          },
          arrow: { kind: 'none', reason: 'required evidence missing' },
        };
      }
      return {
        state: {
          label: 'unknown',
          note: 'mapping state not derivable from the captured evidence',
        },
        arrow: null,
      };
    }
  }
}

/** Kit declared-version — strict-scope rows render the exact tag, never a range. */
function declaredOf(
  declaration: ParticipantDeclaration,
  registration: VersionRegistration,
  scope: string,
): DeclaredVersion {
  return scope === STRICT_SCOPE
    ? { kind: 'pinned', tag: registration.tag }
    : { kind: 'range', range: declaration.requiredVersion };
}

function negotiationOf(group: PackageGroup, indexes: CanonicalIndexes): DetailVersionVm[] {
  return group.registrations.map(({ registration, declarations }) => ({
    registrationId: registration.id,
    symbol: ACTION_SYMBOLS[registration.action] ?? '·',
    tag: registration.tag,
    action: registration.action,
    actionNote:
      ACTION_NOTES[registration.action] ??
      `registry action recorded verbatim: ${registration.rawAction}`,
    isolated:
      registration.action === 'scope'
        ? {
            audience: declarations
              .map((declaration) => participantDisplay(declaration.participant))
              .join(', '),
          }
        : null,
    participants: declarations.map((declaration) => {
      const claims = indexes.claimsByDeclaration.get(declaration.id) ?? [];
      const claim = mainClaimOf(declaration, group.packageName, indexes);
      const { state, arrow } = participantResolution(declaration, registration, claim, indexes);
      // Every further specifier claim of the declaration stays visible with
      // its own state — a blocked or unmapped secondary entrypoint must not
      // vanish behind the main specifier's claim.
      const otherClaims = claims
        .filter((candidate) => candidate !== claim)
        .map((candidate) => {
          const line = participantResolution(declaration, registration, candidate, indexes);
          return {
            claimId: candidate.id,
            specifier: candidate.specifier,
            state: line.state,
            target: line.arrow?.kind === 'winner' ? line.arrow.target : null,
          };
        });
      return {
        declarationId: declaration.id,
        name: declaration.participant,
        host: isHostRemote(declaration.participant),
        declared: declaredOf(declaration, registration, group.scope),
        strict: declaration.strictVersion,
        state,
        arrow,
        otherClaims,
        remoteSelect: declaration.participant,
      };
    }),
  }));
}

function copiesOf(group: PackageGroup, indexes: CanonicalIndexes): DetailCopyVm[] {
  return group.copies.map((copy) => {
    const integrityByTarget = new Map<string, boolean>();
    for (const resolutionId of copy.effectiveResolutionIds) {
      const resolution = indexes.resolutionById.get(resolutionId);
      if (resolution?.status === 'mapped') {
        integrityByTarget.set(resolution.targetUrl, resolution.hasIntegrity);
      }
    }
    return {
      copyId: copy.id,
      resolvedTag: copy.resolvedTag,
      source: copySourceVmOf(copy, indexes),
      disposition: {
        label: copy.sourceDisposition,
        note: DISPOSITION_NOTES[copy.sourceDisposition],
      },
      roles: copy.effectiveRoles.map((role) => ({ label: role, note: ROLE_NOTES[role] })),
      entrypoints: Object.entries(copy.entrypoints).map(([specifier, targetUrl]) => ({
        specifier,
        file: targetFileName(targetUrl),
        targetUrl,
        hasIntegrity: integrityByTarget.get(targetUrl) ?? false,
        importMapSelect: specifier,
      })),
    };
  });
}

export function buildDetail(
  groups: PackageGroup[],
  indexes: CanonicalIndexes,
  selectedId: string | null,
): PackageDetailVm | null {
  const group = selectedId === null ? null : (groups.find((g) => g.id === selectedId) ?? null);
  if (group === null) {
    return null;
  }
  const byId = new Map(groups.map((g) => [g.id, g]));
  const parent = parentOf(group, byId);
  const declarationCount = group.registrations.reduce(
    (sum, { declarations }) => sum + declarations.length,
    0,
  );
  // The four counts are SCOPE-specific: they count this group's canonical
  // records (the group already applies the `packageMeasures` attribution
  // rules), so a package name registered in several share scopes never
  // shows another scope's sums.
  const measures: ResolutionMeasuresVm = {
    registrations: group.registrations.length,
    declaredTags: new Set(group.registrations.map(({ registration }) => registration.tag)).size,
    resolvedCopies: group.copies.length,
    resolvedTags: group.resolvedTags.length,
    unknownTagCopies: group.unknownTagCopyCount,
    declarations: declarationCount,
  };
  const resolutionNote =
    group.copies.length === 0 && declarationCount > 0 ? noCopyNoteOf(group, indexes) : null;

  const copies = copiesOf(group, indexes);
  const targets = new Map<string, boolean>();
  for (const copy of copies) {
    for (const entrypoint of copy.entrypoints) {
      targets.set(
        entrypoint.targetUrl,
        (targets.get(entrypoint.targetUrl) ?? false) || entrypoint.hasIntegrity,
      );
    }
  }
  const integrity = {
    mappedTargets: targets.size,
    withIntegrity: [...targets.values()].filter(Boolean).length,
  };

  const { chunks, chunksUnavailable } = buildChunkSection(group, indexes);

  return {
    packageId: group.id,
    packageName: group.packageName,
    scope: group.scope,
    scopeDisplay: group.scope === GLOBAL_SCOPE ? 'global' : group.scope,
    scopeLabel: group.scope === GLOBAL_SCOPE ? null : group.scope,
    strictScope: group.scope === STRICT_SCOPE,
    parent:
      parent === null
        ? null
        : {
            packageName: parent.packageName,
            packageId: parent.id,
            rule: 'name-derived',
          },
    measures,
    resolutionNote,
    negotiation: negotiationOf(group, indexes),
    copies,
    integrity,
    chunks,
    chunksUnavailable,
  };
}
