/**
 * Packages view-model specs — fixture-driven acceptance (T10, after the
 * user-directed flat-list rework; conflict semantics amended by T10.5:
 * the badge keys on MAPPED multiplicity — row versions and badge speak
 * about the same set, declared-only multiplicity is never flagged):
 *  - T10-AC-01 (amended): clean-skip — NO conflict indicator (one mapped
 *    version); the skip participant keeps its arrow to the winner's file
 *    (detail pane).
 *  - T10-AC-02: strict-split — one tag renders distinct skip and scope
 *    negotiation rows; the scope row is labeled isolated and names its
 *    audience.
 *  - T10-AC-03: strict-scope — two share rows, NO conflict indicator,
 *    pinned exact tags (never a declared range).
 *  - T10-AC-04: frankenstein-live — 20 flat package rows; host-provided
 *    detail shows level-'package' chunk data; a whiteboard-served package
 *    states level-'none' explicit absence.
 *  - T10-AC-05: non-dense — level-'remote' bound instead of a silent gap.
 *  - T10-AC-06: self-fill — the `/extra` external renders as a linked
 *    sibling under its parent (name-derived as tooltip data).
 *  - T10-AC-07: Conflicts filter narrows; strict-only scopes summary
 *    renders without `__GLOBAL__`.
 *  - T10-AC-08 (builder half): pure — same inputs, same output; inputs stay
 *    untouched.
 */
import { FIXTURES, NF_HOST } from 'devtools-bridge';

import type { DerivedFederation } from '../../shared/store/derived-model';
import { deriveFederation } from '../../shared/store/derivations';
import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import { buildImportMapVm } from '../import-map/import-map-view-model';
import {
  DetailParticipantVm,
  PackageDetailVm,
  PackageRowVm,
  PackagesUiState,
  PackagesVm,
  buildPackagesVm,
  packageId,
} from './packages-view-model';

function inputsOf(name: keyof typeof FIXTURES): {
  model: FederationModel;
  derived: DerivedFederation;
} {
  const model = ingestSnapshot(FIXTURES[name]);
  return { model, derived: deriveFederation(model) };
}

function vmOf(name: keyof typeof FIXTURES, ui: Partial<PackagesUiState> = {}): PackagesVm {
  const { model, derived } = inputsOf(name);
  return buildPackagesVm(model, derived, { filter: 'all', selectedId: null, ...ui });
}

function packageRows(vm: PackagesVm): PackageRowVm[] {
  return vm.rows.map((row) => row.payload);
}

function participantsOf(detail: PackageDetailVm, action: string): DetailParticipantVm[] {
  return detail.negotiation
    .filter((version) => version.action === action)
    .flatMap((version) => version.participants);
}

const CONFLICT_LIB = packageId('__GLOBAL__', '@nf-lab/conflict-lib');

describe('buildPackagesVm — conflict indicator and skip arrows (T10-AC-01, T10.5)', () => {
  it('keeps the clean-skip package badge-free — the election succeeded', () => {
    const vm = vmOf('clean-skip');
    const [row] = packageRows(vm);

    expect(vm.packageCount).toBe(1);
    // T10.5: only ONE version is mapped — declared-only multiplicity is
    // the mechanism succeeding, never a warning.
    expect(row.conflict).toBeNull();
    expect(vm.conflictCount).toBe(0);
    expect(row.versions).toEqual([{ tag: '2.0.0', muted: false, note: null }]);
    // Chips answer "who provides": the mapped copy only; the skip-only
    // declarer collapses to "+1" with its verbatim action in the tooltip.
    expect(row.providers).toEqual([{ name: 'mfe2', host: false }]);
    expect(row.alsoDeclaredBy).toEqual({
      count: 1,
      tooltip: 'also declared by: mfe1 (skip)',
    });
  });

  it('keeps the skip participant intact with an arrow to the winner file', () => {
    const vm = vmOf('clean-skip', { selectedId: CONFLICT_LIB });

    const [skip] = participantsOf(vm.detail!, 'skip');
    expect(skip.name).toBe('mfe1');
    expect(skip.declared).toEqual({ kind: 'range', range: '>=1.0.0 <3.0.0' });
    expect(skip.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.jvcc6K1csg.js',
      provider: 'mfe2',
    });
    // The winner serves its own copy — the norm stays quiet, no arrow.
    const [winner] = participantsOf(vm.detail!, 'share');
    expect(winner.arrow).toBeNull();
  });
});

