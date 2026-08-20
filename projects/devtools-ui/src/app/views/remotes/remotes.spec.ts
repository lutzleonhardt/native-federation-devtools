/**
 * Remotes view specs — the component half of T11-AC-05 (template renders
 * vm rows only; boundary note; UI state wiring) plus DOM-level checks of
 * the transposed dependency rows, the sentinel rules, and cross-link
 * hrefs (XC-03).
 */
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import {
  FIXTURES,
  FixtureId,
  NF_HOST,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { provideParticipantColors } from '../../shared/store/participant-colors-provider';
import { RemotesView } from './remotes';

class FixtureSnapshotProvider implements SnapshotProvider {
  constructor(private readonly id: FixtureId | null) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return this.id === null
      ? Promise.reject(new Error('capture failed'))
      : Promise.resolve(structuredClone(FIXTURES[this.id]));
  }
}

/** Flush the store's pending capture promise, then re-render. */
async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function createView(options: { fixture: FixtureId | null; select?: string }) {
  await TestBed.configureTestingModule({
    imports: [RemotesView],
    providers: [
      provideRouter([]),
      // Mirrors the app.config.ts binding — identity-dot pins run against
      // the real store-backed lookup.
      provideParticipantColors(),
      { provide: SNAPSHOT_PROVIDER, useValue: new FixtureSnapshotProvider(options.fixture) },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: convertToParamMap(
              options.select === undefined ? {} : { select: options.select },
            ),
          },
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(RemotesView);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

describe('RemotesView', () => {
  // T11-AC-01 (DOM half): the live remotes render as a flat list with the
  // host chip; sentinels never as visible text; the boundary note renders
  // (T11-AC-05).
  it('renders the three live remotes with the host chip and the boundary note', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.tree-row')).toHaveLength(3);
    expect(el.querySelectorAll('.twisty')).toHaveLength(0);
    const hostChip = el.querySelector<HTMLElement>('.tree-row .chip-host')!;
    expect(hostChip.textContent).toBe('host');
    expect(hostChip.title).toBe(NF_HOST);
    expect(el.textContent).not.toContain(NF_HOST);
    expect(el.textContent).toContain('cannot enumerate what the capture cannot see');

    // T7.7-AC-02/-AC-04: identity dots from the one sorted-name lookup
    // (mermaid → slot 1, whiteboard → slot 2 — the same slots Packages and
    // Import Map render for these names); the host chip never carries one.
    const chipOf = (name: string) =>
      Array.from(el.querySelectorAll<HTMLElement>('.tree-row .chip-remote')).find(
        (chip) => chip.textContent === name,
      )!;
    expect(chipOf('mermaid').querySelector('.dot')?.classList.contains('dot-1')).toBe(true);
    expect(chipOf('whiteboard').querySelector('.dot')?.classList.contains('dot-2')).toBe(true);
    expect(hostChip.querySelector('.dot')).toBeNull();
  });

  // T11-AC-01 (DOM half): capability badges of the selected remote —
  // seeded via the VERBATIM sentinel select payload (cross-link arrival).
  it('seeds the selection from the verbatim sentinel and renders the badge matrix', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live', select: NF_HOST });
    const el = fixture.nativeElement as HTMLElement;

    const name = el.querySelector<HTMLElement>('.detail-name')!;
    expect(name.textContent?.trim()).toBe('host');
    expect(name.title).toBe(NF_HOST);
    const badges = Array.from(el.querySelectorAll<HTMLElement>('.capability'));
    expect(badges.map((badge) => badge.textContent?.trim())).toEqual([
      'dense chunking ✓',
      'dense externals ✓',
      'SRI ✓',
    ]);
  });

  // T11-AC-02 (DOM half): one dependency row — own declaration, explicit
  // arrow to the winner, package cross-link; no other participants.
  it('renders the transposed skip row with its arrow and package link only', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: 'mfe1' });
    const el = fixture.nativeElement as HTMLElement;

    const depRows = el.querySelectorAll('.dep-row');
    expect(depRows).toHaveLength(1);
    const arrow = depRows[0].querySelector<HTMLElement>('.arrow')!;
    expect(arrow.textContent).toContain('_nf_lab_conflict_lib.jvcc6K1csg.js');
    expect(arrow.querySelector('.arrow-provider')?.textContent).toBe('mfe2');
    expect(depRows[0].querySelector('.action-chip')?.textContent).toBe('skip');
    // The package name IS the /packages cross-link.
    const link = depRows[0].querySelector<HTMLAnchorElement>('a.pkg-link')!;
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe(
      '/packages?select=__GLOBAL__|@nf-lab/conflict-lib',
    );
    // The winner never renders as an own participant row here.
    expect(el.querySelectorAll('.chip')).toHaveLength(3); // list chips only
  });

  it('keeps the elected winner quiet beside its explicit own-copy arrow', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: 'mfe2' });
    const el = fixture.nativeElement as HTMLElement;

    const depRow = el.querySelector('.dep-row')!;
    expect(depRow.querySelector('.arrow-own')?.textContent).toContain('own copy');
    // The elected norm carries no marker — only exceptions speak.
    expect(depRow.querySelector('.dep-no-election')).toBeNull();
    // Glyph legend accompanies the dependency section.
    expect(el.querySelectorAll('.glyph-legend .legend-item')).toHaveLength(3);
  });

  it('marks the winner-less share row as the exception', async () => {
    const fixture = await createView({ fixture: 'synthetic-multi-version', select: 'calendar' });
    const el = fixture.nativeElement as HTMLElement;

    const marker = el.querySelector<HTMLElement>('.dep-row .dep-no-election')!;
    expect(marker.textContent?.trim()).toBe('no single elected version');
    expect(marker.title).toContain('registry-election');
    expect(el.querySelector('.dep-row .arrow-own')).not.toBeNull();
  });

  // T11-AC-03 (DOM half): true scoped packages get their own subsection;
  // reclassified @nf-internal chunks stay in the chunk section.
  it('renders the true scoped package in the scoped-externals subsection', async () => {
    const fixture = await createView({ fixture: 'scoped', select: 'mfe1' });
    const el = fixture.nativeElement as HTMLElement;

    const headings = Array.from(el.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toContain('Scoped externals');
    expect(el.querySelector('.scoped-item .mono')?.textContent).toBe('@nf-lab/conflict-lib');
  });

  it('renders reclassified chunks in the chunk section, never as scoped packages', async () => {
    const fixture = await createView({ fixture: 'non-dense', select: 'mfe3' });
    const el = fixture.nativeElement as HTMLElement;

    const headings = Array.from(el.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).not.toContain('Scoped externals');
    expect(el.querySelector('.chunk-note')?.textContent).toContain(
      'package attribution is not derivable',
    );
    const groupLabels = Array.from(el.querySelectorAll<HTMLElement>('.chunk-package .mono')).map(
      (label) => label.textContent,
    );
    expect(groupLabels.some((label) => label?.startsWith('@nf-internal/'))).toBe(true);
  });

  // T11-AC-04 (DOM half): exposes render remote-qualified with the literal
  // live /./ specifier and the joined map target as the link tooltip.
  it('renders remote-qualified exposes with the live /./ specifier', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live', select: 'whiteboard' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.expose-name')?.textContent).toBe('whiteboard/./Bootstrap');
    expect(el.querySelector('.expose-file')?.textContent).toBe('Bootstrap-7COJRA5I.js');
    const mapped = el.querySelector<HTMLAnchorElement>('a.expose-mapped')!;
    expect(mapped.title).toBe(
      'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/Bootstrap-7COJRA5I.js',
    );
    expect(decodeURIComponent(mapped.getAttribute('href') ?? '')).toBe(
      '/import-map?select=whiteboard/./Bootstrap',
    );
  });

  it('selects a remote on row click', async () => {
    const fixture = await createView({ fixture: 'clean-skip' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detail-name')).toBeNull();
    expect(el.textContent).toContain('Select a remote on the left.');

    el.querySelector<HTMLElement>('.tree-row')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.detail-name')?.textContent?.trim()).toBe('mfe1');
  });

  // Wording rules: "resolves to", never "uses"; arrows carry the fixed
  // aria vocabulary.
  it('speaks the fixed vocabulary across list and detail', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live', select: NF_HOST });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).not.toMatch(/\buses\b/);
    expect(el.textContent).not.toMatch(/\bused by\b/);
    for (const arrow of el.querySelectorAll('.arrow')) {
      expect(arrow.getAttribute('aria-label')).toMatch(/^(resolves to|resolution not derived)/);
    }
  });

  it('renders an honest observation when no snapshot is captured', async () => {
    const fixture = await createView({ fixture: null });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('no captured snapshot to render');
    expect(el.querySelector('.tree-row')).toBeNull();
  });
});
