/**
 * Remotes view specs — the component half of T8-AC-05 (template renders
 * vm rows only; canonical claim states and arrows in the DOM; cross-link
 * hrefs) plus the carried-over list/sentinel/expose behavior. Focused DOM
 * pins for `co-declared-share` and `scoped` per T8-AC-05; the boundary
 * note speaks capture/registry language, never delivery.
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
  constructor(private readonly source: FixtureId | SnapshotV1 | null) {}

  captureSnapshot(): Promise<SnapshotV1> {
    if (this.source === null) {
      return Promise.reject(new Error('capture failed'));
    }
    return Promise.resolve(
      structuredClone(typeof this.source === 'string' ? FIXTURES[this.source] : this.source),
    );
  }
}

/** Flush the store's pending capture promise, then re-render. */
async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function createView(options: { fixture: FixtureId | SnapshotV1 | null; select?: string }) {
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

/**
 * Seed for the review-round DOM witnesses (T8 review H1/H2): r1 and r2
 * share one scope URL. `alias-lib` is selected from r1's candidate while
 * r2 declares it WITHOUT candidates (relation-only consumer); `amb-lib`
 * resolves to a target both equal scope prefixes match (ambiguous scope).
 */
const QUALIFIER_SEED: SnapshotV1 = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://seed.example/',
    capturedAt: '2026-08-21T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'seed/1',
  },
  channels: {
    nativeFederationGlobals: { state: 'available' },
    domImportMaps: { state: 'available' },
    importShim: { state: 'unavailable', reason: 'window.importShim is not present' },
  },
  runtime: {
    remotes: {
      '__NF-HOST__': { scopeUrl: 'https://seed.example/', exposes: [], integrity: {} },
      r1: { scopeUrl: 'https://seed.example/shared/', exposes: [], integrity: {} },
      r2: { scopeUrl: 'https://seed.example/shared/', exposes: [], integrity: {} },
    },
    scopedExternals: {},
    sharedExternals: {
      __GLOBAL__: {
        'alias-lib': {
          dirty: false,
          versions: [
            {
              tag: '1.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'r1',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: null,
                  entries: { 'alias-lib': 'lib.js' },
                  cached: true,
                  bundle: null,
                  servedFiles: [{ entry: 'alias-lib', file: 'lib.js' }],
                  generation: 'v4.5',
                },
                {
                  name: 'r2',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: null,
                  entries: {},
                  cached: true,
                  bundle: null,
                  servedFiles: [],
                  generation: 'v4.5',
                },
              ],
            },
          ],
        },
        'amb-lib': {
          dirty: false,
          versions: [
            {
              tag: '1.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'r1',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: null,
                  entries: { 'amb-lib': 'a.js' },
                  cached: true,
                  bundle: null,
                  servedFiles: [{ entry: 'amb-lib', file: 'a.js' }],
                  generation: 'v4.5',
                },
              ],
            },
          ],
        },
      },
    },
    sharedChunks: {},
    generation: 'v4.5',
  },
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap',
        parsed: true,
        importCount: 1,
        scopeCount: 1,
        imports: [{ specifier: 'amb-lib', target: './shared/b.js' }],
        scopes: [
          { scope: './shared/', imports: [{ specifier: 'alias-lib', target: './shared/lib.js' }] },
        ],
        integrity: {},
      },
    ],
    effective: { imports: [], scopes: [], integrityFor: [] },
  },
  errors: [],
};

