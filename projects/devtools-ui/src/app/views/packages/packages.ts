import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
 * Store façade; the left list is a flat leaf list (the copy blocks live in
 * the detail pane, rendered by `nf-package-detail`), the two combinable
 * filters (All/Conflicts × single-select participant) and the selection are
 * view-owned UI state, never store state. The `select` query param seeds
 * the initial selection (cross-link convention, see `app.routes.ts`).
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
  private readonly route = inject(ActivatedRoute);

  protected readonly filter = signal<PackagesFilter>('all');
  protected readonly selectedParticipant = signal<string | null>(null);
  protected readonly selectedId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('select'),
  );

  constructor() {
    // The parent cross-link navigates WITHIN /packages, where the router
    // reuses this component — the selection must follow later query-param
    // emissions, not only the creation snapshot.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const select = params.get('select');
      if (select !== null) {
        this.selectedId.set(select);
      }
    });
  }

  protected readonly vm = computed<PackagesVm | null>(() => {
    const model = this.store.model();
    if (model === null) {
      return null;
    }
    return buildPackagesVm(model, {
      filter: this.filter(),
      selectedParticipant: this.selectedParticipant(),
      selectedId: this.selectedId(),
    });
  });

  protected setFilter(filter: PackagesFilter): void {
    this.filter.set(filter);
  }

  /** Single-select participant chip: click = on, again = off, other = switch. */
  protected toggleParticipant(name: string): void {
    this.selectedParticipant.update((current) => (current === name ? null : name));
  }

  protected onSelect(row: TreeTableRow): void {
    this.selectedId.set((row.payload as PackageRowVm).packageId);
  }
}
