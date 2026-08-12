import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MasterDetail } from '../../shared/kit/master-detail';
import { ParticipantChip } from '../../shared/kit/participant-chip';
import { TreeTable, TreeTableRow } from '../../shared/kit/tree-table';
import { FederationStore } from '../../shared/store/federation-store';
import { PackageDetail } from './package-detail';
import {
  PackageRowVm,
  PackagesFilter,
  PackagesVm,
  buildPackagesVm,
} from './packages-view-model';

/**
 * Packages tab — the V2 default view: which version of a package is
 * actually shared, and what happened to every other declaration. Dumb
 * component over the pure `buildPackagesVm` builder; the left list is a
 * flat leaf list (negotiation structure lives in the detail pane, rendered
 * by `nf-package-detail`), filter and selection are view-owned UI state,
 * never store state. The `select` query param seeds the initial selection
 * (cross-link convention, see `app.routes.ts`).
 */
@Component({
  selector: 'nf-packages-view',
  imports: [TreeTable, MasterDetail, ParticipantChip, PackageDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './packages.html',
  styleUrl: './packages.css',
})
export class PackagesView {
  private readonly store = inject(FederationStore);

  protected readonly filter = signal<PackagesFilter>('all');
  protected readonly selectedId = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('select'),
  );

  protected readonly vm = computed<PackagesVm | null>(() => {
    const model = this.store.model();
    const derived = this.store.derived();
    if (model === null || derived === null) {
      return null;
    }
    return buildPackagesVm(model, derived, {
      filter: this.filter(),
      selectedId: this.selectedId(),
    });
  });

  protected setFilter(filter: PackagesFilter): void {
    this.filter.set(filter);
  }

  /** Tooltip for the collapsed provider count (>3 providers). */
  protected providerNames(row: PackageRowVm): string {
    return row.providers
      .map((provider) => (provider.host ? 'host' : provider.name))
      .join(', ');
  }

  protected onSelect(row: TreeTableRow): void {
    this.selectedId.set((row.payload as PackageRowVm).packageId);
  }
}
