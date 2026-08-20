import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ParticipantChip } from './participant-chip';
import { PARTICIPANT_COLOR_LOOKUP } from './participant-colors';

function createChip(
  name: string,
  options: { host?: boolean; colors?: ReadonlyMap<string, number> } = {},
): HTMLElement {
  // Stub the root lookup: the chip's contract is "render what the shared
  // lookup assigns" — the assignment itself is participant-colors.spec scope.
  TestBed.configureTestingModule({
    providers: [
      { provide: PARTICIPANT_COLOR_LOOKUP, useValue: signal(options.colors ?? new Map()) },
    ],
  });
  const fixture = TestBed.createComponent(ParticipantChip);
  fixture.componentRef.setInput('name', name);
  if (options.host !== undefined) {
    fixture.componentRef.setInput('host', options.host);
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

  it('renders the host as a badge with the verbatim sentinel as tooltip', () => {
    const el = createChip('__NF-HOST__', { host: true });
    const chip = el.querySelector('.chip')!;
    expect(chip.textContent).toBe('host');
    expect(chip.classList.contains('chip-host')).toBe(true);
    expect(chip.getAttribute('title')).toBe('__NF-HOST__');
  });

  // T7.7-AC-01 (amended 2026-08-20 screenshot review): the host chip is an
  // inverted neutral badge — muted fill, bg-token text, same mono font as
  // remote chips (token-level pins: jsdom returns the unresolved var()
  // expressions) — while keeping the tooltip affordance. Reserved styling:
  // deliberately neither a palette hue nor the accent (selection channel).
  it('renders the host chip as an inverted neutral badge in chip typography', () => {
    const host = createChip('__NF-HOST__', { host: true }).querySelector<HTMLElement>('.chip')!;
    TestBed.resetTestingModule();
    const remote = createChip('whiteboard').querySelector<HTMLElement>('.chip')!;
    expect(getComputedStyle(host).fontFamily).toBe(getComputedStyle(remote).fontFamily);
    expect(getComputedStyle(host).backgroundColor).toBe('var(--nf-color-text-muted)');
    expect(getComputedStyle(host).color).toBe('var(--nf-color-bg)');
    expect(getComputedStyle(remote).color).toBe('var(--nf-color-text)');
    expect(getComputedStyle(host).cursor).toBe('help');
  });

  // T7.7-AC-02: an assigned remote renders the identity dot before the name;
  // the dot is decorative (no text) and carries the palette token.
  it('renders the assigned identity dot on a remote chip', () => {
    const el = createChip('whiteboard', { colors: new Map([['whiteboard', 2]]) });
    const chip = el.querySelector<HTMLElement>('.chip-remote')!;
    expect(chip.textContent).toBe('whiteboard');
    const dot = chip.querySelector<HTMLElement>('.dot')!;
    expect(dot).not.toBeNull();
    expect(chip.firstElementChild).toBe(dot);
    expect(dot.classList.contains('dot-2')).toBe(true);
    expect(getComputedStyle(dot).backgroundColor).toBe('var(--nf-participant-color-2)');
  });

  // T7.7-AC-03: no assignment (above-threshold capture) → neutral chip.
  it('renders no dot when the lookup assigns nothing', () => {
    const el = createChip('whiteboard');
    expect(el.querySelector('.dot')).toBeNull();
  });

  // T7.7-AC-04: the host never carries a dot, even when the lookup would
  // (wrongly) offer an assignment for its name.
  it('never renders a dot on the host chip', () => {
    const el = createChip('__NF-HOST__', { host: true, colors: new Map([['__NF-HOST__', 1]]) });
    expect(el.querySelector('.dot')).toBeNull();
  });
});
