import type {
  BundleClaim,
  CanonicalResolutionProjection,
  ChunkGroupProjection,
  CompletenessCounts,
  ConsumerCopyRelation,
  RemoteProjection,
  ResolvedDependencyCopy,
} from '../../shared/store/resolution';
import {
  copySourceRemote,
  copySourceVmOf,
  participantDisplay,
} from '../../shared/view-conventions';

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
 * that anything was requested or executed.
 */

export const NODE_W = 280;
export const NODE_H = 26;
export const NODE_VGAP = 6;
export const COL_GAP = 150;
export const MARGIN = 24;
export const HEADER_H = 30;
export const LABEL_MAX = 36;
/** Display budget of the right-aligned tag sub-label; overflow gets a tooltip. */
export const SUB_LABEL_MAX = 16;

/** Cluster box geometry: header band, inner padding, gap between clusters. */
export const CLUSTER_HEADER = 22;
export const CLUSTER_PAD = 10;
export const CLUSTER_VGAP = 20;

/** Two-line chunk stub (bundle name + qualifier) of a claim without files. */
export const STUB_NODE_H = 40;

/**
 * Bundle-edge reference budget on top of the consume edges: references are
 * capped at `edges.length + MAX_BUNDLE_EDGES`; the overflow count is
 * reported as `cappedEdges`, never silently dropped.
 */
export const MAX_BUNDLE_EDGES = 4000;

/** Text baselines inside the header band and inside a node box. */
const HEADER_BASELINE = 18;
const LABEL_BASELINE = 17;
const LABEL_PAD = 8;
/** Cluster label baseline inside the cluster header band. */
const CLUSTER_LABEL_BASELINE = 15;
/** Second-line baseline of a chunk stub's qualifier text. */
const QUALIFIER_BASELINE = 32;

/**
 * The honest dependency buckets for copies without an evidenced source
 * remote — always pinned after the source-remote clusters, in this order,
 * and never collapsed into one another.
 */
export const HONEST_BUCKETS = ['ambiguous source', 'target only', 'unknown'] as const;
export type HonestBucket = (typeof HONEST_BUCKETS)[number];

export type GraphColumnKey = 'remotes' | 'dependencies' | 'chunks';

export interface GraphColumn {
  key: GraphColumnKey;
  label: string;
  /** Left edge shared by the column's nodes. */
  x: number;
  /** Header text position (baseline). */
  headerX: number;
  headerY: number;
}

/** Fields every node kind shares; the union members discriminate on `kind`. */
export interface GraphNodeBase {
  /** Canonical identity: remote name, copy ID, claim ID, or group ID + file. */
  id: string;
  /**
   * Kind-qualified render key (`<kind>:<id>`). Remote names are arbitrary
   * capture strings and may textually equal a copy ID, so the bare `id` is
   * not unique across kinds.
   */
  key: string;
  /** Truncated to `LABEL_MAX`; the full text moves to `labelTooltip`. */
  label: string;
  /** Full label when truncated, else null. */
  labelTooltip: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
}

export interface RemoteGraphNode extends GraphNodeBase {
  kind: 'remote';
  /** The capture's host. */
  isHost: boolean;
}

export interface DependencyGraphNode extends GraphNodeBase {
  kind: 'dependency';
  /**
   * Resolved tag of the copy, right-aligned and truncated to
   * `SUB_LABEL_MAX`; null when not evidenced.
   */
  subLabel: string | null;
  /** Full tag when truncated, else null. */
  subLabelTooltip: string | null;
  /** Isolated/private copy — rendered with a dashed border. */
  isolated: boolean;
  /** Right-aligned sub-label anchor (text-anchor: end). */
  subLabelX: number;
  subLabelY: number;
}

export interface ChunkGraphNode extends GraphNodeBase {
  kind: 'chunk';
  /**
   * Qualifier line of a stub (a claim without registered chunk files):
   * `source-only` and `ambiguous` claims must surface their uncertainty
   * instead of inventing files. Null on a recorded chunk-file node.
   */
  qualifier: string | null;
  qualifierX: number;
  qualifierY: number;
}

export type GraphNode = RemoteGraphNode | DependencyGraphNode | ChunkGraphNode;

