/**
 * Packages view model — the pure vm layer of the default V2 view (see the
 * four-layer map at `FederationStore`). Inputs are the store's model +
 * derived projections plus caller-owned UI state; the output is render-ready
 * only: templates consume these rows, never store types (XC-06).
 *
 * Presentation doctrine (user-directed rework of the plan block):
 * - The left list is FLAT: one leaf row per package, secondaries indented
 *   under their parent; negotiation structure lives in the detail pane.
 * - Only the unique elected winner stays quiet: every other row says
 *   where it resolves (skip → winner's file, scope and non-elected share
 *   copies → own copy, winner-less → honest reason).
 * - Provenance rules ride along as data for tooltips; only the
 *   `source-derived` residual keeps a visible tag (the one claim not
 *   grounded in capture evidence).
 *
 * The builder groups and flattens precomputed knowledge — it derives
 * nothing new.
 */
import { NF_HOST } from 'devtools-bridge';

import type {
  DeclaredVersion,
  ParticipantArrow,
} from '../../shared/kit/participant-row';
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type {
  DerivedFederation,
  PackageConflict,
  SharedRowFacts,
} from '../../shared/store/derived-model';
import type { FederationModel } from '../../shared/store/federation-model';

export type PackagesFilter = 'all' | 'conflicts';

/** Caller-owned UI state — filter and selection live in the view. */
export interface PackagesUiState {
  filter: PackagesFilter;
  /** Package id, seeded from the `select` query param (`<scope>|<pkg>`). */
  selectedId: string | null;
}

/** Selection / `select`-param id of one (share scope, package). */
export function packageId(scope: string, packageName: string): string {
  return `${scope}|${packageName}`;
}

/** One flat package row; secondaries render indented under their parent. */
export interface PackageRowVm {
  kind: 'package';
  packageId: string;
  scope: string;
  /** Muted scope chip; null in the `__GLOBAL__` scope. */
  scopeLabel: string | null;
  packageName: string;
  /** Subpath suffix (`/extra`) on linked sibling rows, full name otherwise. */
  displayName: string;
  /** Winning version, or every distinct tag joined when no unique winner exists. */
  versionSummary: string;
  conflict: { label: string; note: string } | null;
  /** Present on subpath rows rendered under their parent package (tooltip data). */
  linked: { parentPackage: string; rule: 'name-derived' } | null;
  /**
   * Participants serving a mapped copy (share and scope rows), row order —
   * who provides.
   */
  providers: { name: string; host: boolean }[];
  /**
   * Declarers WITHOUT a mapped copy (skip-only participants) — who
   * consumes the elected copy; rendered as "+n" with the names and
   * verbatim actions in the tooltip. Null when everyone provides.
   */
  alsoDeclaredBy: { count: number; tooltip: string } | null;
}

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

/** Chunk section, strictly gated on the providing remote's attribution ladder. */
export type ChunkSectionVm =
  | {
      level: 'package';
      remote: string;
      /** Display form of the remote (`__NF-HOST__` reads as 'host'). */
      remoteDisplay: string;
      /** Null when the remote records chunk lists but none for this package. */
      packageEntry: { bundleName: string; files: string[]; mappedCount: number } | null;
      rule: 'bundle-chunk-join';
    }
  | {
      level: 'remote';
      remote: string;
      remoteDisplay: string;
      groupCount: number;
      note: string;
      rule: 'chunk-pseudo-externals';
    }
  | { level: 'none'; remote: string; remoteDisplay: string; note: string; rule: 'no-chunk-evidence' };

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

export interface ScopeSummaryVm {
  /** Verbatim share-scope name (registry evidence, tooltip). */
  scope: string;
  /** Display label — the `__GLOBAL__` sentinel reads as 'global'. */
  label: string;
  packageCount: number;
}

export interface PackagesVm {
  scopes: ScopeSummaryVm[];
  packageCount: number;
  conflictCount: number;
  rows: TreeTableRow<PackageRowVm>[];
  detail: PackageDetailVm | null;
  /** Honest empty note; null while the tree has rows. */
  emptyNote: string | null;
}

/** The registry's strict share scope name (spec-pinned, matches derivations). */
const STRICT_SCOPE = 'strict';
const GLOBAL_SCOPE = '__GLOBAL__';

const ACTION_SYMBOLS: Record<string, string> = { share: '●', skip: '○', scope: '◌' };

/** Grounded action vocabulary (rule: registry-election). Verbatim action stays the label. */
const ACTION_NOTES: Record<string, string> = {
  share: 'offers this copy to the version election',
  skip: "this copy is not taken; the participant resolves to the elected copy",
  scope: 'keeps its own copy, mapped only for its own declarers',
};

interface PackageGroup {
  id: string;
  scope: string;
  packageName: string;
  facts: SharedRowFacts[];
  conflict: PackageConflict;
}

