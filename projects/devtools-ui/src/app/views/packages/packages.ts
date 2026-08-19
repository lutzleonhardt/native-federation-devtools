import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MasterDetail } from '../../shared/kit/master-detail';
import { ParticipantChip } from '../../shared/kit/participant-chip';
import { TreeTable, TreeTableRow } from '../../shared/kit/tree-table';
import { FederationStore } from '../../shared/store/federation-store';
import { PackageDetail } from './package-detail';
import { PackageRowVm, PackagesFilter, PackagesVm, buildPackagesVm } from './packages-view-model';

/**
 * Packages tab — the V2 default view: which copies a package actually
 * resolves to, and what every declaration's claim says about it. Dumb
 * component over the pure `buildPackagesVm` builder reading the canonical
 * Store façade; the left list is a flat leaf list (negotiation structure
 * lives in the detail pane, rendered by `nf-package-detail`), filter and
 * selection are view-owned UI state, never store state. The `select` query
 * param seeds the initial selection (cross-link convention, see
 * `app.routes.ts`).
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
    if (model === null) {
      return null;
    }
    return buildPackagesVm(model, {
      filter: this.filter(),
      selectedId: this.selectedId(),
    });
  });

  protected setFilter(filter: PackagesFilter): void {
    this.filter.set(filter);
  }

  /** Tooltip for the collapsed source count (>3 sources). */
  protected sourceNames(row: PackageRowVm): string {
    return row.sources.map((source) => (source.host ? 'host' : source.name)).join(', ');
  }

  protected onSelect(row: TreeTableRow): void {
    this.selectedId.set((row.payload as PackageRowVm).packageId);
  }
}
