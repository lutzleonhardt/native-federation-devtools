/**
 * Packages view model — the pure vm layer of the default V2 view. Inputs are
 * the canonical Store façade (`model.resolutionProjection`,
 * `model.effectiveConsumerResolutions`, `model.registryEvidence`) plus
 * caller-owned UI state; the output is render-ready only: templates consume
 * these rows, never store types (T7-AC-05).
 *
 * This file is the FACADE: grouping, scopes summary, and the public
 * surface. The two halves live beside it — `packages-row-vm.ts` (flat leaf
 * list, resolved-tag versions, multiplicity indicator) and
 * `packages-detail-vm.ts` (measures, negotiation, resolved copies, chunks
 * via `packages-chunk-vm.ts`); shared internals in `packages-vm-shared.ts`.
 * Views import from here only.
 *
 * Presentation doctrine (T10.5 flat list, model inputs recast by T7):
 * - The left list is FLAT: one leaf row per (share scope, package),
 *   secondaries indented under their parent; negotiation structure lives in
 *   the detail pane.
 * - Row versions are the RESOLVED tags of the group's canonical copies;
 *   requested (declared) versions render separately in the negotiation.
 *   The multiplicity indicator counts the same set — distinct resolved
 *   tags — so row and indicator can never diverge; copy multiplicity with
 *   one resolved tag is never flagged.
 * - Every claim is qualified: selected/not-selected/anchored states stay
 *   visible, source wording is qualified (registry slot, explicit anchor,
 *   exact/observed target source, unknown), and reasons ride along as
 *   tooltip data.
 *
 * The builder groups and flattens precomputed knowledge — it derives
 * nothing new.
 */
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type { FederationModel } from '../../shared/store/federation-model';
import type { SharedExternalId } from '../../shared/store/resolution';
import { PackageDetailVm, buildDetail } from './packages-detail-vm';
import { PackageRowVm, buildRows } from './packages-row-vm';
import {
  CanonicalIndexes,
  GLOBAL_SCOPE,
  PackageGroup,
  buildCanonicalIndexes,
  copyGroupIds,
  multiVersionOf,
  packageId,
} from './packages-vm-shared';

export { packageId } from './packages-vm-shared';
export { NEGOTIATION_LEGEND } from './packages-detail-vm';
export type { PackageRowVm, RowVersionVm } from './packages-row-vm';
export type {
  DetailCopyVm,
  DetailParticipantVm,
  DetailVersionVm,
  PackageDetailVm,
  ResolutionMeasuresVm,
} from './packages-detail-vm';
export type { ChunkClaimVm, ChunkSectionVm } from './packages-chunk-vm';

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

export function buildPackagesVm(model: FederationModel, ui: PackagesUiState): PackagesVm {
  const indexes = buildCanonicalIndexes(model);
  const groups = groupPackages(model, indexes);
  const scopes = summarizeScopes(groups);
  const conflictCount = groups.filter((group) => group.multiVersion).length;

  const rows = buildRows(groups, indexes, ui.filter === 'conflicts');
  const detail = buildDetail(groups, indexes, ui.selectedId);

  let emptyNote: string | null = null;
  if (groups.length === 0) {
    emptyNote = 'no shared packages in this capture';
  } else if (rows.length === 0) {
    emptyNote = 'no version conflicts in this capture';
  }

  return { scopes, packageCount: groups.length, conflictCount, rows, detail, emptyNote };
}

/**
 * One group per (share scope, package) from the canonical shared-external
 * records, store order; copies join source-first (the `packageMeasures`
 * attribution). An empty share scope holds no records and manufactures no
 * packages (T7-AC-02).
 */
function groupPackages(model: FederationModel, indexes: CanonicalIndexes): PackageGroup[] {
  const groups: PackageGroup[] = [];
  const byId = new Map<string, PackageGroup>();
  const groupIdBySharedExternal = new Map<SharedExternalId, string>();
  for (const external of model.registryEvidence.sharedExternals) {
    const id = packageId(external.shareScope, external.packageName);
    groupIdBySharedExternal.set(external.id, id);
    let group = byId.get(id);
    if (group === undefined) {
      group = {
        id,
        scope: external.shareScope,
        packageName: external.packageName,
        registrations: [],
        copies: [],
        resolvedTags: [],
        unknownTagCopyCount: 0,
        multiVersion: false,
      };
      byId.set(id, group);
      groups.push(group);
    }
    for (const registrationId of external.versionRegistrationIds) {
      const registration = indexes.registrationById.get(registrationId);
      if (registration === undefined) {
        continue;
      }
      group.registrations.push({
        registration,
        declarations: registration.participantDeclarationIds.flatMap((declarationId) => {
          const declaration = indexes.declarationById.get(declarationId);
          return declaration === undefined ? [] : [declaration];
        }),
      });
    }
  }

  const knownGroupIds = new Set(byId.keys());
  for (const copy of model.resolutionProjection.copies) {
    for (const groupId of copyGroupIds(copy, indexes, knownGroupIds, groupIdBySharedExternal)) {
      const group = byId.get(groupId);
      if (group === undefined) {
        continue;
      }
      group.copies.push(copy);
      if (copy.resolvedTag === null) {
        group.unknownTagCopyCount += 1;
      } else if (!group.resolvedTags.includes(copy.resolvedTag)) {
        group.resolvedTags.push(copy.resolvedTag);
      }
    }
  }
  for (const group of groups) {
    group.multiVersion = multiVersionOf(group.scope, group.resolvedTags);
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
