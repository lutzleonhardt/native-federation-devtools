import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FederationStore } from '../../shared/store/federation-store';
import { GraphModel, buildGraphModel } from './graph-model';

/**
 * Graph tab (preview) — the resolution graph over the canonical projection:
 * remotes and resolved dependency copies as columns, one consume edge per
 * `ConsumerCopyRelation`. Dumb component over the pure `buildGraphModel`
 * builder; the template draws the precomputed primitives only and tracks by
 * canonical IDs. All wording stays resolution-honest: an edge shows what the
 * captured map resolves, never what was requested or executed.
 */
@Component({
  selector: 'nf-graph-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphView {
  private readonly store = inject(FederationStore);

  protected readonly vm = computed<GraphModel | null>(() => {
    const model = this.store.model();
    return model === null ? null : buildGraphModel(model.resolutionProjection);
  });
}