describe('buildPackagesVm — strict-split negotiation rows (T10-AC-02)', () => {
  const vm = vmOf('strict-split', { selectedId: CONFLICT_LIB });

  it('renders distinct skip and scope rows for the same tag', () => {
    const sameTag = vm.detail!.negotiation.filter((version) => version.tag === '1.0.0');
    // Store order sorts actions alphabetically within a tag: scope, skip.
    expect(sameTag.map((version) => version.action)).toEqual(['scope', 'skip']);
    // T10.5 glyphs distinguish by shape: ◆ isolated copy, ○ no own copy.
    expect(sameTag.map((version) => version.symbol)).toEqual(['◆', '○']);
  });

  it('flags mapped multiplicity and lists the scoped copy muted (T10.5)', () => {
    const [row] = packageRows(vm);
    // Badge and row versions derive from the same set — the mapped tags.
    expect(row.conflict).toEqual({
      label: '⚠ 2 versions mapped',
      note: 'more than one version mapped in this share scope (rule: mapped-multiplicity)',
    });
    expect(row.versions).toEqual([
      { tag: '2.0.0', muted: false, note: null },
      { tag: '1.0.0', muted: true, note: 'own copy of mfe3 (scope)' },
    ]);
  });

  it('labels the scope row isolated and names its audience', () => {
    const scopeRow = vm.detail!.negotiation.find((version) => version.action === 'scope')!;
    expect(scopeRow.isolated).toEqual({ audience: 'mfe3' });
    // The action itself stays verbatim, never an interpreted motive.
    expect(scopeRow.action).toBe('scope');
    // Only the elected winner is quiet — the scoped copy states its claim.
    expect(scopeRow.participants[0].arrow).toEqual({ kind: 'own' });
    const [share] = participantsOf(vm.detail!, 'share');
    expect(share.arrow).toBeNull();
  });

  it('renders the host winner as arrow provider under its display name', () => {
    const [skip] = participantsOf(vm.detail!, 'skip');
    expect(skip.arrow).toMatchObject({ kind: 'winner', provider: 'host' });
  });

  it('splits the row tail into providers and consumer-only declarers', () => {
    const [row] = packageRows(vm);
    expect(row.providers).toEqual([
      { name: '__NF-HOST__', host: true },
      { name: 'mfe3', host: false },
    ]);
    expect(row.alsoDeclaredBy).toEqual({
      count: 1,
      tooltip: 'also declared by: mfe1 (skip)',
    });
  });
});

