/**
 * Graph view specs — DOM half of the walking skeleton: the template renders
 * the precomputed model primitives only (nodes, Bézier edges, native
 * tooltips), tracks by canonical IDs, keeps the two empty states honest, and
 * never emits delivery-claiming vocabulary (T1-AC-05 rendered-text pin).
 */
import { Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  FIXTURES,
  FixtureId,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { PARTICIPANT_COLOR_LOOKUP } from '../../shared/kit/participant-colors';
import type { FederationModel } from '../../shared/store/federation-model';
import { FederationStore } from '../../shared/store/federation-store';
import { ingestSnapshot } from '../../shared/store/ingest';
import { provideParticipantColors } from '../../shared/store/participant-colors-provider';
import type {
  CanonicalResolutionProjection,
  ConsumerCopyRelation,
  ConsumerCopyRelationId,
  ResolvedDependencyCopy,
  ResolvedDependencyCopyId,
} from '../../shared/store/resolution';
import { GraphView } from './graph';

class FixtureSnapshotProvider implements SnapshotProvider {
  constructor(private readonly id: FixtureId | null) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return this.id === null
      ? Promise.reject(new Error('capture failed'))
      : Promise.resolve(structuredClone(FIXTURES[this.id]));
  }
}

/** Flush the store's pending capture promise, then re-render. */
async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function createView(fixtureId: FixtureId | null, extraProviders: Provider[] = []) {
  await TestBed.configureTestingModule({
    imports: [GraphView],
    providers: [
      provideRouter([]),
      provideParticipantColors(),
      { provide: SNAPSHOT_PROVIDER, useValue: new FixtureSnapshotProvider(fixtureId) },
      ...extraProviders,
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(GraphView);
  fixture.detectChanges();
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

/**
 * Seeded projection harness for cases no fixture reaches (ghost consumer):
 * the store is stubbed with a model carrying only the projection — the
 * component reads nothing else. The color lookup stays the neutral kit
 * default here.
 */
async function createSeededView(projection: CanonicalResolutionProjection): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [GraphView],
    providers: [
      provideRouter([]),
      {
        provide: FederationStore,
        useValue: { model: signal({ resolutionProjection: projection } as FederationModel) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(GraphView);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

/** Minimal canonical seeds (branded-ID casts) for the seeded harness. */
function seededCopy(id: string): ResolvedDependencyCopy {
  return {
    id: id as ResolvedDependencyCopyId,
    sourcePackage: 'pkg',
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
  };
}

function seededRelation(consumerRemote: string, copyId: string): ConsumerCopyRelation {
  return {
    id: `consumer-copy-relation:[${consumerRemote},${copyId}]` as ConsumerCopyRelationId,
    consumerRemote,
    copyId: copyId as ResolvedDependencyCopyId,
    effectiveResolutionIds: [],
    claimIds: [],
    mappingStates: [],
  };
}

function seededProjection(
  partial: Partial<
    Pick<CanonicalResolutionProjection, 'remotes' | 'copies' | 'consumerRelations' | 'completeness'>
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

/** Tooltip texts of the edge groups whose visible path is (not) dotted. */
function edgeTitles(el: HTMLElement, dotted: boolean): string[] {
  return Array.from(el.querySelectorAll<SVGGElement>('g.graph-edge-group'))
    .filter((group) => (group.querySelector('path.graph-edge.dotted') !== null) === dotted)
    .map((group) => group.querySelector('title')?.textContent?.trim() ?? '');
}

/** Whitespace-normalized text content. */
function textOf(node: Element | null): string {
  return node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Normalized cluster label texts in render order. */
function clusterLabels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll('.graph-cluster-label')).map((label) => textOf(label));
}

describe('GraphView', () => {
  // T1-AC-01: one dependency node with a solid and a dotted consume edge;
  // the dotted tooltip lists `not-selected`; the resolved tag is the
  // right-aligned sub-label.
  it('renders co-declared-share with one copy, a solid and a dotted edge', async () => {
    const el = await createView('co-declared-share');

    expect(el.querySelectorAll('.graph-node.dependency').length).toBe(1);
    expect(el.querySelectorAll('.graph-node.remote').length).toBe(3);
    expect(el.querySelector('.graph-node-sublabel')?.textContent?.trim()).toBe('1.0.0');

    const edges = el.querySelectorAll<SVGPathElement>('path.graph-edge');
    expect(edges.length).toBe(2);
    expect(el.querySelectorAll('path.graph-edge.dotted').length).toBe(1);
    expect(edgeTitles(el, true)).toEqual(['not-selected']);
    expect(edgeTitles(el, false)).toEqual(['']);

    // Review follow-up: every edge carries an invisible wide hit path with
    // the same geometry — the 1.5px stroke alone is no usable hover target.
    for (const group of Array.from(el.querySelectorAll('g.graph-edge-group'))) {
      const hit = group.querySelector('path.graph-edge-hit');
      const visible = group.querySelector('path.graph-edge');
      expect(hit?.getAttribute('d')).toBe(visible?.getAttribute('d'));
    }
  });

  // T1-AC-02: one remote node per projection remote (host first) and one
  // dependency node per projection copy; identities are canonical IDs.
  it('renders frankenstein-live one-to-one against its projection', async () => {
    const projection = ingestSnapshot(
      structuredClone(FIXTURES['frankenstein-live']),
    ).resolutionProjection;
    const el = await createView('frankenstein-live');

    const remoteLabels = Array.from(
      el.querySelectorAll('.graph-node.remote .graph-node-label'),
    ).map((label) => label.textContent?.trim());
    // The host sentinel reads as `host` (chip convention); its node still
    // tracks the canonical `__NF-HOST__` identity.
    expect(remoteLabels).toEqual(['host', 'mermaid', 'whiteboard']);
    expect(el.querySelector('.graph-node.remote')?.classList.contains('host')).toBe(true);

    expect(el.querySelectorAll('.graph-node.dependency').length).toBe(projection.copies.length);
    expect(el.querySelectorAll('path.graph-edge').length).toBe(projection.consumerRelations.length);
  });

  // T1-AC-03: the anchored relation renders dotted with `anchored` listed;
  // private copies render with the isolated (dashed) metadata.
  it('renders pooling-anchor anchored edges dotted and scoped copies isolated', async () => {
    const anchorEl = await createView('pooling-anchor');
    const dottedTitles = edgeTitles(anchorEl, true);
    expect(dottedTitles.filter((title) => title === 'anchored').length).toBe(2);

    TestBed.resetTestingModule();
    const scopedEl = await createView('scoped');
    const dependencies = Array.from(scopedEl.querySelectorAll('.graph-node.dependency'));
    expect(dependencies.length).toBe(2);
    expect(dependencies.every((node) => node.classList.contains('isolated'))).toBe(true);
    expect(scopedEl.querySelectorAll('.graph-node.remote.isolated').length).toBe(0);
  });

  // T1-AC-05: forbidden delivery vocabulary never reaches the rendered DOM.
  it('keeps delivery-claiming vocabulary out of the rendered graph', async () => {
    const forbidden = /\b(loaded|downloaded|fetched|executed|wire cost|byte size|cache hit)\b/i;
    const fixtureIds: FixtureId[] = [
      'co-declared-share',
      'pooling-anchor',
      'scoped',
      'clean-skip',
      'frankenstein-live',
      'synthetic-multi-version',
      'synthetic-empty-page',
    ];
    for (const id of fixtureIds) {
      TestBed.resetTestingModule();
      const el = await createView(id);
      expect(el.textContent).not.toMatch(forbidden);
      for (const withTitle of Array.from(el.querySelectorAll('[title], [aria-label]'))) {
        expect(withTitle.getAttribute('title') ?? '').not.toMatch(forbidden);
        expect(withTitle.getAttribute('aria-label') ?? '').not.toMatch(forbidden);
      }
    }
  });

  // T1-AC-06: a capture producing no nodes says so; a missing snapshot
  // reuses the panel's existing empty wording.
  it('renders the two empty states honestly', async () => {
    const emptyEl = await createView('synthetic-empty-page');
    expect(emptyEl.querySelector('.view-observation')?.textContent?.trim()).toBe(
      'Nothing to graph.',
    );
    expect(emptyEl.querySelector('svg')).toBeNull();

    TestBed.resetTestingModule();
    const missingEl = await createView(null);
    expect(missingEl.querySelector('.view-observation')?.textContent?.trim()).toBe(
      'no captured snapshot to render',
    );
    expect(missingEl.querySelector('svg')).toBeNull();
  });

  // ---- Task 2: clustered columns, chunk stubs, honest footer ----

  // T2-AC-01: the three-column mock reading — dependency clusters with
  // host first and counts, host chunk groups under emitter · bundle heads.
  it('renders frankenstein-live as three clustered columns', async () => {
    const el = await createView('frankenstein-live');

    const headers = Array.from(el.querySelectorAll('.graph-column-header')).map((h) => textOf(h));
    expect(headers).toEqual(['Remotes', 'Dependencies', 'Chunks']);
    expect(clusterLabels(el)).toEqual([
      'host (12)',
      'mermaid (1)',
      'whiteboard (7)',
      'host · browser-angular_common (1)',
      'host · browser-angular_core (5)',
      'host · browser-angular_platform_browser (1)',
      'host · browser-rxjs (1)',
      'host · browser-tslib (1)',
    ]);
    expect(el.querySelectorAll('.graph-node.chunk').length).toBe(9);
    expect(el.querySelectorAll('.graph-node.chunk.stub').length).toBe(2);
  });

  // T2-AC-02 + T2-AC-03: the emitting source remote carries the chunk
  // column's qualified stub, the borrowing consumer contributes nothing,
  // and no file is fabricated; bundle references stay unrendered (Task 3).
  it('renders the clean-skip stub under the emitting remote without fabricated files', async () => {
    const projection = ingestSnapshot(structuredClone(FIXTURES['clean-skip'])).resolutionProjection;
    const el = await createView('clean-skip');

    expect(clusterLabels(el)).toEqual(['mfe2 (1)', 'mfe2 · browser-shared (1)']);
    expect(el.querySelectorAll('.graph-node.chunk').length).toBe(1);
    const stub = el.querySelector('.graph-node.chunk.stub');
    expect(textOf(stub?.querySelector('.graph-node-label') ?? null)).toBe('browser-shared');
    expect(textOf(stub?.querySelector('.graph-node-qualifier') ?? null)).toBe(
      'source-only — no registered chunk list',
    );
    // Rendered paths are exactly the consume edges (hit + visible per
    // relation) — bundle-edge references wait for the hover trace.
    expect(el.querySelectorAll('path').length).toBe(2 * projection.consumerRelations.length);
  });

  // T2-AC-06: source clusters carry the same identity slots as the chip
  // dots (mermaid → 1, whiteboard → 2 on frankenstein-live); host
  // clusters stay neutral.
  it('carries the chip color slots on source clusters and keeps host neutral', async () => {
    const el = await createView('frankenstein-live');
    const clusters = Array.from(el.querySelectorAll<SVGGElement>('g.graph-cluster'));
    const labelOf = (group: SVGGElement) => textOf(group.querySelector('.graph-cluster-label'));

    const mermaid = clusters.find((group) => labelOf(group).startsWith('mermaid'));
    const whiteboard = clusters.find((group) => labelOf(group).startsWith('whiteboard'));
    expect(mermaid?.classList.contains('hue-1')).toBe(true);
    expect(whiteboard?.classList.contains('hue-2')).toBe(true);
    const hostClusters = clusters.filter((group) => labelOf(group).startsWith('host'));
    expect(hostClusters.length).toBe(6);
    for (const group of hostClusters) {
      expect(Array.from(group.classList).some((c) => c.startsWith('hue-'))).toBe(false);
    }
  });

  // T2-AC-07: the completeness footer renders only on divergence, with the
  // four counts and the Remotes link; an all-zero capture renders none.
  it('renders the completeness footer only on divergence', async () => {
    const divergentEl = await createView('synthetic-multi-version');
    const line = divergentEl.querySelector('.graph-footer-line');
    expect(textOf(line)).toBe(
      '0 unknown · 2 unmapped · 0 blocked · 0 ambiguous — details in the Remotes view',
    );
    expect(line?.querySelector('a')?.getAttribute('href')).toBe('/remotes');

    TestBed.resetTestingModule();
    const cleanEl = await createView('co-declared-share');
    expect(cleanEl.querySelector('.graph-footer')).toBeNull();
  });

  // T2-AC-07: a consumer-less relation renders the dropped-relation line —
  // reported, never silently omitted, and no node is invented for it.
  it('renders the dropped-relation line for a consumer-less relation', async () => {
    const el = await createSeededView(
      seededProjection({
        remotes: [
          {
            name: 'host',
            isHost: true,
            scopeUrl: './host/',
            resolvedScopeUrl: 'https://page.test/host/',
          },
        ],
        copies: [seededCopy('copy-1')],
        consumerRelations: [seededRelation('ghost', 'copy-1')],
      }),
    );

    const lines = Array.from(el.querySelectorAll('.graph-footer-line')).map((line) => textOf(line));
    expect(lines).toEqual(["1 relation not drawn — consumer not among the capture's remotes"]);
    expect(el.querySelectorAll('path.graph-edge').length).toBe(0);
    expect(el.querySelectorAll('.graph-node').length).toBe(2);
  });

  // Codex review fix (T2-AC-07): a capture can diverge without yielding a
  // single node — the footer must render next to the empty state, or an
  // incomplete capture looks merely blank.
  it('renders the divergence footer even when the capture yields no nodes', async () => {
    const el = await createSeededView(
      seededProjection({
        completeness: {
          total: {
            unknownResolutions: 1,
            unmappedResolutions: 0,
            blockedResolutions: 0,
            ambiguousSourceClaims: 0,
          },
          byConsumer: {},
          consumerIssues: [],
        },
      }),
    );

    expect(textOf(el.querySelector('.view-observation'))).toBe('Nothing to graph.');
    expect(el.querySelector('svg')).toBeNull();
    expect(textOf(el.querySelector('.graph-footer-line'))).toBe(
      '1 unknown · 0 unmapped · 0 blocked · 0 ambiguous — details in the Remotes view',
    );
  });

  // Codex review fix (T2-AC-06 hardening): the hue class binding is pinned
  // for a high palette slot, not only the slots the corpus reaches.
  it('binds high palette slots to their hue class', async () => {
    const el = await createView('frankenstein-live', [
      {
        provide: PARTICIPANT_COLOR_LOOKUP,
        useValue: signal<ReadonlyMap<string, number>>(new Map([['mermaid', 8]])).asReadonly(),
      },
    ]);

    const clusters = Array.from(el.querySelectorAll<SVGGElement>('g.graph-cluster'));
    const mermaid = clusters.find((group) =>
      textOf(group.querySelector('.graph-cluster-label')).startsWith('mermaid'),
    );
    expect(mermaid?.classList.contains('hue-8')).toBe(true);
    // No other cluster is colored under this lookup.
    expect(
      clusters.filter((group) => Array.from(group.classList).some((c) => c.startsWith('hue-')))
        .length,
    ).toBe(1);
  });
});
