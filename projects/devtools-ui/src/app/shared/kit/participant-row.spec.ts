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
    // T7.6-AC-05: a configuration fact — muted like the declared range,
    // never warning-colored.
    expect(getComputedStyle(strictMarker).color).toBe(getComputedStyle(declared).color);

    const arrow = el.querySelector('.arrow')!;
    expect(arrow.textContent).toContain('→');
    expect(arrow.querySelector('.arrow-target')?.textContent).toBe('19.2.3');
    // T8.6: the source renders as `from` + provider (7.6 wording).
    expect(arrow.querySelector('.arrow-source-word')?.textContent).toBe('from');
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

  // T8.6: the own-copy arrow is gone from the kit — zone membership says it
  // in the one remaining consumer; only winner and none remain.
  it('offers no own-copy arrow branch', () => {
    const el = createRow({
      name: 'mfe1',
      declared: { kind: 'range', range: '~2.0.0' },
      arrow: { kind: 'none', reason: 'no unique winner' },
    });

    expect(el.textContent).not.toContain('own copy');
    expect(el.querySelector('.arrow-own')).toBeNull();
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
      'resolves to 19.2.3 (source: host)',
    );
    expect(el.textContent).not.toContain('uses');
    expect(el.textContent).not.toContain('loaded');
  });

  // T8.6: the caller's grounded registration note rides the declared
  // version; the pinned variant keeps its exact-tag fallback without one.
  it('renders a caller-provided declared note as the declared tooltip', () => {
    const fixture = TestBed.createComponent(ParticipantRow);
    fixture.componentRef.setInput('name', 'mfe1');
    fixture.componentRef.setInput('declared', { kind: 'range', range: '^1.0.0' });
    fixture.componentRef.setInput('declaredNote', 'offers this copy to the version election');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.declared')?.getAttribute('title')).toBe(
      'offers this copy to the version election',
    );

    // Without a note, a range carries no tooltip at all.
    const quiet = createRow({ name: 'mfe1', declared: { kind: 'range', range: '^1.0.0' } });
    expect(quiet.querySelector('.declared')?.hasAttribute('title')).toBe(false);
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
          [arrow]="{ kind: 'none', reason: 'no unique winner' }"
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

  // T8.6: a caller may replace the winner arrow's provider text with a
  // linked element (the from-chip of the Remotes consumes rows) — the kit
  // itself stays router-free, and the aria vocabulary keeps the source.
  it('projects a caller-provided source element over the provider text', () => {
    // Test scaffolding only — real consumers keep templates in separate files.
    @Component({
      imports: [ParticipantRow],
      template: `
        <nf-participant-row
          name="shell"
          [declared]="{ kind: 'range', range: '^19.0.0' }"
          [arrow]="{ kind: 'winner', target: 'lib.js', provider: 'mfe2' }"
        >
          <a nfArrowSource class="the-source-link" href="#">mfe2</a>
        </nf-participant-row>
      `,
    })
    class SourceHost {}

    const fixture = TestBed.createComponent(SourceHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.arrow .arrow-source-word')?.textContent).toBe('from');
    expect(el.querySelector('.arrow .the-source-link')?.textContent).toBe('mfe2');
    expect(el.querySelector('.arrow .arrow-provider')).toBeNull();
    expect(el.querySelector('.arrow')?.getAttribute('aria-label')).toBe(
      'resolves to lib.js (source: mfe2)',
    );
  });
});
