import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import {
  FIXTURES,
  FixtureId,
  PRIMARY_FIXTURE_ID,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';
import { App } from './app';
import { appConfig } from './app.config';
import { routes } from './app.routes';
import { SnapshotExportService } from './shared/snapshot-export.service';

class StubSnapshotProvider implements SnapshotProvider {
  captureSnapshot(): Promise<SnapshotV1> {
    return Promise.resolve(structuredClone(FIXTURES[PRIMARY_FIXTURE_ID]));
  }
}

/**
 * Fixture-backed provider that counts captureSnapshot() invocations and
 * serves the listed fixtures in call order (the last one repeats).
 */
class SequenceSnapshotProvider implements SnapshotProvider {
  calls = 0;

  constructor(private readonly fixtureIds: readonly FixtureId[]) {}

  captureSnapshot(): Promise<SnapshotV1> {
    const id = this.fixtureIds[Math.min(this.calls, this.fixtureIds.length - 1)];
    this.calls++;
    return Promise.resolve(structuredClone(FIXTURES[id]));
  }
}

/** Flush the store's pending capture promise, then re-render. */
async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: SNAPSHOT_PROVIDER, useClass: StubSnapshotProvider },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // T1-AC-01: the shell renders navigation placeholders for the three
  // Phase-1 views.
  it('should render navigation links for the three views', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.shell-nav a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(labels).toEqual(['Remotes & Exposes', 'Shared Dependencies', 'Import Map']);
  });

  // T6: the shell-level export button follows the snapshot state.
  it('enables the export button once a snapshot is captured', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.shell-export',
    )!;
    expect(button.textContent?.trim()).toBe('Export JSON');
    expect(button.disabled).toBe(true);

    await settle(fixture);
    expect(button.disabled).toBe(false);
  });

  // T9-AC-01: the shell shows the capture identity (page URL, captured-at)
  // once a snapshot exists; while capturing it claims no state.
  it('shows page URL and captured-at in the shell status once captured', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.shell-status')).toBeNull();
    expect(el.querySelector<HTMLButtonElement>('.shell-refresh')!.disabled).toBe(true);

    await settle(fixture);
    const status = el.querySelector('.shell-status')!;
    expect(status.textContent).toContain('https://lutzleonhardt.de/frankenstein-meeting-room/');
    expect(status.textContent).toContain('2026-08-11T11:56:25.504Z');
    expect(el.querySelector<HTMLButtonElement>('.shell-refresh')!.disabled).toBe(false);
  });

  // The capture identity stays visible for every captured snapshot — including
  // one where nothing was detected (guarantee moved here with the meta, from
  // the view specs).
  it('keeps the capture meta visible when nothing was detected', async () => {
    const provider = new SequenceSnapshotProvider(['synthetic-not-recognized']);
    TestBed.overrideProvider(SNAPSHOT_PROVIDER, { useValue: provider });
    const fixture = TestBed.createComponent(App);
    await settle(fixture);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.shell-status')?.textContent,
    ).toContain('synthetic-fixture.example');
  });

  // T9-AC-04: shell refresh re-invokes captureSnapshot() through the shared
  // store, and the active view renders the new snapshot from the same instance.
  it('refresh re-captures and updates the active view through the shared store', async () => {
    const provider = new SequenceSnapshotProvider([
      'frankenstein-live',
      'synthetic-collision',
    ]);
    TestBed.overrideProvider(SNAPSHOT_PROVIDER, { useValue: provider });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/remotes');
    await settle(fixture);

    const el = fixture.nativeElement as HTMLElement;
    expect(provider.calls).toBe(1);
    expect(el.querySelector('.nf-table')?.textContent).toContain('whiteboard');

    el.querySelector<HTMLButtonElement>('.shell-refresh')!.click();
    await settle(fixture);

    expect(provider.calls).toBe(2);
    const table = el.querySelector('.nf-table')!;
    expect(table.textContent).toContain('calendar');
    expect(table.textContent).not.toContain('whiteboard');
    // The shell meta follows the refreshed snapshot too.
    expect(el.querySelector('.shell-status')?.textContent).toContain('synthetic-fixture.example');
  });

  // T6: clicking the button delegates to the export service.
  it('delegates the export click to the export service', async () => {
    const service = TestBed.inject(SnapshotExportService);
    const exportSpy = vi.spyOn(service, 'exportCurrent').mockImplementation(() => {});

    const fixture = TestBed.createComponent(App);
    await settle(fixture);
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.shell-export')!
      .click();

    expect(exportSpy).toHaveBeenCalledTimes(1);
  });
});

// T2: dev mode serves fixture-backed snapshots through the real DI wiring.
describe('appConfig snapshot provider', () => {
  it('provides the primary fixture snapshot', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const provider = TestBed.inject(SNAPSHOT_PROVIDER);
    const snapshot = await provider.captureSnapshot();
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.capture.mode).toBe('passive');
    expect(Object.keys(snapshot.runtime!.remotes)).toContain('whiteboard');
    expect(PRIMARY_FIXTURE_ID).toBe('frankenstein-live');
  });
});