describe('buildPackagesVm — strict scope rendering (T10-AC-03)', () => {
  const strictLib = packageId('strict', '@nf-lab/conflict-lib');

  it('renders the strict package without any conflict indicator', () => {
    const vm = vmOf('strict-scope');
    const [row] = packageRows(vm);

    expect(row.conflict).toBeNull();
    expect(vm.conflictCount).toBe(0);
    // No unique winner — every pinned tag lists unmuted (side-by-side by design).
    expect(row.versions).toEqual([
      { tag: '2.0.0', muted: false, note: null },
      { tag: '1.0.0', muted: false, note: null },
    ]);
    expect(row.scopeLabel).toBe('strict');
    expect(row.providers).toEqual([
      { name: 'mfe2', host: false },
      { name: 'mfe1', host: false },
    ]);
    expect(row.alsoDeclaredBy).toBeNull();
  });

  it('declares every strict participant as a pinned exact tag, never a range', () => {
    const vm = vmOf('strict-scope', { selectedId: strictLib });
    const declared = vm.detail!.negotiation.flatMap((version) =>
      version.participants.map((participant) => participant.declared),
    );
    expect(declared).toEqual([
      { kind: 'pinned', tag: '2.0.0' },
      { kind: 'pinned', tag: '1.0.0' },
    ]);
  });

  it('reports no unique providing remote in the strict detail chunk section', () => {
    const vm = vmOf('strict-scope', { selectedId: strictLib });
    expect(vm.detail!.chunks).toBeNull();
    expect(vm.detail!.chunksUnavailable).toBe('no unique providing remote in this share scope');
  });

  it('shares pinned copies side by side without the no-winner note', () => {
    const vm = vmOf('strict-scope', { selectedId: strictLib });
    // Side-by-side is by design here — the pinned-scope chip explains it.
    expect(vm.detail!.negotiationNote).toBeNull();
    const arrows = vm.detail!.negotiation.flatMap((version) =>
      version.participants.map((participant) => participant.arrow),
    );
    expect(arrows).toEqual([{ kind: 'own' }, { kind: 'own' }]);
  });
});

describe('buildPackagesVm — winner-less multi-share (synthetic-multi-version)', () => {
  const uiLib = packageId('__GLOBAL__', 'ui-lib');

  it('states the honest no-winner note and renders both own-copy claims', () => {
    const vm = vmOf('synthetic-multi-version', { selectedId: uiLib });

    // The synthetic fixture pins the doctrine: unresolved ambiguity,
    // never an interpreted winner.
    expect(vm.detail!.negotiationNote).toBe(
      'no single elected version — 2 versions are declared share',
    );
    const arrows = vm.detail!.negotiation.flatMap((version) =>
      version.participants.map((participant) => participant.arrow),
    );
    expect(arrows).toEqual([{ kind: 'own' }, { kind: 'own' }]);

    const [row] = packageRows(vm);
    // Both mapped copies list unmuted (no winner to privilege) and the
    // badge counts the same set (T10.5).
    expect(row.versions).toEqual([
      { tag: '2.0.0', muted: false, note: null },
      { tag: '1.2.3', muted: false, note: null },
    ]);
    expect(row.conflict).toEqual({
      label: '⚠ 2 versions mapped',
      note: 'more than one version mapped in this share scope (rule: mapped-multiplicity)',
    });
    expect(row.providers).toEqual([
      { name: 'chat', host: false },
      { name: 'calendar', host: false },
    ]);
    expect(row.alsoDeclaredBy).toBeNull();
  });
});

