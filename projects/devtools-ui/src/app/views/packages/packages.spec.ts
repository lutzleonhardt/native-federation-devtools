/**
 * Packages view specs — the component half of T10-AC-08 (template renders
 * vm rows only; UI state wiring) plus DOM-level checks of the flat-list
 * rework, the wording rules, and cross-link hrefs (XC-03).
 */
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import {
  FIXTURES,
  FixtureId,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { PackagesView } from './packages';

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
    imports: [PackagesView],
    providers: [
      provideRouter([]),
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
  const fixture = TestBed.createComponent(PackagesView);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

const CONFLICT_LIB = '__GLOBAL__|@nf-lab/conflict-lib';

describe('PackagesView', () => {
  // T10-AC-04 (DOM half): a FLAT leaf list — every package is one row,
  // nothing expands (negotiation lives in the detail pane).
  it('renders one flat leaf row per (scope, package) of the live fixture', async () => {
    const fixture = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.tree-row')).toHaveLength(20);
    expect(el.querySelectorAll('.twisty')).toHaveLength(0);
    // The __GLOBAL__ sentinel reads as 'global'; verbatim stays in the tooltip.
    const scopeName = el.querySelector<HTMLElement>('.scope-name')!;
    expect(scopeName.textContent).toBe('global');
    expect(scopeName.title).toBe('__GLOBAL__');
    expect(el.textContent).not.toContain('__GLOBAL__');
    // Host-provided packages carry the quiet host chip, sentinel as tooltip.
    const hostChips = el.querySelectorAll<HTMLElement>('.tree-row .chip-host');
    expect(hostChips.length).toBeGreaterThan(0);
    expect(hostChips[0].textContent).toBe('host');
    expect(hostChips[0].title).toBe('__NF-HOST__');
    // Linked secondaries render the glyph, no visible rule chip.
    expect(el.querySelectorAll('.linked-glyph').length).toBeGreaterThan(0);
    expect(el.textContent).not.toContain('name-derived');
  });

  // T10-AC-01 (DOM half, amended by T10.5): the clean election carries NO
  // warning badge; the detail pane keeps the skip participant intact with
  // the arrow to the winner's file; the winner stays quiet.
  it('renders skip arrows in the detail pane while the winner stays quiet', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    // Only one version is mapped — declared-only multiplicity never warns.
    expect(el.querySelector('.pkg-conflict')).toBeNull();
    expect(
      Array.from(el.querySelectorAll<HTMLElement>('.pkg-versions .pkg-version')).map(
        (version) => version.textContent,
      ),
    ).toEqual(['2.0.0']);
    // The row tail shows providers as chips; the skip-only declarer
    // collapses to "+1" with names + verbatim action in the tooltip.
    const tailChips = Array.from(el.querySelectorAll('.tree-row .pkg-tail .chip'));
    expect(tailChips.map((chip) => chip.textContent)).toEqual(['mfe2']);
    const count = el.querySelector<HTMLElement>('.pkg-count')!;
    expect(count.textContent).toBe('+1');
    expect(count.title).toBe('also declared by: mfe1 (skip)');

    const arrows = el.querySelectorAll('.pkg-detail .arrow');
    expect(arrows).toHaveLength(1);
    expect(arrows[0].textContent).toContain('_nf_lab_conflict_lib.jvcc6K1csg.js');
    expect(arrows[0].querySelector('.arrow-provider')?.textContent).toBe('mfe2');

    // T10.5: the glyph legend names all three shapes, notes one hover away.
    const legendItems = Array.from(
      el.querySelectorAll<HTMLElement>('.glyph-legend .legend-item'),
    );
    expect(legendItems.map((item) => item.textContent?.trim())).toEqual([
      '● share',
      '◆ scope',
      '○ skip',
    ]);
    expect(legendItems[0].title).toContain('version election');
  });

  // T10-AC-07 (DOM half, amended by T10.5): the Conflicts filter keys on
  // mapped multiplicity — a clean election narrows to the honest empty note.
  it('narrows the clean self-fill capture to the empty note under Conflicts', async () => {
    const fixture = await createView({ fixture: 'self-fill' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.tree-row')).toHaveLength(2);

    const conflictsButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.filter-button')).find(
      (button) => button.textContent?.includes('Conflicts'),
    )!;
    expect(conflictsButton.textContent?.trim()).toBe('Conflicts (0)');
    conflictsButton.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.tree-row')).toHaveLength(0);
    expect(el.textContent).toContain('no version conflicts in this capture');
  });

  // T10.5: the badge and the row versions speak about the same set — the
  // mapped copies; the scoped second copy renders muted with its claim.
  it('flags mapped multiplicity with the badge and the muted scoped copy', async () => {
    const fixture = await createView({ fixture: 'strict-split' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.pkg-conflict')?.textContent).toBe('⚠ 2 versions mapped');
    const versions = Array.from(
      el.querySelectorAll<HTMLElement>('.pkg-versions .pkg-version'),
    );
    expect(versions.map((version) => version.textContent)).toEqual(['2.0.0', '1.0.0']);
    expect(versions[0].classList.contains('pkg-version-muted')).toBe(false);
    expect(versions[1].classList.contains('pkg-version-muted')).toBe(true);
    expect(versions[1].title).toBe('own copy of mfe3 (scope)');

    const conflictsButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.filter-button')).find(
      (button) => button.textContent?.includes('Conflicts'),
    )!;
    expect(conflictsButton.textContent?.trim()).toBe('Conflicts (1)');
    conflictsButton.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.tree-row')).toHaveLength(1);
  });

  // T10-AC-06 (DOM half): the linked sibling carries its association as a
  // tooltip on the name, not as a visible chip.
  it('renders the linked sibling with a name tooltip instead of a chip', async () => {
    const fixture = await createView({ fixture: 'self-fill' });
    const el = fixture.nativeElement as HTMLElement;

    const names = Array.from(el.querySelectorAll<HTMLElement>('.pkg-name'));
    expect(names.map((name) => name.textContent)).toEqual(['@nf-lab/conflict-lib', '/extra']);
    expect(names[1].title).toBe(
      'secondary entry of @nf-lab/conflict-lib — rule: name-derived',
    );
    expect(names[0].hasAttribute('title')).toBe(false);
  });

  // Cross-link convention (XC-03): the select query param seeds the
  // selection; participant and file links carry select payloads.
  it('seeds the selection from the select param and renders cross-links', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.detail-name')?.textContent).toBe('@nf-lab/conflict-lib');

    const hrefs = Array.from(el.querySelectorAll<HTMLAnchorElement>('.pkg-detail a')).map(
      (anchor) => decodeURIComponent(anchor.getAttribute('href') ?? ''),
    );
    expect(hrefs).toContain('/remotes?select=mfe2');
    expect(hrefs).toContain('/remotes?select=mfe1');
    expect(hrefs.some((href) => href.includes('/import-map?select=@nf-lab/conflict-lib'))).toBe(
      true,
    );
    // The participant chips themselves are the /remotes links.
    expect(el.querySelectorAll('.pkg-detail a.chip-link .chip').length).toBeGreaterThan(0);
  });

  // T10.5: scope surfaces name their config origin — shareScope for named
  // scopes, the default note for __GLOBAL__, strictVersion for the marker.
  it('names the config origin of scopes and the strict marker in tooltips', async () => {
    const strictFixture = await createView({
      fixture: 'strict-scope',
      select: 'strict|@nf-lab/conflict-lib',
    });
    const strictEl = strictFixture.nativeElement as HTMLElement;
    expect(strictEl.querySelector<HTMLElement>('.pkg-scope')?.title).toBe(
      'share scope — configured via shareScope: strict',
    );
    expect(strictEl.querySelector<HTMLElement>('.detail-strict')?.title).toContain(
      "shareScope: 'strict'",
    );
    expect(strictEl.querySelector<HTMLElement>('.detail-scope .mono')?.title).toBe(
      'configured via shareScope: strict',
    );
  });

  it('marks the global scope as the unconfigured default in the detail tooltip', async () => {
    const fixture = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector<HTMLElement>('.detail-scope .mono')?.title).toBe(
      '__GLOBAL__ — the default share scope (no shareScope configured)',
    );
  });

  it('selects a package on row click', async () => {
    const fixture = await createView({ fixture: 'clean-skip' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detail-name')).toBeNull();

    el.querySelector<HTMLElement>('.tree-row')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.detail-name')?.textContent).toBe('@nf-lab/conflict-lib');
  });

  // Wording rules: "mapped" / "loaded on demand", never bare "loaded";
  // "resolves to", never "uses" (arrow aria-labels included).
  it('speaks the fixed vocabulary across list and detail', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|@angular/common',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toMatch(/loaded\s+on\s+demand/);
    expect(el.textContent).not.toMatch(/\buses\b/);
    expect(el.textContent).not.toMatch(/\bloaded\b(?!\s+on\s+demand)/);
    for (const arrow of el.querySelectorAll('.arrow')) {
      expect(arrow.getAttribute('aria-label')).toMatch(/^(resolves to|resolution not derived)/);
    }
  });

  // Winner-less multi-share: the no-winner note renders and every share
  // copy states its own-copy claim (never an interpreted winner).
  it('renders the no-winner note with own-copy arrows for multi-share packages', async () => {
    const fixture = await createView({
      fixture: 'synthetic-multi-version',
      select: '__GLOBAL__|ui-lib',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.negotiation-note')?.textContent).toBe(
      'no single elected version — 2 versions are declared share',
    );
    expect(el.querySelectorAll('.pkg-detail .arrow-own')).toHaveLength(2);
  });

  it('renders an honest observation when no snapshot is captured', async () => {
    const fixture = await createView({ fixture: null });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('no captured snapshot to render');
    expect(el.querySelector('.tree-row')).toBeNull();
  });
});