export function buildPackagesVm(
  model: FederationModel,
  derived: DerivedFederation,
  ui: PackagesUiState,
): PackagesVm {
  const groups = groupPackages(derived);
  const scopes = summarizeScopes(groups);
  const conflictCount = groups.filter((group) => group.conflict.conflict).length;

  const rows = buildRows(groups, ui);
  const detail = buildDetail(groups, derived, ui.selectedId);

  let emptyNote: string | null = null;
  if (groups.length === 0) {
    emptyNote = 'no shared packages in this capture';
  } else if (rows.length === 0) {
    emptyNote = 'no version conflicts in this capture';
  }

  return { scopes, packageCount: groups.length, conflictCount, rows, detail, emptyNote };
}

/** One group per (scope, package), store order; conflicts cover every group. */
function groupPackages(derived: DerivedFederation): PackageGroup[] {
  const conflictById = new Map(
    derived.packageConflicts.map((conflict) => [
      packageId(conflict.scope, conflict.packageName),
      conflict,
    ]),
  );
  const groups: PackageGroup[] = [];
  const byId = new Map<string, PackageGroup>();
  for (const facts of derived.sharedRowFacts) {
    const id = packageId(facts.row.scope, facts.row.packageName);
    let group = byId.get(id);
    if (group === undefined) {
      group = {
        id,
        scope: facts.row.scope,
        packageName: facts.row.packageName,
        facts: [],
        conflict: conflictById.get(id)!,
      };
      byId.set(id, group);
      groups.push(group);
    }
    group.facts.push(facts);
  }
  return groups;
}

function summarizeScopes(groups: PackageGroup[]): ScopeSummaryVm[] {
  const counts = new Map<string, number>();
  for (const group of groups) {
    counts.set(group.scope, (counts.get(group.scope) ?? 0) + 1);
  }
  return [...counts.entries()].map(([scope, packageCount]) => ({
    scope,
    label: scope === GLOBAL_SCOPE ? 'global' : scope,
    packageCount,
  }));
}

/** The unique share row of a group — the elected winner, or null (honest). */
function winnerOf(group: PackageGroup): SharedRowFacts | null {
  const shareRows = group.facts.filter((facts) => facts.row.action === 'share');
  return shareRows.length === 1 ? shareRows[0] : null;
}

/**
 * Only the unique elected winner stays quiet — every other row says where
 * it resolves (rule: registry-election): a skip row points at the
 * winner's file (or the honest winner-less state), scope rows and
 * non-elected share copies claim their own copy.
 */
function toKitArrow(facts: SharedRowFacts, winner: SharedRowFacts | null): ParticipantArrow | null {
  if (facts === winner) {
    return null;
  }
  const arrow = facts.arrow;
  if (arrow.kind === 'winner') {
    if (arrow.providerParticipant === null) {
      return { kind: 'none', reason: 'no unique winner' };
    }
    return {
      kind: 'winner',
      target: arrow.file ?? arrow.targetUrl ?? '(no served file recorded)',
      provider: arrow.providerParticipant === NF_HOST ? 'host' : arrow.providerParticipant,
    };
  }
  return { kind: 'own' };
}

