import { TestBed } from '@angular/core/testing';

import { StateBadge } from '../honest-state/state-badge';
import { CapabilityBadge } from './capability-badge';

describe('CapabilityBadge (view kit)', () => {
  it('renders the capability label as a quiet presence chip', () => {
    const fixture = TestBed.createComponent(CapabilityBadge);
    fixture.componentRef.setInput('label', 'chunking');
    fixture.detectChanges();
    const chip = (fixture.nativeElement as HTMLElement).querySelector('.capability')!;

    expect(chip.textContent?.trim()).toBe('chunking ✓');
    expect(chip.querySelector('.capability-check')?.getAttribute('aria-hidden')).toBe('true');
    // Without a note there is no tooltip and no affordance-triggering title.
    expect(chip.hasAttribute('title')).toBe(false);
  });

  it('exposes an optional note as tooltip', () => {
    const fixture = TestBed.createComponent(CapabilityBadge);
    fixture.componentRef.setInput('label', 'chunking');
    fixture.componentRef.setInput('note', 'bundle chunk lists are recorded in the registry');
    fixture.detectChanges();
    const chip = (fixture.nativeElement as HTMLElement).querySelector('.capability')!;
    expect(chip.getAttribute('title')).toBe('bundle chunk lists are recorded in the registry');
  });

  // T9-AC-05: visually distinct from the honest-state StateBadge — the
  // evidence-limit vocabulary must never blur into capability presence.
  it('renders distinctly from the honest-state StateBadge', () => {
    const capability = TestBed.createComponent(CapabilityBadge);
    capability.componentRef.setInput('label', 'SRI');
    capability.detectChanges();
    const state = TestBed.createComponent(StateBadge);
    state.componentRef.setInput('kind', 'partial');
    state.detectChanges();

    const capabilityEl = (capability.nativeElement as HTMLElement).querySelector('.capability')!;
    const stateEl = (state.nativeElement as HTMLElement).querySelector('.badge')!;
    // Different structure: the capability chip is not a .badge and carries
    // the presence check mark; the state badge names an evidence limit.
    expect(capabilityEl.classList.contains('badge')).toBe(false);
    expect(stateEl.classList.contains('capability')).toBe(false);
    expect(capabilityEl.querySelector('.capability-check')).not.toBeNull();
    expect(stateEl.querySelector('.capability-check')).toBeNull();
    expect(stateEl.textContent?.trim()).toBe('partial');
  });
});
