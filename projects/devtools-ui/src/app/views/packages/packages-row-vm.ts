/**
 * Row half of the Packages vm builder — the FLAT leaf list: one row per
 * (scope, package), linked subpath packages indented one level under their
 * parent (no expansion; negotiation structure lives in the detail pane).
 *
 * Version doctrine (T10.5): the row lists the versions that exist as
 * MAPPED copies (share and scope rows) — the elected winner first, every
 * other mapped tag muted with its own-copy note. The conflict badge counts
 * the same set (`mappedTags`), so row and badge can never diverge;
 * declared-only multiplicity (clean skip) is the election succeeding and
 * stays out of both.
 */
import { NF_HOST } from 'devtools-bridge';

import type { TreeTableRow } from '../../shared/kit/tree-table';
import {
  GLOBAL_SCOPE,
  PackageGroup,
  packageId,
  participantDisplay,
  winnerOf,
} from './packages-vm-shared';

/** One version of a package row's mapped-copy list. */
export interface RowVersionVm {
  tag: string;
  /** True on non-winner mapped tags — rendered dimmed beside the winner. */
  muted: boolean;
  /** Own-copy claim of a muted tag (tooltip); null on winner/winner-less tags. */
  note: string | null;
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
  /**
   * Versions existing as mapped copies — the elected winner first (when
   * unique), every other mapped tag follows muted. Winner-less groups list
   * every mapped tag unmuted (no version to privilege).
   */
  versions: RowVersionVm[];
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

/**
 * Mapped-copy versions of one group, winner first. A muted tag carries the
 * own-copy claim of its non-skip rows as the note.
 */
function rowVersionsOf(group: PackageGroup): RowVersionVm[] {
  const winner = winnerOf(group);
  const versions: RowVersionVm[] = [];
  const seen = new Set<string>();
  if (winner !== null) {
    seen.add(winner.row.tag);
    versions.push({ tag: winner.row.tag, muted: false, note: null });
  }
  for (const facts of group.facts) {
    const { tag, action } = facts.row;
    if (action === 'skip' || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    const claims = group.facts
      .filter((entry) => entry.row.tag === tag && entry.row.action !== 'skip')
      .map((entry) => `${participantDisplay(entry.row.participant)} (${entry.row.action})`);
    versions.push({
      tag,
      muted: winner !== null,
      note: winner === null ? null : `own copy of ${claims.join(', ')}`,
    });
  }
  return versions;
}

function packageRowOf(
  group: PackageGroup,
  linked: { parentPackage: string } | null,
): PackageRowVm {
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
      consumers.push({ name: participantDisplay(name), action: facts.row.action });
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
    versions: rowVersionsOf(group),
    conflict: group.conflict.conflict
      ? {
          label: `⚠ ${group.conflict.mappedTags.length} versions mapped`,
          note: 'more than one version mapped in this share scope (rule: mapped-multiplicity)',
        }
      : null,
    linked: linked ? { parentPackage: linked.parentPackage, rule: 'name-derived' } : null,
    providers,
    alsoDeclaredBy,
  };
}

/** Flatten to kit tree rows — base packages at depth 0, linked subpaths at depth 1. */
export function buildRows(
  groups: PackageGroup[],
  conflictsOnly: boolean,
): TreeTableRow<PackageRowVm>[] {
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
