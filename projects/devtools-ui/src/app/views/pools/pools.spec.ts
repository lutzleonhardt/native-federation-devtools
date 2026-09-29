/**
 * Pools DOM (grouping-and-pooling Task 6): the card renders the matrix and
 * the outcome lines, and no delivery-claiming vocabulary reaches the page.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  FIXTURES,
  FixtureId,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { provideParticipantColors } from '../../shared/store/participant-colors-provider';
import { PoolsView } from './pools';

class FixtureSnapshotProvider implements SnapshotProvider {
  constructor(private readonly id: FixtureId) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return Promise.resolve(structuredClone(FIXTURES[this.id]));
  }
}

async function createView(id: FixtureId): Promise<HTMLElement> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PoolsView],
    providers: [
      provideRouter([]),
      provideParticipantColors(),
      { provide: SNAPSHOT_PROVIDER, useValue: new FixtureSnapshotProvider(id) },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PoolsView);
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PoolsView', () => {
  it('renders one card with the tag matrix and outcome lines', async () => {
    const el = await createView('pool-tag-anchored');
    expect(el.querySelectorAll('.pool-card').length).toBe(1);
    expect(el.querySelector('.pool-name')?.textContent?.trim()).toBe('pool @nf-lab/ui-core');
    expect(el.querySelectorAll('.pool-matrix tbody tr').length).toBe(2);
    expect(el.querySelectorAll('.pool-outcome').length).toBe(4);
    expect(el.querySelector('.pool-footnote')?.textContent).toContain('mfe3');
  });

  it('shows the empty line without pool tags', async () => {
    const el = await createView('frankenstein-live');
    expect(el.querySelector('.view-observation')?.textContent?.trim()).toBe(
      'No pool tags in this capture.',
    );
  });

  // T6-AC-07: forbidden delivery vocabulary never reaches the rendered DOM.
  it('keeps delivery-claiming vocabulary out of the view', async () => {
    const forbidden = /\b(loaded|downloaded|fetched|executed|wire cost|byte size|cache hit)\b/i;
    for (const id of [
      'pooling-anchor',
      'pool-tag-anchored',
      'pool-tag-islanded',
      'pool-tag-orphan',
    ] as const) {
      const el = await createView(id);
      expect(el.textContent).not.toMatch(forbidden);
      for (const withTitle of Array.from(el.querySelectorAll('[title]'))) {
        expect(withTitle.getAttribute('title') ?? '').not.toMatch(forbidden);
      }
    }
  });
});
