import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import {
  FIXTURES,
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
    expect(PRIMARY_FIXTURE_ID).toBe('frankenstein-production');
  });
});
