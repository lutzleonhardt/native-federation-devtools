/**
 * Row half of the Packages vm builder — the FLAT leaf list: one row per
 * (share scope, package), linked subpath packages indented one level under
 * their parent (no expansion; the copy blocks live in the detail pane).
 *
 * Version doctrine (T7, presentation reduced by T7.5): the row is package
 * name plus RESOLVED tags only — requested (declared) versions never mix in,
 * participant chips live in the filter, not on rows. A tag whose copies
 * carry the `ordinary-shared` role leads; other resolved tags render muted
 * with their own-copy claim. The conflict glyph counts the same set
 * (distinct resolved tags), so row and indicator can never diverge; copy
 * multiplicity with one resolved tag is never flagged.
 */
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type { ResolvedDependencyCopy } from '../../shared/store/resolution';
import {
  CanonicalIndexes,
  GLOBAL_SCOPE,
  PackageGroup,
  copySourceRemote,
  noCopyNoteOf,
  parentOf,
  participantDisplay,
} from './packages-vm-shared';

/** One resolved tag of a package row's copy list. */
export interface RowVersionVm {
  tag: string;
  /** True on resolved tags without a shared-elected copy — rendered dimmed. */
  muted: boolean;
  /** Own-copy claim of a muted tag (tooltip); null on unmuted tags. */
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
   * Distinct resolved tags of the group's copies — tags with an
   * `ordinary-shared` copy first, every other resolved tag muted with its
   * own-copy claim.
   */
  versions: RowVersionVm[];
  /** Copies without a uniquely evidenced source tag (honest residual). */
  unknownTagged: { count: number; note: string } | null;
  /** Honest empty state of the versions cell; null while copies exist. */
  noCopy: { label: string; note: string } | null;
  /** Resolved-tag multiplicity glyph; the rule stays in the tooltip. */
  conflict: { label: string; note: string } | null;
  /** Present on subpath rows rendered under their parent package (tooltip data). */
  linked: { parentPackage: string; rule: 'name-derived' } | null;
}

/** Own-copy claim of one muted resolved tag, from its copies' sources. */
function mutedNoteOf(copies: ResolvedDependencyCopy[], indexes: CanonicalIndexes): string {
  const claims = copies.map((copy) => {
    const source = copySourceRemote(copy, indexes);
    return source === null
      ? 'source unknown'
      : `${participantDisplay(source)} (${copy.sourceActions.join(', ')})`;
  });
  return `own copy of ${[...new Set(claims)].join(', ')}`;
}

/**
 * Resolved tags of one group — tags backed by an `ordinary-shared` copy
 * first (unmuted), every other resolved tag muted with its own-copy claim.
 * Without any shared-elected tag, all resolved tags list unmuted (nothing
 * to privilege).
 */
function rowVersionsOf(group: PackageGroup, indexes: CanonicalIndexes): RowVersionVm[] {
  const copiesByTag = new Map<string, ResolvedDependencyCopy[]>();
  for (const copy of group.copies) {
    if (copy.resolvedTag === null) {
      continue;
    }
    copiesByTag.set(copy.resolvedTag, [...(copiesByTag.get(copy.resolvedTag) ?? []), copy]);
  }
  const sharedTags = group.resolvedTags.filter((tag) =>
    copiesByTag.get(tag)?.some((copy) => copy.effectiveRoles.includes('ordinary-shared')),
  );
  const otherTags = group.resolvedTags.filter((tag) => !sharedTags.includes(tag));
  return [
    ...sharedTags.map((tag) => ({ tag, muted: false, note: null })),
    ...otherTags.map((tag) => ({
      tag,
      muted: sharedTags.length > 0,
      note: sharedTags.length > 0 ? mutedNoteOf(copiesByTag.get(tag) ?? [], indexes) : null,
    })),
  ];
}

function packageRowOf(
  group: PackageGroup,
  indexes: CanonicalIndexes,
  linked: { parentPackage: string } | null,
): PackageRowVm {
  return {
    kind: 'package',
    packageId: group.id,
    scope: group.scope,
    scopeLabel: group.scope === GLOBAL_SCOPE ? null : group.scope,
    packageName: group.packageName,
    displayName: linked ? group.packageName.slice(linked.parentPackage.length) : group.packageName,
    versions: rowVersionsOf(group, indexes),
    unknownTagged:
      group.unknownTagCopyCount > 0
        ? {
            count: group.unknownTagCopyCount,
            note: `${group.unknownTagCopyCount} ${
              group.unknownTagCopyCount === 1 ? 'copy' : 'copies'
            } without a uniquely evidenced source tag`,
          }
        : null,
    noCopy:
      group.copies.length === 0 ? { label: 'no copy', note: noCopyNoteOf(group, indexes) } : null,
    conflict: group.multiVersion
      ? {
          label: '⚠',
          note: `${group.resolvedTags.length} resolved versions — rule: resolved-tag-multiplicity`,
        }
      : null,
    linked: linked ? { parentPackage: linked.parentPackage, rule: 'name-derived' } : null,
  };
}

/** Flatten to kit tree rows — base packages at depth 0, linked subpaths at depth 1. */
export function buildRows(
  groups: PackageGroup[],
  indexes: CanonicalIndexes,
  conflictsOnly: boolean,
): TreeTableRow<PackageRowVm>[] {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const linkedChildren = new Map<string, PackageGroup[]>();
  const bases: PackageGroup[] = [];
  for (const group of groups) {
    const parent = parentOf(group, byId);
    if (parent !== null) {
      linkedChildren.set(parent.id, [...(linkedChildren.get(parent.id) ?? []), group]);
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
      payload: packageRowOf(group, indexes, linked),
    });
  };

  for (const base of bases) {
    const children = linkedChildren.get(base.id) ?? [];
    if (!conflictsOnly || base.multiVersion) {
      pushPackage(base, 0, null);
      for (const child of children.filter(
        (candidate) => !conflictsOnly || candidate.multiVersion,
      )) {
        pushPackage(child, 1, { parentPackage: base.packageName });
      }
    } else {
      // Parent filtered out: a conflicted subpath stands on its own row.
      for (const child of children.filter((candidate) => candidate.multiVersion)) {
        pushPackage(child, 0, null);
      }
    }
  }
  return rows;
}
