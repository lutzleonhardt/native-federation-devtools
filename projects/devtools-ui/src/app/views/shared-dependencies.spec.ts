import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FIXTURES, FixtureId, SNAPSHOT_PROVIDER, SnapshotProvider, SnapshotV1 } from 'devtools-bridge';

import { SharedDependencies } from './shared-dependencies';

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
  const fixture = TestBed.createComponent(SharedDependencies);
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

describe('SharedDependencies', () => {
  // T4-AC-01: the react outcome from the primary fixture renders with scope,
  // selected version, action, provider, and the declared requirement.
  it('renders the react resolver outcome from the primary fixture', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const cells = rowCells(fixture);
    expect(cells).toHaveLength(20);

    const react = cells.find((row) => row[0] === 'react')!;
    expect(react[1]).toBe('__GLOBAL__');
    expect(react[2]).toBe('18.3.1');
    expect(react[3]).toBe('share');
    expect(react[4]).toBe('whiteboard');
    expect(react[5]).toBe('whiteboard requires ^18.3.1 (strict)');
  });

  // Host-provided package: the host flag names the provider; the host's own
  // requirement stays visible as a participant entry.
  it('renders a host-provided package with the host as provider', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const cells = rowCells(fixture);

    const rxjs = cells.find((row) => row[0] === 'rxjs')!;
    expect(rxjs[2]).toBe('7.8.2');
    expect(rxjs[4]).toBe('__NF-HOST__ host');
    expect(rxjs[5]).toBe('__NF-HOST__ host requires ~7.8.0 (strict)');
  });

  // T4-AC-02 (→ XC-04): two version tags render as unresolved uncertainty —
  // both visible, marked ambiguous, no winner chosen.
  it('renders a multi-version package as ambiguous with all versions visible', async () => {
    const { fixture } = await renderView('synthetic-multi-version');
    const el = fixture.nativeElement as HTMLElement;
    const cells = rowCells(fixture);

    const uiLib = cells.filter((row) => row[0].startsWith('ui-lib'));
    expect(uiLib).toHaveLength(2);
    expect(uiLib.map((row) => row[2]).sort()).toEqual(['1.2.3', '2.0.0']);

    // Every row of the package carries the ambiguous badge; nothing in the
    // view singles out a winner.
    const badges = el.querySelectorAll('.cell-package nf-state-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toContain('ambiguous');
    expect(el.textContent).not.toMatch(/selected|winner|resolved to/i);
  });

  // T4-AC-03 (→ XC-04): the claims aspect renders as missing with a reason;
  // nothing implies claims were observed.
  it('renders the claims aspect as missing with the Phase-2 reason', async () => {
    const { fixture } = await renderView('frankenstein-production');
    const el = fixture.nativeElement as HTMLElement;

    const claims = el.querySelector('.claims-aspect')!;
    const evidence = claims.querySelector('nf-missing-evidence')!;
    expect(evidence.textContent).toContain('not observable in a passive capture');
    expect(evidence.textContent).toContain('recording reload (Phase 2)');
    // The aspect holds no data — only the explicit missing-evidence state.
    expect(claims.querySelector('table')).toBeNull();
  });

  // Without recognized Native Federation the explicit not-detected state
  // renders; no outcome table and no claims aspect are invented.
  it('renders the not-detected state with reason and no rows', async () => {
    const { fixture } = await renderView('synthetic-not-recognized');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nf-not-detected')?.textContent).toContain(
      'global present but carries none of the four repository keys',
    );
    expect(el.querySelector('.nf-table')).toBeNull();
    expect(el.querySelector('.claims-aspect')).toBeNull();
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

  // An available runtime with zero shared packages is an observation.
  it('renders the zero-packages observation for a runtime without shared externals', async () => {
    const { fixture } = await renderView('synthetic-collision');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.view-observation')?.textContent).toContain(
      'zero shared packages registered',
    );
    expect(el.querySelector('.nf-table')).toBeNull();
  });
});