/** One cluster box of a clustered column (dependencies or chunks). */
export interface GraphCluster {
  /** Kind-qualified render key — cluster names are arbitrary capture strings. */
  key: string;
  column: 'dependencies' | 'chunks';
  /** `host`, source-remote display, honest bucket, or `emitter · bundle`. */
  label: string;
  /** Number of enclosed nodes. */
  count: number;
  /**
   * 1-based `--nf-participant-color-N` index of the owning remote from the
   * injected app-wide assignment; null renders neutral. The host and the
   * honest buckets are always neutral — a hue is an identity claim.
   */
  colorIndex: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
}

export interface GraphEdge {
  /** Canonical `ConsumerCopyRelation` ID. */
  id: string;
  /** Consumer remote name. */
  sourceId: string;
  /** Copy ID. */
  targetId: string;
  /**
   * Solid when every mapping state of the relation is `own-selected` —
   * vacuously solid for a claim-less relation, whose binding carries no
   * deviation evidence. Dotted otherwise.
   */
  style: 'solid' | 'dotted';
  /** Distinct mapping states verbatim on dotted edges; null on solid ones. */
  tooltip: string | null;
  /** Cubic Bézier from source right-mid to target left-mid. */
  path: string;
}

/**
 * One `dependency → chunk` reference of a bundle claim. Computed into the
 * model with full geometry but not rendered as a standing edge — the hover
 * trace (Task 3) draws the references of the hovered node only.
 */
export interface BundleEdgeRef {
  key: string;
  /** Render key of the claiming dependency node. */
  dependencyKey: string;
  /** Render key of the claimed chunk node. */
  chunkKey: string;
  path: string;
}

