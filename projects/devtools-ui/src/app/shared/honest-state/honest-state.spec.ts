import { TestBed } from '@angular/core/testing';

import { MissingEvidence } from './missing-evidence';
import { NotDetected } from './not-detected';
import { StateBadge } from './state-badge';

// T3-AC-04: the honest-state primitives are shared components with distinct
// renderings for missing / partial / ambiguous.
describe('honest-state primitives', () => {
  it('missing-evidence renders the label and the verbatim reason', () => {
    const fixture = TestBed.createComponent(MissingEvidence);
    fixture.componentRef.setInput('reason', 'window.__NATIVE_FEDERATION__ is not defined');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.missing-label')?.textContent).toContain('Evidence missing');
    expect(el.querySelector('.missing-reason')?.textContent).toContain(
      'window.__NATIVE_FEDERATION__ is not defined',
    );
  });

  it('partial badge renders distinctly from the ambiguous badge', () => {
    const partial = TestBed.createComponent(StateBadge);
    partial.componentRef.setInput('kind', 'partial');
    partial.detectChanges();
    const ambiguous = TestBed.createComponent(StateBadge);
    ambiguous.componentRef.setInput('kind', 'ambiguous');
    ambiguous.detectChanges();

    const partialEl = (partial.nativeElement as HTMLElement).querySelector('.badge')!;
    const ambiguousEl = (ambiguous.nativeElement as HTMLElement).querySelector('.badge')!;
    expect(partialEl.textContent?.trim()).toBe('partial');
    expect(ambiguousEl.textContent?.trim()).toBe('ambiguous');
    expect(partialEl.classList.contains('badge-partial')).toBe(true);
    expect(partialEl.classList.contains('badge-ambiguous')).toBe(false);
    expect(ambiguousEl.classList.contains('badge-ambiguous')).toBe(true);
    expect(ambiguousEl.classList.contains('badge-partial')).toBe(false);
  });

  it('badge exposes an optional note as tooltip', () => {
    const fixture = TestBed.createComponent(StateBadge);
    fixture.componentRef.setInput('kind', 'ambiguous');
    fixture.componentRef.setInput('note', 'association not proven by evidence');
    fixture.detectChanges();
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.badge')!;
    expect(badge.getAttribute('title')).toBe('association not proven by evidence');
  });

  it('not-detected renders the global empty state with the reason', () => {
    const fixture = TestBed.createComponent(NotDetected);
    fixture.componentRef.setInput('reason', 'global present but repositories missing');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.not-detected-title')?.textContent).toContain(
      'No Native Federation detected',
    );
    expect(el.querySelector('.not-detected-reason')?.textContent).toContain(
      'global present but repositories missing',
    );
  });
});
