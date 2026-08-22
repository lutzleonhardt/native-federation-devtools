/**
 * Import Map view model — the raw evidence view (spec 4.3): unchanged in
 * role, demoted as a destination, promoted as a data source. Sections
 * render the store's flattened effective map verbatim in map order
 * (GLOBAL IMPORTS first, then one section per scope prefix); every
 * annotation joins the canonical read surface — the view derives nothing
 * itself. A row is annotated by the effective consumer resolutions whose
 * recorded map-entry provenance IS this row (mapped and blocked), their
 * declaration resolution claims, the resolved copy with its qualified
 * source, the copy's bundle claims, recorded chunk groups whose files
 * resolve to the row's target, and the ingest's expose join. Several
 * consumers or claims annotate one row; they never duplicate it. Honest
 * outcomes stay visible: ambiguity renders as ambiguity, a foreign-origin
 * target states "unattributable", a row no canonical binding resolves
 * through simply carries no resolution claim — never a guessed owner.
 * Unmapped and unknown resolutions carry no map-entry provenance by
 * definition: they annotate nothing here and never invent a row (their
 * distinguishable rendering lives in Remotes/Packages; aggregation is
 * Task-10 diagnostics territory).
 *
 * Inputs are the store's model plus caller-owned UI state; the output is
 * render-ready only: templates consume these rows, never store types
 * (XC-06).
 */
import type { FederationModel, ImportMapEntryRow } from '../../shared/store/federation-model';
import { resolveUrl } from '../../shared/store/merge-document-maps';
import type {
  BundleClaimId,
  ClaimMappingState,
  DeclarationResolutionClaim,
  DeclarationResolutionClaimId,
  EffectiveConsumerResolution,
  EffectiveConsumerResolutionId,
  ResolvedDependencyCopy,
  ResolvedDependencyCopyId,
} from '../../shared/store/resolution';
import {
  CanonicalIndexes,
  buildCanonicalIndexes,
  copySourceVmOf,
  countClaim,
  isHostRemote,
  packageId,
  participantDisplay,
} from '../../shared/view-conventions';

/** Caller-owned UI state — the `select` payload seeds row highlighting. */
export interface ImportMapUiState {
  /** Specifier payload (cross-link convention); `/./` infixes tolerated. */
  selected: string | null;
}

/** The V1 honesty caption, verbatim (spec 4.3). */
export const IMPORT_MAP_CAPTION =
  'This layer proves resolution only — an import-mapped file is not necessarily requested, and a requested file is not proof of execution.';

/**
 * Qualified source language of one row's resolved copy — the shared T7
 * ladder plus `unattributable` for targets whose observed attribution is
 * a CDN/foreign origin (kept distinct from `unknown-source`).
 */
export type RowSourceQualifier =
  | 'exact-target-source'
  | 'explicit-anchor'
  | 'observed-target-source'
  | 'ambiguous-source'
  | 'unattributable'
  | 'unknown-source';

/** The resolved copy annotation of a row — qualified source, never bare. */
export interface RowSourceVm {
  copyId: ResolvedDependencyCopyId;
  /** Display form of the source remote; null when no source is evidenced. */
  display: string | null;
  host: boolean;
  /** `select` payload for the /remotes cross-link; null without a remote. */
  remoteSelect: string | null;
  qualifier: RowSourceQualifier;
  label: string;
  note: string;
}

/** One consumer claim annotating a row (state vocabulary shared with T7/T8). */
export interface RowClaimVm {
  claimId: DeclarationResolutionClaimId;
  consumer: string;
  display: string;
  host: boolean;
  /** Verbatim `select` payload for the /remotes cross-link. */
  select: string;
  state: ClaimMappingState;
  /** Exact own-candidate/target equality (claim evidence); null when not evaluable. */
  ownCandidateSelected: boolean | null;
  /** Speaking state word; `own-selected` renders as 'selected'. */
  stateLabel: string;
  note: string;
  /**
   * True for the unmarked norm: a single own-selected claim restates the
   * row itself — only exceptions speak (T10 doctrine). Multi-claim rows
   * always speak so annotation multiplicity stays visible.
   */
  quiet: boolean;
}

