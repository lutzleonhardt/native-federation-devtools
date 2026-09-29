import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ParticipantChip } from '../../shared/kit/participant-chip';
import { FederationStore } from '../../shared/store/federation-store';
import { POOLING_DOCS_URL, POOLS_DEFINITION, PoolsVm, buildPoolsVm } from './pools-view-model';

/**
 * Pools tab — one card per explicit-tag pool: the tag matrix that shows why
 * the packages belong together, and one outcome line per remote read off the
 * stored rows. Outcomes only; the orchestrator's reasons are not recorded.
 */
@Component({
  selector: 'nf-pools-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ParticipantChip],
  templateUrl: './pools.html',
  styleUrl: './pools.css',
})
export class PoolsView {
  private readonly store = inject(FederationStore);

  protected readonly definition = POOLS_DEFINITION;
  protected readonly docsUrl = POOLING_DOCS_URL;

  protected readonly vm = computed<PoolsVm | null>(() => {
    const model = this.store.model();
    return model === null ? null : buildPoolsVm(model.resolutionProjection);
  });
}
