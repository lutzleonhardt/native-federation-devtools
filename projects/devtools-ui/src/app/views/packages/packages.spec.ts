/**
 * Packages view specs — the component half of the T7.5 redesign: templates
 * render vm rows only, UI state wiring (status × participant filter),
 * canonical IDs seed the selection through the Store façade, plus DOM-level
 * checks of the copy-block presentation: deviation-only annotations with
 * grounded tooltips, default qualifiers as tooltip data, per-file SRI, the
 * unresolved bucket, and cross-link hrefs.
 */
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  FIXTURES,
  FixtureId,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { provideParticipantColors } from '../../shared/store/participant-colors-provider';
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
  // Live query params: within-/packages navigation reuses the component and
  // only emits on this observable — the stub must model that.
  const queryParams = new BehaviorSubject<ParamMap>(
    convertToParamMap(options.select === undefined ? {} : { select: options.select }),
  );
  await TestBed.configureTestingModule({
    imports: [PackagesView],
    providers: [
      provideRouter([]),
      // Mirrors the app.config.ts binding — identity-dot pins run against
      // the real store-backed lookup.
      provideParticipantColors(),
      { provide: SNAPSHOT_PROVIDER, useValue: new FixtureSnapshotProvider(options.fixture) },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: queryParams.value },
          queryParamMap: queryParams.asObservable(),
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PackagesView);
  fixture.detectChanges();
  await settle(fixture);
  return { fixture, queryParams };
}

const CONFLICT_LIB = '__GLOBAL__|@nf-lab/conflict-lib';

/** Rendered state-chip labels of the detail pane, DOM order. */
function stateChipsOf(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.pkg-detail .state-chip')).map((chip) =>
    chip.textContent!.trim(),
  );
}

