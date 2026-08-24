import type {
  BundleClaim,
  CanonicalResolutionProjection,
  ChunkGroupProjection,
} from '../../shared/store/resolution';
import { participantDisplay } from '../../shared/view-conventions';
import {
  columnX,
  compareStrings,
  dependencyClusterOf,
  dependencyLabelOf,
  dependencyNodeAt,
  edgeOf,
  edgePath,
  nodeBaseAt,
  remoteNodeAt,
  remoteOrder,
  stubQualifierOf,
} from './graph-element-factories';
import {
  BundleEdgeRef,
  CLUSTER_HEADER,
  CLUSTER_LABEL_BASELINE,
  CLUSTER_PAD,
  CLUSTER_VGAP,
  ChunkGraphNode,
  DependencyGraphNode,
  GraphBuildOptions,
  GraphCluster,
  GraphEdge,
  GraphModel,
  GraphNode,
  HEADER_BASELINE,
  HEADER_H,
  HONEST_BUCKETS,
  HonestBucket,
  LABEL_PAD,
  MARGIN,
  MAX_BUNDLE_EDGES,
  NODE_H,
  NODE_VGAP,
  NODE_W,
  QUALIFIER_BASELINE,
  RemoteGraphNode,
  STUB_NODE_H,
} from './graph-types';

/**
 * Pure graph model over the canonical resolution projection: three columns
 * (remotes, resolved dependency copies clustered by their evidenced source,
 * claimed chunk files clustered by emitter · bundle), one consume edge per
 * `ConsumerCopyRelation`, and precomputed `dependency → chunk` references
 * for the hover trace. The builder computes all geometry; the renderer draws
 * primitives only. Identical inputs produce a deeply equal model. Every
 * rendered identity chains to canonical IDs (remote name, copy ID, relation
 * ID, bundle-claim ID, chunk-group ID + recorded file), and nothing here
 * claims delivery — an edge proves what the captured map resolves, never
 * that anything was requested or executed. The model shapes and layout
 * constants live in `graph-types`, the element-level rules and constructors
 * in `graph-element-factories`.
 */

interface ClusterSeed {
  key: string;
  label: string;
  /** Hue owner; null renders neutral (host, honest buckets, no emitter). */
  hueRemote: string | null;
}

/** Node blueprint of the chunks column before geometry is assigned. */
type ChunkNodeSeed =
  | { kind: 'file'; id: string; label: string }
  | { kind: 'stub'; id: string; label: string; qualifier: string };

