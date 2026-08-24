/**
 * Graph builder specs — DOM-free pins over the pure `buildGraphModel`
 * derivation: node derivation and ordering, the dependency label fallback
 * chain, truncation, edge styles from relation mapping states (including the
 * vacuously solid claim-less relation), the fixed-column geometry, and
 * determinism. Fixture cases run through the real ingest pipeline; synthetic
 * seeds pin the rules the corpus does not reach.
 */
import { FIXTURES, FixtureId } from 'devtools-bridge';

import {
  PARTICIPANT_PALETTE_SIZE,
  assignParticipantColors,
} from '../../shared/kit/participant-colors';
import { ingestSnapshot } from '../../shared/store/ingest';
import type {
  BundleClaim,
  BundleClaimId,
  BundleClaimStatus,
  CanonicalResolutionProjection,
  ChunkGroupId,
  ChunkGroupProjection,
  ClaimMappingState,
  ConsumerCopyRelation,
  ConsumerCopyRelationId,
  ObservedTargetProvider,
  RemoteProjection,
  ResolvedDependencyCopy,
  ResolvedDependencyCopyId,
} from '../../shared/store/resolution';
import { buildGraphModel } from './graph-model';
import {
  CLUSTER_HEADER,
  CLUSTER_PAD,
  COL_GAP,
  ChunkGraphNode,
  DependencyGraphNode,
  GraphModel,
  HEADER_H,
  LABEL_MAX,
  MARGIN,
  MAX_BUNDLE_EDGES,
  NODE_H,
  NODE_VGAP,
  NODE_W,
  RemoteGraphNode,
  SUB_LABEL_MAX,
} from './graph-types';

function projectionOf(fixtureId: FixtureId): CanonicalResolutionProjection {
  return ingestSnapshot(structuredClone(FIXTURES[fixtureId])).resolutionProjection;
}

function modelOf(fixtureId: FixtureId): GraphModel {
  return buildGraphModel(projectionOf(fixtureId));
}

/** Union-narrowing selectors over the node list. */
function remoteNodesOf(model: GraphModel): RemoteGraphNode[] {
  return model.nodes.filter((node): node is RemoteGraphNode => node.kind === 'remote');
}

function dependencyNodesOf(model: GraphModel): DependencyGraphNode[] {
  return model.nodes.filter((node): node is DependencyGraphNode => node.kind === 'dependency');
}

function chunkNodesOf(model: GraphModel): ChunkGraphNode[] {
  return model.nodes.filter((node): node is ChunkGraphNode => node.kind === 'chunk');
}

function clusterLabelsOf(model: GraphModel, column: 'dependencies' | 'chunks'): [string, number][] {
  return model.clusters.filter((c) => c.column === column).map((c) => [c.label, c.count]);
}

/** Synthetic seed helpers — minimal canonical shapes with branded-ID casts. */
function remoteOf(name: string, isHost = false): RemoteProjection {
  return { name, isHost, scopeUrl: `./${name}/`, resolvedScopeUrl: `https://page.test/${name}/` };
}

function copyOf(
  id: string,
  partial: Partial<
    Pick<
      ResolvedDependencyCopy,
      | 'sourcePackage'
      | 'resolvedTag'
      | 'source'
      | 'sourceDisposition'
      | 'resolutionContexts'
      | 'entrypoints'
      | 'observedTargetProviders'
      | 'bundleClaimIds'
    >
  > = {},
): ResolvedDependencyCopy {
  return {
    id: id as ResolvedDependencyCopyId,
    sourcePackage: null,
    resolvedTag: null,
    source: { kind: 'target-url', targetUrl: 'https://cdn.test/mod.js' },
    sourceDisposition: 'target-only',
    effectiveRoles: ['unclassified'],
    sourceActions: [],
    entrypoints: {},
    effectiveResolutionIds: [],
    resolutionContexts: [],
    sourceRegistrationRefs: [],
    observedTargetProviders: [],
    registryServingSlotClaims: [],
    bundleClaimIds: [],
    provenance: { evidence: [] },
    ...partial,
  };
}

