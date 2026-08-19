/**
 * Packages view model — the pure vm layer of the default V2 view. Inputs are
 * the canonical Store façade (`model.resolutionProjection`,
 * `model.effectiveConsumerResolutions`, `model.registryEvidence`) plus
 * caller-owned UI state; the output is render-ready only: templates consume
 * these rows, never store types (T7-AC-05).
 *
 * This file is the FACADE: grouping, scopes summary, the two combinable
 * filters (status × participant), and the public surface. The halves live
 * beside it — `packages-row-vm.ts` (flat leaf list, resolved-tag versions,
 * conflict glyph) and `packages-detail-vm.ts` (copy blocks, unresolved
 * bucket, diagnostics footer; chunks via `packages-chunk-vm.ts`); shared
 * internals in `packages-vm-shared.ts`. Views import from here only.
 *
 * Presentation doctrine (T7.5 redesign over the T7 model):
 * - The left list is FLAT and minimal: package name + resolved tags;
 *   participant chips live in the filter, the copy blocks in the detail.
 * - The participant filter is single-select (`selectedParticipant`) and
 *   combines with the Conflicts filter (Conflicts ∧ participant).
 * - Deviation-first: every claim stays visible and grounded, but the happy
 *   path renders almost nothing.
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
  involvedParticipantsOf,
  isHostRemote,
  multiVersionOf,
  packageId,
  participantDisplay,
} from './packages-vm-shared';

export { packageId } from './packages-vm-shared';
export type { PackageRowVm, RowVersionVm } from './packages-row-vm';
export type {
  AnnotationVm,
  ConsumerRowVm,
  CopyBlockVm,
  CopyFileVm,
  CopySourceVm,
  DeclaredVm,
  PackageDetailVm,
  UnresolvedRowVm,
} from './packages-detail-vm';
export type { ChunkClaimVm } from './packages-chunk-vm';

export type PackagesFilter = 'all' | 'conflicts';

/** Caller-owned UI state — filters and selection live in the view. */
export interface PackagesUiState {
  filter: PackagesFilter;
  /** Raw participant name; null shows every package (single-select chips). */
  selectedParticipant: string | null;
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

/** One participant-filter chip; `name` is the raw select value. */
export interface ParticipantChipVm {
  name: string;
  host: boolean;
}

export interface PackagesVm {
  scopes: ScopeSummaryVm[];
  /** Packages within the current participant selection. */
  packageCount: number;
  conflictCount: number;
  /** Every participant involved anywhere in the capture — host first. */
  participants: ParticipantChipVm[];
  rows: TreeTableRow<PackageRowVm>[];
  detail: PackageDetailVm | null;
  /** Honest empty note; null while the tree has rows. */
  emptyNote: string | null;
}

export function buildPackagesVm(model: FederationModel, ui: PackagesUiState): PackagesVm {
  const indexes = buildCanonicalIndexes(model);
  const groups = groupPackages(model, indexes);
  const scopes = summarizeScopes(groups);

  const involvement = new Map(
    groups.map((group) => [group.id, involvedParticipantsOf(group, indexes)]),
  );
  const participants = participantChips(groups, involvement);
  const selected = ui.selectedParticipant;
  const visibleGroups =
    selected === null ? groups : groups.filter((group) => involvement.get(group.id)!.has(selected));
  const conflictCount = visibleGroups.filter((group) => group.multiVersion).length;

  const rows = buildRows(visibleGroups, indexes, ui.filter === 'conflicts');
  const detail = buildDetail(groups, indexes, ui.selectedId);

  let emptyNote: string | null = null;
  if (groups.length === 0) {
    emptyNote = 'no shared packages in this capture';
  } else if (rows.length === 0) {
    const who = selected === null ? null : participantDisplay(selected);
    if (ui.filter === 'conflicts') {
      emptyNote =
        who === null
          ? 'no version conflicts in this capture'
          : `no version conflicts involve ${who} in this capture`;
    } else {
      emptyNote = `no packages involve ${who} in this capture`;
    }
  }

  return {
    scopes,
    packageCount: visibleGroups.length,
    conflictCount,
    participants,
    rows,
    detail,
    emptyNote,
  };
}

/** Distinct involved participants over all groups — host first, then first seen. */
function participantChips(
  groups: PackageGroup[],
  involvement: ReadonlyMap<string, ReadonlySet<string>>,
): ParticipantChipVm[] {
  const seen = new Set<string>();
  const chips: ParticipantChipVm[] = [];
  for (const group of groups) {
    for (const name of involvement.get(group.id) ?? []) {
      if (!seen.has(name)) {
        seen.add(name);
        chips.push({ name, host: isHostRemote(name) });
      }
    }
  }
  return [...chips.filter((chip) => chip.host), ...chips.filter((chip) => !chip.host)];
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
