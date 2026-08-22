/**
 * Import Map view specs — the component half of T9 (template renders vm
 * rows only; XC-06):
 *  - T9-AC-01 (DOM half): the co-declared row renders both consumer
 *    claims and the one exact source chip.
 *  - T9-AC-03 (DOM half, fixture + SEEDED): anchors, ambiguity,
 *    unattributable, blocked, shared scope URLs, quiet norms — no
 *    guessed owner, no unqualified delivery claim anywhere.
 *  - T9-AC-05 (DOM half): live sections render in map order with the
 *    identity owner chip, SRI markers, cross-link hrefs, caption, empty
 *    states, and select seeding; the 'served by' column language is gone.
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
 * SEEDED page: a CDN target (unattributable), equally matching exact
 * candidates (ambiguous), a blocked prefix entry, and a scope URL two
 * remotes register (shared scope identity).
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
  // T9-AC-05 (DOM half): sections in map order, identity owner chip, SRI
  // markers; sentinels never as visible text; the 'served by' language is
  // gone.
  it('renders the live sections in map order with the identity owner chip', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    const heads = Array.from(el.querySelectorAll<HTMLElement>('.section-head .section-label'));
    expect(heads.map((head) => head.textContent?.trim())).toEqual([
      'GLOBAL IMPORTS',
      'https://lutzleonhardt.de/frankenstein-meeting-room/',
    ]);
    expect(el.querySelectorAll('.map-row')).toHaveLength(29);
    expect(el.querySelectorAll('.row-sri')).toHaveLength(29);

    const ownerChip = el.querySelector<HTMLElement>('.section-owner .chip-host')!;
    expect(ownerChip.textContent).toBe('host');
    expect(ownerChip.title).toBe(NF_HOST);
    expect(el.textContent).not.toContain(NF_HOST);
    const ownerLink = el.querySelector<HTMLElement>('.section-owner .chip-link')!;
    expect(ownerLink.title).toContain('scope-url identity');

    // T7.7-AC-02/-AC-04: identity dots from the one sorted-name lookup —
    // whiteboard keeps its slot (identical to Packages and Remotes); the
    // host chip never carries a dot.
    const whiteboardChip = Array.from(
      el.querySelectorAll<HTMLElement>('.cell-attr .chip-remote'),
    ).find((chip) => chip.textContent === 'whiteboard')!;
    expect(whiteboardChip.querySelector('.dot')?.classList.contains('dot-2')).toBe(true);
    expect(ownerChip.querySelector('.dot')).toBeNull();

    // Column discipline: every section keeps the same four columns; the
    // trailing column is the qualified 'resolution' channel — the
    // unqualified 'served by' header is gone.
    const tables = Array.from(el.querySelectorAll<HTMLTableElement>('.import-table'));
    const headersOf = (table: HTMLTableElement) =>
      Array.from(table.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headersOf(tables[0])).toEqual(['specifier', 'target', 'SRI', 'resolution']);
    expect(headersOf(tables[1])).toEqual(['specifier', 'target', 'SRI', 'resolution']);

    // Targets render relative to the page base; the verbatim URL is the
    // tooltip evidence.
    const reactTarget = Array.from(el.querySelectorAll<HTMLElement>('.target-text')).find(
      (target) => target.textContent === 'whiteboard/react.QYXZqQxJ1j.js',
    )!;
    expect(reactTarget.title).toBe(
      'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/react.QYXZqQxJ1j.js',
    );
  });

  // T9-AC-05/XC-03: package and remote cross-link hrefs.
  it('links package rows to /packages and annotation chips to /remotes', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(el.querySelectorAll<HTMLAnchorElement>('.map-row a')).map((anchor) =>
      decodeURIComponent(anchor.getAttribute('href') ?? ''),
    );

    expect(hrefs).toContain('/packages?select=__GLOBAL__|@angular/common');
    expect(hrefs).toContain(`/remotes?select=${NF_HOST}`);
    expect(hrefs).toContain('/remotes?select=whiteboard');

    const chunkRow = rowByText(el, '@nf-internal/chunk-WW26EZ22');
    const bundleLink = chunkRow.querySelector<HTMLAnchorElement>('.note-link')!;
    expect(bundleLink.textContent?.trim()).toBe('browser-angular_common');
    expect(bundleLink.title).toContain('recorded chunk file of host');
    expect(decodeURIComponent(bundleLink.getAttribute('href') ?? '')).toBe(
      `/remotes?select=${NF_HOST}`,
    );
  });

  // T9-AC-01 (DOM half): both consumer claims and the one exact source
  // chip render on the one co-declared row.
  it('renders both consumer claims of the co-declared row with its one source', async () => {
    const fixture = await createView({ fixture: 'co-declared-share' });
    const el = fixture.nativeElement as HTMLElement;
    const row = rowByText(el, '@nf-lab/conflict-lib');

    const sourceChip = row.querySelector<HTMLElement>('.cell-attr > .chip-link .chip')!;
    expect(sourceChip.textContent).toBe('mfe1');

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
  });

  // T9-AC-03 (DOM half): the anchor stays visible and qualified on the
  // consumer scope row.
  it('renders the pooling anchor qualified on the consumer scope row', async () => {
    const fixture = await createView({ fixture: 'pooling-anchor' });
    const el = fixture.nativeElement as HTMLElement;
    const scopeTables = Array.from(el.querySelectorAll<HTMLElement>('.map-section')).filter(
      (section) => section.querySelector('.section-label.mono') !== null,
    );
    expect(scopeTables.length).toBe(2);
    const mfe2Row = scopeTables[1].querySelector<HTMLElement>('.map-row')!;
    expect(mfe2Row.querySelector('.cell-attr > .chip-link .chip')?.textContent).toBe('mfe1');
    expect(mfe2Row.querySelector('.row-qualifier')?.textContent?.trim()).toBe('explicit anchor');
    expect(mfe2Row.querySelector('.claim-state')?.textContent?.trim()).toBe('anchored');
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
      expect(row.querySelector('.cell-attr .chip')).toBeNull();
      const bundle = row.querySelector<HTMLElement>('.row-bundle')!;
      expect(bundle.textContent).toContain('browser-shared');
      expect(bundle.querySelector('.row-qualifier')?.textContent?.trim()).toBe('source-only');
      expect(bundle.title).toContain('no registered chunk group backs it');
    }
  });

  // T9-AC-03 (DOM half, SEEDED): honest outcomes render — ambiguity,
  // unattributable, blocked, shared scope identity; no guessed owner.
  it('renders ambiguous, unattributable, blocked, and shared-scope outcomes honestly', async () => {
    const fixture = await createView({ fixture: null, snapshot: SEEDED_HONEST_OUTCOMES });
    const el = fixture.nativeElement as HTMLElement;

    const cdnRow = rowByText(el, 'lodash');
    expect(cdnRow.querySelector('.cell-attr > .chip-link')).toBeNull();
    const cdnQualifier = cdnRow.querySelector<HTMLElement>('.row-qualifier')!;
    expect(cdnQualifier.textContent?.trim()).toBe('unattributable');
    expect(cdnQualifier.title).toContain('CDN or foreign origin');

    const ambiguousRow = rowByText(el, 'vendor/lib.js');
    expect(ambiguousRow.querySelector('.cell-attr > .chip-link')).toBeNull();
    expect(ambiguousRow.querySelector('.row-qualifier')?.textContent?.trim()).toBe(
      'ambiguous source',
    );

    const blockedRow = rowByText(el, 'util/');
    const blocked = blockedRow.querySelector<HTMLElement>('.row-blocked')!;
    expect(blocked.textContent).toBe('blocked');
    expect(blocked.title).toContain('prefix-target-missing-trailing-slash');

    // The scope two remotes register names both — an identity, not an
    // election, so no ambiguous badge and no single owner.
    const owner = el.querySelector<HTMLElement>('.section-owner')!;
    expect(Array.from(owner.querySelectorAll('.chip')).map((chip) => chip.textContent)).toEqual([
      'team-a',
      'team-b',
    ]);
    expect(owner.title).toContain('scope-url identity');
  });

  // T9-AC-05: the honesty caption renders verbatim on populated AND empty
  // captures; mapMode 'none' renders the honest empty state.
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
      const text = el.textContent ?? '';
      expect(text).not.toContain('served by');
      expect(text).not.toMatch(/\bloaded\b/);
      // Tooltips carry the grounded notes — sweep them for the banned
      // unqualified claim as well.
      for (const titled of Array.from(el.querySelectorAll<HTMLElement>('[title]'))) {
        expect(titled.title).not.toContain('served by');
      }
    }
  });
});
