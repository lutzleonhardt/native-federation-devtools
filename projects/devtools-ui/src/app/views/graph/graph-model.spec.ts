/**
 * Graph builder specs — DOM-free pins over the pure `buildGraphModel`
 * derivation: node derivation and ordering, the dependency label fallback
 * chain, truncation, edge styles from relation mapping states (including the
 * vacuously solid claim-less relation), the fixed-column geometry, and
 * determinism. Fixture cases run through the real ingest pipeline; synthetic
 * seeds pin the rules the corpus does not reach.
 */
import { FIXTURES, FixtureId } from 'devtools-bridge';

import { ingestSnapshot } from '../../shared/store/ingest';
import type {
  CanonicalResolutionProjection,
  ClaimMappingState,
  ConsumerCopyRelation,
  ConsumerCopyRelationId,
  RemoteProjection,
  ResolvedDependencyCopy,
  ResolvedDependencyCopyId,
} from '../../shared/store/resolution';
import {
  COL_GAP,
  GraphModel,
  HEADER_H,
  MARGIN,
  NODE_H,
  NODE_VGAP,
  NODE_W,
  buildGraphModel,
} from './graph-model';

function projectionOf(fixtureId: FixtureId): CanonicalResolutionProjection {
  return ingestSnapshot(structuredClone(FIXTURES[fixtureId])).resolutionProjection;
}

function modelOf(fixtureId: FixtureId): GraphModel {
  return buildGraphModel(projectionOf(fixtureId));
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
      'sourcePackage' | 'resolvedTag' | 'sourceDisposition' | 'resolutionContexts' | 'entrypoints'
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

function syntheticProjection(
  partial: Partial<Pick<CanonicalResolutionProjection, 'remotes' | 'copies' | 'consumerRelations'>>,
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

    expect(model.nodes.filter((n) => n.kind === 'remote').map((n) => n.id)).toEqual([
      '__NF-HOST__',
      'mfe1',
      'mfe2',
    ]);
    const dependencies = model.nodes.filter((n) => n.kind === 'dependency');
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

    const remoteNodes = model.nodes.filter((n) => n.kind === 'remote');
    expect(remoteNodes.map((n) => n.id)).toEqual(['__NF-HOST__', 'mermaid', 'whiteboard']);
    expect(remoteNodes[0].isHost).toBe(true);

    const dependencyIds = model.nodes.filter((n) => n.kind === 'dependency').map((n) => n.id);
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
  // listed; equal labels fall back to the copy-ID tiebreak.
  it('renders pooling-anchor anchored relations dotted and orders equal labels by copy ID', () => {
    const model = modelOf('pooling-anchor');

    const anchored = model.edges.filter((e) => e.tooltip === 'anchored');
    expect(anchored.length).toBe(2);
    expect(anchored.every((e) => e.style === 'dotted')).toBe(true);
    expect(anchored.map((e) => e.sourceId).sort()).toEqual(['mfe1', 'mfe2']);

    const dependencies = model.nodes.filter((n) => n.kind === 'dependency');
    expect(dependencies.map((n) => [n.label, n.subLabel])).toEqual([
      ['@nf-lab/conflict-lib', '1.0.0'],
      ['@nf-lab/conflict-lib', '2.0.0'],
      ['@nf-lab/conflict-lib/extra', '1.0.0'],
    ]);
  });

  // T1-AC-03 (model level): private copies carry the isolated metadata.
  it('marks the scoped fixture private copies as isolated', () => {
    const model = modelOf('scoped');
    const dependencies = model.nodes.filter((n) => n.kind === 'dependency');
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
    expect(model.nodes.map((n) => [n.label, n.isolated])).toEqual([
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
    // copy: right-mid (304, 67) → left-mid (454, 67), dx = max(24, 75).
    expect(model.edges[0].path).toBe('M 304,67 C 379,67 379,67 454,67');
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

  it('pins the fixed-column geometry and the Bézier edge path', () => {
    const model = modelOf('co-declared-share');

    expect(model.columns.map((c) => [c.key, c.x])).toEqual([
      ['remotes', MARGIN],
      ['dependencies', MARGIN + NODE_W + COL_GAP],
    ]);
    const remoteYs = model.nodes.filter((n) => n.kind === 'remote').map((n) => n.y);
    const firstY = MARGIN + HEADER_H;
    expect(remoteYs).toEqual([
      firstY,
      firstY + NODE_H + NODE_VGAP,
      firstY + 2 * (NODE_H + NODE_VGAP),
    ]);
    expect(model.width).toBe(2 * MARGIN + 2 * NODE_W + COL_GAP);
    expect(model.height).toBe(MARGIN + HEADER_H + 3 * (NODE_H + NODE_VGAP) - NODE_VGAP + MARGIN);

    // mfe1 (row 1, column 0) → the single copy (row 0, column 1):
    // right-mid (304, 99) → left-mid (454, 67), dx = max(24, 150/2) = 75.
    const mfe1Edge = model.edges.find((e) => e.sourceId === 'mfe1');
    expect(mfe1Edge?.path).toBe('M 304,99 C 379,99 379,67 454,67');
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
});