/** A consumer whose binding resolves through the row without an own claim. */
export interface RowConsumerVm {
  consumer: string;
  display: string;
  host: boolean;
  select: string;
  note: string;
}

/** One bundle claim of the row's copy; only `mapped-source` renders plain. */
export interface RowBundleVm {
  bundleClaimId: BundleClaimId;
  /** The bundle name. */
  label: string;
  status: 'mapped-source' | 'source-only' | 'ambiguous';
  /** True when the status must render visibly next to the label. */
  qualified: boolean;
  /** `select` payload of the claim's source remote; null under ambiguity. */
  select: string | null;
  note: string;
}

/** Recorded chunk-group attribution of a row (canonical chunk groups). */
export interface RowChunkVm {
  emitterRemote: string;
  display: string;
  /** Verbatim `select` payload for the /remotes cross-link. */
  select: string;
  /** Group label — the bundle name, or the pseudo package for v4.5 groups. */
  groupLabel: string;
  /** Annotation noun: 'bundle'/'bundles' with bundle names, 'chunk group' otherwise. */
  groupNoun: 'bundle' | 'bundles' | 'chunk group';
  note: string;
}

/** The ingest's expose join: this row's target is a recorded exposed module. */
export interface RowExposeVm {
  remote: string;
  display: string;
  host: boolean;
  select: string;
  moduleName: string;
  note: string;
}

/** Blocked-binding annotation — the matching entry terminally blocks lookups. */
export interface RowBlockedVm {
  reasons: string[];
  note: string;
}

export interface ImportMapRowVm {
  specifier: string;
  /** Verbatim target URL (tooltip evidence). */
  target: string;
  /**
   * Display form: relative to the page base — the verbatim URL stays one
   * hover away. A foreign-origin target keeps its absolute URL and
   * visibly stands out (honest signal, matches `unattributable`).
   */
  targetDisplay: string;
  hasIntegrity: boolean;
  /** Every effective resolution whose recorded map entry is this row. */
  resolutionIds: EffectiveConsumerResolutionId[];
  /** Resolved copies materializing this row's binding (one per copy ID). */
  sources: RowSourceVm[];
  /**
   * True when the sources merely restate the scope-section owner with an
   * exact qualifier — the header carries the claim, the row stays quiet
   * (only exceptions speak). Always false in the global section.
   */
  sourceQuiet: boolean;
  claims: RowClaimVm[];
  /** Consumers of the row's resolutions no claim covers (relation-only). */
  claimlessConsumers: RowConsumerVm[];
  bundles: RowBundleVm[];
  /** One annotation per emitter — emitter-distinct groups never merge. */
  chunks: RowChunkVm[];
  /** Every recorded exposed module whose map target is this row's target. */
  exposes: RowExposeVm[];
  blocked: RowBlockedVm | null;
  /** `/packages?select=` payload of the claimed registry package, where unique. */
  packageSelect: string | null;
  selected: boolean;
}

/**
 * Scope-section identity — remotes whose registered (resolved) scope URL
 * equals the section's scope prefix. An identity join, never a
 * most-specific election; a scope no registered remote matches carries no
 * owner claim. Per the pooling doctrine a consumer scope only names the
 * CONSUMER — where its rows resolve is said per row, never here.
 */
export type SectionOwnerVm =
  | {
      kind: 'remote';
      remote: string;
      display: string;
      host: boolean;
      select: string;
      note: string;
    }
  | {
      kind: 'shared-scope-url';
      remotes: { remote: string; display: string; host: boolean; select: string }[];
      note: string;
    };

export interface ImportMapSectionVm {
  kind: 'global' | 'scope';
  /** 'GLOBAL IMPORTS', or the scope prefix verbatim. */
  label: string;
  scope: string | null;
  /** Scope-URL identity of a scope section; null on global or without a match. */
  owner: SectionOwnerVm | null;
  /** e.g. "22 entries". */
  countClaim: string;
  rows: ImportMapRowVm[];
}