export interface GraphModel {
  columns: GraphColumn[];
  clusters: GraphCluster[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Capped at `edges.length + MAX_BUNDLE_EDGES`; overflow in `cappedEdges`. */
  bundleEdgeRefs: BundleEdgeRef[];
  /** Bundle-edge references dropped by the cap — counted, never silent. */
  cappedEdges: number;
  /**
   * Relations whose consumer remote (or copy) has no rendered node — nodes
   * come only from the projection's remotes and copies, never invented for
   * an edge. Empty on every demonstrated capture; surfaced as data so the
   * omission is never silent.
   */
  droppedRelationIds: string[];
  /** `projection.completeness.total` passthrough for the divergence footer. */
  completeness: CompletenessCounts;
  /** True when any completeness count is non-zero — the footer's gate. */
  divergent: boolean;
  width: number;
  height: number;
  /** True when the projection yields no nodes at all. */
  empty: boolean;
}

export interface GraphBuildOptions {
  /**
   * The app-wide participant color assignment (name → 1-based palette
   * index, host excluded, empty above the palette threshold) — the same
   * lookup the participant chips render, so a remote's cluster hue equals
   * its identity-dot slot in every view. Its domain covers the capture's
   * renderable participants independent of any graph filtering, which keeps
   * cluster hues stable under later filtering.
   */
  participantColors?: ReadonlyMap<string, number>;
}

/** Locale-independent codepoint comparison — determinism over collation. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function truncated(
  full: string,
  max: number = LABEL_MAX,
): Pick<GraphNodeBase, 'label' | 'labelTooltip'> {
  if (full.length <= max) {
    return { label: full, labelTooltip: null };
  }
  return { label: `${full.slice(0, max - 1)}…`, labelTooltip: full };
}

/**
 * Label budget of a dependency node: the DISPLAYED tag sub-label reserves
 * its own characters plus a two-char gap inside the shared node width, so a
 * near-limit label never runs under the tag (T1 open issue). Because the
 * displayed tag is itself bounded by `SUB_LABEL_MAX`, label + gap + tag
 * never exceed `LABEL_MAX`; the floor is a pure defensive bound.
 */
function dependencyLabelBudget(shownTag: string | null): number {
  return shownTag === null ? LABEL_MAX : Math.max(12, LABEL_MAX - shownTag.length - 2);
}

/**
 * Label rule for a dependency node: the evidenced source package first, else
 * the alphabetically first consumer registry package of the copy's
 * resolution contexts, else the target URL of the first (alphabetically
 * first specifier) entrypoint.
 */
function dependencyLabelOf(copy: ResolvedDependencyCopy): string {
  if (copy.sourcePackage !== null) {
    return copy.sourcePackage;
  }
  const contextPackages = copy.resolutionContexts
    .map((context) => context.consumerRegistryPackage)
    .sort(compareStrings);
  if (contextPackages.length > 0) {
    return contextPackages[0];
  }
  const specifiers = Object.keys(copy.entrypoints).sort(compareStrings);
  return specifiers.length > 0 ? copy.entrypoints[specifiers[0]] : copy.id;
}

/** Isolated/private copies render dashed; every other disposition is solid. */
function isIsolated(copy: ResolvedDependencyCopy): boolean {
  return (
    copy.sourceDisposition === 'scope-registration' ||
    copy.sourceDisposition === 'private-registration'
  );
}

function columnX(index: number): number {
  return MARGIN + index * (NODE_W + COL_GAP);
}

function nodeBaseAt(
  kind: GraphNode['kind'],
  id: string,
  fullLabel: string,
  x: number,
  y: number,
  labelMax: number = LABEL_MAX,
): GraphNodeBase {
  return {
    id,
    key: `${kind}:${id}`,
    ...truncated(fullLabel, labelMax),
    x,
    y,
    width: NODE_W,
    height: NODE_H,
    labelX: x + LABEL_PAD,
    labelY: y + LABEL_BASELINE,
  };
}

function remoteNodeAt(remote: RemoteProjection, rowIndex: number): RemoteGraphNode {
  const y = MARGIN + HEADER_H + rowIndex * (NODE_H + NODE_VGAP);
  // Chip convention: the `__NF-HOST__` sentinel reads as `host`; the
  // verbatim name stays reachable as tooltip, and `id` stays canonical.
  const display = participantDisplay(remote.name);
  const base = nodeBaseAt('remote', remote.name, display, columnX(0), y);
  return {
    ...base,
    labelTooltip: display === remote.name ? base.labelTooltip : remote.name,
    kind: 'remote',
    isHost: remote.isHost,
  };
}

function dependencyNodeAt(
  copy: ResolvedDependencyCopy,
  fullLabel: string,
  y: number,
): DependencyGraphNode {
  const x = columnX(1);
  const tag = copy.resolvedTag === null ? null : truncated(copy.resolvedTag, SUB_LABEL_MAX);
  return {
    ...nodeBaseAt(
      'dependency',
      copy.id,
      fullLabel,
      x,
      y,
      dependencyLabelBudget(tag?.label ?? null),
    ),
    kind: 'dependency',
    subLabel: tag === null ? null : tag.label,
    subLabelTooltip: tag === null ? null : tag.labelTooltip,
    isolated: isIsolated(copy),
    subLabelX: x + NODE_W - LABEL_PAD,
    subLabelY: y + LABEL_BASELINE,
  };
}

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(24, (x2 - x1) / 2);
  return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function remoteOrder(a: RemoteProjection, b: RemoteProjection): number {
  if (a.isHost !== b.isHost) {
    return a.isHost ? -1 : 1;
  }
  return compareStrings(a.name, b.name);
}

function edgeOf(
  relation: ConsumerCopyRelation,
  source: RemoteGraphNode,
  target: DependencyGraphNode,
): GraphEdge {
  const solid = relation.mappingStates.every((state) => state === 'own-selected');
  return {
    id: relation.id,
    sourceId: source.id,
    targetId: target.id,
    style: solid ? 'solid' : 'dotted',
    tooltip: solid ? null : Array.from(new Set(relation.mappingStates)).join(', '),
    path: edgePath(
      source.x + source.width,
      source.y + source.height / 2,
      target.x,
      target.y + target.height / 2,
    ),
  };
}

/**
 * Dependency cluster of one copy, from the shared source attribution: an
 * evidenced source remote (`exact-target-source` / `explicit-anchor`)
 * clusters under that remote; everything else stays in its honest bucket —
 * a scope-prefix observation is not an evidenced source.
 */
function dependencyClusterOf(
  copy: ResolvedDependencyCopy,
): { kind: 'source'; remote: string } | { kind: 'bucket'; bucket: HonestBucket } {
  const qualifier = copySourceVmOf(copy).qualifier;
  switch (qualifier) {
    case 'exact-target-source':
    case 'explicit-anchor':
      // The qualifier ladder only reaches these for an evidenced source
      // record, whose variant embeds its remote name.
      return { kind: 'source', remote: copySourceRemote(copy)! };
    case 'ambiguous-source':
      return { kind: 'bucket', bucket: 'ambiguous source' };
    case 'observed-target-source':
      return { kind: 'bucket', bucket: 'target only' };
    case 'unknown-source':
      return { kind: 'bucket', bucket: 'unknown' };
  }
}

/** Qualifier line of a chunk stub; only `mapped-source` claims list files. */
function stubQualifierOf(claim: BundleClaim): string {
  return claim.status === 'ambiguous'
    ? 'ambiguous — no unique source'
    : 'source-only — no registered chunk list';
}

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