describe('PackagesView', () => {
  // Flat leaf list, reduced to name + resolved versions: no participant
  // chips on rows — the participant axis lives in the filter zone.
  it('renders one minimal flat leaf row per (scope, package) of the live fixture', async () => {
    const { fixture } = await createView({ fixture: 'frankenstein-live' });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.tree-row')).toHaveLength(20);
    expect(el.querySelectorAll('.twisty')).toHaveLength(0);
    // Rows carry no participant chips anymore (T7.5-AC-05).
    expect(el.querySelectorAll('.tree-row .chip')).toHaveLength(0);
    // The __GLOBAL__ sentinel reads as 'global'; verbatim stays in the tooltip.
    const scopeName = el.querySelector<HTMLElement>('.scope-name')!;
    expect(scopeName.textContent).toBe('global');
    expect(scopeName.title).toBe('__GLOBAL__');
    expect(el.textContent).not.toContain('__GLOBAL__');
    // Linked secondaries render the glyph, no visible rule chip.
    expect(el.querySelectorAll('.linked-glyph').length).toBeGreaterThan(0);
    expect(el.textContent).not.toContain('name-derived');

    // T7.7-AC-02 (cross-view witness): the live fixture's filter chips carry
    // the exact slots remotes.spec and import-map.spec pin for these names
    // (mermaid → 1, whiteboard → 2) — same lookup, same fixture, three views.
    const chips = Array.from(el.querySelectorAll<HTMLElement>('.participant-toggle .chip-remote'));
    const chipOf = (name: string) => chips.find((chip) => chip.textContent === name)!;
    expect(chipOf('mermaid').querySelector('.dot')?.classList.contains('dot-1')).toBe(true);
    expect(chipOf('whiteboard').querySelector('.dot')?.classList.contains('dot-2')).toBe(true);
  });

  // T7.5-AC-05: the participant filter renders every involved participant
  // as a single-select chip toggle and combines with the status filter.
  it('filters by participant via single-select chips (on / off / switch)', async () => {
    const { fixture } = await createView({ fixture: 'pooling-anchor' });
    const el = fixture.nativeElement as HTMLElement;

    const toggles = Array.from(el.querySelectorAll<HTMLButtonElement>('.participant-toggle'));
    expect(toggles.map((toggle) => toggle.textContent!.trim())).toEqual(['host', 'mfe1', 'mfe2']);
    const hostToggle = toggles[0];
    expect(hostToggle.querySelector<HTMLElement>('.chip-host')?.title).toBe('__NF-HOST__');
    expect(el.querySelectorAll('.tree-row')).toHaveLength(2);

    // T7.7-AC-02/-AC-04: identity dots from the one sorted-name lookup
    // (mfe1 → slot 1, mfe2 → slot 2); the host chip never carries a dot.
    expect(toggles[1].querySelector('.chip .dot')?.classList.contains('dot-1')).toBe(true);
    expect(toggles[2].querySelector('.chip .dot')?.classList.contains('dot-2')).toBe(true);
    expect(hostToggle.querySelector('.dot')).toBeNull();

    // T7.6-AC-01: buttons + chips form one left filter zone with a visible
    // divider between them; the scopes summary sits outside the zone and is
    // pushed to the right edge via its auto margin.
    const zone = el.querySelector<HTMLElement>('.filter-zone')!;
    expect(zone.querySelector('.filter-group')).not.toBeNull();
    expect(zone.querySelector('.participant-filter')).not.toBeNull();
    expect(zone.querySelector('.scopes-summary')).toBeNull();
    expect(getComputedStyle(el.querySelector('.participant-filter')!).borderLeftWidth).toBe('1px');
    expect(getComputedStyle(el.querySelector('.scopes-summary')!).marginLeft).toBe('auto');

    // on: narrow to the packages the host is involved in
    hostToggle.click();
    fixture.detectChanges();
    expect(hostToggle.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelectorAll('.tree-row')).toHaveLength(1);

    // switch: another chip replaces the selection
    toggles[2].click();
    fixture.detectChanges();
    expect(hostToggle.getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelectorAll('.tree-row')).toHaveLength(2);

    // off: clicking the active chip clears the filter
    toggles[2].click();
    fixture.detectChanges();
    expect(toggles[2].getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelectorAll('.tree-row')).toHaveLength(2);
  });

  // T7.5-AC-01 (DOM half): one copy block, none of the removed sections,
  // default qualifiers only in tooltips, per-file SRI, nested chunk files.
  it('renders the signals package as one copy block without the legacy sections', async () => {
    const { fixture } = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|@angular/core/primitives/signals',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.copy-block')).toHaveLength(1);
    // The five legacy sections are gone — no headings render at all here.
    expect(el.querySelectorAll('.pkg-detail h3')).toHaveLength(0);
    for (const heading of ['Resolution', 'Negotiation', 'Resolved copies', 'Integrity']) {
      expect(el.querySelector('.pkg-detail')!.textContent).not.toContain(heading);
    }
    // Header: tag · shared · from [host]; default qualifiers as tooltips.
    const head = el.querySelector<HTMLElement>('.copy-head')!;
    expect(head.querySelector('.copy-tag')?.textContent).toBe('21.2.12');
    expect(head.querySelector('.copy-disposition')?.textContent).toBe('shared');
    expect(head.querySelector<HTMLElement>('.copy-disposition')?.title).toContain(
      'ordinary-shared',
    );
    // T7.6-AC-03: the connective reads 'from'; the qualifier stays tooltip data.
    expect(head.querySelector('.source-word')?.textContent).toBe('from');
    expect(head.querySelector<HTMLElement>('.source-word')?.title).toContain('exact target source');
    expect(el.querySelector('.pkg-detail')!.textContent).not.toContain('exact target source');
    expect(el.querySelector('.pkg-detail')!.textContent).not.toContain('ordinary-shared');
    // File line: name, mapped cross-link, SRI marker.
    const fileLine = el.querySelector<HTMLElement>('.file-line')!;
    expect(fileLine.querySelector('.file-name')?.textContent).toBe(
      '_angular_core_primitives_signals.ePwPWbaXlE.js',
    );
    expect(fileLine.querySelector('.file-sri')?.textContent).toBe('SRI ✓');
    // Consumer row: chip + range + STRICT, no state chips (happy path).
    const consumer = el.querySelector<HTMLElement>('.consumer-row')!;
    expect(consumer.querySelector('.chip')?.textContent).toBe('host');
    expect(consumer.querySelector('.consumer-declared')?.textContent).toBe('^21.2.0');
    expect(consumer.querySelector('.consumer-strict')?.textContent).toBe('STRICT');
    expect(stateChipsOf(el)).toEqual([]);
    // T7.6-AC-04: consumers and chunks sit under group labels; file list,
    // both labels, and the chunk claims are direct siblings under the block
    // (one CHUNKS label per block, bundle heads as rows beneath).
    const block = el.querySelector<HTMLElement>('.copy-block')!;
    expect(
      Array.from(block.querySelectorAll(':scope > .group-label')).map((label) => label.textContent),
    ).toEqual(['files', 'declared by', 'chunks']);
    expect(block.querySelector(':scope > .file-list')).not.toBeNull();
    expect(block.querySelector(':scope > .chunk-claim')).not.toBeNull();
    expect(block.querySelector('.chunk-claim .group-label')).toBeNull();
    // The arrow glyph is gone — 'resolves to' stays participant-row kit
    // vocabulary and does not leak into the copy block.
    expect(block.textContent).not.toContain('→');
    // T7.6-AC-05: STRICT is a configuration fact — muted like the declared
    // range, never warning-colored.
    expect(getComputedStyle(consumer.querySelector('.consumer-strict')!).color).toBe(
      getComputedStyle(consumer.querySelector('.consumer-declared')!).color,
    );
    // Chunks nest inside the block: five files, unqualified (mapped-source).
    expect(el.querySelectorAll('.copy-block .chunk-item')).toHaveLength(5);
    expect(el.querySelector('.chunk-status')).toBeNull();
    expect(el.querySelector<HTMLElement>('.chunk-list')?.title).toContain('available for loading');
  });

  // T7.5-AC-02 (DOM half): skip renders as a grounded row annotation; the
  // absent SRI stays a quiet, visible observation.
  it('renders the clean-skip block with the skipped-own annotation and no skip section', async () => {
    const { fixture } = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.copy-block')).toHaveLength(1);
    expect(stateChipsOf(el)).toEqual(['skipped own 1.0.0']);
    const skipChip = el.querySelector<HTMLElement>('.pkg-detail .state-chip')!;
    expect(skipChip.title).toContain('registered with action skip');
    expect(el.querySelector('.file-sri-missing')?.textContent).toBe('no SRI');
    // No glyph legend, no action glyphs — the annotation is the trace.
    expect(el.querySelector('.glyph-legend')).toBeNull();
    expect(el.textContent).not.toContain('●');
    expect(el.querySelector('.unresolved-heading')).toBeNull();
  });

  // T7.5-AC-03 (DOM half): two blocks under the multiplicity header; the
  // row compresses to the ⚠ glyph with the rule in its tooltip.
  it('renders strict-split as two blocks under the ⚠ 2 resolved versions header', async () => {
    const { fixture } = await createView({ fixture: 'strict-split', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.detail-conflict')?.textContent).toBe('⚠ 2 resolved versions');
    const blocks = Array.from(el.querySelectorAll<HTMLElement>('.copy-block'));
    expect(blocks).toHaveLength(2);
    expect(blocks[0].querySelector('.copy-tag')?.textContent).toBe('2.0.0');
    expect(blocks[0].querySelector('.copy-disposition')?.textContent).toBe('shared');
    expect(blocks[1].querySelector('.copy-tag')?.textContent).toBe('1.0.0');
    expect(blocks[1].querySelector('.copy-disposition')?.textContent).toBe('isolated');
    expect(blocks[1].querySelector('.copy-audience')?.textContent).toBe('mapped only for mfe3');
    expect(stateChipsOf(el)).toEqual(['skipped own 1.0.0', 'kept own copy']);
    // T7.6-AC-04: the sparse isolated block (one consumer row, no chunk
    // list) still renders both group labels.
    expect(
      Array.from(blocks[1].querySelectorAll(':scope > .group-label')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['files', 'declared by', 'chunks']);
    expect(blocks[1].querySelectorAll('.consumer-row')).toHaveLength(1);
    expect(blocks[1].querySelector('.chunk-list')).toBeNull();
    // T7.6-AC-05: the conflict header keeps its warning color; STRICT stays
    // muted alongside the declared range.
    const strictColor = getComputedStyle(el.querySelector('.consumer-strict')!).color;
    expect(strictColor).toBe(getComputedStyle(el.querySelector('.consumer-declared')!).color);
    expect(strictColor).not.toBe(getComputedStyle(el.querySelector('.detail-conflict')!).color);

    // Row: ⚠ glyph with the rule tooltip, non-elected version muted.
    const conflict = el.querySelector<HTMLElement>('.pkg-conflict')!;
    expect(conflict.textContent).toBe('⚠');
    expect(conflict.title).toBe('2 resolved versions — rule: resolved-tag-multiplicity');
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
    const { fixture } = await createView({ fixture: 'self-fill' });
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
    const { fixture } = await createView({ fixture: 'self-fill' });
    const el = fixture.nativeElement as HTMLElement;

    const names = Array.from(el.querySelectorAll<HTMLElement>('.pkg-name'));
    expect(names.map((name) => name.textContent)).toEqual(['@nf-lab/conflict-lib', '/extra']);
    expect(names[1].title).toBe('secondary entry of @nf-lab/conflict-lib — rule: name-derived');
    expect(names[0].hasAttribute('title')).toBe(false);
  });

  // Cross-link convention: the select query param seeds the selection;
  // source chips, consumer chips, and file lines carry select payloads.
  it('seeds the selection from the select param and renders cross-links', async () => {
    const { fixture } = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.detail-name')?.textContent).toContain('@nf-lab/conflict-lib');

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
    const { fixture: strictFixture } = await createView({
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
    // T7.6-AC-02: label and value joined by a colon.
    expect(strictEl.querySelector('.detail-scope')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'share scope: strict',
    );
    // T7.6-AC-05: pinned scope is a configuration fact — muted like the meta
    // line, tooltip verbatim.
    expect(getComputedStyle(strictEl.querySelector('.detail-strict')!).color).toBe(
      getComputedStyle(strictEl.querySelector('.detail-scope')!).color,
    );
  });

  it('marks the global scope as the unconfigured default in the detail tooltip', async () => {
    const { fixture } = await createView({ fixture: 'clean-skip', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector<HTMLElement>('.detail-scope .mono')?.title).toBe(
      '__GLOBAL__ — the default share scope (no shareScope configured)',
    );
    expect(el.querySelector('.detail-scope')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'share scope: global',
    );
  });

  // T7.6-AC-03: the copy-head connective reads 'from' for every disposition;
  // the standalone word 'source' is gone from the copy-block DOM.
  it('reads skip-registration from [mfe1] on the pooling-anchor block', async () => {
    const { fixture } = await createView({ fixture: 'pooling-anchor', select: CONFLICT_LIB });
    const el = fixture.nativeElement as HTMLElement;

    const anchor = Array.from(el.querySelectorAll<HTMLElement>('.copy-block')).find(
      (block) => block.querySelector('.copy-tag')?.textContent === '1.0.0',
    )!;
    expect(anchor.querySelector('.copy-disposition')?.textContent).toBe('skip-registration');
    expect(anchor.querySelector('.copy-head .source-word')?.textContent).toBe('from');
    expect(anchor.querySelector('.copy-head .chip-link .chip')?.textContent).toBe('mfe1');
    // T7.7-AC-02: detail chips read the same lookup — mfe1 keeps palette
    // slot 1, identical to its toolbar chip.
    expect(
      anchor.querySelector('.copy-head .chip-link .chip .dot')?.classList.contains('dot-1'),
    ).toBe(true);
    for (const block of Array.from(el.querySelectorAll<HTMLElement>('.copy-block'))) {
      expect(block.textContent).not.toMatch(/(?<![\w-])source(?![\w-])/);
    }
  });

  it('selects a package on row click', async () => {
    const { fixture } = await createView({ fixture: 'clean-skip' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detail-name')).toBeNull();

    el.querySelector<HTMLElement>('.tree-row')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.detail-name')?.textContent).toContain('@nf-lab/conflict-lib');
  });

  // T7.5-AC-06: the parent cross-link navigates WITHIN /packages, where the
  // router reuses the component — the selection must follow later
  // query-param emissions, not only the creation snapshot.
  it('follows later select query-param emissions (parent link within /packages)', async () => {
    const { fixture, queryParams } = await createView({
      fixture: 'self-fill',
      select: '__GLOBAL__|@nf-lab/conflict-lib/extra',
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detail-name')?.textContent).toContain('/extra');

    queryParams.next(convertToParamMap({ select: CONFLICT_LIB }));
    fixture.detectChanges();
    expect(el.querySelector('.detail-name')?.textContent?.trim()).toBe('@nf-lab/conflict-lib');
  });

  // Wording rules (T7): resolution-honest vocabulary only — "mapped",
  // "available for loading" (as grounding tooltips); never "uses", never
  // implied delivery, never a winner claim.
  it('speaks the resolution-honest vocabulary across list and detail', async () => {
    const { fixture } = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|@angular/common',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.file-mapped').length).toBeGreaterThan(0);
    expect(el.querySelector<HTMLElement>('.chunk-list')?.title).toContain('available for loading');
    expect(el.textContent).not.toMatch(/\buses\b/);
    expect(el.textContent).not.toMatch(/\bloaded\b/);
    expect(el.textContent).not.toMatch(/\bwinner\b/);
    expect(el.textContent).not.toMatch(/\bprovider\b/);
  });

  it('qualifies the source-only bundle claim and claims chunk-list absence', async () => {
    const { fixture } = await createView({
      fixture: 'frankenstein-live',
      select: '__GLOBAL__|tslib',
    });
    const el = fixture.nativeElement as HTMLElement;

    const claim = el.querySelector<HTMLElement>('.chunk-claim')!;
    const status = claim.querySelector<HTMLElement>('.chunk-status')!;
    expect(status.textContent).toBe('source-only');
    expect(status.classList.contains('chunk-status-qualified')).toBe(true);
    expect(status.title).toContain('registers no chunk list');
    expect(claim.querySelector('.chunk-absence')?.textContent).toBe(
      '(no chunk list recorded in this capture)',
    );
    expect(claim.querySelector('.chunk-list')).toBeNull();
  });

  // T7.5-AC-04 (DOM half): zero blocks, the honest no-copies line, and the
  // unresolved bucket with states and offered tags.
  it('renders the honest empty detail with the unresolved bucket', async () => {
    const { fixture } = await createView({
      fixture: 'synthetic-multi-version',
      select: '__GLOBAL__|ui-lib',
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.pkg-no-copy')?.textContent).toBe('no copy');
    expect(el.querySelector('.pkg-conflict')).toBeNull();
    expect(el.querySelectorAll('.copy-block')).toHaveLength(0);
    expect(el.querySelector('.no-copies')?.textContent).toBe('no resolved copies in this capture');
    expect(el.querySelector('.unresolved-heading')?.textContent).toBe('unresolved');
    // The bucket keeps its own heading — no DECLARED BY label (T7.6-AC-04).
    expect(el.querySelector('.unresolved-list .group-label')).toBeNull();
    expect(stateChipsOf(el)).toEqual(['not mapped', 'not mapped']);
    const offered = Array.from(el.querySelectorAll<HTMLElement>('.offered-chip'));
    expect(offered.map((chip) => chip.textContent)).toEqual(['offered 1.2.3', 'offered 2.0.0']);
    expect(offered[0].title.length).toBeGreaterThan(0);
  });

  it('renders an honest observation when no snapshot is captured', async () => {
    const { fixture } = await createView({ fixture: null });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('no captured snapshot to render');
    expect(el.querySelector('.tree-row')).toBeNull();
  });
});