function toDeclared(facts: SharedRowFacts): DeclaredVersion {
  // Strict-scope rows are pinned to the exact tag — never a declared range.
  return facts.strictPinned !== null
    ? { kind: 'pinned', tag: facts.row.tag }
    : { kind: 'range', range: facts.row.requiredVersion };
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

function packageRowOf(
  group: PackageGroup,
  linked: { parentPackage: string } | null,
): PackageRowVm {
  const winner = winnerOf(group);
  const tags = group.conflict.tags;
  // Providers = participants with a mapped copy (any non-skip row);
  // skip-only declarers consume the elected copy and collapse to "+n".
  const providers: { name: string; host: boolean }[] = [];
  const consumers: { name: string; action: string }[] = [];
  const seen = new Set<string>();
  for (const facts of group.facts) {
    const name = facts.row.participant;
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    const providing = group.facts.some(
      (candidate) => candidate.row.participant === name && candidate.row.action !== 'skip',
    );
    if (providing) {
      providers.push({ name, host: name === NF_HOST });
    } else {
      consumers.push({ name: name === NF_HOST ? 'host' : name, action: facts.row.action });
    }
  }
  const alsoDeclaredBy =
    consumers.length > 0
      ? {
          count: consumers.length,
          tooltip: `also declared by: ${consumers
            .map((consumer) => `${consumer.name} (${consumer.action})`)
            .join(', ')}`,
        }
      : null;
  return {
    kind: 'package',
    packageId: group.id,
    scope: group.scope,
    scopeLabel: group.scope === GLOBAL_SCOPE ? null : group.scope,
    packageName: group.packageName,
    displayName: linked
      ? group.packageName.slice(linked.parentPackage.length)
      : group.packageName,
    versionSummary: winner?.row.tag ?? tags.join(' · '),
    conflict: group.conflict.conflict
      ? {
          label: `⚠ ${tags.length} versions`,
          note: 'more than one version declared in this share scope (rule: version-multiplicity)',
        }
      : null,
    linked: linked ? { parentPackage: linked.parentPackage, rule: 'name-derived' } : null,
    providers,
    alsoDeclaredBy,
  };
}

/**
 * Flatten to kit tree rows: a FLAT leaf list — base packages at depth 0,
 * linked subpath packages indented one level under their parent (no
 * expansion; negotiation structure lives in the detail pane).
 */
function buildRows(groups: PackageGroup[], ui: PackagesUiState): TreeTableRow<PackageRowVm>[] {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const linkedChildren = new Map<string, PackageGroup[]>();
  const bases: PackageGroup[] = [];
  for (const group of groups) {
    const link = group.facts[0].parentLink;
    const parentId = link === null ? null : packageId(group.scope, link.parentPackage);
    if (parentId !== null && byId.has(parentId)) {
      linkedChildren.set(parentId, [...(linkedChildren.get(parentId) ?? []), group]);
    } else {
      bases.push(group);
    }
  }

  const conflictsOnly = ui.filter === 'conflicts';
  const rows: TreeTableRow<PackageRowVm>[] = [];

  const pushPackage = (
    group: PackageGroup,
    depth: number,
    linked: { parentPackage: string } | null,
  ): void => {
    rows.push({
      id: group.id,
      depth,
      expandable: false,
      expanded: false,
      payload: packageRowOf(group, linked),
    });
  };

  for (const base of bases) {
    const children = linkedChildren.get(base.id) ?? [];
    if (!conflictsOnly || base.conflict.conflict) {
      pushPackage(base, 0, null);
      for (const child of children.filter(
        (candidate) => !conflictsOnly || candidate.conflict.conflict,
      )) {
        pushPackage(child, 1, { parentPackage: base.packageName });
      }
    } else {
      // Parent filtered out: a conflicted subpath stands on its own row.
      for (const child of children.filter((candidate) => candidate.conflict.conflict)) {
        pushPackage(child, 0, null);
      }
    }
  }
  return rows;
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

function buildDetail(
  groups: PackageGroup[],
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
      declared: toDeclared(facts),
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

  const { chunks, chunksUnavailable } = buildChunkSection(group, winner, derived);

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

/** Chunk section gated on the providing remote's attribution ladder. */
function buildChunkSection(
  group: PackageGroup,
  winner: SharedRowFacts | null,
  derived: DerivedFederation,
): { chunks: ChunkSectionVm | null; chunksUnavailable: string | null } {
  if (winner === null) {
    return { chunks: null, chunksUnavailable: 'no unique providing remote in this share scope' };
  }
  const remote = winner.row.participant;
  const remoteDisplay = remote === NF_HOST ? 'host' : remote;
  const attribution = derived.chunkAttribution.find((entry) => entry.remote === remote);
  if (attribution === undefined) {
    return {
      chunks: null,
      chunksUnavailable: 'providing remote not present in the captured registry',
    };
  }
  switch (attribution.level) {
    case 'package': {
      const entry = attribution.packages.find(
        (candidate) => candidate.packageName === group.packageName,
      );
      return {
        chunks: {
          level: 'package',
          remote,
          remoteDisplay,
          packageEntry:
            entry === undefined
              ? null
              : {
                  bundleName: entry.bundleName,
                  files: entry.files,
                  mappedCount: attribution.groups
                    .filter(
                      (chunkGroup) =>
                        chunkGroup.origin === 'shared-chunks' &&
                        chunkGroup.bundleName === entry.bundleName &&
                        chunkGroup.mapped,
                    )
                    .reduce((count, chunkGroup) => count + chunkGroup.files.length, 0),
                },
          rule: 'bundle-chunk-join',
        },
        chunksUnavailable: null,
      };
    }
    case 'remote':
      return {
        chunks: {
          level: 'remote',
          remote,
          remoteDisplay,
          groupCount: attribution.groups.length,
          note: `chunks belong to ${remoteDisplay}; package attribution not derivable`,
          rule: 'chunk-pseudo-externals',
        },
        chunksUnavailable: null,
      };
    case 'none':
      return {
        chunks: {
          level: 'none',
          remote,
          remoteDisplay,
          note: `no chunk evidence recorded for ${remoteDisplay} — the capture shows no chunk lists (dense-chunking capability absent)`,
          rule: 'no-chunk-evidence',
        },
        chunksUnavailable: null,
      };
  }
}
