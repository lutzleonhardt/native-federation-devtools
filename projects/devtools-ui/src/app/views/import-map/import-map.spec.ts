/**
 * Import Map view specs — the component half of T12 (template renders vm
 * rows only; XC-06):
 *  - T12-AC-01: live sections render in map order with the owning-remote
 *    chip on the scope section; SRI markers per row.
 *  - T12-AC-02: chunk rows link their owning bundle to /remotes, package
 *    rows link to /packages (XC-03 hrefs).
 *  - T12-AC-03: honesty caption verbatim; mapMode 'none' empty state.
 *  - T12-AC-04 (DOM half, SEEDED): ambiguous badge + "unattributable" —
 *    no guessed owner.
 *  - select seeding tolerates the /./ infix; error state stays honest.
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

/** SEEDED page: a CDN target (unattributable) and a scope-prefix tie (ambiguous). */
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
      'team-a': { scopeUrl: './team/app/', exposes: [], integrity: {} },
      'team-b': { scopeUrl: './team/app/', exposes: [], integrity: {} },
      [NF_HOST]: { scopeUrl: './', exposes: [], integrity: {} },
    },
    scopedExternals: {},
    sharedExternals: {},
    sharedChunks: {},
    generation: 'unknown',
  },
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap',
        parsed: true,
        importCount: 1,
        scopeCount: 1,
        imports: [{ specifier: 'lodash', target: 'https://cdn.example/lodash.js' }],
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

describe('ImportMapView', () => {
  // T12-AC-01 (DOM half): sections in map order, owner chip, SRI markers;
  // sentinels never as visible text.
  it('renders the live sections in map order with the owning-remote chip', async () => {
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

    // T7.7-AC-02/-AC-04: identity dots from the one sorted-name lookup —
    // whiteboard keeps slot 2 (identical to Packages and Remotes); the host
    // chip never carries a dot.
    const whiteboardChip = Array.from(
      el.querySelectorAll<HTMLElement>('.cell-attr .chip-remote'),
    ).find((chip) => chip.textContent === 'whiteboard')!;
    expect(whiteboardChip.querySelector('.dot')?.classList.contains('dot-2')).toBe(true);
    expect(ownerChip.querySelector('.dot')).toBeNull();

    // Column discipline: the global table carries the provider column (no
    // norm to be quiet against); the owned scope section drops it — the
    // header claim suffices — and gains the bundle column instead.
    const tables = Array.from(el.querySelectorAll<HTMLTableElement>('.import-table'));
    const headersOf = (table: HTMLTableElement) =>
      Array.from(table.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headersOf(tables[0])).toEqual(['specifier', 'target', 'SRI', 'served by']);
    expect(headersOf(tables[1])).toEqual(['specifier', 'target', 'SRI', 'bundle']);

    // Targets render relative to the page base; the verbatim URL is the
    // tooltip evidence.
    const reactTarget = Array.from(el.querySelectorAll<HTMLElement>('.target-text')).find(
      (target) => target.textContent === 'whiteboard/react.QYXZqQxJ1j.js',
    )!;
    expect(reactTarget.title).toBe(
      'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/react.QYXZqQxJ1j.js',
    );
  });

  // T12-AC-02 (DOM half): package and bundle cross-link hrefs (XC-03).
  it('links package rows to /packages and chunk rows to their owning remote', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(el.querySelectorAll<HTMLAnchorElement>('.map-row a')).map((anchor) =>
      decodeURIComponent(anchor.getAttribute('href') ?? ''),
    );

    expect(hrefs).toContain('/packages?select=__GLOBAL__|@angular/common');
    expect(hrefs).toContain(`/remotes?select=${NF_HOST}`);
    expect(hrefs).toContain('/remotes?select=whiteboard');

    const chunkRow = Array.from(el.querySelectorAll<HTMLElement>('.map-row')).find((row) =>
      row.textContent?.includes('@nf-internal/chunk-WW26EZ22'),
    )!;
    const bundleLink = chunkRow.querySelector<HTMLAnchorElement>('.note-link')!;
    expect(bundleLink.textContent?.trim()).toBe('browser-angular_common');
    expect(decodeURIComponent(bundleLink.getAttribute('href') ?? '')).toBe(
      `/remotes?select=${NF_HOST}`,
    );
  });

  // T12-AC-03: the honesty caption renders verbatim on populated AND empty
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

  // T12-AC-04 (DOM half, SEEDED): honest outcomes render — ambiguous badge,
  // "unattributable" text, no guessed owner chips on either row.
  it('renders the ambiguous badge and the unattributable state without a guessed owner', async () => {
    const fixture = await createView({ fixture: null, snapshot: SEEDED_HONEST_OUTCOMES });
    const el = fixture.nativeElement as HTMLElement;

    const rows = Array.from(el.querySelectorAll<HTMLElement>('.map-row'));
    const cdnRow = rows.find((row) => row.textContent?.includes('lodash'))!;
    expect(cdnRow.textContent).toContain('unattributable');
    expect(cdnRow.querySelector('.chip')).toBeNull();

    const tiedRow = rows.find((row) => row.textContent?.includes('shared'))!;
    const badge = tiedRow.querySelector<HTMLElement>('nf-state-badge .badge-ambiguous')!;
    expect(badge.textContent).toBe('ambiguous');
    expect(badge.title).toContain('team-a, team-b, host');
    expect(tiedRow.querySelector('.chip')).toBeNull();
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
});
