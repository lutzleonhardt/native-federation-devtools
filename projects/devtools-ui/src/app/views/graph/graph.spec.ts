/**
 * Graph view specs — DOM half of the walking skeleton: the template renders
 * the precomputed model primitives only (nodes, Bézier edges, native
 * tooltips), tracks by canonical IDs, keeps the two empty states honest, and
 * never emits delivery-claiming vocabulary (T1-AC-05 rendered-text pin).
 */
import { TestBed } from '@angular/core/testing';
import {
  FIXTURES,
  FixtureId,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { ingestSnapshot } from '../../shared/store/ingest';
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

async function createView(fixtureId: FixtureId | null) {
  await TestBed.configureTestingModule({
    imports: [GraphView],
    providers: [{ provide: SNAPSHOT_PROVIDER, useValue: new FixtureSnapshotProvider(fixtureId) }],
  }).compileComponents();
  const fixture = TestBed.createComponent(GraphView);
  fixture.detectChanges();
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

/** Tooltip texts of the edge groups whose visible path is (not) dotted. */
function edgeTitles(el: HTMLElement, dotted: boolean): string[] {
  return Array.from(el.querySelectorAll<SVGGElement>('g.graph-edge-group'))
    .filter((group) => (group.querySelector('path.graph-edge.dotted') !== null) === dotted)
    .map((group) => group.querySelector('title')?.textContent?.trim() ?? '');
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
    expect(remoteLabels).toEqual(['__NF-HOST__', 'mermaid', 'whiteboard']);
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
      'frankenstein-live',
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
});