describe('RemotesView', () => {
  // The live remotes render as a flat list with the host chip; sentinels
  // never as visible text; the boundary note renders in capture language.
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
    expect(el.textContent).not.toContain('never loaded');

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

  // Capability badges of the selected remote — seeded via the VERBATIM
  // sentinel select payload (cross-link arrival), canonically grounded.
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

  // T8-AC-02 (DOM half): one declaration row — evidenced fallback arrow to
  // the selected copy's source, package cross-link; no provider claim.
  it('renders the transposed skip row with its fallback arrow and package link', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: 'mfe1' });
    const el = fixture.nativeElement as HTMLElement;

    const depRows = el.querySelectorAll('.dep-row');
    expect(depRows).toHaveLength(1);
    const arrow = depRows[0].querySelector<HTMLElement>('.arrow')!;
    expect(arrow.textContent).toContain('_nf_lab_conflict_lib.jvcc6K1csg.js');
    expect(arrow.querySelector('.arrow-provider')?.textContent).toBe('mfe2');
    expect(arrow.getAttribute('aria-label')).toBe(
      'resolves to _nf_lab_conflict_lib.jvcc6K1csg.js (source: mfe2)',
    );
    expect(depRows[0].querySelector('.action-chip')?.textContent).toBe('skip');
    // The fallback carries no extra state chip — the arrow speaks.
    expect(depRows[0].querySelector('.state-chip')).toBeNull();
    // The package name IS the /packages cross-link.
    const link = depRows[0].querySelector<HTMLAnchorElement>('a.pkg-link')!;
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe(
      '/packages?select=__GLOBAL__|@nf-lab/conflict-lib',
    );
    // The selected source never renders as an own participant row here.
    expect(el.querySelectorAll('.chip')).toHaveLength(3); // list chips only
  });

  it('keeps the selected consumer quiet beside its explicit own-copy arrow', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: 'mfe2' });
    const el = fixture.nativeElement as HTMLElement;

    const depRow = el.querySelector('.dep-row')!;
    expect(depRow.querySelector('.arrow-own')?.textContent).toContain('own copy');
    // The norm carries no chip — only deviations speak.
    expect(depRow.querySelector('.state-chip')).toBeNull();
    // Glyph legend accompanies the dependency section.
    expect(el.querySelectorAll('.glyph-legend .legend-item')).toHaveLength(3);
  });

  // T8-AC-01/-AC-05 (DOM half): the co-declared consumer renders its own
  // declaration with the canonical not-selected state and the arrow to the
  // shared copy.
  it('renders the co-declared consumer with its claim state and shared-copy arrow', async () => {
    const fixture = await createView({ fixture: 'co-declared-share', select: 'mfe2' });
    const el = fixture.nativeElement as HTMLElement;

    const depRows = el.querySelectorAll('.dep-row');
    expect(depRows).toHaveLength(1);
    const chip = depRows[0].querySelector<HTMLElement>('.state-chip')!;
    expect(chip.textContent).toBe('not selected');
    expect(chip.title).toContain('a different composition may select it');
    const arrow = depRows[0].querySelector<HTMLElement>('.arrow')!;
    expect(arrow.textContent).toContain('_nf_lab_conflict_lib.JF7uEdSVsN.js');
    expect(arrow.querySelector('.arrow-provider')?.textContent).toBe('mfe1');
    expect(depRows[0].querySelector('.action-chip')?.textContent).toBe('share');
  });

  it('marks an unresolved declaration with the honest none-arrow and state', async () => {
    const fixture = await createView({ fixture: 'synthetic-multi-version', select: 'calendar' });
    const el = fixture.nativeElement as HTMLElement;

    const depRow = el.querySelector('.dep-row')!;
    expect(depRow.querySelector('.arrow-none')?.textContent).toContain(
      'no import-map binding in this capture',
    );
    const chip = depRow.querySelector<HTMLElement>('.state-chip')!;
    expect(chip.textContent).toBe('not mapped');
    expect(chip.title).toContain('in this capture');
  });

  // T8-AC-03/-AC-05 (DOM half): the true private registration renders its
  // complete path — package, tag, own-mapping state, resolved file.
  it('renders the private registration path in the scoped-externals subsection', async () => {
    const fixture = await createView({ fixture: 'scoped', select: 'mfe1' });
    const el = fixture.nativeElement as HTMLElement;

    const headings = Array.from(el.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toContain('Scoped externals');
    const item = el.querySelector<HTMLElement>('.scoped-item')!;
    expect(item.querySelector('.mono')?.textContent).toBe('@nf-lab/conflict-lib');
    expect(item.querySelector<HTMLElement>('.mono.tip')?.title).toContain(
      'no share action, no share scope',
    );
    expect(item.querySelector('.scoped-tag')?.textContent).toBe('1.0.0');
    const state = item.querySelector<HTMLElement>('.state-chip')!;
    expect(state.textContent).toBe('own mapping');
    expect(state.title).toContain('private domain');
    expect(item.querySelector('.scoped-file')?.textContent).toBe(
      '_nf_lab_conflict_lib.JF7uEdSVsN.js',
    );
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

  // T8-AC-04 (DOM half): the dense host chunk section renders canonical
  // bundle claims; only mapped-source presents its files unqualified.
  it('renders canonical bundle claims with visible qualification', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live', select: NF_HOST });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.chunk-note')?.textContent).toContain('canonical bundle claims');
    const rows = Array.from(el.querySelectorAll<HTMLElement>('.chunk-package'));
    const packageOf = (row: HTMLElement) => row.querySelector('.mono')?.textContent;
    const common = rows.find((row) => packageOf(row) === '@angular/common')!;
    expect(common.textContent).toContain('browser-angular_common');
    expect(common.textContent).toContain('1 chunk file');
    expect(common.querySelector('.chunk-status')).toBeNull();
    const tslib = rows.find((row) => packageOf(row) === 'tslib')!;
    expect(tslib.querySelector('.chunk-status')?.textContent).toBe('source-only');
    expect(tslib.textContent).toContain('no chunk list recorded in this capture');
  });

  // Exposes render remote-qualified with the literal live /./ specifier
  // and the joined map target as the link tooltip.
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

  // T8 review H1 (DOM half): a claim resolving to an ambiguously attributed
  // copy renders the qualified ambiguity — chip and arrow, never "unknown".
  it('renders an ambiguous source qualification on the dependency row', async () => {
    const fixture = await createView({ fixture: QUALIFIER_SEED, select: 'r1' });
    const el = fixture.nativeElement as HTMLElement;

    const rows = Array.from(el.querySelectorAll<HTMLElement>('.dep-row'));
    const ambRow = rows.find((row) => row.querySelector('.pkg-link')?.textContent === 'amb-lib')!;
    const chips = Array.from(ambRow.querySelectorAll<HTMLElement>('.state-chip'));
    expect(chips.map((chip) => chip.textContent)).toEqual(['not selected', 'ambiguous source']);
    expect(chips[1].title).toBe(
      'equally specific remote scope prefixes match this target — none is chosen',
    );
    expect(ambRow.querySelector('.arrow-provider')?.textContent).toBe('ambiguous source');
  });

  // T8 review H2 (DOM half): a claim-less consumer relation renders with
  // copy, qualified source, and binding instead of disappearing.
  it('renders the relation-only consumer binding of an alias scope', async () => {
    const fixture = await createView({ fixture: QUALIFIER_SEED, select: 'r2' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('resolved bindings without an own resolution claim');
    const item = el.querySelector<HTMLElement>('.relation-item')!;
    expect(item.querySelector('.mono')?.textContent).toBe('alias-lib');
    expect(item.querySelector('.scoped-tag')?.textContent).toBe('1.0.0');
    expect(item.querySelector<HTMLElement>('.state-chip')?.textContent).toBe('r1');
    expect(item.querySelector<HTMLElement>('.state-chip')?.title).toContain('exact target source');
    const binding = item.querySelector<HTMLElement>('.relation-binding')!;
    expect(binding.textContent).toBe('alias-lib → lib.js');
    expect(binding.title).toBe('https://seed.example/shared/lib.js');
    // The candidate-less declaration row itself stays honest beside it.
    expect(el.querySelector('.dep-row .arrow-none')?.textContent).toContain(
      'no resolution claim derivable',
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

  // Wording rules: "resolves to", never "uses"; no delivery claims; arrows
  // carry the fixed aria vocabulary.
  it('speaks the fixed vocabulary across list and detail', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live', select: NF_HOST });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).not.toMatch(/\buses\b/);
    expect(el.textContent).not.toMatch(/\bused by\b/);
    expect(el.textContent).not.toMatch(/\bloaded\b/);
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