describe('buildPackagesVm — live fixture detail (T10-AC-04)', () => {
  const { model, derived } = inputsOf('frankenstein-live');
  const build = (selectedId: string | null) =>
    buildPackagesVm(model, derived, { filter: 'all', selectedId });

  it('lists all 20 packages as flat leaf rows', () => {
    const vm = build(null);
    expect(vm.packageCount).toBe(20);
    expect(packageRows(vm)).toHaveLength(20);
    expect(vm.rows.every((row) => !row.expandable)).toBe(true);
    expect(vm.scopes.reduce((sum, scope) => sum + scope.packageCount, 0)).toBe(20);
  });

  it('marks host-provided packages with the host provider chip data', () => {
    const vm = build(null);
    const common = packageRows(vm).find((row) => row.packageName === '@angular/common')!;
    expect(common.providers).toEqual([{ name: NF_HOST, host: true }]);
    expect(common.alsoDeclaredBy).toBeNull();
  });

  it('shows level-package chunk data for a host-provided package', () => {
    const vm = build(packageId('__GLOBAL__', '@angular/common'));
    expect(vm.detail!.chunks).toEqual({
      level: 'package',
      remote: NF_HOST,
      remoteDisplay: 'host',
      packageEntry: {
        bundleName: 'browser-angular_common',
        files: ['chunk-WW26EZ22.js'],
        fileRows: [
          {
            file: 'chunk-WW26EZ22.js',
            mapped: {
              specifier: '@nf-internal/chunk-WW26EZ22',
              targetUrl:
                'https://lutzleonhardt.de/frankenstein-meeting-room/chunk-WW26EZ22.js',
              hasIntegrity: true,
              select: '@nf-internal/chunk-WW26EZ22',
            },
          },
        ],
        fileClaim: '1 chunk file',
        mappedCount: 1,
      },
      rule: 'bundle-chunk-join',
    });
  });

  // T12: the chunk file's `select` payload is the entry's REAL specifier
  // from the shared chunk-map join — the Import Map view selects exactly
  // that row (cross-view roundtrip; the two views share the join source).
  it('sends a chunk-file select payload the Import Map view resolves to its row', () => {
    const vm = build(packageId('__GLOBAL__', '@angular/common'));
    const chunks = vm.detail!.chunks;
    if (chunks?.level !== 'package' || chunks.packageEntry === null) {
      expect.unreachable('expected level-package chunk data');
    }
    const mapped = chunks.packageEntry.fileRows[0].mapped!;

    const importMapVm = buildImportMapVm(model, derived, { selected: mapped.select });
    const selected = importMapVm.sections
      .flatMap((section) => section.rows)
      .filter((row) => row.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].specifier).toBe(mapped.specifier);
    expect(selected[0].target).toBe(mapped.targetUrl);
    expect(selected[0].chunk?.groupLabel).toBe('browser-angular_common');
  });

  // T11.5-AC-01/02: the chunk-file claim is shared wording with the Remotes
  // detail (`view-conventions.ts`) — a bundle the participant row names but
  // the chunks repository holds no list for claims the absence explicitly,
  // never a zero count.
  it('claims chunk-list absence for no-list bundles instead of zero counts', () => {
    const noListBundles = [
      { packageName: 'tslib', bundleName: 'browser-tslib' },
      { packageName: '@angular/platform-browser', bundleName: 'browser-angular_platform_browser' },
    ];
    for (const { packageName, bundleName } of noListBundles) {
      const vm = build(packageId('__GLOBAL__', packageName));
      expect(vm.detail!.chunks).toMatchObject({
        level: 'package',
        remote: NF_HOST,
        packageEntry: {
          bundleName,
          files: [],
          fileClaim: 'no chunk list recorded in this capture',
        },
      });
    }
  });

  it('states explicit level-none absence for a whiteboard-served package', () => {
    const whiteboardPackage = derived.sharedRowFacts.find(
      (facts) => facts.row.participant === 'whiteboard',
    )!.row;
    const vm = build(packageId(whiteboardPackage.scope, whiteboardPackage.packageName));

    expect(vm.detail!.chunks).toMatchObject({
      level: 'none',
      remote: 'whiteboard',
      rule: 'no-chunk-evidence',
    });
    expect((vm.detail!.chunks as { note: string }).note).toContain(
      'no chunk evidence recorded for whiteboard',
    );
  });
});

describe('buildPackagesVm — non-dense ladder bound (T10-AC-05)', () => {
  it('states the level-remote bound instead of a silent gap', () => {
    const { model, derived } = inputsOf('non-dense');
    const mfe3Package = derived.sharedRowFacts.find(
      (facts) => facts.row.participant === 'mfe3',
    )!.row;
    const vm = buildPackagesVm(model, derived, {
      filter: 'all',
      selectedId: packageId(mfe3Package.scope, mfe3Package.packageName),
    });

    expect(vm.detail!.chunks).toMatchObject({
      level: 'remote',
      remote: 'mfe3',
      note: 'chunks belong to mfe3; package attribution not derivable',
      rule: 'chunk-pseudo-externals',
    });
    expect((vm.detail!.chunks as { groupCount: number }).groupCount).toBeGreaterThan(0);
  });
});

