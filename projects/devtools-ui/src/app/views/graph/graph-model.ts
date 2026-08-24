import type {
  CanonicalResolutionProjection,
  ConsumerCopyRelation,
  RemoteProjection,
  ResolvedDependencyCopy,
} from '../../shared/store/resolution';

/**
 * Pure graph model over the canonical resolution projection: two flat
 * columns (remotes, resolved dependency copies) and one consume edge per
 * `ConsumerCopyRelation`. The builder computes all geometry; the renderer
 * draws primitives only. Identical inputs produce a deeply equal model.
 * Every rendered identity is a canonical ID (remote name, copy ID,
 * relation ID), and nothing here claims delivery — an edge proves what the
 * captured map resolves, never that anything was requested or executed.
 */

export const NODE_W = 280;
export const NODE_H = 26;
export const NODE_VGAP = 6;
export const COL_GAP = 150;
export const MARGIN = 24;
export const HEADER_H = 30;
export const LABEL_MAX = 36;

/** Text baselines inside the header band and inside a node box. */
const HEADER_BASELINE = 18;
const LABEL_BASELINE = 17;
const LABEL_PAD = 8;

export type GraphColumnKey = 'remotes' | 'dependencies';

export interface GraphColumn {
  key: GraphColumnKey;
  label: string;
  /** Left edge shared by the column's nodes. */
  x: number;
  /** Header text position (baseline). */
  headerX: number;
  headerY: number;
}

export interface GraphNode {
  /** Canonical identity: remote name or copy ID. */
  id: string;
  /**
   * Kind-qualified render key (`remote:<id>` / `dependency:<id>`). Remote
   * names are arbitrary capture strings and may textually equal a copy ID,
   * so the bare `id` is not unique across kinds.
   */
  key: string;
  kind: 'remote' | 'dependency';
  /** Truncated to `LABEL_MAX`; the full text moves to `labelTooltip`. */
  label: string;
  /** Full label when truncated, else null. */
  labelTooltip: string | null;
  /** Resolved tag of a dependency copy, right-aligned; null elsewhere. */
  subLabel: string | null;
  /** Remote nodes: the capture's host. */
  isHost: boolean;
  /** Dependency nodes: isolated/private copy — rendered with a dashed border. */
  isolated: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
  /** Right-aligned sub-label anchor (text-anchor: end). */
  subLabelX: number;
  subLabelY: number;
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

export interface GraphModel {
  columns: GraphColumn[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  /**
   * Relations whose consumer remote (or copy) has no rendered node — nodes
   * come only from the projection's remotes and copies, never invented for
   * an edge. Empty on every demonstrated capture; surfaced as data so the
   * omission is never silent.
   */
  droppedRelationIds: string[];
  width: number;
  height: number;
  /** True when the projection yields no nodes at all. */
  empty: boolean;
}

/** Reserved for later tasks (clustering, filters); empty on purpose. */
export interface GraphBuildOptions {}

/** Locale-independent codepoint comparison — determinism over collation. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function truncated(full: string): Pick<GraphNode, 'label' | 'labelTooltip'> {
  if (full.length <= LABEL_MAX) {
    return { label: full, labelTooltip: null };
  }
  return { label: `${full.slice(0, LABEL_MAX - 1)}…`, labelTooltip: full };
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

function nodeAt(
  columnIndex: number,
  rowIndex: number,
  fields: Pick<
    GraphNode,
    'id' | 'kind' | 'label' | 'labelTooltip' | 'subLabel' | 'isHost' | 'isolated'
  >,
): GraphNode {
  const x = columnX(columnIndex);
  const y = MARGIN + HEADER_H + rowIndex * (NODE_H + NODE_VGAP);
  return {
    ...fields,
    key: `${fields.kind}:${fields.id}`,
    x,
    y,
    width: NODE_W,
    height: NODE_H,
    labelX: x + LABEL_PAD,
    labelY: y + LABEL_BASELINE,
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

function edgeOf(relation: ConsumerCopyRelation, source: GraphNode, target: GraphNode): GraphEdge {
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

export function buildGraphModel(
  projection: CanonicalResolutionProjection,
  _options: GraphBuildOptions = {},
): GraphModel {
  const remoteNodes = [...projection.remotes].sort(remoteOrder).map((remote, row) =>
    nodeAt(0, row, {
      id: remote.name,
      kind: 'remote',
      ...truncated(remote.name),
      subLabel: null,
      isHost: remote.isHost,
      isolated: false,
    }),
  );

  const dependencyNodes = projection.copies
    .map((copy) => ({ copy, fullLabel: dependencyLabelOf(copy) }))
    .sort(
      (a, b) => compareStrings(a.fullLabel, b.fullLabel) || compareStrings(a.copy.id, b.copy.id),
    )
    .map(({ copy, fullLabel }, row) =>
      nodeAt(1, row, {
        id: copy.id,
        kind: 'dependency',
        ...truncated(fullLabel),
        subLabel: copy.resolvedTag,
        isHost: false,
        isolated: isIsolated(copy),
      }),
    );

  // Kind-separated lookups: a remote name may textually equal a copy ID, and
  // an edge source must always resolve to a remote, a target to a copy.
  const remoteNodeByName = new Map<string, GraphNode>(remoteNodes.map((node) => [node.id, node]));
  const dependencyNodeById = new Map<string, GraphNode>(
    dependencyNodes.map((node) => [node.id, node]),
  );

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

  const nodes = [...remoteNodes, ...dependencyNodes];
  const rows = Math.max(remoteNodes.length, dependencyNodes.length);
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
    ],
    nodes,
    edges,
    droppedRelationIds,
    width: columnX(1) + NODE_W + MARGIN,
    height: MARGIN + HEADER_H + (rows > 0 ? rows * (NODE_H + NODE_VGAP) - NODE_VGAP : 0) + MARGIN,
    empty: nodes.length === 0,
  };
}
