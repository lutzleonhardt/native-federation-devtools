/**
 * Shared internals of the Packages vm builder — the (scope, package) group
 * shape and the election helpers used by both the row half
 * (`packages-row-vm.ts`) and the detail half (`packages-detail-vm.ts`).
 * Views import from the `packages-view-model.ts` facade only.
 */
import { NF_HOST } from 'devtools-bridge';

import type { PackageConflict, SharedRowFacts } from '../../shared/store/derived-model';

/** The registry's strict share scope name (spec-pinned, matches derivations). */
export const STRICT_SCOPE = 'strict';
export const GLOBAL_SCOPE = '__GLOBAL__';

/** Selection / `select`-param id of one (share scope, package). */
export function packageId(scope: string, packageName: string): string {
  return `${scope}|${packageName}`;
}

/** Display form of a participant — the `__NF-HOST__` sentinel reads as 'host'. */
export function participantDisplay(name: string): string {
  return name === NF_HOST ? 'host' : name;
}

export interface PackageGroup {
  id: string;
  scope: string;
  packageName: string;
  facts: SharedRowFacts[];
  conflict: PackageConflict;
}

/** The unique share row of a group — the elected winner, or null (honest). */
export function winnerOf(group: PackageGroup): SharedRowFacts | null {
  const shareRows = group.facts.filter((facts) => facts.row.action === 'share');
  return shareRows.length === 1 ? shareRows[0] : null;
}
