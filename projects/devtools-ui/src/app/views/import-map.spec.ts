import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FIXTURES, FixtureId, SNAPSHOT_PROVIDER, SnapshotProvider, SnapshotV1 } from 'devtools-bridge';

import { ImportMap } from './import-map';

/** Snapshot-backed provider that counts captureSnapshot() invocations. */
class CountingSnapshotProvider implements SnapshotProvider {
  calls = 0;

  constructor(private readonly snapshot: SnapshotV1) {}

  captureSnapshot(): Promise<SnapshotV1> {
    this.calls++;
    return Promise.resolve(structuredClone(this.snapshot));
  }
}

/** Flush the pending capture promise, then render. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function renderSnapshot(snapshot: SnapshotV1) {
  const provider = new CountingSnapshotProvider(snapshot);
  TestBed.configureTestingModule({
    providers: [{ provide: SNAPSHOT_PROVIDER, useValue: provider }],
  });
  const fixture = TestBed.createComponent(ImportMap);
  await settle(fixture);
  return { fixture, provider };
}

async function renderView(fixtureId: FixtureId) {
  return renderSnapshot(FIXTURES[fixtureId]);
}

function rowCells(fixture: ComponentFixture<unknown>, tableSelector: string): string[][] {
  const rows = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>(
      `${tableSelector} tbody tr`,
    ),
  );
  return rows.map((row) =>
    Array.from(row.cells).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
  );
}

describe('ImportMap', () => {
  // T5-AC-01: all 22 global imports render with specifier, effective target,
  // and the integrity-presence indicator (every primary-fixture entry has one).
  it('renders the 22 global imports with targets and integrity presence', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const cells = rowCells(fixture, '.imports-section .nf-table');
    expect(cells).toHaveLength(22);

    const excalidraw = cells.find((row) => row[0] === '@excalidraw/excalidraw')!;
    expect(excalidraw[1]).toContain('/whiteboard/_excalidraw_excalidraw.');
    expect(excalidraw[2]).toBe('SRI');
    // Presence only across the board — every target carries an SRI entry.
    expect(cells.every((row) => row[2] === 'SRI')).toBe(true);
  });

  // T5-AC-01: the single scope renders as its own group beneath the global
  // imports, with its own entries and integrity presence.
  it('renders the single scope grouped with its imports', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const el = fixture.nativeElement as HTMLElement;

    const groups = el.querySelectorAll('.scope-group');
    expect(groups).toHaveLength(1);
    expect(groups[0].querySelector('h2')?.textContent).toContain(
      'http://127.0.0.1:8088/frankenstein-meeting-room/',
    );

    const cells = rowCells(fixture, '.scope-group .nf-table');
    expect(cells).toHaveLength(7);
    expect(cells[0][0]).toBe('@nf-internal/chunk-WW26EZ22');
    expect(cells.every((row) => row[2] === 'SRI')).toBe(true);
  });

  // Integrity is presence per entry, not a blanket flag: a target without an
  // SRI entry renders the explicit "none" marker.
  it('renders no integrity indicator for a target without an SRI entry', async () => {
    const snapshot: SnapshotV1 = structuredClone(FIXTURES['frankenstein-production']);
    const effective = snapshot.importMaps!.effective!;
    const dropped = effective.imports.find((entry) => entry.specifier === 'react')!;
    effective.integrityFor = effective.integrityFor.filter((target) => target !== dropped.target);

    const { fixture } = await renderSnapshot(snapshot);
    const cells = rowCells(fixture, '.imports-section .nf-table');
    const react = cells.find((row) => row[0] === 'react')!;
    expect(react[2]).toBe('none');
    expect(cells.filter((row) => row[2] === 'SRI')).toHaveLength(21);
  });

  // The caption guards against over-reading the layer: resolution only.
  it('renders the resolution-only caption in the ready state', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const caption = (fixture.nativeElement as HTMLElement).querySelector('.layer-caption');
    expect(caption?.textContent).toContain('resolution only');
    expect(caption?.textContent).toContain('not proof of execution');
  });

  // T5-AC-02 (→ XC-04): without any import-map channel the explicit missing
  // state renders with both channel reasons; no table is invented.
  it('renders the missing state with reasons when no import-map channel yielded data', async () => {
    const { fixture } = await renderView('synthetic-no-import-maps');
    const el = fixture.nativeElement as HTMLElement;

    const evidence = el.querySelector('nf-missing-evidence')!;
    expect(evidence.textContent).toContain('page context was not accessible');
    expect(evidence.textContent).toContain('window.importShim is not present');
    expect(el.querySelector('.nf-table')).toBeNull();
    expect(el.querySelector('.layer-caption')).toBeNull();
  });

  // Partial evidence: a declared document map without a shim renders the DOM
  // observation plus an explicit missing effective layer.
  it('renders document-map counts and a missing effective layer for the partial state', async () => {
    const { fixture } = await renderView('synthetic-missing-channel');
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.view-observation')?.textContent).toContain(
      'declares 1 import map(s)',
    );
    expect(el.querySelector('.document-map-list')?.textContent).toContain(
      'importmap · parsed · 2 imports · 0 scopes',
    );
    const aspect = el.querySelector('.effective-aspect')!;
    expect(aspect.querySelector('nf-missing-evidence')?.textContent).toContain(
      'window.importShim is not present',
    );
    expect(el.querySelector('.nf-table')).toBeNull();
  });

  // A DOM scan that found zero maps is an observation, not missing evidence —
  // only the effective layer is missing (no shim).
  it('renders the zero-maps observation for a page without document import maps', async () => {
    const { fixture } = await renderView('synthetic-empty-page');
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.view-observation')?.textContent).toContain(
      'zero import maps declared',
    );
    expect(el.querySelector('.effective-aspect nf-missing-evidence')?.textContent).toContain(
      'window.importShim is not present',
    );
  });

});
