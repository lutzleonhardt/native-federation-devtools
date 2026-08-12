import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DeclaredVersion, ParticipantArrow, ParticipantRow } from './participant-row';

function createRow(inputs: {
  name: string;
  host?: boolean;
  declared: DeclaredVersion;
  strict?: boolean;
  arrow?: ParticipantArrow;
  action?: string;
  actionNote?: string;
}) {
  const fixture = TestBed.createComponent(ParticipantRow);
  fixture.componentRef.setInput('name', inputs.name);
  fixture.componentRef.setInput('declared', inputs.declared);
  if (inputs.arrow !== undefined) {
    fixture.componentRef.setInput('arrow', inputs.arrow);
  }
  if (inputs.host !== undefined) {
    fixture.componentRef.setInput('host', inputs.host);
  }
  if (inputs.strict !== undefined) {
    fixture.componentRef.setInput('strict', inputs.strict);
  }
  if (inputs.action !== undefined) {
    fixture.componentRef.setInput('action', inputs.action);
  }
  if (inputs.actionNote !== undefined) {
    fixture.componentRef.setInput('actionNote', inputs.actionNote);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ParticipantRow (view kit)', () => {
  // T9-AC-03: 'winner' arrow renders the provider's file.
  it('renders name, declared range, strict marker, and the winner arrow', () => {
    const el = createRow({
      name: 'shell',
      declared: { kind: 'range', range: '^19.0.0' },
      strict: true,
      arrow: { kind: 'winner', target: '19.2.3', provider: 'host' },
      action: 'skip',
    });

    expect(el.querySelector('.participant')?.textContent).toBe('shell');
    const declared = el.querySelector('.declared')!;
    expect(declared.textContent).toBe('^19.0.0');
    expect(declared.classList.contains('declared-range')).toBe(true);
    const strictMarker = el.querySelector<HTMLElement>('.strict-marker')!;
    expect(strictMarker.textContent).toBe('strict');
    // Config-origin reference (T10.5): the tooltip names the config field.
    expect(strictMarker.title).toContain('strictVersion: true');

    const arrow = el.querySelector('.arrow')!;
    expect(arrow.textContent).toContain('→');
    expect(arrow.querySelector('.arrow-target')?.textContent).toBe('19.2.3');
    expect(arrow.querySelector('.arrow-provider')?.textContent).toBe('host');
    expect(el.querySelector('.action-chip')?.textContent).toBe('skip');
    // Without a note there is no tooltip and no affordance-triggering title.
    expect(el.querySelector('.action-chip')?.hasAttribute('title')).toBe(false);
  });

  it('exposes an optional action note as tooltip on the chip', () => {
    const el = createRow({
      name: 'mfe1',
      declared: { kind: 'range', range: '~19.1.0' },
      arrow: { kind: 'winner', target: '19.2.3', provider: 'host' },
      action: 'skip',
      actionNote: "this participant's copy is not taken into consideration",
    });
    expect(el.querySelector('.action-chip')?.getAttribute('title')).toBe(
      "this participant's copy is not taken into consideration",
    );
  });

  // T9-AC-03: 'own' arrow renders own copy.
  it('renders the own-copy arrow', () => {
    const el = createRow({
      name: 'mfe1',
      declared: { kind: 'range', range: '~2.0.0' },
      arrow: { kind: 'own' },
    });

    expect(el.querySelector('.arrow')?.textContent).toContain('→ own copy');
    expect(el.querySelector('.arrow-target')).toBeNull();
    expect(el.querySelector('.strict-marker')).toBeNull();
    expect(el.querySelector('.action-chip')).toBeNull();
  });

  // T10 (rework): the norm is quiet — without an arrow input no resolution
  // claim is drawn at all.
  it('renders no arrow when none is given', () => {
    const el = createRow({
      name: 'whiteboard',
      declared: { kind: 'range', range: '^18.3.1' },
      action: 'share',
    });

    expect(el.querySelector('.arrow')).toBeNull();
    expect(el.querySelector('.action-chip')?.textContent).toBe('share');
  });

  // T10 (rework): host renders as the quiet chip, sentinel in the tooltip.
  it('renders the host registration as a host chip', () => {
    const el = createRow({
      name: '__NF-HOST__',
      host: true,
      declared: { kind: 'range', range: '^21.2.0' },
    });

    const chip = el.querySelector('.participant .chip')!;
    expect(chip.textContent).toBe('host');
    expect(chip.getAttribute('title')).toBe('__NF-HOST__');
  });

  // T10: winner-less honest state — reason verbatim, no invented target.
  it('renders the winner-less arrow with its reason and no target', () => {
    const el = createRow({
      name: 'mfe1',
      declared: { kind: 'range', range: '~1.0.0' },
      arrow: { kind: 'none', reason: 'no unique winner' },
      action: 'skip',
    });

    const arrow = el.querySelector('.arrow')!;
    expect(arrow.classList.contains('arrow-none')).toBe(true);
    expect(arrow.textContent).toContain('→ no unique winner');
    expect(arrow.getAttribute('aria-label')).toBe('resolution not derived: no unique winner');
    expect(el.querySelector('.arrow-target')).toBeNull();
    expect(el.querySelector('.arrow-provider')).toBeNull();
  });

  // T9-AC-03: the pinned variant renders the exact tag, never a range.
  it('pinned variant renders the exact tag with pinned styling', () => {
    const el = createRow({
      name: 'shell',
      declared: { kind: 'pinned', tag: '1.2.3' },
      strict: true,
      arrow: { kind: 'own' },
    });

    const declared = el.querySelector('.declared')!;
    expect(declared.textContent).toBe('1.2.3');
    expect(declared.classList.contains('declared-pinned')).toBe(true);
    expect(declared.classList.contains('declared-range')).toBe(false);
    // Tooltip affordance names the semantics.
    expect(declared.getAttribute('title')).toContain('exact tag');
  });

  // Fixed vocabulary: "resolves to" — never "uses", never bare "loaded".
  it('speaks the fixed resolution vocabulary', () => {
    const el = createRow({
      name: 'shell',
      declared: { kind: 'range', range: '^19.0.0' },
      arrow: { kind: 'winner', target: '19.2.3', provider: 'host' },
    });

    expect(el.querySelector('.arrow')?.getAttribute('aria-label')).toBe(
      'resolves to 19.2.3 (provider: host)',
    );
    expect(el.textContent).not.toContain('uses');
    expect(el.textContent).not.toContain('loaded');

    const own = createRow({
      name: 'mfe1',
      declared: { kind: 'range', range: '~2.0.0' },
      arrow: { kind: 'own' },
    });
    expect(own.querySelector('.arrow')?.getAttribute('aria-label')).toBe('resolves to own copy');
  });

  // T10 (cross-link rework): a caller may replace the default name chip
  // with a linked element — the kit itself stays router-free.
  it('projects a caller-provided name element over the default chip', () => {
    // Test scaffolding only — real consumers keep templates in separate files.
    @Component({
      imports: [ParticipantRow],
      template: `
        <nf-participant-row name="chat" [declared]="{ kind: 'range', range: '^2.0.0' }">
          <a nfParticipant class="the-name-link" href="#">chat</a>
        </nf-participant-row>
      `,
    })
    class NameHost {}

    const fixture = TestBed.createComponent(NameHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.participant .the-name-link')?.textContent).toBe('chat');
    expect(el.querySelector('.participant nf-participant-chip')).toBeNull();
  });

  it('projects optional link slots', () => {
    // Test scaffolding only — real consumers keep templates in separate files.
    @Component({
      imports: [ParticipantRow],
      template: `
        <nf-participant-row
          name="shell"
          [declared]="{ kind: 'range', range: '^19.0.0' }"
          [arrow]="{ kind: 'own' }"
        >
          <a nfRowLinks class="the-link" href="#">details</a>
        </nf-participant-row>
      `,
    })
    class RowHost {}

    const fixture = TestBed.createComponent(RowHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.row-links .the-link')?.textContent).toBe('details');
  });
});
