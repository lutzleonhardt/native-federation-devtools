/**
 * Detail half of the Packages vm builder — negotiation (version groups with
 * participant rows and exception arrows), served entries, integrity, and
 * the chunk section (via `packages-chunk-vm.ts`).
 *
 * Arrow doctrine: only the unique elected winner stays quiet — every other
 * row says where it resolves (skip → winner's file, scope and non-elected
 * share copies → own copy, winner-less → honest reason).
 */
import { NF_HOST } from 'devtools-bridge';

import type {
  DeclaredVersion,
  ParticipantArrow,
} from '../../shared/kit/participant-row';
import type { DerivedFederation, SharedRowFacts } from '../../shared/store/derived-model';
import type { FederationModel } from '../../shared/store/federation-model';
import {
  ACTION_NOTES,
  ACTION_SYMBOLS,
  declaredOf,
  explicitArrowOf,
} from '../../shared/view-conventions';
import { ChunkSectionVm, buildChunkSection } from './packages-chunk-vm';
import {
  GLOBAL_SCOPE,
  PackageGroup,
  STRICT_SCOPE,
  packageId,
  winnerOf,
} from './packages-vm-shared';

export { NEGOTIATION_LEGEND } from '../../shared/view-conventions';

/** Winner's provider in the detail pane — all three honest outcomes. */
export type ProviderVm =
  | { outcome: 'derived'; remote: string; host: boolean; hostFallback: boolean; rule: 'scope-prefix-match' }
  | { outcome: 'ambiguous'; candidates: string[]; rule: 'scope-prefix-match' }
  | { outcome: 'unattributable'; rule: 'scope-prefix-match' };

export interface DetailParticipantVm {
  name: string;
  host: boolean;
  declared: DeclaredVersion;
  strict: boolean;
  /** Exception arrows only (skip → winner, winner-less); null = quiet norm. */
  arrow: ParticipantArrow | null;
  /** `select` payload for the /remotes cross-link. */
  remoteSelect: string;
  /** Present on the winning share row only. */
  provider: ProviderVm | null;
  /** Losing-copy residual; empty `files` means every copy is mapped. */
  declaredNotMapped: { count: number; files: string[]; rule: 'source-derived' } | null;
}

export interface DetailVersionVm {
  symbol: string;
  tag: string;
  action: string;
  actionNote: string;
  isolated: { audience: string } | null;
  participants: DetailParticipantVm[];
}

/** One served file of a mapped copy (share/scope rows — skip files live in the residual). */
export interface DetailEntryVm {
  participant: string;
  host: boolean;
  /** Entry name (v4.5 spelling); null for the v4 single-file spelling. */
  entry: string | null;
  file: string;
  /** Map-backed URL; null when no map entry joins. */
  targetUrl: string | null;
  hasIntegrity: boolean;
  /** `select` payload for the /import-map cross-link. */
  importMapSelect: string;
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
  /**
   * Honest no-winner state: multiple share declarations without an elected
   * version (never in the strict scope, where side-by-side is by design).
   */
  negotiationNote: string | null;
  negotiation: DetailVersionVm[];
  entries: DetailEntryVm[];
  /** Over the distinct mapped target URLs of this package. */
  integrity: { withIntegrity: number; mappedTargets: number };
  chunks: ChunkSectionVm | null;
  /** Why the chunk section is absent when `chunks` is null. */
  chunksUnavailable: string | null;
}

/**
 * Only the unique elected winner stays quiet — every other row says where
 * it resolves (rule: registry-election, mapping shared via
 * `explicitArrowOf`): a skip row points at the winner's file (or the
 * honest winner-less state), scope rows and non-elected share copies
 * claim their own copy.
 */
function toKitArrow(facts: SharedRowFacts, winner: SharedRowFacts | null): ParticipantArrow | null {
  return facts === winner ? null : explicitArrowOf(facts);
}

/** (tag, action) version groups of one package, row order preserved. */
function versionGroupsOf(group: PackageGroup): { key: string; facts: SharedRowFacts[] }[] {
  const versionGroups: { key: string; facts: SharedRowFacts[] }[] = [];
  const byKey = new Map<string, { key: string; facts: SharedRowFacts[] }>();
  for (const facts of group.facts) {
    const key = `${facts.row.tag} ${facts.row.action}`;
    let versionGroup = byKey.get(key);
    if (versionGroup === undefined) {
      versionGroup = { key, facts: [] };
      byKey.set(key, versionGroup);
      versionGroups.push(versionGroup);
    }
    versionGroup.facts.push(facts);
  }
  return versionGroups;
}

