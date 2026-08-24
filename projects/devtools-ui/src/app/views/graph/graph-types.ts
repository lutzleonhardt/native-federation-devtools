import type { CompletenessCounts } from '../../shared/store/resolution';

/**
 * Contract of the pure graph model: the layout constants and the shapes
 * `buildGraphModel` emits. The renderer draws these precomputed primitives
 * only; every rendered identity chains to canonical IDs (remote name, copy
 * ID, relation ID, bundle-claim ID, chunk-group ID + recorded file).
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
export const HEADER_BASELINE = 18;
export const LABEL_BASELINE = 17;
export const LABEL_PAD = 8;
/** Cluster label baseline inside the cluster header band. */
export const CLUSTER_LABEL_BASELINE = 15;
/** Second-line baseline of a chunk stub's qualifier text. */
export const QUALIFIER_BASELINE = 32;

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
