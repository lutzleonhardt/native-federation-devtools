/**
 * Shared internals of the Packages vm builder — the (scope, package) group
 * shape and the election helpers used by both the row half
 * (`packages-row-vm.ts`) and the detail half (`packages-detail-vm.ts`).
 * Views import from the `packages-view-model.ts` facade only.
 *
 * The cross-view vocabulary (scope constants, select ids, sentinel
 * display) lives in `shared/view-conventions.ts` since T11; the re-exports
 * keep this module's import sites stable.
 */
import type { PackageConflict, SharedRowFacts } from '../../shared/store/derived-model';

export {
  GLOBAL_SCOPE,
  STRICT_SCOPE,
  packageId,
  participantDisplay,
} from '../../shared/view-conventions';

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
