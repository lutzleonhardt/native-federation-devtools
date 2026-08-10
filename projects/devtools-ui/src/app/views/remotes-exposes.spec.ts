import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FIXTURES, FixtureId, SNAPSHOT_PROVIDER, SnapshotProvider, SnapshotV1 } from 'devtools-bridge';

import { RemotesExposes } from './remotes-exposes';

/** Fixture-backed provider that counts captureSnapshot() invocations. */
class CountingFixtureProvider implements SnapshotProvider {
  calls = 0;

  constructor(private readonly fixtureId: FixtureId) {}

  captureSnapshot(): Promise<SnapshotV1> {
    this.calls++;
    return Promise.resolve(structuredClone(FIXTURES[this.fixtureId]));
  }
}

/** Flush the pending capture promise, then render. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function renderView(fixtureId: FixtureId) {
  const provider = new CountingFixtureProvider(fixtureId);
  TestBed.configureTestingModule({
    providers: [{ provide: SNAPSHOT_PROVIDER, useValue: provider }],
  });
  const fixture = TestBed.createComponent(RemotesExposes);
  await settle(fixture);
  return { fixture, provider };
}

function rowCells(fixture: ComponentFixture<unknown>): string[][] {
  const rows = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>('.nf-table tbody tr'),
  );
  return rows.map((row) =>
    Array.from(row.cells).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
  );
}

describe('RemotesExposes', () => {
  // T3-AC-01: each remote of the primary fixture renders with name, scope
  // URL, and its expose keys.
  it('renders name, scope URL, and expose keys per remote from the primary fixture', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const cells = rowCells(fixture);
    expect(cells).toHaveLength(3);

    const host = cells.find((row) => row[0].startsWith('__NF-HOST__'))!;
    expect(host[0]).toContain('host');
    expect(host[1]).toBe('http://127.0.0.1:8088/frankenstein-meeting-room/');
    expect(host[2]).toBe('no exposes registered');

    const mermaid = cells.find((row) => row[0] === 'mermaid')!;
    expect(mermaid[1]).toBe('http://127.0.0.1:8088/frankenstein-meeting-room/mermaid/');
    expect(mermaid[2]).toBe('http://127.0.0.1:8088/frankenstein-meeting-room/Bootstrap');
    expect(mermaid[3]).toBe('Bootstrap-BBNZEAEH.js');

    const whiteboard = cells.find((row) => row[0] === 'whiteboard')!;
    expect(whiteboard[1]).toBe('http://127.0.0.1:8088/frankenstein-meeting-room/whiteboard/');
    expect(whiteboard[2]).toBe('http://127.0.0.1:8088/frankenstein-meeting-room/Bootstrap');
    expect(whiteboard[3]).toBe('Bootstrap-7COJRA5I.js');
  });

  // T3-AC-02: a colliding expose key renders as separate entries attributed
  // to each remote — never merged.
  it('renders colliding expose keys as separate entries per remote', async () => {
    const { fixture } = await renderView('synthetic-collision');
    const cells = rowCells(fixture);
    const colliding = cells.filter(
      (row) => row[2] === 'https://synthetic-fixture.example/Widget',
    );
    expect(colliding).toHaveLength(2);
    expect(colliding.map((row) => row[0]).sort()).toEqual(['calendar', 'chat']);
    expect(colliding.map((row) => row[3]).sort()).toEqual([
      'Widget-AAAA1111.js',
      'Widget-BBBB2222.js',
    ]);
  });

  // T3-AC-03: without recognized Native Federation the explicit not-detected
  // state renders with its reason; no rows are invented.
  it('renders the not-detected state with reason and no rows', async () => {
    const { fixture } = await renderView('synthetic-not-recognized');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nf-not-detected')?.textContent).toContain(
      'global present but repositories missing',
    );
    expect(el.querySelector('.nf-table')).toBeNull();
  });

  // Missing channel: honest unavailable state with the captured reason.
  it('renders the missing-evidence state when the globals channel is unavailable', async () => {
    const { fixture } = await renderView('synthetic-missing-channel');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nf-missing-evidence')?.textContent).toContain(
      'window.__NATIVE_FEDERATION__ is not defined',
    );
    expect(el.querySelector('.nf-table')).toBeNull();
  });
});
