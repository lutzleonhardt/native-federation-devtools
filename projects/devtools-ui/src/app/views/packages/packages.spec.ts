/**
 * Packages view specs — the component half of T7-AC-05 (templates render vm
 * rows only; UI state wiring; canonical IDs seed the selection through the
 * Store façade) plus DOM-level checks of the canonical claim wording:
 * selected / not selected / anchored states, resolved-tag versions,
 * qualified chunk claims, and cross-link hrefs.
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

/** Rendered state-chip labels of the negotiation, DOM order. */
function stateChipsOf(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.pkg-detail .state-chip')).map((chip) =>
    chip.textContent!.trim(),
  );
}

describe('PackagesView', () => {
  // Flat leaf list preserved: every package is one row, nothing expands
  // (negotiation lives in the detail pane).
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
    // Host-sourced packages carry the quiet host chip, sentinel as tooltip.
    const hostChips = el.querySelectorAll<HTMLElement>('.tree-row .chip-host');
    expect(hostChips.length).toBeGreaterThan(0);
    expect(hostChips[0].textContent).toBe('host');
    expect(hostChips[0].title).toBe('__NF-HOST__');
    // Linked secondaries render the glyph, no visible rule chip.
    expect(el.querySelectorAll('.linked-glyph').length).toBeGreaterThan(0);
    expect(el.textContent).not.toContain('name-derived');
  });

  // T7-AC-01 (DOM half): selected and not-selected declarations stay
  // visible as canonical state chips; the not-selected arrow names the
  // copy's evidenced source, and the row tail claims one source only.
  it('renders selected and not-selected state chips for the co-declared share', async () => {
    const fixture = await createView({ fixture: 'co-declared-share', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    expect(stateChipsOf(el)).toEqual(['selected', 'not selected']);
    // No conflict badge and exactly one resolved version chip.
    expect(el.querySelector('.pkg-conflict')).toBeNull();
    expect(
      Array.from(el.querySelectorAll<HTMLElement>('.pkg-versions .pkg-version')).map(
        (version) => version.textContent,
      ),
    ).toEqual(['1.0.0']);
    // The row tail: mfe1 sources the copy; mfe2 collapses to "+1" with its
    // claim state in the tooltip — never a second provider chip.
    const tailChips = Array.from(el.querySelectorAll('.tree-row .pkg-tail .chip'));
    expect(tailChips.map((chip) => chip.textContent)).toEqual(['mfe1']);
    const count = el.querySelector<HTMLElement>('.pkg-count')!;
    expect(count.textContent).toBe('+1');
    expect(count.title).toBe('also resolves here: mfe2 (not-selected)');
    // The not-selected arrow points at the resolved target of the binding
    // and names its evidenced SOURCE — never a provider claim.
    const arrows = el.querySelectorAll('.pkg-detail .arrow');
    expect(arrows).toHaveLength(1);
    expect(arrows[0].textContent).toContain('_nf_lab_conflict_lib.JF7uEdSVsN.js');
    expect(arrows[0].querySelector('.arrow-provider')?.textContent).toBe('mfe1');
    expect(arrows[0].getAttribute('aria-label')).toBe(
      'resolves to _nf_lab_conflict_lib.JF7uEdSVsN.js (source: mfe1)',
    );
  });

  // T7-AC-02 (DOM half): the canonical four counts render as named facts.
  it('renders the canonical resolution counts as named facts', async () => {
    const fixture = await createView({ fixture: 'strict-split', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    const facts = new Map(
      Array.from(el.querySelectorAll('.detail-kv .kv-row')).map((row) => [
        row.querySelector('dt')!.textContent!.trim(),
        row.querySelector('dd')!.textContent!.trim(),
      ]),
    );
    expect(facts.get('registrations')).toBe('3');
    expect(facts.get('declared tags')).toBe('2');
    expect(facts.get('resolved copies')).toBe('2');
    expect(facts.get('resolved tags')).toBe('2');
    expect(facts.get('declarations')).toBe('3');
    expect(facts.has('unknown tags')).toBe(false);
  });

  // T7-AC-03 (DOM half): resolved-tag multiplicity flags; the isolated
  // second copy renders muted with its own-copy claim.
  it('flags resolved multiplicity with the badge and the muted own copy', async () => {
    const fixture = await createView({ fixture: 'strict-split' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.pkg-conflict')?.textContent).toBe('⚠ 2 resolved versions');
    const versions = Array.from(el.querySelectorAll<HTMLElement>('.pkg-versions .pkg-version'));
    expect(versions.map((version) => version.textContent)).toEqual(['2.0.0', '1.0.0']);
    expect(versions[0].classList.contains('pkg-version-muted')).toBe(false);
    expect(versions[1].classList.contains('pkg-version-muted')).toBe(true);
    expect(versions[1].title).toBe('own copy of mfe3 (scope)');

    const conflictsButton = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.filter-button'),
    ).find((button) => button.textContent?.includes('Conflicts'))!;
    expect(conflictsButton.textContent?.trim()).toBe('Conflicts (1)');
    conflictsButton.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.tree-row')).toHaveLength(1);
  });

  it('narrows the clean self-fill capture to the empty note under Conflicts', async () => {
    const fixture = await createView({ fixture: 'self-fill' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.tree-row')).toHaveLength(2);

    const conflictsButton = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.filter-button'),
    ).find((button) => button.textContent?.includes('Conflicts'))!;
    expect(conflictsButton.textContent?.trim()).toBe('Conflicts (0)');
    conflictsButton.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.tree-row')).toHaveLength(0);
    expect(el.textContent).toContain('no version conflicts in this capture');
  });

  // Linked sibling carries its association as a tooltip on the name.
  it('renders the linked sibling with a name tooltip instead of a chip', async () => {
    const fixture = await createView({ fixture: 'self-fill' });
    const el = fixture.nativeElement as HTMLElement;

    const names = Array.from(el.querySelectorAll<HTMLElement>('.pkg-name'));
    expect(names.map((name) => name.textContent)).toEqual(['@nf-lab/conflict-lib', '/extra']);
    expect(names[1].title).toBe('secondary entry of @nf-lab/conflict-lib — rule: name-derived');
    expect(names[0].hasAttribute('title')).toBe(false);
  });

  // Cross-link convention: the select query param seeds the selection;
  // participant, source, and entrypoint links carry select payloads.
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

  // Wording rules (T7): resolution-honest vocabulary only — "resolves to",
  // "available for loading"; never "uses", never implied delivery.
  it('speaks the resolution-honest vocabulary across list and detail', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|@angular/common',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toMatch(/available\s+for\s+loading/);
    expect(el.textContent).not.toMatch(/\buses\b/);
    expect(el.textContent).not.toMatch(/\bloaded\b/);
    expect(el.textContent).not.toMatch(/\bwinner\b/);
    for (const arrow of el.querySelectorAll('.pkg-detail .arrow')) {
      expect(arrow.getAttribute('aria-label')).toMatch(/^(resolves to|resolution not derived)/);
    }
  });

  // T7-AC-04 (DOM half): a mapped-source claim renders its chunk file and
  // count; a source-only claim renders the shared absence wording and stays
  // visibly qualified — never a zero masquerading as a count.
  it('renders the mapped-source bundle claim with its chunk file', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|@angular/common',
    });
    const el = fixture.nativeElement as HTMLElement;

    const claim = el.querySelector<HTMLElement>('.chunk-claim')!;
    expect(claim.querySelector('.chunk-claim-head .mono')?.textContent).toBe(
      'browser-angular_common',
    );
    expect(claim.querySelector('.chunk-status')?.textContent).toBe('mapped-source');
    expect(claim.querySelector('.chunk-files')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 chunk file · available for loading',
    );
    expect(claim.querySelector('.chunk-list .mono')?.textContent).toBe('chunk-WW26EZ22.js');
  });

  it('qualifies the source-only bundle claim and claims chunk-list absence', async () => {
    const fixture = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|tslib',
    });
    const el = fixture.nativeElement as HTMLElement;

    const claim = el.querySelector<HTMLElement>('.chunk-claim')!;
    const status = claim.querySelector<HTMLElement>('.chunk-status')!;
    expect(status.textContent).toBe('source-only');
    expect(status.classList.contains('chunk-status-qualified')).toBe(true);
    expect(status.title).toContain('registers no chunk list');
    expect(claim.querySelector('.chunk-files')?.textContent?.trim()).toBe(
      'no chunk list recorded in this capture',
    );
    expect(claim.querySelector('.chunk-list')).toBeNull();
  });

  // Honest no-copy rendering: declared registrations without any resolved
  // copy state their absence instead of manufacturing mapped versions.
  it('renders the honest no-copy state for the map-less multi-share capture', async () => {
    const fixture = await createView({
      fixture: 'synthetic-multi-version',
      select: '__GLOBAL__|ui-lib',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.pkg-no-copy')?.textContent).toBe('no resolved copies');
    expect(el.querySelector('.pkg-conflict')).toBeNull();
    expect(el.querySelector('.negotiation-note')?.textContent).toBe(
      'declared, but no import-map binding resolves this package in this capture',
    );
    expect(stateChipsOf(el)).toEqual(['not mapped', 'not mapped']);
    expect(el.textContent).toContain('no resolved copies — no bundle evidence to attribute');
  });

  it('renders an honest observation when no snapshot is captured', async () => {
    const fixture = await createView({ fixture: null });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('no captured snapshot to render');
    expect(el.querySelector('.tree-row')).toBeNull();
  });
});