function relationOf(
  consumerRemote: string,
  copyId: string,
  mappingStates: ClaimMappingState[],
): ConsumerCopyRelation {
  return {
    id: `consumer-copy-relation:[${consumerRemote},${copyId}]` as ConsumerCopyRelationId,
    consumerRemote,
    copyId: copyId as ResolvedDependencyCopyId,
    effectiveResolutionIds: [],
    claimIds: [],
    mappingStates,
  };
}

function observedProviderOf(
  remote: string | null,
  outcome: ObservedTargetProvider['outcome'],
): ObservedTargetProvider {
  return {
    id: `observed:${remote}` as ObservedTargetProvider['id'],
    resolutionId: 'resolution-1' as ObservedTargetProvider['resolutionId'],
    remote,
    outcome,
    rule: 'scope-prefix-match',
    provenance: { evidence: [] },
  };
}

function chunkGroupOf(
  id: string,
  emitterRemote: string,
  bundleName: string,
  files: string[],
): ChunkGroupProjection {
  return {
    id: id as ChunkGroupId,
    emitterRemote,
    origin: 'shared-chunks',
    bundleName,
    pseudoPackage: null,
    files,
    provenance: { evidence: [] },
  };
}

function bundleClaimOf(
  id: string,
  copyId: string,
  status: BundleClaimStatus,
  sourceRemote: string | null,
  bundle: string,
  chunkGroupIds: string[] = [],
): BundleClaim {
  return {
    id: id as BundleClaimId,
    copyId: copyId as ResolvedDependencyCopyId,
    source: null,
    sourceRemote,
    bundle,
    chunkGroupIds: chunkGroupIds as ChunkGroupId[],
    status,
    provenance: { evidence: [] },
  };
}

function syntheticProjection(
  partial: Partial<
    Pick<
      CanonicalResolutionProjection,
      'remotes' | 'copies' | 'consumerRelations' | 'chunkGroups' | 'bundleClaims'
    >
  >,
): CanonicalResolutionProjection {
  return {
    remotes: [],
    copies: [],
    consumerRelations: [],
    chunkGroups: [],
    bundleClaims: [],
    declarationResolutionClaims: [],
    registryServingSlotClaims: [],
    observedTargetProviders: [],
    sourceComparisons: [],
    packageMeasures: [],
    completeness: {
      total: {
        unknownResolutions: 0,
        unmappedResolutions: 0,
        blockedResolutions: 0,
        ambiguousSourceClaims: 0,
      },
      byConsumer: {},
      consumerIssues: [],
    },
    ...partial,
  };
}

