/**
 * Packages view model — the pure vm layer of the default V2 view (see the
 * four-layer map at `FederationStore`). Inputs are the store's model +
 * derived projections plus caller-owned UI state; the output is render-ready
 * only: templates consume these rows, never store types (XC-06).
 *
 * This file is the FACADE: grouping, scopes summary, and the public
 * surface. The two halves live beside it — `packages-row-vm.ts` (flat leaf
 * list, mapped-copy versions, conflict badge) and `packages-detail-vm.ts`
 * (negotiation, entries, integrity, chunks via `packages-chunk-vm.ts`);
 * shared internals in `packages-vm-shared.ts`. Views import from here only.
 *
 * Presentation doctrine (user-directed rework of the plan block, sharpened
 * in T10.5):
 * - The left list is FLAT: one leaf row per package, secondaries indented
 *   under their parent; negotiation structure lives in the detail pane.
 * - Row versions and the conflict badge speak about the SAME set — the
 *   mapped copies; declared-only multiplicity is never flagged.
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
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type { DerivedFederation } from '../../shared/store/derived-model';
import type { FederationModel } from '../../shared/store/federation-model';
import { PackageDetailVm, buildDetail } from './packages-detail-vm';
import { PackageRowVm, buildRows } from './packages-row-vm';
import { GLOBAL_SCOPE, PackageGroup, packageId } from './packages-vm-shared';

export { packageId } from './packages-vm-shared';
export { NEGOTIATION_LEGEND } from './packages-detail-vm';
export type { PackageRowVm, RowVersionVm } from './packages-row-vm';
export type {
  DetailEntryVm,
  DetailParticipantVm,
  DetailVersionVm,
  PackageDetailVm,
  ProviderVm,
} from './packages-detail-vm';
export type { ChunkSectionVm } from './packages-chunk-vm';

export type PackagesFilter = 'all' | 'conflicts';

/** Caller-owned UI state — filter and selection live in the view. */
export interface PackagesUiState {
  filter: PackagesFilter;
  /** Package id, seeded from the `select` query param (`<scope>|<pkg>`). */
  selectedId: string | null;
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

export function buildPackagesVm(
  model: FederationModel,
  derived: DerivedFederation,
  ui: PackagesUiState,
): PackagesVm {
  const groups = groupPackages(derived);
  const scopes = summarizeScopes(groups);
  const conflictCount = groups.filter((group) => group.conflict.conflict).length;

  const rows = buildRows(groups, ui.filter === 'conflicts');
  const detail = buildDetail(groups, model, derived, ui.selectedId);

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