function versionHeadOf(facts: SharedRowFacts[]): Omit<DetailVersionVm, 'participants'> {
  const { tag, action } = facts[0].row;
  const isolated =
    action === 'scope'
      ? { audience: facts.map((entry) => entry.row.participant).join(', ') }
      : null;
  return {
    symbol: ACTION_SYMBOLS[action] ?? '·',
    tag,
    action,
    actionNote: ACTION_NOTES[action] ?? 'registry action recorded verbatim',
    isolated,
  };
}

function toProviderVm(facts: SharedRowFacts): ProviderVm | null {
  const provider = facts.provider;
  if (provider === null) {
    return null;
  }
  switch (provider.outcome) {
    case 'derived':
      return {
        outcome: 'derived',
        remote: provider.remote!,
        host: provider.remote === NF_HOST,
        hostFallback: provider.hostFallback,
        rule: 'scope-prefix-match',
      };
    case 'ambiguous':
      return { outcome: 'ambiguous', candidates: provider.candidates, rule: 'scope-prefix-match' };
    case 'unattributable':
      return { outcome: 'unattributable', rule: 'scope-prefix-match' };
  }
}

export function buildDetail(
  groups: PackageGroup[],
  model: FederationModel,
  derived: DerivedFederation,
  selectedId: string | null,
): PackageDetailVm | null {
  const group = selectedId === null ? null : (groups.find((g) => g.id === selectedId) ?? null);
  if (group === null) {
    return null;
  }
  const winner = winnerOf(group);
  const parentLink = group.facts[0].parentLink;
  const shareCount = group.facts.filter((facts) => facts.row.action === 'share').length;
  // In the strict scope side-by-side sharing is by design (the pinned-scope
  // chip explains it); elsewhere the no-winner state deserves its own line.
  const negotiationNote =
    winner === null && shareCount > 1 && group.scope !== STRICT_SCOPE
      ? `no single elected version — ${shareCount} versions are declared share`
      : null;

  const negotiation: DetailVersionVm[] = versionGroupsOf(group).map((versionGroup) => ({
    ...versionHeadOf(versionGroup.facts),
    participants: versionGroup.facts.map((facts) => ({
      name: facts.row.participant,
      host: facts.row.participant === NF_HOST,
      declared: declaredOf(facts),
      strict: facts.row.strictVersion,
      arrow: toKitArrow(facts, winner),
      remoteSelect: facts.row.participant,
      provider: facts === winner ? toProviderVm(facts) : null,
      declaredNotMapped:
        facts.declaredNotMapped === null
          ? null
          : {
              count: facts.declaredNotMapped.files.length,
              files: facts.declaredNotMapped.files,
              rule: 'source-derived',
            },
    })),
  }));

  // Served files of mapped copies — skip-row files live in the residual claim.
  const entries: DetailEntryVm[] = group.facts
    .filter((facts) => facts.row.action !== 'skip')
    .flatMap((facts) =>
      facts.row.servedFiles.map((served) => {
        // The row's map join backs its own package specifier only.
        const isSpecifierFile =
          served.entry === facts.row.packageName || served.entry === null;
        return {
          participant: facts.row.participant,
          host: facts.row.participant === NF_HOST,
          entry: served.entry,
          file: served.file,
          targetUrl: isSpecifierFile ? (facts.row.resolution?.targetUrl ?? null) : null,
          hasIntegrity: isSpecifierFile ? (facts.row.resolution?.hasIntegrity ?? false) : false,
          importMapSelect: served.entry ?? facts.row.packageName,
        };
      }),
    );

  const mappedTargets = new Map<string, boolean>();
  for (const facts of group.facts) {
    if (facts.row.resolution !== null) {
      mappedTargets.set(facts.row.resolution.targetUrl, facts.row.resolution.hasIntegrity);
    }
  }
  const integrity = {
    mappedTargets: mappedTargets.size,
    withIntegrity: [...mappedTargets.values()].filter(Boolean).length,
  };

  const { chunks, chunksUnavailable } = buildChunkSection(group, winner, model, derived);

  return {
    packageId: group.id,
    packageName: group.packageName,
    scope: group.scope,
    scopeDisplay: group.scope === GLOBAL_SCOPE ? 'global' : group.scope,
    scopeLabel: group.scope === GLOBAL_SCOPE ? null : group.scope,
    strictScope: group.scope === STRICT_SCOPE,
    parent:
      parentLink === null
        ? null
        : {
            packageName: parentLink.parentPackage,
            packageId: packageId(group.scope, parentLink.parentPackage),
            rule: 'name-derived',
          },
    negotiationNote,
    negotiation,
    entries,
    integrity,
    chunks,
    chunksUnavailable,
  };
}