export interface ImportMapVm {
  sections: ImportMapSectionVm[];
  caption: string;
  /** Honest empty state; null while the map has entries. */
  emptyNote: string | null;
}

const GLOBAL_LABEL = 'GLOBAL IMPORTS';

/** Select matching tolerates the literal `/./` infix (same rule as the ingest expose join). */
function collapseDotInfix(specifier: string): string {
  return specifier.replace(/\/\.\//g, '/');
}

/**
 * Row identity — the exact recorded map entry (scope, specifier, target)
 * as a structural JSON tuple: delimiter-safe, and a null scope never
 * collides with an empty-string scope.
 */
function rowKey(scope: string | null, specifier: string, target: string): string {
  return JSON.stringify([scope, specifier, target]);
}

const STATE_LABELS: Record<ClaimMappingState, string> = {
  'own-selected': 'selected',
  'not-selected': 'not selected',
  anchored: 'anchored',
  'self-filled': 'self-filled',
  fallback: 'fallback',
  blocked: 'blocked',
  unknown: 'unknown',
};

const STATE_NOTES: Record<ClaimMappingState, string> = {
  'own-selected': 'its own candidate URL is the resolved target of this entry',
  'not-selected':
    'its own candidate is not the selected target — the binding still resolves through this entry',
  anchored: 'an explicit servedBy anchor selects this target',
  'self-filled': 'no applicable shared source — the consumer’s own copy fills the binding',
  fallback: 'the binding resolves to the elected shared copy through this entry',
  blocked: 'the matching entry terminally blocks this binding',
  unknown: 'mapping state not derivable from the captured evidence',
};

function claimVmOf(claim: DeclarationResolutionClaim): RowClaimVm {
  const display = participantDisplay(claim.consumerRemote);
  const domain =
    claim.resolutionDomain.kind === 'share-scope'
      ? `share scope ${claim.resolutionDomain.name}`
      : `private registration of ${participantDisplay(claim.resolutionDomain.remote)}`;
  return {
    claimId: claim.id,
    consumer: claim.consumerRemote,
    display,
    host: isHostRemote(claim.consumerRemote),
    select: claim.consumerRemote,
    state: claim.mappingState,
    ownCandidateSelected: claim.ownCandidateSelected,
    stateLabel: STATE_LABELS[claim.mappingState],
    note: `claim of ${display} under ${domain} for '${claim.specifier}' — ${STATE_NOTES[claim.mappingState]} (rule: declaration-resolution claim)`,
    quiet: false,
  };
}

/**
 * Qualified source of one copy — the shared ladder, refined with the
 * `unattributable` outcome the copy's observed attribution evidences (a
 * CDN/foreign origin is an honest external URL, not an unknown).
 */
function rowSourceOf(copy: ResolvedDependencyCopy, indexes: CanonicalIndexes): RowSourceVm {
  const ladder = copySourceVmOf(copy, indexes);
  const unattributable =
    ladder.qualifier === 'unknown-source' &&
    copy.observedTargetProviders.some((provider) => provider.outcome === 'unattributable');
  const vm: Omit<RowSourceVm, 'copyId'> = unattributable
    ? {
        display: ladder.display,
        host: ladder.host,
        remoteSelect: ladder.remoteSelect,
        qualifier: 'unattributable',
        label: 'unattributable',
        note: 'no registry scope matches this target — CDN or foreign origin (rule: scope-prefix-match)',
      }
    : ladder;
  return {
    copyId: copy.id,
    ...vm,
    note: copy.resolvedTag === null ? vm.note : `${vm.note}; resolved tag ${copy.resolvedTag}`,
  };
}

function bundleVmOf(bundleClaimId: BundleClaimId, indexes: CanonicalIndexes): RowBundleVm | null {
  const claim = indexes.bundleClaimById.get(bundleClaimId);
  if (claim === undefined) {
    return null;
  }
  const notes: Record<RowBundleVm['status'], string> = {
    'mapped-source': `bundle of the selected source ${
      claim.sourceRemote === null ? '' : participantDisplay(claim.sourceRemote)
    } — registered chunk groups back it (rule: bundle-claim)`,
    'source-only': `bundle declared by the selected source ${
      claim.sourceRemote === null ? '' : participantDisplay(claim.sourceRemote)
    } — no registered chunk group backs it in this capture (rule: bundle-claim)`,
    ambiguous: 'bundle of an ambiguous candidate source — no source is chosen (rule: bundle-claim)',
  };
  return {
    bundleClaimId,
    label: claim.bundle,
    status: claim.status,
    qualified: claim.status !== 'mapped-source',
    select: claim.sourceRemote,
    note: notes[claim.status],
  };
}

interface ChunkJoin {
  emitterRemote: string;
  bundleName: string | null;
  pseudoPackage: string | null;
}

function chunkVmsOf(joins: ChunkJoin[] | undefined): RowChunkVm[] {
  if (joins === undefined) {
    return [];
  }
  // Emitter-aware: equal chunk filenames from different emitters never
  // merge (T6 doctrine) — one annotation per emitter. Within ONE emitter
  // several groups can record one file (registry evidence, e.g. one
  // esbuild chunk in two bundle lists) — the label names them all, never
  // silently just the first.
  const byEmitter = new Map<string, ChunkJoin[]>();
  for (const join of joins) {
    byEmitter.set(join.emitterRemote, [...(byEmitter.get(join.emitterRemote) ?? []), join]);
  }
  return [...byEmitter.entries()].map(([emitterRemote, emitterJoins]) => {
    const display = participantDisplay(emitterRemote);
    const labels = [
      ...new Set(
        emitterJoins.map((join) => join.bundleName ?? join.pseudoPackage ?? 'chunk group'),
      ),
    ];
    const hasBundle = emitterJoins.some((join) => join.bundleName !== null);
    return {
      emitterRemote,
      display,
      select: emitterRemote,
      groupLabel: labels.join(' · '),
      groupNoun: hasBundle ? (labels.length > 1 ? 'bundles' : 'bundle') : 'chunk group',
      note: `recorded chunk file of ${display} — the file resolves to this entry's target (rule: chunk-group join)`,
    };
  });
}

/** Canonical row joins, built once per vm from the three façade surfaces. */
interface RowJoins {
  resolutionsByRow: Map<string, EffectiveConsumerResolution[]>;
  claimsByResolution: Map<EffectiveConsumerResolutionId, DeclarationResolutionClaim[]>;
  copiesByResolution: Map<EffectiveConsumerResolutionId, ResolvedDependencyCopy[]>;
  chunksByTarget: Map<string, ChunkJoin[]>;
  exposesByTarget: Map<string, RowExposeVm[]>;
}

function buildRowJoins(model: FederationModel): RowJoins {
  const projection = model.resolutionProjection;

  const resolutionsByRow = new Map<string, EffectiveConsumerResolution[]>();
  for (const resolution of model.effectiveConsumerResolutions) {
    if (resolution.mapEntry === null) {
      continue;
    }
    const key = rowKey(
      resolution.mapEntry.scope,
      resolution.mapEntry.specifier,
      resolution.mapEntry.target,
    );
    resolutionsByRow.set(key, [...(resolutionsByRow.get(key) ?? []), resolution]);
  }

  const claimsByResolution = new Map<EffectiveConsumerResolutionId, DeclarationResolutionClaim[]>();
  for (const claim of projection.declarationResolutionClaims) {
    claimsByResolution.set(claim.effectiveResolutionId, [
      ...(claimsByResolution.get(claim.effectiveResolutionId) ?? []),
      claim,
    ]);
  }

  const copiesByResolution = new Map<EffectiveConsumerResolutionId, ResolvedDependencyCopy[]>();
  for (const copy of projection.copies) {
    for (const resolutionId of copy.effectiveResolutionIds) {
      copiesByResolution.set(resolutionId, [...(copiesByResolution.get(resolutionId) ?? []), copy]);
    }
  }

  // Canonical chunk groups joined by resolved file URL — the emitter's
  // registered scope URL is the base (page base when the emitter is not
  // in the remotes projection), reproducing the ingest's join rule.
  const scopeUrlByRemote = new Map(
    projection.remotes.map((remote) => [remote.name, remote.resolvedScopeUrl]),
  );
  const chunksByTarget = new Map<string, ChunkJoin[]>();
  for (const group of projection.chunkGroups) {
    const base = scopeUrlByRemote.get(group.emitterRemote) ?? model.provenance.pageUrl;
    for (const file of group.files) {
      const target = resolveUrl(file, base);
      chunksByTarget.set(target, [
        ...(chunksByTarget.get(target) ?? []),
        {
          emitterRemote: group.emitterRemote,
          bundleName: group.bundleName,
          pseudoPackage: group.pseudoPackage,
        },
      ]);
    }
  }

  // The ingest's expose join (`mapTarget`): a row whose target is a
  // recorded exposed module names its remote — registry evidence, no
  // delivery claim.
  const exposesByTarget = new Map<string, RowExposeVm[]>();
  for (const remote of model.remotes) {
    for (const expose of remote.exposes) {
      if (expose.mapTarget === null) {
        continue;
      }
      const display = participantDisplay(remote.name);
      exposesByTarget.set(expose.mapTarget, [
        ...(exposesByTarget.get(expose.mapTarget) ?? []),
        {
          remote: remote.name,
          display,
          host: remote.isHost,
          select: remote.name,
          moduleName: expose.moduleName,
          note: `recorded exposed module '${expose.moduleName}' of ${display} (rule: expose join)`,
        },
      ]);
    }
  }

  return {
    resolutionsByRow,
    claimsByResolution,
    copiesByResolution,
    chunksByTarget,
    exposesByTarget,
  };
}

/** `/packages?select=` payload — unique claimed share-scope registry package. */
function packageSelectOf(
  entry: ImportMapEntryRow,
  claims: DeclarationResolutionClaim[],
): string | null {
  const payloads = new Set(
    claims
      .filter(
        (claim) =>
          claim.resolutionDomain.kind === 'share-scope' && claim.specifier === entry.specifier,
      )
      .map((claim) =>
        claim.resolutionDomain.kind === 'share-scope'
          ? packageId(claim.resolutionDomain.name, claim.consumerRegistryPackage)
          : '',
      ),
  );
  return payloads.size === 1 ? [...payloads][0] : null;
}

function blockedVmOf(resolutions: EffectiveConsumerResolution[]): RowBlockedVm | null {
  const reasons = [
    ...new Set(
      resolutions.flatMap((resolution) =>
        resolution.status === 'blocked' ? [resolution.blockedReason] : [],
      ),
    ),
  ].sort();
  if (reasons.length === 0) {
    return null;
  }
  return {
    reasons,
    note: `the matching import-map entry terminally blocks this binding (${reasons.join(', ')})`,
  };
}

export function buildImportMapVm(model: FederationModel, ui: ImportMapUiState): ImportMapVm {
  if (model.mapMode === 'none') {
    return {
      sections: [],
      caption: IMPORT_MAP_CAPTION,
      emptyNote: 'no import map recorded in this capture',
    };
  }

  const indexes = buildCanonicalIndexes(model);
  const joins = buildRowJoins(model);
  const wanted = ui.selected === null ? null : collapseDotInfix(ui.selected);
  const pageBase = model.provenance.pageUrl;

  const rowOf = (entry: ImportMapEntryRow): ImportMapRowVm => {
    const resolutions =
      joins.resolutionsByRow.get(rowKey(entry.scope, entry.specifier, entry.target)) ?? [];
    const claims = resolutions.flatMap(
      (resolution) => joins.claimsByResolution.get(resolution.id) ?? [],
    );
    const copies = [
      ...new Map(
        resolutions
          .flatMap((resolution) => joins.copiesByResolution.get(resolution.id) ?? [])
          .map((copy) => [copy.id, copy] as const),
      ).values(),
    ];
    const claimVms = claims.map(claimVmOf);
    if (claimVms.length === 1 && claimVms[0].state === 'own-selected') {
      claimVms[0].quiet = true;
    }
    const claimedConsumers = new Set(claims.map((claim) => claim.consumerRemote));
    const claimlessConsumers = [
      ...new Set(resolutions.flatMap((resolution) => resolution.consumerRemotes)),
    ]
      .filter((consumer) => !claimedConsumers.has(consumer))
      .map((consumer) => ({
        consumer,
        display: participantDisplay(consumer),
        host: isHostRemote(consumer),
        select: consumer,
        note: `binding of ${participantDisplay(consumer)} resolves through this entry without an own resolution claim`,
      }));
    return {
      specifier: entry.specifier,
      target: entry.target,
      targetDisplay:
        entry.target.startsWith(pageBase) && entry.target.length > pageBase.length
          ? entry.target.slice(pageBase.length)
          : entry.target,
      hasIntegrity: entry.hasIntegrity,
      resolutionIds: resolutions.map((resolution) => resolution.id),
      sources: copies.map((copy) => rowSourceOf(copy, indexes)),
      sourceQuiet: false,
      claims: claimVms,
      claimlessConsumers,
      bundles: [...new Set(copies.flatMap((copy) => copy.bundleClaimIds))].flatMap(
        (bundleClaimId) => {
          const vm = bundleVmOf(bundleClaimId, indexes);
          return vm === null ? [] : [vm];
        },
      ),
      chunks: chunkVmsOf(joins.chunksByTarget.get(entry.target)),
      exposes: joins.exposesByTarget.get(entry.target) ?? [],
      blocked: blockedVmOf(resolutions),
      packageSelect: packageSelectOf(entry, claims),
      selected: wanted !== null && collapseDotInfix(entry.specifier) === wanted,
    };
  };

  /** Scope-URL identity of a section (never a most-specific election). */
  const ownerOf = (scope: string): SectionOwnerVm | null => {
    const matches = model.resolutionProjection.remotes.filter(
      (remote) => remote.resolvedScopeUrl === scope,
    );
    if (matches.length === 0) {
      return null;
    }
    if (matches.length === 1) {
      const remote = matches[0];
      const display = participantDisplay(remote.name);
      return {
        kind: 'remote',
        remote: remote.name,
        display,
        host: remote.isHost,
        select: remote.name,
        note: `this scope prefix is the registered scope URL of ${display} (rule: scope-url identity)`,
      };
    }
    const remotes = matches.map((remote) => ({
      remote: remote.name,
      display: participantDisplay(remote.name),
      host: remote.isHost,
      select: remote.name,
    }));
    return {
      kind: 'shared-scope-url',
      remotes,
      note: `this scope prefix is the registered scope URL of ${remotes
        .map((remote) => remote.display)
        .join(' and ')} (rule: scope-url identity)`,
    };
  };

  // The flattened effective map is already in map order (top-level first,
  // then scopes); sections keep first-appearance order.
  const sections: ImportMapSectionVm[] = [];
  const byScope = new Map<string | null, ImportMapSectionVm>();
  for (const entry of model.importMapEntries) {
    let section = byScope.get(entry.scope);
    if (section === undefined) {
      section = {
        kind: entry.scope === null ? 'global' : 'scope',
        label: entry.scope ?? GLOBAL_LABEL,
        scope: entry.scope,
        owner: entry.scope === null ? null : ownerOf(entry.scope),
        countClaim: '',
        rows: [],
      };
      byScope.set(entry.scope, section);
      sections.push(section);
    }
    section.rows.push(rowOf(entry));
  }
  for (const section of sections) {
    section.countClaim = countClaim(section.rows.length, 'entry', 'entries');
    // Only exceptions speak: a source chip restating the section's
    // identity-owned remote with an exact qualifier stays quiet; every
    // non-exact qualifier and every foreign source keeps speaking.
    if (section.owner?.kind === 'remote') {
      const owner = section.owner;
      for (const row of section.rows) {
        row.sourceQuiet =
          row.sources.length > 0 &&
          row.sources.every(
            (source) =>
              source.qualifier === 'exact-target-source' && source.remoteSelect === owner.remote,
          );
      }
    }
  }

  return {
    sections,
    caption: IMPORT_MAP_CAPTION,
    emptyNote: sections.length === 0 ? 'the recorded import map tags merge to an empty map' : null,
  };
}