describe('buildGraphModel', () => {
  // T1-AC-04: identical projection input produces a deeply equal model.
  it('is deterministic: two independent ingests produce a deeply equal model', () => {
    expect(modelOf('co-declared-share')).toEqual(modelOf('co-declared-share'));
    expect(modelOf('frankenstein-live')).toEqual(modelOf('frankenstein-live'));
  });

  // T1-AC-01 (model level): one dependency node, mfe1 solid, mfe2 dotted
  // with `not-selected`, resolved tag as right-aligned sub-label.
  it('renders co-declared-share as one copy with a solid and a dotted consume edge', () => {
    const projection = projectionOf('co-declared-share');
    const model = buildGraphModel(projection);

    expect(remoteNodesOf(model).map((n) => n.id)).toEqual(['__NF-HOST__', 'mfe1', 'mfe2']);
    const dependencies = dependencyNodesOf(model);
    expect(dependencies.length).toBe(1);
    expect(dependencies[0].id).toBe(projection.copies[0].id);
    expect(dependencies[0].label).toBe('@nf-lab/conflict-lib');
    expect(dependencies[0].subLabel).toBe('1.0.0');
    expect(dependencies[0].isolated).toBe(false);

    expect(model.edges.length).toBe(2);
    const bySource = new Map(model.edges.map((e) => [e.sourceId, e]));
    expect(bySource.get('mfe1')).toEqual(
      expect.objectContaining({ style: 'solid', tooltip: null }),
    );
    expect(bySource.get('mfe2')).toEqual(
      expect.objectContaining({ style: 'dotted', tooltip: 'not-selected' }),
    );
  });

  // T1-AC-02 (model level): one remote node per projection remote (host
  // first), one dependency node per copy, one edge per relation — all keyed
  // by canonical IDs.
  it('maps frankenstein-live one-to-one onto canonical identities', () => {
    const projection = projectionOf('frankenstein-live');
    const model = buildGraphModel(projection);

    const remoteNodes = remoteNodesOf(model);
    expect(remoteNodes.map((n) => n.id)).toEqual(['__NF-HOST__', 'mermaid', 'whiteboard']);
    expect(remoteNodes[0].isHost).toBe(true);
    // Display mapping: the sentinel renders as `host`, the verbatim name
    // stays reachable as tooltip, the id stays canonical.
    expect(remoteNodes[0].label).toBe('host');
    expect(remoteNodes[0].labelTooltip).toBe('__NF-HOST__');
    expect(remoteNodes[1].labelTooltip).toBeNull();

    const dependencyIds = dependencyNodesOf(model).map((n) => n.id);
    expect(dependencyIds.length).toBe(projection.copies.length);
    expect(new Set(dependencyIds)).toEqual(new Set(projection.copies.map((c) => c.id)));

    expect(model.edges.map((e) => e.id).sort()).toEqual(
      projection.consumerRelations.map((r) => r.id).sort(),
    );
    expect(model.droppedRelationIds).toEqual([]);
    const nodeIds = new Set(model.nodes.map((n) => n.id));
    for (const edge of model.edges) {
      expect(nodeIds.has(edge.sourceId)).toBe(true);
      expect(nodeIds.has(edge.targetId)).toBe(true);
    }
  });

  // T1-AC-03 (model level): anchored relations render dotted with `anchored`
  // listed; since T2, cluster order (host first, then mfe1) precedes the
  // label/copy-ID order within a cluster.
  it('renders pooling-anchor anchored relations dotted and orders equal labels by copy ID', () => {
    const model = modelOf('pooling-anchor');

    const anchored = model.edges.filter((e) => e.tooltip === 'anchored');
    expect(anchored.length).toBe(2);
    expect(anchored.every((e) => e.style === 'dotted')).toBe(true);
    expect(anchored.map((e) => e.sourceId).sort()).toEqual(['mfe1', 'mfe2']);

    const dependencies = dependencyNodesOf(model);
    expect(dependencies.map((n) => [n.label, n.subLabel])).toEqual([
      ['@nf-lab/conflict-lib', '2.0.0'],
      ['@nf-lab/conflict-lib', '1.0.0'],
      ['@nf-lab/conflict-lib/extra', '1.0.0'],
    ]);
  });

  // T1-AC-03 (model level): private copies carry the isolated metadata.
  it('marks the scoped fixture private copies as isolated', () => {
    const model = modelOf('scoped');
    const dependencies = dependencyNodesOf(model);
    expect(dependencies.length).toBe(2);
    expect(dependencies.every((n) => n.isolated)).toBe(true);
  });

  it('marks only scope- and private-registration dispositions as isolated', () => {
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-share', { sourcePackage: 'a', sourceDisposition: 'share-registration' }),
          copyOf('copy-skip', { sourcePackage: 'b', sourceDisposition: 'skip-registration' }),
          copyOf('copy-scope', { sourcePackage: 'c', sourceDisposition: 'scope-registration' }),
          copyOf('copy-private', { sourcePackage: 'd', sourceDisposition: 'private-registration' }),
          copyOf('copy-url', { sourcePackage: 'e', sourceDisposition: 'target-only' }),
        ],
      }),
    );
    expect(dependencyNodesOf(model).map((n) => [n.label, n.isolated])).toEqual([
      ['a', false],
      ['b', false],
      ['c', true],
      ['d', true],
      ['e', false],
    ]);
  });

  it('labels dependencies by source package, else first context package, else first entrypoint URL', () => {
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-source', {
            sourcePackage: 'named-source',
            resolutionContexts: [
              {
                resolutionDomain: { kind: 'share-scope', name: '__GLOBAL__' },
                consumerRegistryPackage: 'aaa-context',
                claimIds: [],
              },
            ],
          }),
          copyOf('copy-context', {
            resolutionContexts: [
              {
                resolutionDomain: { kind: 'share-scope', name: '__GLOBAL__' },
                consumerRegistryPackage: 'zeta-pkg',
                claimIds: [],
              },
              {
                resolutionDomain: { kind: 'share-scope', name: '__GLOBAL__' },
                consumerRegistryPackage: 'alpha-pkg',
                claimIds: [],
              },
            ],
          }),
          copyOf('copy-url', {
            entrypoints: {
              'zeta-specifier': 'https://cdn.test/zeta.js',
              'alpha-specifier': 'https://cdn.test/alpha.js',
            },
          }),
        ],
      }),
    );
    expect(model.nodes.map((n) => n.label).sort()).toEqual([
      'alpha-pkg',
      'https://cdn.test/alpha.js',
      'named-source',
    ]);
  });

  // T1-AC-04: labels above 36 chars truncate to 35 + `…`, full text as tooltip.
  it('truncates long labels and keeps the full text as tooltip', () => {
    const long = '@nf-lab/a-very-long-package-name-that-overflows';
    const short = 'fits-within-the-limit';
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-long', { sourcePackage: long }),
          copyOf('copy-short', { sourcePackage: short }),
        ],
      }),
    );
    // Codepoint label sort puts `@nf-lab/…` before `fits-…`.
    const [truncated, fits] = model.nodes;
    expect(truncated.label).toBe(`${long.slice(0, 35)}…`);
    expect(truncated.label.length).toBe(36);
    expect(truncated.labelTooltip).toBe(long);
    expect(fits.label).toBe(short);
    expect(fits.labelTooltip).toBeNull();
  });

  // T1 open issue closed here: a tagged dependency reserves the tag's
  // characters (plus a two-char gap) in its label budget, so a near-limit
  // label never runs under the right-aligned tag.
  it('reserves sub-label space when truncating a tagged dependency label', () => {
    const long = '@nf-lab/a-very-long-package-name-that-overflows';
    const model = buildGraphModel(
      syntheticProjection({
        copies: [copyOf('copy-tagged', { sourcePackage: long, resolvedTag: '21.2.12' })],
      }),
    );
    const [node] = dependencyNodesOf(model);
    // Budget = LABEL_MAX - 7 (tag) - 2 (gap) = 27 → 26 chars + `…`.
    expect(node.label).toBe(`${long.slice(0, 26)}…`);
    expect(node.label.length).toBe(27);
    expect(node.labelTooltip).toBe(long);
    expect(node.subLabel).toBe('21.2.12');
    expect(node.subLabelTooltip).toBeNull();
  });

  // Codex review fix: the overlap invariant must hold for LONG tags too —
  // the displayed tag is bounded by SUB_LABEL_MAX (full tag as tooltip),
  // and the label budget derives from the DISPLAYED tag, so label + gap +
  // tag can never exceed the node's character budget.
  it('bounds a long resolved tag with a tooltip and keeps the label clear of it', () => {
    const tag = '1.2.3-canary.20260824.abc1234';
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-pre', {
            sourcePackage: '@nf-lab/a-very-long-package-name-that-overflows',
            resolvedTag: tag,
          }),
        ],
      }),
    );
    const [node] = dependencyNodesOf(model);
    expect(node.subLabel).toBe(`${tag.slice(0, SUB_LABEL_MAX - 1)}…`);
    expect(node.subLabel!.length).toBe(SUB_LABEL_MAX);
    expect(node.subLabelTooltip).toBe(tag);
    // Label budget from the displayed tag: 36 - 16 - 2 = 18 chars.
    expect(node.label.length).toBe(18);
    expect(node.label.length + 2 + node.subLabel!.length).toBeLessThanOrEqual(LABEL_MAX);
  });

  // A claim-less relation carries no deviation evidence: the all-own-selected
  // rule is vacuously true and the edge renders solid without a tooltip.
  it('renders a claim-less relation (empty mapping states) solid', () => {
    const model = buildGraphModel(
      syntheticProjection({
        remotes: [remoteOf('host', true)],
        copies: [copyOf('copy-1', { sourcePackage: 'pkg' })],
        consumerRelations: [relationOf('host', 'copy-1', [])],
      }),
    );
    expect(model.edges).toEqual([expect.objectContaining({ style: 'solid', tooltip: null })]);
  });

  it('lists all distinct mapping states verbatim on a mixed dotted edge', () => {
    const model = buildGraphModel(
      syntheticProjection({
        remotes: [remoteOf('host', true)],
        copies: [copyOf('copy-1', { sourcePackage: 'pkg' })],
        consumerRelations: [
          relationOf('host', 'copy-1', ['fallback', 'not-selected', 'own-selected']),
        ],
      }),
    );
    expect(model.edges[0].style).toBe('dotted');
    expect(model.edges[0].tooltip).toBe('fallback, not-selected, own-selected');
  });

  // Review regression: remote names are arbitrary capture strings — one that
  // textually equals a copy ID must not merge lookups, corrupt the edge, or
  // duplicate render keys.
  it('keeps a remote whose name equals a copy ID distinct from that copy', () => {
    const model = buildGraphModel(
      syntheticProjection({
        remotes: [remoteOf('copy-1', true)],
        copies: [copyOf('copy-1', { sourcePackage: 'pkg' })],
        consumerRelations: [relationOf('copy-1', 'copy-1', [])],
      }),
    );

    expect(model.nodes.map((n) => n.key)).toEqual(['remote:copy-1', 'dependency:copy-1']);
    expect(model.droppedRelationIds).toEqual([]);
    expect(model.edges.length).toBe(1);
    // The edge must anchor at the remote node (column 0), not the same-ID
    // copy: right-mid (304, 67) → left-mid inside the `unknown` cluster
    // (454, 54 + CLUSTER_HEADER + CLUSTER_PAD + 13 = 99), dx = max(24, 75).
    expect(model.edges[0].path).toBe('M 304,67 C 379,67 379,99 454,99');
  });

  // Review regression: a relation without a rendered endpoint is never a
  // silent omission — it is reported, and no node is invented for it.
  it('reports relations whose consumer remote has no rendered node', () => {
    const relation = relationOf('ghost', 'copy-1', ['own-selected']);
    const model = buildGraphModel(
      syntheticProjection({
        remotes: [remoteOf('host', true)],
        copies: [copyOf('copy-1', { sourcePackage: 'pkg' })],
        consumerRelations: [relation],
      }),
    );
    expect(model.edges).toEqual([]);
    expect(model.droppedRelationIds).toEqual([relation.id]);
    expect(model.nodes.length).toBe(2);
  });

  it('pins the three-column geometry, the cluster boxes, and the Bézier edge path', () => {
    const model = modelOf('co-declared-share');

    expect(model.columns.map((c) => [c.key, c.x])).toEqual([
      ['remotes', MARGIN],
      ['dependencies', MARGIN + NODE_W + COL_GAP],
      ['chunks', MARGIN + 2 * (NODE_W + COL_GAP)],
    ]);
    const remoteYs = remoteNodesOf(model).map((n) => n.y);
    const firstY = MARGIN + HEADER_H;
    expect(remoteYs).toEqual([
      firstY,
      firstY + NODE_H + NODE_VGAP,
      firstY + 2 * (NODE_H + NODE_VGAP),
    ]);

    // One dependency cluster (mfe1) with one node: the box encloses the
    // node with the header band and padding; the node sits inset in y only.
    const dependencyCluster = model.clusters.find((c) => c.column === 'dependencies');
    expect(dependencyCluster).toEqual(
      expect.objectContaining({
        label: 'mfe1',
        count: 1,
        x: MARGIN + NODE_W + COL_GAP - CLUSTER_PAD,
        y: firstY,
        width: NODE_W + 2 * CLUSTER_PAD,
        height: CLUSTER_HEADER + CLUSTER_PAD + NODE_H + CLUSTER_PAD,
      }),
    );
    const dependency = dependencyNodesOf(model)[0];
    expect(dependency.y).toBe(firstY + CLUSTER_HEADER + CLUSTER_PAD);

    expect(model.width).toBe(MARGIN + 2 * (NODE_W + COL_GAP) + NODE_W + CLUSTER_PAD + MARGIN);
    // Remotes column (3 flat rows) is the tallest of the three columns.
    expect(model.height).toBe(MARGIN + HEADER_H + 3 * (NODE_H + NODE_VGAP) - NODE_VGAP + MARGIN);

    // mfe1 (row 1, column 0) → the single copy (cluster row 0, column 1):
    // right-mid (304, 99) → left-mid (454, 86 + 13 = 99), dx = max(24, 75).
    const mfe1Edge = model.edges.find((e) => e.sourceId === 'mfe1');
    expect(mfe1Edge?.path).toBe('M 304,99 C 379,99 379,99 454,99');
  });

  // T1-AC-06 (model level): a projection with no nodes flags empty.
  it('flags an empty capture as nothing to graph', () => {
    const model = modelOf('synthetic-empty-page');
    expect(model.empty).toBe(true);
    expect(model.nodes).toEqual([]);
    expect(model.edges).toEqual([]);
  });

  it('keeps remotes without copies renderable (not empty)', () => {
    const model = modelOf('synthetic-multi-version');
    expect(model.empty).toBe(false);
    expect(model.nodes.every((n) => n.kind === 'remote')).toBe(true);
    expect(model.edges).toEqual([]);
  });

  // ---- Task 2: source clustering, chunk column, honest footer data ----

  // T2-AC-01 (model level): dependency clusters by evidenced source with
  // host first; cluster boxes enclose exactly their nodes.
  it('clusters frankenstein-live dependencies by evidenced source with host first', () => {
    const model = modelOf('frankenstein-live');
    expect(clusterLabelsOf(model, 'dependencies')).toEqual([
      ['host', 12],
      ['mermaid', 1],
      ['whiteboard', 7],
    ]);
    for (const cluster of model.clusters.filter((c) => c.column === 'dependencies')) {
      const enclosed = dependencyNodesOf(model).filter(
        (n) =>
          n.x >= cluster.x &&
          n.x + n.width <= cluster.x + cluster.width &&
          n.y >= cluster.y &&
          n.y + n.height <= cluster.y + cluster.height,
      );
      expect(enclosed.length).toBe(cluster.count);
    }
  });

  // T2-AC-01 (model level): the chunk column renders the host's chunk
  // groups under `emitter · bundle` heads; claims without registered files
  // stay qualified stubs.
  it('derives frankenstein-live chunk clusters as emitter · bundle', () => {
    const model = modelOf('frankenstein-live');
    expect(clusterLabelsOf(model, 'chunks')).toEqual([
      ['host · browser-angular_common', 1],
      ['host · browser-angular_core', 5],
      ['host · browser-angular_platform_browser', 1],
      ['host · browser-rxjs', 1],
      ['host · browser-tslib', 1],
    ]);
    const chunks = chunkNodesOf(model);
    expect(chunks.length).toBe(9);
    expect(chunks.filter((n) => n.qualifier === null).length).toBe(7);

    // 2 copies × browser-angular_common (1 file) + 6 × browser-angular_core
    // (5 files) + 2 × browser-rxjs (1 file) + 2 stub references = 36.
    expect(model.bundleEdgeRefs.length).toBe(36);
    expect(model.cappedEdges).toBe(0);
    const nodeKeys = new Set(model.nodes.map((n) => n.key));
    for (const ref of model.bundleEdgeRefs) {
      expect(nodeKeys.has(ref.dependencyKey)).toBe(true);
      expect(nodeKeys.has(ref.chunkKey)).toBe(true);
    }
  });

  // T2-AC-02: chunk evidence follows the selected source — the emitting
  // remote's cluster carries it, the borrowing consumer contributes nothing.
  it('clusters clean-skip chunk evidence under the emitting source remote only', () => {
    const projection = projectionOf('clean-skip');
    const model = buildGraphModel(projection);
    expect(clusterLabelsOf(model, 'dependencies')).toEqual([['mfe2', 1]]);
    expect(clusterLabelsOf(model, 'chunks')).toEqual([['mfe2 · browser-shared', 1]]);
    // Every consumer still relates to the copy through consume edges …
    expect(model.edges.length).toBe(projection.consumerRelations.length);
    // … but the chunk column holds only the emitter's qualified claim.
    const chunks = chunkNodesOf(model);
    expect(chunks.map((n) => [n.label, n.qualifier])).toEqual([
      ['browser-shared', 'source-only — no registered chunk list'],
    ]);
  });

  // T2-AC-03 (model level): ambiguous claims keep their qualifier and
  // attribute no chunk files; the copy itself sits in its honest bucket.
  it('keeps ambiguous bundle claims qualified without attributing chunk files', () => {
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-amb', {
            sourcePackage: 'pkg',
            sourceDisposition: 'ambiguous-source',
            bundleClaimIds: ['claim-a', 'claim-b'] as BundleClaimId[],
          }),
        ],
        bundleClaims: [
          bundleClaimOf('claim-a', 'copy-amb', 'ambiguous', 'mfe1', 'browser-shared'),
          bundleClaimOf('claim-b', 'copy-amb', 'ambiguous', 'mfe2', 'browser-shared'),
        ],
      }),
    );
    expect(chunkNodesOf(model).map((n) => [n.label, n.qualifier])).toEqual([
      ['browser-shared', 'ambiguous — no unique source'],
      ['browser-shared', 'ambiguous — no unique source'],
    ]);
    expect(clusterLabelsOf(model, 'chunks')).toEqual([
      ['mfe1 · browser-shared', 1],
      ['mfe2 · browser-shared', 1],
    ]);
    expect(clusterLabelsOf(model, 'dependencies')).toEqual([['ambiguous source', 1]]);
  });

  // T2-AC-04: the honest buckets render named and pinned last — never
  // collapsed into one `(unresolved)` bucket. `zzz-remote` sorts after every
  // bucket name, so the order below proves pinning, not sorting.
  it('pins the honest buckets last and never collapses them', () => {
    const model = buildGraphModel(
      syntheticProjection({
        copies: [
          copyOf('copy-sourced', {
            sourcePackage: 'a-sourced',
            source: {
              kind: 'shared-declaration',
              declarationId: 'decl-1' as never,
              participant: 'zzz-remote',
            },
            sourceDisposition: 'share-registration',
          }),
          copyOf('copy-ambiguous', {
            sourcePackage: 'b-ambiguous',
            sourceDisposition: 'ambiguous-source',
          }),
          copyOf('copy-observed', {
            sourcePackage: 'c-observed',
            observedTargetProviders: [observedProviderOf('mfe1', 'scope-derived')],
          }),
          copyOf('copy-unknown', { sourcePackage: 'd-unknown' }),
        ],
      }),
    );
    const labels = clusterLabelsOf(model, 'dependencies').map(([label]) => label);
    expect(labels).toEqual(['zzz-remote', 'ambiguous source', 'target only', 'unknown']);
    expect(labels).not.toContain('(unresolved)');
  });

  // T2-AC-06 (model level): hues come from the injected app-wide
  // assignment; the host and the honest buckets stay neutral by rule.
  it('maps cluster hues through the injected assignment and keeps the host neutral', () => {
    const projection = projectionOf('pooling-anchor');
    const colors = new Map([
      ['__NF-HOST__', 1],
      ['mfe1', 2],
    ]);
    const model = buildGraphModel(projection, { participantColors: colors });
    const byLabel = new Map(model.clusters.map((c) => [c.label, c.colorIndex]));
    expect(byLabel.get('host')).toBeNull();
    expect(byLabel.get('mfe1')).toBe(2);
    expect(byLabel.get('host · browser-shared')).toBeNull();
    expect(byLabel.get('mfe1 · browser-shared')).toBe(2);
    // Identical inputs render identical hues.
    expect(buildGraphModel(projection, { participantColors: colors })).toEqual(model);
  });

  // T2-AC-06: above the palette size the app-wide assignment is empty —
  // every cluster renders neutral, no recycling code path exists.
  it('renders every cluster neutral above the palette size', () => {
    const names = Array.from({ length: PARTICIPANT_PALETTE_SIZE + 1 }, (_, i) => `remote-${i}`);
    const overflow = assignParticipantColors(names);
    expect(overflow.size).toBe(0);
    const model = buildGraphModel(projectionOf('pooling-anchor'), {
      participantColors: overflow,
    });
    expect(model.clusters.every((c) => c.colorIndex === null)).toBe(true);
  });

  it('keeps honest buckets neutral even when the lookup names them', () => {
    const model = buildGraphModel(
      syntheticProjection({ copies: [copyOf('copy-u', { sourcePackage: 'pkg' })] }),
      { participantColors: new Map([['unknown', 4]]) },
    );
    expect(model.clusters.map((c) => [c.label, c.colorIndex])).toEqual([['unknown', null]]);
  });

  // T2-AC-07 (model level): completeness passes through untouched and
  // gates the divergence footer.
  it('passes completeness through and flags divergence', () => {
    expect(modelOf('co-declared-share').divergent).toBe(false);
    const divergent = modelOf('synthetic-multi-version');
    expect(divergent.divergent).toBe(true);
    expect(divergent.completeness.unmappedResolutions).toBe(2);
  });

  it('caps bundle-edge references at consume-edge count + MAX_BUNDLE_EDGES', () => {
    const files = Array.from({ length: MAX_BUNDLE_EDGES + 100 }, (_, i) => `chunk-${i}.js`);
    const model = buildGraphModel(
      syntheticProjection({
        remotes: [remoteOf('host', true)],
        copies: [
          copyOf('copy-1', {
            sourcePackage: 'pkg',
            bundleClaimIds: ['claim-1'] as BundleClaimId[],
          }),
        ],
        consumerRelations: [relationOf('host', 'copy-1', ['own-selected'])],
        bundleClaims: [
          bundleClaimOf('claim-1', 'copy-1', 'mapped-source', 'mfe1', 'bundle-x', ['group-1']),
        ],
        chunkGroups: [chunkGroupOf('group-1', 'mfe1', 'bundle-x', files)],
      }),
    );
    // One consume edge raises the cap to 1 + MAX_BUNDLE_EDGES — the
    // edges.length summand is part of the pinned arithmetic (review fix).
    expect(model.edges.length).toBe(1);
    expect(model.bundleEdgeRefs.length).toBe(MAX_BUNDLE_EDGES + 1);
    expect(model.cappedEdges).toBe(99);
    // The cap limits references, never nodes — every recorded file renders.
    expect(chunkNodesOf(model).length).toBe(files.length);
  });
});