export function buildGraphModel(
  projection: CanonicalResolutionProjection,
  options: GraphBuildOptions = {},
): GraphModel {
  const participantColors = options.participantColors ?? new Map<string, number>();
  const hostNames = new Set(
    projection.remotes.filter((remote) => remote.isHost).map((remote) => remote.name),
  );
  const clusterHueOf = (owner: string | null): number | null =>
    owner === null || hostNames.has(owner) ? null : (participantColors.get(owner) ?? null);
  // Cluster names follow the chip convention (`host`, verbatim otherwise) —
  // the same display form the remote node carries.
  const remoteClusterDisplay = (name: string): string => participantDisplay(name);

  const remoteNodes = [...projection.remotes]
    .sort(remoteOrder)
    .map((remote, row) => remoteNodeAt(remote, row));

  // --- Dependency clustering by evidenced source -------------------------
  const sortedCopies = projection.copies
    .map((copy) => ({ copy, fullLabel: dependencyLabelOf(copy) }))
    .sort(
      (a, b) => compareStrings(a.fullLabel, b.fullLabel) || compareStrings(a.copy.id, b.copy.id),
    );

  const sourceClusterEntries = new Map<string, typeof sortedCopies>();
  const bucketClusterEntries = new Map<HonestBucket, typeof sortedCopies>();
  for (const entry of sortedCopies) {
    const cluster = dependencyClusterOf(entry.copy);
    if (cluster.kind === 'source') {
      sourceClusterEntries.set(cluster.remote, [
        ...(sourceClusterEntries.get(cluster.remote) ?? []),
        entry,
      ]);
    } else {
      bucketClusterEntries.set(cluster.bucket, [
        ...(bucketClusterEntries.get(cluster.bucket) ?? []),
        entry,
      ]);
    }
  }

  // Host first, other source remotes alphabetical, honest buckets last.
  const sourceClusterNames = [...sourceClusterEntries.keys()].sort((a, b) => {
    const aHost = hostNames.has(a);
    const bHost = hostNames.has(b);
    if (aHost !== bHost) {
      return aHost ? -1 : 1;
    }
    return compareStrings(a, b);
  });

  const clusters: GraphCluster[] = [];
  const dependencyNodes: DependencyGraphNode[] = [];
  const orderedDependencyEntries: typeof sortedCopies = [];
  let dependencyCursor = MARGIN + HEADER_H;

  const layoutDependencyCluster = (seed: ClusterSeed, entries: typeof sortedCopies): void => {
    const boxY = dependencyCursor;
    let nodeY = boxY + CLUSTER_HEADER + CLUSTER_PAD;
    for (const entry of entries) {
      dependencyNodes.push(dependencyNodeAt(entry.copy, entry.fullLabel, nodeY));
      orderedDependencyEntries.push(entry);
      nodeY += NODE_H + NODE_VGAP;
    }
    const boxHeight = nodeY - NODE_VGAP - boxY + CLUSTER_PAD;
    const boxX = columnX(1) - CLUSTER_PAD;
    clusters.push({
      key: seed.key,
      column: 'dependencies',
      label: seed.label,
      count: entries.length,
      colorIndex: clusterHueOf(seed.hueRemote),
      x: boxX,
      y: boxY,
      width: NODE_W + 2 * CLUSTER_PAD,
      height: boxHeight,
      labelX: boxX + CLUSTER_PAD,
      labelY: boxY + CLUSTER_LABEL_BASELINE,
    });
    dependencyCursor = boxY + boxHeight + CLUSTER_VGAP;
  };

  for (const name of sourceClusterNames) {
    layoutDependencyCluster(
      { key: `dependencies:source:${name}`, label: remoteClusterDisplay(name), hueRemote: name },
      sourceClusterEntries.get(name)!,
    );
  }
  for (const bucket of HONEST_BUCKETS) {
    const entries = bucketClusterEntries.get(bucket);
    if (entries !== undefined) {
      layoutDependencyCluster(
        { key: `dependencies:bucket:${bucket}`, label: bucket, hueRemote: null },
        entries,
      );
    }
  }

  // Kind-separated lookups: a remote name may textually equal a copy ID, and
  // an edge source must always resolve to a remote, a target to a copy.
  const remoteNodeByName = new Map<string, RemoteGraphNode>(
    remoteNodes.map((node) => [node.id, node]),
  );
  const dependencyNodeById = new Map<string, DependencyGraphNode>(
    dependencyNodes.map((node) => [node.id, node]),
  );

  // --- Chunk column from the copies' bundle claims -----------------------
  // The chunk column derives exclusively from copies' attached claims (the
  // selected source path), so pseudo/`mapping-or-exposed` groups are
  // excluded structurally, not by filter. Claims without registered files
  // render a qualified stub — uncertainty stays visible, files are never
  // invented.
  const claimById = new Map<string, BundleClaim>(
    projection.bundleClaims.map((claim) => [claim.id, claim]),
  );
  const groupById = new Map<string, ChunkGroupProjection>(
    projection.chunkGroups.map((group) => [group.id, group]),
  );

  interface ChunkClusterCollector {
    emitter: string | null;
    bundle: string;
    seeds: ChunkNodeSeed[];
  }
  const chunkClusterByKey = new Map<string, ChunkClusterCollector>();
  const seenChunkNodeIds = new Set<string>();
  const refPairs: { copyId: string; chunkNodeId: string }[] = [];
  const seenRefPairs = new Set<string>();

  const collectChunkNode = (
    emitter: string | null,
    bundle: string,
    seed: ChunkNodeSeed,
    copyId: string,
  ): void => {
    const clusterKey = `chunks:${JSON.stringify([emitter, bundle])}`;
    if (!seenChunkNodeIds.has(seed.id)) {
      seenChunkNodeIds.add(seed.id);
      const collector = chunkClusterByKey.get(clusterKey) ?? { emitter, bundle, seeds: [] };
      collector.seeds.push(seed);
      chunkClusterByKey.set(clusterKey, collector);
    }
    const refKey = `${copyId}\n${seed.id}`;
    if (!seenRefPairs.has(refKey)) {
      seenRefPairs.add(refKey);
      refPairs.push({ copyId, chunkNodeId: seed.id });
    }
  };

  for (const { copy } of orderedDependencyEntries) {
    for (const claimId of copy.bundleClaimIds) {
      const claim = claimById.get(claimId);
      if (claim === undefined) {
        continue;
      }
      if (claim.status === 'mapped-source') {
        for (const groupId of claim.chunkGroupIds) {
          const group = groupById.get(groupId);
          if (group === undefined) {
            continue;
          }
          for (const file of group.files) {
            collectChunkNode(
              group.emitterRemote,
              group.bundleName ?? claim.bundle,
              // The pair (chunk group, recorded file) is the node identity;
              // equal filenames from different emitters stay distinct.
              { kind: 'file', id: `${group.id}\n${file}`, label: file },
              copy.id,
            );
          }
        }
      } else {
        collectChunkNode(
          claim.sourceRemote,
          claim.bundle,
          { kind: 'stub', id: claim.id, label: claim.bundle, qualifier: stubQualifierOf(claim) },
          copy.id,
        );
      }
    }
  }

  // Host-emitter clusters first, then alphabetical by emitter and bundle;
  // an emitter-less cluster (no evidenced source remote on the claim) last.
  const orderedChunkClusters = [...chunkClusterByKey.entries()].sort(([, a], [, b]) => {
    const aHost = a.emitter !== null && hostNames.has(a.emitter);
    const bHost = b.emitter !== null && hostNames.has(b.emitter);
    if (aHost !== bHost) {
      return aHost ? -1 : 1;
    }
    if ((a.emitter === null) !== (b.emitter === null)) {
      return a.emitter === null ? 1 : -1;
    }
    return compareStrings(a.emitter ?? '', b.emitter ?? '') || compareStrings(a.bundle, b.bundle);
  });

  const chunkNodes: ChunkGraphNode[] = [];
  const chunkNodeById = new Map<string, ChunkGraphNode>();
  let chunkCursor = MARGIN + HEADER_H;
  for (const [clusterKey, collector] of orderedChunkClusters) {
    const boxY = chunkCursor;
    let nodeY = boxY + CLUSTER_HEADER + CLUSTER_PAD;
    const x = columnX(2);
    for (const seed of collector.seeds) {
      const height = seed.kind === 'stub' ? STUB_NODE_H : NODE_H;
      const node: ChunkGraphNode = {
        ...nodeBaseAt('chunk', seed.id, seed.label, x, nodeY),
        kind: 'chunk',
        height,
        qualifier: seed.kind === 'stub' ? seed.qualifier : null,
        qualifierX: x + LABEL_PAD,
        qualifierY: nodeY + QUALIFIER_BASELINE,
      };
      chunkNodes.push(node);
      chunkNodeById.set(node.id, node);
      nodeY += height + NODE_VGAP;
    }
    const boxHeight = nodeY - NODE_VGAP - boxY + CLUSTER_PAD;
    const boxX = x - CLUSTER_PAD;
    const label =
      collector.emitter === null
        ? collector.bundle
        : `${remoteClusterDisplay(collector.emitter)} · ${collector.bundle}`;
    clusters.push({
      key: clusterKey,
      column: 'chunks',
      label,
      count: collector.seeds.length,
      colorIndex: clusterHueOf(collector.emitter),
      x: boxX,
      y: boxY,
      width: NODE_W + 2 * CLUSTER_PAD,
      height: boxHeight,
      labelX: boxX + CLUSTER_PAD,
      labelY: boxY + CLUSTER_LABEL_BASELINE,
    });
    chunkCursor = boxY + boxHeight + CLUSTER_VGAP;
  }

  // --- Consume edges -----------------------------------------------------
  // One edge per relation. A relation endpoint outside the rendered node set
  // cannot be drawn; such relations are reported via `droppedRelationIds` —
  // nodes come only from the projection's remotes and copies, never invented
  // for an edge.
  const edges: GraphEdge[] = [];
  const droppedRelationIds: string[] = [];
  for (const relation of projection.consumerRelations) {
    const source = remoteNodeByName.get(relation.consumerRemote);
    const target = dependencyNodeById.get(relation.copyId);
    if (source !== undefined && target !== undefined) {
      edges.push(edgeOf(relation, source, target));
    } else {
      droppedRelationIds.push(relation.id);
    }
  }

  // --- Bundle-edge references (rendered by the hover trace only) ---------
  const referenceCap = edges.length + MAX_BUNDLE_EDGES;
  const bundleEdgeRefs: BundleEdgeRef[] = [];
  for (const pair of refPairs.slice(0, referenceCap)) {
    const dependency = dependencyNodeById.get(pair.copyId)!;
    const chunk = chunkNodeById.get(pair.chunkNodeId)!;
    bundleEdgeRefs.push({
      key: `${dependency.key}\n${chunk.key}`,
      dependencyKey: dependency.key,
      chunkKey: chunk.key,
      path: edgePath(
        dependency.x + dependency.width,
        dependency.y + dependency.height / 2,
        chunk.x,
        chunk.y + chunk.height / 2,
      ),
    });
  }
  const cappedEdges = Math.max(0, refPairs.length - referenceCap);

  // --- Canvas ------------------------------------------------------------
  const nodes: GraphNode[] = [...remoteNodes, ...dependencyNodes, ...chunkNodes];
  const remotesBottom =
    remoteNodes.length > 0
      ? MARGIN + HEADER_H + remoteNodes.length * (NODE_H + NODE_VGAP) - NODE_VGAP
      : MARGIN + HEADER_H;
  const dependenciesBottom =
    dependencyNodes.length > 0 ? dependencyCursor - CLUSTER_VGAP : MARGIN + HEADER_H;
  const chunksBottom = chunkNodes.length > 0 ? chunkCursor - CLUSTER_VGAP : MARGIN + HEADER_H;

  const completeness = projection.completeness.total;
  return {
    columns: [
      {
        key: 'remotes',
        label: 'Remotes',
        x: columnX(0),
        headerX: columnX(0),
        headerY: MARGIN + HEADER_BASELINE,
      },
      {
        key: 'dependencies',
        label: 'Dependencies',
        x: columnX(1),
        headerX: columnX(1),
        headerY: MARGIN + HEADER_BASELINE,
      },
      {
        key: 'chunks',
        label: 'Chunks',
        x: columnX(2),
        headerX: columnX(2),
        headerY: MARGIN + HEADER_BASELINE,
      },
    ],
    clusters,
    nodes,
    edges,
    bundleEdgeRefs,
    cappedEdges,
    droppedRelationIds,
    completeness,
    divergent:
      completeness.unknownResolutions > 0 ||
      completeness.unmappedResolutions > 0 ||
      completeness.blockedResolutions > 0 ||
      completeness.ambiguousSourceClaims > 0,
    width: columnX(2) + NODE_W + CLUSTER_PAD + MARGIN,
    height: Math.max(remotesBottom, dependenciesBottom, chunksBottom) + MARGIN,
    empty: nodes.length === 0,
  };
}
