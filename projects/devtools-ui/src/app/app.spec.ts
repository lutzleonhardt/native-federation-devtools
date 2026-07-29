import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PRIMARY_FIXTURE_ID, SNAPSHOT_PROVIDER } from 'devtools-bridge';
import { App } from './app';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
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