describe('buildPackagesVm — linked sibling subpath rows (T10-AC-06)', () => {
  it('renders /extra as a linked sibling directly under its parent', () => {
    const vm = vmOf('self-fill');
    const extraRow = vm.rows.find(
      (row) => row.id === packageId('__GLOBAL__', '@nf-lab/conflict-lib/extra'),
    )!;
    const payload = extraRow.payload;

    // One level under its parent, directly after the parent's row.
    expect(extraRow.depth).toBe(1);
    expect(vm.rows.indexOf(extraRow)).toBe(1);
    expect(extraRow.expandable).toBe(false);
    expect(payload.displayName).toBe('/extra');
    expect(payload.linked).toEqual({
      parentPackage: '@nf-lab/conflict-lib',
      rule: 'name-derived',
    });
  });

  it('links the subpath detail back to its parent package', () => {
    const extraId = packageId('__GLOBAL__', '@nf-lab/conflict-lib/extra');
    const vm = vmOf('self-fill', { selectedId: extraId });
    expect(vm.detail!.parent).toEqual({
      packageName: '@nf-lab/conflict-lib',
      packageId: CONFLICT_LIB,
      rule: 'name-derived',
    });
  });
});

describe('buildPackagesVm — filter and scopes summary (T10-AC-07, T10.5)', () => {
  it('empties the Conflicts filter when every election succeeded', () => {
    const all = vmOf('self-fill');
    expect(packageRows(all).map((row) => row.packageName)).toEqual([
      '@nf-lab/conflict-lib',
      '@nf-lab/conflict-lib/extra',
    ]);

    // T10.5: the self-fill skip resolves cleanly — no mapped multiplicity,
    // the filter narrows to the honest empty note.
    const conflicts = vmOf('self-fill', { filter: 'conflicts' });
    expect(conflicts.conflictCount).toBe(0);
    expect(conflicts.rows).toEqual([]);
    expect(conflicts.emptyNote).toBe('no version conflicts in this capture');
  });

  it('keeps mapped-multiplicity packages under the Conflicts filter', () => {
    const conflicts = vmOf('strict-split', { filter: 'conflicts' });
    expect(conflicts.conflictCount).toBe(1);
    expect(packageRows(conflicts).map((row) => row.packageName)).toEqual([
      '@nf-lab/conflict-lib',
    ]);
  });

  it('renders a strict-only scopes summary without __GLOBAL__', () => {
    const vm = vmOf('strict-scope');
    expect(vm.scopes).toEqual([{ scope: 'strict', label: 'strict', packageCount: 1 }]);
  });

  it('reads the __GLOBAL__ sentinel as the global label, verbatim preserved', () => {
    const vm = vmOf('clean-skip');
    expect(vm.scopes).toEqual([{ scope: '__GLOBAL__', label: 'global', packageCount: 1 }]);
    const detail = vmOf('clean-skip', { selectedId: CONFLICT_LIB }).detail!;
    expect(detail.scope).toBe('__GLOBAL__');
    expect(detail.scopeDisplay).toBe('global');
  });

  it('yields an honest empty note when the Conflicts filter matches nothing', () => {
    const vm = vmOf('frankenstein-live', { filter: 'conflicts' });
    expect(vm.rows).toEqual([]);
    expect(vm.emptyNote).toBe('no version conflicts in this capture');
  });
});

describe('buildPackagesVm — purity (T10-AC-08)', () => {
  it('is pure: identical inputs produce identical output and stay unmodified', () => {
    const { model, derived } = inputsOf('self-fill');
    const modelBefore = JSON.stringify(model);
    const derivedBefore = JSON.stringify(derived);
    const ui: PackagesUiState = { filter: 'all', selectedId: CONFLICT_LIB };

    const first = buildPackagesVm(model, derived, ui);
    const second = buildPackagesVm(model, derived, ui);

    expect(second).toEqual(first);
    expect(JSON.stringify(model)).toBe(modelBefore);
    expect(JSON.stringify(derived)).toBe(derivedBefore);
  });
});
