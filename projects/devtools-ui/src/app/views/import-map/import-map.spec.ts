/**
 * Import Map view specs — the component half of T9.5 (template renders vm
 * groups/rows only; XC-06):
 *  - T9.5-AC-01 (DOM half): the live GLOBAL section renders `EXPOSES`
 *    plus the signature-group heads with hoisted SRI and visible
 *    qualifiers; the table grid and its headers are gone.
 *  - T9.5-AC-03/-AC-04 (DOM half, fixture + SEEDED): qualified heads,
 *    blocked rows, the muted unreferenced tail, `overrides global`, and
 *    the anchor rows — no guessed owner, no unqualified delivery claim.
 *  - T9.5-AC-05 (DOM half): the chunk-wiring fold is a keyboard-operable
 *    `<button>` with `aria-expanded`, collapsed rows are not in the DOM,
 *    selection auto-expands; caption, empty states, select seeding, and
 *    the wording sweep carry over.
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
import { ImportMapView } from './import-map';

class StubSnapshotProvider implements SnapshotProvider {
  constructor(private readonly snapshot: SnapshotV1 | null) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return this.snapshot === null
      ? Promise.reject(new Error('capture failed'))
      : Promise.resolve(structuredClone(this.snapshot));
  }
}

/**
 * SEEDED page: a CDN target (unattributable head), equally matching exact
 * candidates (ambiguous head), a blocked prefix entry (ungrouped), and a
 * scope URL two remotes register whose row nothing canonical references
 * (shared scope identity + unreferenced tail).
 */
const SEEDED_HONEST_OUTCOMES: SnapshotV1 = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://seeded.example/app/',
    capturedAt: '2026-08-13T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'seeded-spec/1',
  },
  channels: {
    nativeFederationGlobals: { state: 'available' },
    domImportMaps: { state: 'available' },
    importShim: { state: 'unavailable', reason: 'seeded: no shim' },
  },
  runtime: {
    remotes: {
      [NF_HOST]: { scopeUrl: './', exposes: [], integrity: {} },
      'mfe-a': { scopeUrl: './vendor/', exposes: [], integrity: {} },
      'mfe-b': { scopeUrl: './vendor/', exposes: [], integrity: {} },
      'team-a': { scopeUrl: './team/app/', exposes: [], integrity: {} },
      'team-b': { scopeUrl: './team/app/', exposes: [], integrity: {} },
    },
    scopedExternals: {},
    sharedExternals: {
      __GLOBAL__: {
        lodash: {
          dirty: false,
          versions: [
            {
              tag: '1.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-a',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: 'nope.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'nope.js' }],
                  generation: 'v4',
                },
              ],
            },
          ],
        },
        lib: {
          dirty: false,
          versions: [
            {
              tag: '1.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-a',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: 'lib.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'lib.js' }],
                  generation: 'v4',
                },
                {
                  name: 'mfe-b',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: 'lib.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'lib.js' }],
                  generation: 'v4',
                },
              ],
            },
          ],
        },
        'util/x': {
          dirty: false,
          versions: [
            {
              tag: '1.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-a',
                  requiredVersion: '^1.0.0',
                  strictVersion: false,
                  file: 'x.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'x.js' }],
                  generation: 'v4',
                },
              ],
            },
          ],
        },
      },
    },
    sharedChunks: {},
    generation: 'unknown',
  },
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap',
        parsed: true,
        importCount: 3,
        scopeCount: 1,
        imports: [
          { specifier: 'lodash', target: 'https://cdn.example/lodash.js' },
          { specifier: 'lib', target: './vendor/lib.js' },
          { specifier: 'util/', target: './util' },
        ],
        scopes: [
          {
            scope: './team/app/',
            imports: [{ specifier: 'shared', target: './team/app/shared.js' }],
          },
        ],
        integrity: {},
      },
    ],
    effective: null,
  },
  errors: [],
};

/** Flush the store's pending capture promise, then re-render. */
async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}

