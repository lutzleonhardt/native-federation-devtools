import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
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
