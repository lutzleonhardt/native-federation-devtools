import { TestBed } from '@angular/core/testing';

import { ParticipantChip } from './participant-chip';

function createChip(name: string, host?: boolean): HTMLElement {
  const fixture = TestBed.createComponent(ParticipantChip);
  fixture.componentRef.setInput('name', name);
  if (host !== undefined) {
    fixture.componentRef.setInput('host', host);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ParticipantChip (view kit)', () => {
  it('renders a remote name verbatim', () => {
    const el = createChip('whiteboard');
    const chip = el.querySelector('.chip')!;
    expect(chip.textContent).toBe('whiteboard');
    expect(chip.classList.contains('chip-remote')).toBe(true);
    expect(chip.hasAttribute('title')).toBe(false);
  });

  it('renders the host as a quiet chip with the verbatim sentinel as tooltip', () => {
    const el = createChip('__NF-HOST__', true);
    const chip = el.querySelector('.chip')!;
    expect(chip.textContent).toBe('host');
    expect(chip.classList.contains('chip-host')).toBe(true);
    expect(chip.getAttribute('title')).toBe('__NF-HOST__');
  });
});
