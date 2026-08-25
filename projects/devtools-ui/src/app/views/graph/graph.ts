import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PARTICIPANT_COLOR_LOOKUP } from '../../shared/kit/participant-colors';
import { FederationStore } from '../../shared/store/federation-store';
import { countClaim } from '../../shared/view-conventions';
import { nodeKeyOf } from './graph-element-factories';
import { buildGraphModel, graphAdjacencyOf } from './graph-model';
import { BundleEdgeRef, GraphEdge, GraphModel } from './graph-types';

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
 *
 * Interaction state is exactly `{ selectedRemotes, hovered }` — everything
 * else derives per change. Clicking a remote toggles the consumer filter
 * (OR semantics, applied inside the builder); hovering traces a node by
 * emphasis only — classes flip and the hovered node's precomputed bundle
 * edges are revealed, but the model itself never changes on hover.
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

  /**
   * The whole interaction state. Both signals reset with every new capture
   * (`linkedSignal` on the store model): view state is per capture — a
   * fixture switch reloads the app, an in-place Refresh resets here — so
   * no selection or hover can carry names a newer capture no longer has.
   */
  protected readonly selectedRemotes = linkedSignal({
    source: this.store.model,
    computation: (): ReadonlySet<string> => new Set(),
  });
  /** Render key of the hovered node; null without a hover. */
  protected readonly hovered = linkedSignal({
    source: this.store.model,
    computation: (): string | null => null,
  });

  protected readonly vm = computed<GraphModel | null>(() => {
    const model = this.store.model();
    return model === null
      ? null
      : buildGraphModel(model.resolutionProjection, {
          participantColors: this.participantColors(),
          selectedRemotes: this.selectedRemotes(),
        });
  });

  /** Undirected adjacency — derived once per model, not per hover. */
  private readonly adjacency = computed<ReadonlyMap<string, ReadonlySet<string>>>(() => {
    const vm = this.vm();
    return vm === null ? new Map() : graphAdjacencyOf(vm);
  });

  /** Emphasis set of the hover trace: the hovered node plus its neighbors. */
  private readonly traced = computed<ReadonlySet<string> | null>(() => {
    const hovered = this.hovered();
    if (hovered === null) {
      return null;
    }
    return new Set([hovered, ...(this.adjacency().get(hovered) ?? [])]);
  });

  /** The hovered node's bundle edges — a reveal of precomputed references. */
  protected readonly hoveredBundleEdges = computed<BundleEdgeRef[]>(() => {
    const hovered = this.hovered();
    const vm = this.vm();
    if (hovered === null || vm === null) {
      return [];
    }
    return vm.bundleEdgeRefs.filter(
      (ref) => ref.dependencyKey === hovered || ref.chunkKey === hovered,
    );
  });

  protected nodeDimmed(key: string): boolean {
    const traced = this.traced();
    return traced !== null && !traced.has(key);
  }

  protected edgeDimmed(edge: GraphEdge): boolean {
    const hovered = this.hovered();
    return (
      hovered !== null &&
      nodeKeyOf('remote', edge.sourceId) !== hovered &&
      nodeKeyOf('dependency', edge.targetId) !== hovered
    );
  }

  protected setHovered(key: string | null): void {
    this.hovered.set(key);
  }

  protected toggleRemote(name: string): void {
    const next = new Set(this.selectedRemotes());
    if (!next.delete(name)) {
      next.add(name);
    }
    this.selectedRemotes.set(next);
  }

  protected clearSelection(): void {
    this.selectedRemotes.set(new Set());
  }

  protected filterLine(count: number): string {
    return `filtering by ${countClaim(count, 'remote')}`;
  }

  protected cappedLine(count: number): string {
    return `${countClaim(count, 'additional bundle link')} hidden to keep the graph responsive.`;
  }

  /** Footer line for relations whose consumer has no rendered node. */
  protected droppedRelationLine(count: number): string {
    return `${countClaim(count, 'relation')} not drawn — consumer not among the capture's remotes`;
  }
}
