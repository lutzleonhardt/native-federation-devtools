import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PARTICIPANT_COLOR_LOOKUP } from '../../shared/kit/participant-colors';
import { FederationStore } from '../../shared/store/federation-store';
import { countClaim } from '../../shared/view-conventions';
import { buildGraphModel } from './graph-model';
import { GraphModel } from './graph-types';

/**
 * Graph tab (preview) — the resolution graph over the canonical projection:
 * remotes, resolved dependency copies clustered by evidenced source, and
 * claimed chunk files clustered by emitter · bundle, one consume edge per
 * `ConsumerCopyRelation`. Dumb component over the pure `buildGraphModel`
 * builder; the template draws the precomputed primitives only and tracks by
 * canonical IDs. Cluster hues come from the app-wide participant color
 * assignment, so a remote's cluster carries the same identity color as its
 * chip dots. All wording stays resolution-honest: an edge shows what the
 * captured map resolves, never what was requested or executed.
 */
@Component({
  selector: 'nf-graph-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphView {
  private readonly store = inject(FederationStore);
  private readonly participantColors = inject(PARTICIPANT_COLOR_LOOKUP);

  protected readonly vm = computed<GraphModel | null>(() => {
    const model = this.store.model();
    return model === null
      ? null
      : buildGraphModel(model.resolutionProjection, {
          participantColors: this.participantColors(),
        });
  });

  /** Footer line for relations whose consumer has no rendered node. */
  protected droppedRelationLine(count: number): string {
    return `${countClaim(count, 'relation')} not drawn — consumer not among the capture's remotes`;
  }
}