async function createView(options: {
  fixture: FixtureId | null;
  snapshot?: SnapshotV1;
  select?: string;
}) {
  const snapshot =
    options.snapshot ?? (options.fixture === null ? null : FIXTURES[options.fixture]);
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ImportMapView],
    providers: [
      provideRouter([]),
      // Mirrors the app.config.ts binding — identity-dot pins run against
      // the real store-backed lookup.
      provideParticipantColors(),
      { provide: SNAPSHOT_PROVIDER, useValue: new StubSnapshotProvider(snapshot) },
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
  const fixture = TestBed.createComponent(ImportMapView);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

function rowByText(el: HTMLElement, text: string): HTMLElement {
  const row = Array.from(el.querySelectorAll<HTMLElement>('.map-row')).find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (row === undefined) {
    throw new Error(`row not rendered: ${text}`);
  }
  return row;
}

describe('ImportMapView', () => {
  // T9.5-AC-01 (DOM half): group heads replace the table grid; SRI hoists
  // into the heads; the section count carries the raw-pivot contract.
  it('renders the live GLOBAL section as evidence groups — the table grid is gone', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    // The 4-column table and its per-section headers are gone.
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('th')).toBeNull();

    const heads = Array.from(el.querySelectorAll<HTMLElement>('.section-head .section-label'));
    expect(heads.map((head) => head.textContent?.trim())).toEqual([
      'GLOBAL IMPORTS',
      'https://lutzleonhardt.de/frankenstein-meeting-room/',
    ]);
    const counts = Array.from(el.querySelectorAll<HTMLElement>('.section-count'));
    expect(counts.map((count) => count.textContent?.trim())).toEqual(['22 entries', '7 entries']);
    expect(counts[0].title).toContain('Export JSON preserves the artifact verbatim');
    expect(counts[0].title).toContain('recorded map order carries no resolution semantics');

    // GLOBAL factors into EXPOSES, the PACKAGES home label, and the seven
    // signature groups; the host scope holds only the collapsed fold.
    const sections = Array.from(el.querySelectorAll<HTMLElement>('.map-section'));
    expect(sections[0].querySelectorAll('.group-head')).toHaveLength(9);
    expect(
      Array.from(el.querySelectorAll<HTMLElement>('.group-kind')).map((kind) =>
        kind.textContent?.trim(),
      ),
    ).toEqual(['EXPOSES', 'PACKAGES', 'CHUNK WIRING']);

    // The home label counts every package-kind row and grounds the kind
    // derivation; it carries no SRI hoist of its own.
    const homeHead = el.querySelector<HTMLElement>('.home-head')!;
    expect(homeHead.textContent).toContain('20 entries');
    const homeKind = homeHead.querySelector<HTMLElement>('.group-kind')!;
    expect(homeKind.title).toContain('precedence: expose > chunk > package');
    expect(homeHead.querySelector('.head-sri')).toBeNull();

    // Uniform SRI hoists into every head — no row marks itself.
    expect(el.querySelectorAll('.row-sri')).toHaveLength(0);
    expect(el.querySelectorAll('.head-sri')).toHaveLength(9);
    expect(el.querySelectorAll('.map-row')).toHaveLength(22);

    // The source-only qualifier sits stable in its head.
    const qualifiedHead = Array.from(el.querySelectorAll<HTMLElement>('.group-head')).find((head) =>
      head.textContent?.includes('browser-angular_platform_browser'),
    )!;
    expect(qualifiedHead.querySelector('.row-qualifier')?.textContent?.trim()).toBe('source-only');

    // Expose rows surface the recorded module name visibly.
    const exposeRow = rowByText(el, 'whiteboard/./Bootstrap');
    expect(exposeRow.querySelector('.expose-word')?.textContent?.trim()).toBe('expose ./Bootstrap');

    // Identity chips: the owner chip renders host without a dot; the
    // whiteboard head chip keeps its palette slot (T7.7 carry-over).
    const ownerChip = el.querySelector<HTMLElement>('.section-owner .chip-host')!;
    expect(ownerChip.textContent).toBe('host');
    expect(ownerChip.title).toBe(NF_HOST);
    expect(el.textContent).not.toContain(NF_HOST);
    expect(ownerChip.querySelector('.dot')).toBeNull();
    const whiteboardChip = Array.from(
      el.querySelectorAll<HTMLElement>('.group-head .chip-remote'),
    ).find((chip) => chip.textContent === 'whiteboard')!;
    expect(whiteboardChip.querySelector('.dot')?.classList.contains('dot-2')).toBe(true);

    // Targets render relative to the page base; the verbatim URL is the
    // tooltip evidence.
    const reactTarget = Array.from(el.querySelectorAll<HTMLElement>('.target-text')).find(
      (target) => target.textContent === 'whiteboard/react.QYXZqQxJ1j.js',
    )!;
    expect(reactTarget.title).toBe(
      'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/react.QYXZqQxJ1j.js',
    );
  });

  // T9.5-AC-05 (DOM half): the fold contract — real button, aria-expanded,
  // collapsed rows out of the DOM, expandable, collapsible again.
  it('folds chunk wiring collapsed by default behind a keyboard-operable button', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    const button = el.querySelector<HTMLButtonElement>('.fold-head')!;
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.textContent).toContain('CHUNK WIRING');
    expect(button.textContent).toContain('7 entries in 3 bundles');
    expect(button.textContent).toContain('SRI ✓');
    // The bundle names stay one hover away on the tip'd summary.
    const summary = button.querySelector<HTMLElement>('.head-summary')!;
    expect(summary.classList.contains('tip')).toBe(true);
    expect(summary.title).toBe('browser-angular_core, browser-angular_common, browser-rxjs');
    // Collapsed rows are not in the DOM; the vm stays complete.
    expect(el.textContent).not.toContain('@nf-internal/chunk-WW26EZ22');
    expect(el.querySelectorAll('.map-row')).toHaveLength(22);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('.map-row')).toHaveLength(29);
    // The bundle summary yields to the expanded rows.
    expect(button.textContent).not.toContain('in 3 bundles');

    // Expanded wiring rows keep the full per-row channel: emitter chip
    // plus the bundle label linking its remote.
    const chunkRow = rowByText(el, '@nf-internal/chunk-WW26EZ22');
    expect(chunkRow.querySelector('.row-chunk .chip-host')?.textContent).toBe('host');
    const bundleLink = chunkRow.querySelector<HTMLAnchorElement>('.row-chunk .note-link')!;
    expect(bundleLink.textContent?.trim()).toBe('browser-angular_common');
    expect(bundleLink.title).toBe('');
    expect(chunkRow.querySelector<HTMLElement>('.row-chunk')!.title).toContain(
      'recorded chunk file of host',
    );
    expect(decodeURIComponent(bundleLink.getAttribute('href') ?? '')).toBe(
      `/remotes?select=${NF_HOST}`,
    );

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelectorAll('.map-row')).toHaveLength(22);
  });

  // T9.5-AC-05: a seeded selection inside the fold auto-expands it; an
  // explicit toggle wins over the selection.
  it('auto-expands the fold holding the seeded selection', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: '@nf-internal/chunk-WW26EZ22',
    });
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLButtonElement>('.fold-head')!;
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const selected = el.querySelectorAll<HTMLElement>('.row-selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('@nf-internal/chunk-WW26EZ22');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelectorAll('.row-selected')).toHaveLength(0);
  });

  // T9.5-AC-01 (DOM half): the signature head carries the one source chip
  // and the qualified bundle; the row keeps both consumer claims.
  it('renders the co-declared claims on the row under its factored head', async () => {
    const fixture = await createView({ fixture: 'co-declared-share' });
    const el = fixture.nativeElement as HTMLElement;

    const head = Array.from(el.querySelectorAll<HTMLElement>('.group-head')).find((candidate) =>
      candidate.textContent?.includes('browser-shared'),
    )!;
    expect(head.querySelector('.chip')?.textContent).toBe('mfe1');
    expect(head.querySelector('.source-word')?.textContent).toBe('from');
    expect(head.querySelector('.row-qualifier')?.textContent?.trim()).toBe('source-only');
    expect(head.textContent).toContain('1 entry');

    const row = rowByText(el, '@nf-lab/conflict-lib');
    const claims = Array.from(row.querySelectorAll<HTMLElement>('.row-claim'));
    expect(
      claims.map((claim) => [
        claim.querySelector('.chip')?.textContent,
        claim.querySelector('.claim-state')?.textContent?.trim(),
      ]),
    ).toEqual([
      ['mfe1', 'selected'],
      ['mfe2', 'not selected'],
    ]);
    // The source and bundle stay hoisted — the row renders no qualifier
    // and no bundle of its own.
    expect(row.querySelector('.row-qualifier')).toBeNull();
    expect(row.querySelector('.row-bundle')).toBeNull();
  });

  // T9.5-AC-04 (DOM half): the anchor stays visible and qualified on the
  // consumer scope row, which also carries the overrides-global marker.
  it('renders the pooling anchor qualified with the overrides-global marker', async () => {
    const fixture = await createView({ fixture: 'pooling-anchor' });
    const el = fixture.nativeElement as HTMLElement;
    const scopeSections = Array.from(el.querySelectorAll<HTMLElement>('.map-section')).filter(
      (section) => section.querySelector('.section-label.mono') !== null,
    );
    expect(scopeSections.length).toBe(2);
    for (const section of scopeSections) {
      const row = section.querySelector<HTMLElement>('.map-row')!;
      expect(row.querySelector('.chip')?.textContent).toBe('mfe1');
      expect(row.querySelector('.row-qualifier')?.textContent?.trim()).toBe('explicit anchor');
      expect(row.querySelector('.claim-state')?.textContent?.trim()).toBe('anchored');
      const override = row.querySelector<HTMLElement>('.row-override')!;
      expect(override.textContent?.trim()).toBe('overrides global');
      expect(override.title).toContain('rule: scope-precedence');
      // Ungrouped scope rows always self-mark their integrity state.
      expect(row.querySelector('.row-sri')?.textContent?.trim()).toBe('no SRI');
    }
  });

  // Quiet norms: an identity-owned scope section whose rows restate the
  // owner shows only the qualified bundle evidence.
  it('quiets owner-restating sources — the bundle claim stays qualified', async () => {
    const fixture = await createView({ fixture: 'strict-scope' });
    const el = fixture.nativeElement as HTMLElement;
    const scopeSections = Array.from(el.querySelectorAll<HTMLElement>('.map-section')).filter(
      (section) => section.querySelector('.section-label.mono') !== null,
    );
    for (const section of scopeSections) {
      const row = section.querySelector<HTMLElement>('.map-row')!;
      expect(row.querySelector('.chip')).toBeNull();
      const bundle = row.querySelector<HTMLElement>('.row-bundle')!;
      expect(bundle.textContent).toContain('browser-shared');
      expect(bundle.querySelector('.row-qualifier')?.textContent?.trim()).toBe('source-only');
      expect(bundle.title).toContain('no registered chunk group backs it');
      expect(row.querySelector('.row-override')).toBeNull();
    }
  });

  // T9.5-AC-04 (DOM half, SEEDED): qualified heads, blocked rows, shared
  // scope identity, and the unreferenced tail render honestly.
  it('renders ambiguous, unattributable, blocked, and unreferenced outcomes honestly', async () => {
    const fixture = await createView({ fixture: null, snapshot: SEEDED_HONEST_OUTCOMES });
    const el = fixture.nativeElement as HTMLElement;

    // Qualified signatures form heads carrying the qualified language.
    const headQualifiers = Array.from(
      el.querySelectorAll<HTMLElement>('.group-head .row-qualifier'),
    );
    expect(headQualifiers.map((qualifier) => qualifier.textContent?.trim())).toEqual([
      'unattributable',
      'ambiguous source',
    ]);
    expect(headQualifiers[0].title).toContain('CDN or foreign origin');
    const cdnRow = rowByText(el, 'lodash');
    expect(cdnRow.textContent).toContain('https://cdn.example/lodash.js');

    // The blocked row has no signature — it renders ungrouped with the
    // full per-row channel and its own SRI mark.
    const blockedRow = rowByText(el, 'util/');
    const blocked = blockedRow.querySelector<HTMLElement>('.row-blocked')!;
    expect(blocked.textContent).toBe('blocked');
    expect(blocked.title).toContain('prefix-target-missing-trailing-slash');
    expect(blockedRow.querySelector('.row-sri')?.textContent?.trim()).toBe('no SRI');

    // The scope two remotes register names both — an identity, not an
    // election; its unreferenced row renders muted with no annotation.
    const owner = el.querySelector<HTMLElement>('.section-owner')!;
    expect(Array.from(owner.querySelectorAll('.chip')).map((chip) => chip.textContent)).toEqual([
      'team-a',
      'team-b',
    ]);
    expect(owner.title).toContain('scope-url identity');
    const sharedRow = rowByText(el, 'shared');
    expect(sharedRow.classList.contains('row-muted')).toBe(true);
    expect(sharedRow.querySelector('.chip')).toBeNull();
  });

  // T9.5-AC-03 (DOM half): the hostile capture renders the muted
  // UNREFERENCED tail with per-row SRI marks (mixed — no hoist).
  it('renders the unreferenced tail muted with per-row SRI marks', async () => {
    const fixture = await createView({ fixture: 'synthetic-hostile' });
    const el = fixture.nativeElement as HTMLElement;

    const group = el.querySelector<HTMLElement>('.group-unreferenced')!;
    const kind = group.querySelector<HTMLElement>('.group-kind')!;
    expect(kind.textContent?.trim()).toBe('UNREFERENCED');
    expect(kind.title).toContain('honest absence, never a guessed owner');
    expect(group.querySelector('.head-sri')).toBeNull();

    const rows = Array.from(group.querySelectorAll<HTMLElement>('.map-row'));
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.classList.contains('row-muted'))).toBe(true);
    expect(rows.map((row) => row.querySelector('.row-sri')?.textContent?.trim())).toEqual([
      'SRI ✓',
      'no SRI',
    ]);
    expect(group.querySelector('.chip')).toBeNull();
  });

  // T9.5-AC-05: the honesty caption renders verbatim on populated AND
  // empty captures; mapMode 'none' renders the honest empty state.
  it('renders the caption verbatim and the honest empty state for mapMode none', async () => {
    const live = await createView({ fixture: 'frankenstein-live' });
    const caption =
      'This layer proves resolution only — an import-mapped file is not necessarily requested, and a requested file is not proof of execution.';
    expect((live.nativeElement as HTMLElement).querySelector('.caption')?.textContent).toBe(
      caption,
    );

    const empty = await createView({ fixture: 'synthetic-empty-page' });
    const el = empty.nativeElement as HTMLElement;
    expect(el.querySelector('.caption')?.textContent).toBe(caption);
    expect(el.querySelectorAll('.map-row')).toHaveLength(0);
    expect(el.textContent).toContain('no import map recorded in this capture');
  });

  // Select seeding tolerates the literal /./ infix (both sender payloads).
  it('highlights the seeded selection, tolerating the /./ infix', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: 'whiteboard/Bootstrap',
    });
    const el = fixture.nativeElement as HTMLElement;
    const selected = el.querySelectorAll<HTMLElement>('.row-selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('whiteboard/./Bootstrap');
  });

  it('stays honest on a failed capture', async () => {
    const fixture = await createView({ fixture: null });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'no captured snapshot to render',
    );
  });

  // Wording sweep: no unqualified delivery language anywhere in the view.
  it('never renders unqualified delivery language', async () => {
    for (const name of ['frankenstein-live', 'pooling-anchor', 'scoped'] as const) {
      const fixture = await createView({ fixture: name });
      const el = fixture.nativeElement as HTMLElement;
      el.querySelector<HTMLButtonElement>('.fold-head')?.click();
      fixture.detectChanges();
      const text = el.textContent ?? '';
      expect(text).not.toContain('served by');
      expect(text).not.toMatch(/\bloaded\b/);
      // Tooltips carry the grounded notes — sweep them for the banned
      // unqualified claim as well.
      for (const titled of Array.from(el.querySelectorAll<HTMLElement>('[title]'))) {
        expect(titled.title).not.toContain('served by');
        expect(titled.title).not.toMatch(/\bloaded\b/);
      }
    }
  });
});
