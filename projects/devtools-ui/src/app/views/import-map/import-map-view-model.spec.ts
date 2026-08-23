/**
 * Import Map view-model specs — fixture-driven acceptance plus seeded
 * cases for outcomes no capture exhibits (tagged SEEDED). T9 annotation
 * pins carry over; T9.5 adds the evidence-group layer:
 *  - T9.5-AC-01: frankenstein-live GLOBAL factors into `EXPOSES` plus the
 *    seven signature groups with hoisted SRI and visible qualifiers; the
 *    host scope folds into the collapsed `CHUNK WIRING` head.
 *  - T9.5-AC-02: multiset equality over ALL fixtures including folded
 *    rows, plus the order-invariant permutation pin (supersedes the T9
 *    map-order clause — deliberate plan amendment).
 *  - T9.5-AC-03: kinds derive from canonical joins only — wiring rows
 *    fold with their quiet pseudo-external claims intact, the expose ∧
 *    resolution seed keeps the expose home with its annotations, hostile
 *    rows render `UNREFERENCED` with no guessed annotation.
 *  - T9.5-AC-04: pooling anchors stay visible, `overrides global` derives
 *    from map-structural evidence alone, qualified language stays in
 *    heads or the per-row channel.
 *  - T9.5-AC-05 (builder half): fold groups stay complete in the vm,
 *    selection marks the containing group, caption/empty/select/purity
 *    pins carry over.
 */
import { FIXTURES, NF_HOST } from 'devtools-bridge';
import type {
  DocumentImportMapV1,
  ExternalRemoteV1,
  ExternalScopesV1,
  RemoteV1,
  SnapshotV1,
} from 'devtools-bridge';

import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import type { ChunkGroupId } from '../../shared/store/resolution';
import {
  IMPORT_MAP_CAPTION,
  IMPORT_MAP_SECTION_CONTRACT,
  ImportMapGroupKind,
  ImportMapGroupVm,
  ImportMapRowVm,
  ImportMapVm,
  OVERRIDES_GLOBAL_NOTE,
  buildImportMapVm,
} from './import-map-view-model';

const LIVE_BASE = 'https://lutzleonhardt.de/frankenstein-meeting-room/';
const SEEDED_PAGE = 'https://seeded.example/app/';

function modelOf(name: keyof typeof FIXTURES): FederationModel {
  return ingestSnapshot(FIXTURES[name]);
}

function vmOf(name: keyof typeof FIXTURES, selected: string | null = null): ImportMapVm {
  return buildImportMapVm(modelOf(name), { selected });
}

function allRows(vm: ImportMapVm): ImportMapRowVm[] {
  return vm.sections.flatMap((section) => section.groups.flatMap((group) => group.rows));
}

function rowOf(vm: ImportMapVm, specifier: string): ImportMapRowVm {
  const row = allRows(vm).find((candidate) => candidate.specifier === specifier);
  if (row === undefined) {
    throw new Error(`row not rendered: ${specifier}`);
  }
  return row;
}

function groupOf(
  vm: ImportMapVm,
  sectionIndex: number,
  kind: ImportMapGroupKind,
): ImportMapGroupVm {
  const group = vm.sections[sectionIndex].groups.find((candidate) => candidate.kind === kind);
  if (group === undefined) {
    throw new Error(`group not rendered: ${kind}`);
  }
  return group;
}

function seededRemote(scopeUrl: string): RemoteV1 {
  return { scopeUrl, exposes: [], integrity: {} };
}

function seededParticipant(name: string, file = 'entry.js'): ExternalRemoteV1 {
  return {
    name,
    requiredVersion: '^1.0.0',
    strictVersion: false,
    file,
    entries: null,
    cached: false,
    bundle: null,
    servedFiles: file === '' ? [] : [{ entry: null, file }],
    generation: 'v4',
  };
}

function mapTag(
  imports: Record<string, string>,
  scopes: Record<string, Record<string, string>> = {},
): DocumentImportMapV1 {
  return {
    kind: 'importmap',
    parsed: true,
    importCount: Object.keys(imports).length,
    scopeCount: Object.keys(scopes).length,
    imports: Object.entries(imports).map(([specifier, target]) => ({ specifier, target })),
    scopes: Object.entries(scopes).map(([scope, entries]) => ({
      scope,
      imports: Object.entries(entries).map(([specifier, target]) => ({ specifier, target })),
    })),
    integrity: {},
  };
}

/** Shared externals of the seeded global share scope, one version each. */
function share(externals: Record<string, ExternalRemoteV1[]>): ExternalScopesV1 {
  return {
    __GLOBAL__: Object.fromEntries(
      Object.entries(externals).map(([packageName, participants]) => [
        packageName,
        {
          dirty: false,
          versions: [{ tag: '1.0.0', action: 'share', host: false, remotes: participants }],
        },
      ]),
    ),
  };
}

function seededSnapshot(overrides: {
  remotes?: Record<string, RemoteV1>;
  sharedExternals?: ExternalScopesV1;
  sharedChunks?: Record<string, Record<string, string[]>>;
  documentMaps?: DocumentImportMapV1[];
}): SnapshotV1 {
  return {
    schemaVersion: 1,
    capture: {
      pageUrl: SEEDED_PAGE,
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
      remotes: overrides.remotes ?? {},
      scopedExternals: {},
      sharedExternals: overrides.sharedExternals ?? {},
      sharedChunks: overrides.sharedChunks ?? {},
      generation: 'unknown',
    },
    importMaps: { documentMaps: overrides.documentMaps ?? [], effective: null },
    errors: [],
  };
}

function seededVm(
  overrides: Parameters<typeof seededSnapshot>[0],
  selected: string | null = null,
): ImportMapVm {
  return buildImportMapVm(ingestSnapshot(seededSnapshot(overrides)), { selected });
}

describe('buildImportMapVm — sections in map order (T9.5-AC-02)', () => {
  const vm = vmOf('frankenstein-live');

  it('renders GLOBAL IMPORTS first, then the page-base scope section', () => {
    expect(vm.sections.map((section) => section.kind)).toEqual(['global', 'scope']);
    expect(vm.sections[0].label).toBe('GLOBAL IMPORTS');
    expect(vm.sections[0].owner).toBeNull();
    expect(vm.sections[0].countClaim).toBe('22 entries');
    expect(vm.sections[1].scope).toBe(LIVE_BASE);
    expect(vm.sections[1].countClaim).toBe('7 entries');
    expect(vm.emptyNote).toBeNull();
  });

  it('names the scope section owner by scope-URL identity, never an election', () => {
    const owner = vm.sections[1].owner;
    expect(owner?.kind).toBe('remote');
    if (owner?.kind === 'remote') {
      expect(owner.remote).toBe(NF_HOST);
      expect(owner.display).toBe('host');
      expect(owner.host).toBe(true);
      expect(owner.select).toBe(NF_HOST);
      expect(owner.note).toBe(
        'this scope prefix is the registered scope URL of host (rule: scope-url identity)',
      );
    }
  });

  it('renders targets relative to the page base — verbatim URL kept as evidence', () => {
    const common = rowOf(vm, '@angular/common');
    expect(common.targetDisplay).toBe('_angular_common.Ucn2BmyRM1.js');
    expect(common.target).toBe(`${LIVE_BASE}_angular_common.Ucn2BmyRM1.js`);

    expect(rowOf(vm, 'react').targetDisplay).toBe('whiteboard/react.QYXZqQxJ1j.js');
    expect(rowOf(vm, '@nf-internal/chunk-WW26EZ22').targetDisplay).toBe('chunk-WW26EZ22.js');
  });

  it('marks SRI exactly where the integrity data covers the target', () => {
    const model = modelOf('frankenstein-live');
    for (const row of allRows(vm)) {
      expect(row.hasIntegrity).toBe(row.target in model.effectiveMap.integrity);
    }
    expect(allRows(vm).every((row) => row.hasIntegrity)).toBe(true);
  });

  it('carries the raw-pivot/order contract on the section count', () => {
    expect(IMPORT_MAP_SECTION_CONTRACT).toContain('recorded (scope, specifier, target) entry');
    expect(IMPORT_MAP_SECTION_CONTRACT).toContain('map order carries no resolution semantics');
    expect(IMPORT_MAP_SECTION_CONTRACT).toContain('Export JSON preserves the artifact verbatim');
    expect(IMPORT_MAP_SECTION_CONTRACT).toContain('nothing claims requests or execution');
  });
});

describe('buildImportMapVm — one row per recorded entry, order invariant (T9.5-AC-02)', () => {
  const HOME_ORDER: Record<ImportMapGroupKind, number> = {
    exposes: 0,
    signature: 1,
    ungrouped: 2,
    'chunk-wiring': 3,
    unreferenced: 4,
  };
  const tripleOf = (scope: string | null, specifier: string, target: string) =>
    JSON.stringify([scope, specifier, target]);

  it('renders every recorded entry exactly once — multiset equality incl. folded rows', () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const model = modelOf(name);
      const rendered = buildImportMapVm(model, { selected: null });
      const triples = rendered.sections.flatMap((section) =>
        section.groups.flatMap((group) =>
          group.rows.map((row) => tripleOf(section.scope, row.specifier, row.target)),
        ),
      );
      const recorded = model.importMapEntries.map((entry) =>
        tripleOf(entry.scope, entry.specifier, entry.target),
      );
      expect([...triples].sort()).toEqual([...recorded].sort());
      expect(new Set(triples).size).toBe(triples.length);
    }
  });

  it('renders the deterministic permutation of the recorded entries, identically twice', () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const model = modelOf(name);
      const vm = buildImportMapVm(model, { selected: null });

      // Sections keep map first-appearance order.
      const scopeOrder: (string | null)[] = [];
      for (const entry of model.importMapEntries) {
        if (!scopeOrder.includes(entry.scope)) {
          scopeOrder.push(entry.scope);
        }
      }
      expect(vm.sections.map((section) => section.scope)).toEqual(scopeOrder);

      for (const section of vm.sections) {
        const mapIndex = new Map(
          model.importMapEntries
            .filter((entry) => entry.scope === section.scope)
            .map((entry, index) => [tripleOf(entry.scope, entry.specifier, entry.target), index]),
        );
        const indexOf = (row: ImportMapRowVm) =>
          mapIndex.get(tripleOf(section.scope, row.specifier, row.target))!;

        // Homes render in the fixed order exposes → signature → ungrouped
        // → chunk-wiring → unreferenced.
        const kindRanks = section.groups.map((group) => HOME_ORDER[group.kind]);
        expect(kindRanks).toEqual([...kindRanks].sort((a, b) => a - b));

        // Signature groups order by the map position of their first row.
        const signatureFirsts = section.groups
          .filter((group) => group.kind === 'signature')
          .map((group) => indexOf(group.rows[0]));
        expect(signatureFirsts).toEqual([...signatureFirsts].sort((a, b) => a - b));

        // Rows keep map order within every home.
        for (const group of section.groups) {
          const indexes = group.rows.map(indexOf);
          expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
        }
      }

      // Two renders of one capture are identical.
      expect(buildImportMapVm(model, { selected: null })).toEqual(vm);
    }
  });

  it('annotates a multi-consumer binding on one row instead of duplicating it', () => {
    const vm = vmOf('co-declared-share');
    const rows = allRows(vm).filter((row) => row.specifier === '@nf-lab/conflict-lib');
    expect(rows).toHaveLength(1);
    expect(rows[0].resolutionIds).toHaveLength(2);
    expect(rows[0].claims).toHaveLength(2);
    expect(rows[0].sources).toHaveLength(1);
  });
});

describe('buildImportMapVm — evidence homes (T9.5-AC-01)', () => {
  const vm = vmOf('frankenstein-live');

  it('factors the live GLOBAL section into EXPOSES plus the seven signature groups', () => {
    const global = vm.sections[0];
    expect(
      global.groups.map((group) => [
        group.kind,
        group.countClaim,
        group.sources.map((source) => [source.display, source.qualifier]),
        group.bundles.map((bundle) => [bundle.label, bundle.status]),
      ]),
    ).toEqual([
      ['exposes', '2', [], []],
      ['signature', '7 entries', [['whiteboard', 'exact-target-source']], []],
      ['signature', '1 entry', [['mermaid', 'exact-target-source']], []],
      [
        'signature',
        '2 entries',
        [['host', 'exact-target-source']],
        [['browser-angular_common', 'mapped-source']],
      ],
      [
        'signature',
        '1 entry',
        [['host', 'exact-target-source']],
        [['browser-angular_platform_browser', 'source-only']],
      ],
      [
        'signature',
        '2 entries',
        [['host', 'exact-target-source']],
        [['browser-rxjs', 'mapped-source']],
      ],
      [
        'signature',
        '1 entry',
        [['host', 'exact-target-source']],
        [['browser-tslib', 'source-only']],
      ],
      [
        'signature',
        '6 entries',
        [['host', 'exact-target-source']],
        [['browser-angular_core', 'mapped-source']],
      ],
    ]);
    // The source-only qualifier is visible in its head, never dropped.
    expect(global.groups[4].bundles[0].qualified).toBe(true);
  });

  it('labels the package home once — PACKAGES spans its groups (screenshot round 1)', () => {
    const global = vm.sections[0];
    expect(global.groups[1].packagesHead).toEqual({
      countClaim: '20 entries',
      note: expect.stringContaining('precedence: expose > chunk > package'),
    });
    expect(global.groups.filter((group) => group.packagesHead !== null)).toEqual([
      global.groups[1],
    ]);
    expect(groupOf(vm, 1, 'chunk-wiring').packagesHead).toBeNull();
  });

  it('carries the PACKAGES label exactly once per section with a package home', () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      for (const section of buildImportMapVm(modelOf(name), { selected: null }).sections) {
        const home = section.groups.filter(
          (group) => group.kind === 'signature' || group.kind === 'ungrouped',
        );
        const labeled = section.groups.filter((group) => group.packagesHead !== null);
        if (home.length === 0) {
          expect(labeled).toEqual([]);
          continue;
        }
        // The label sits on the home's FIRST group and counts every
        // package-kind row of the section.
        expect(labeled).toEqual([home[0]]);
        const total = home.reduce((count, group) => count + group.rows.length, 0);
        expect(home[0].packagesHead?.countClaim).toBe(total === 1 ? '1 entry' : `${total} entries`);
      }
    }
  });

  it('hoists uniform SRI into every live head — no row left marking itself', () => {
    for (const section of vm.sections) {
      for (const group of section.groups) {
        expect(group.integrityHoist).toBe(true);
      }
    }
  });

  it('keeps quiet single own-selected rows bare inside their signature group', () => {
    const whiteboard = vm.sections[0].groups[1];
    for (const row of whiteboard.rows) {
      expect(row.claims).toHaveLength(1);
      expect(row.claims[0].quiet).toBe(true);
      expect(row.claimlessConsumers).toEqual([]);
      expect(row.blocked).toBeNull();
      expect(row.overridesGlobal).toBe(false);
    }
  });

  it('groups on head facts only — copy IDs and resolved tags never split a group', () => {
    const whiteboard = vm.sections[0].groups[1];
    // Seven rows, seven distinct copies, one group.
    expect(new Set(whiteboard.rows.map((row) => row.sources[0].copyId)).size).toBe(7);
    // The head note is the fixed factoring string — no per-copy tag.
    expect(whiteboard.sources[0].note).toBe(
      'uniquely evidenced source record — its candidate URL matches the resolved target exactly',
    );
    expect(whiteboard.sources[0].note).not.toContain('resolved tag');
    // The per-copy tag stays on the row VMs (reachable via /packages).
    expect(whiteboard.rows[0].sources[0].note).toContain('resolved tag');
  });

  it('folds the host scope into the collapsed CHUNK WIRING head with count and bundle summary', () => {
    const fold = groupOf(vm, 1, 'chunk-wiring');
    expect(fold.countClaim).toBe('7 entries');
    expect(fold.bundleSummary).toBe('in 3 bundles');
    // The bundle names stay one hover away, dominant bundle first.
    expect(fold.bundleSummaryNote).toBe(
      'browser-angular_core, browser-angular_common, browser-rxjs',
    );
    expect(fold.integrityHoist).toBe(true);
    expect(fold.note).toContain('wiring internal chunk specifiers');
    expect(fold.rows.map((row) => row.specifier)).toEqual([
      '@nf-internal/chunk-WW26EZ22',
      '@nf-internal/chunk-PAMKM67I',
      '@nf-internal/chunk-RCIWTGS7',
      '@nf-internal/chunk-K6ZMRNMW',
      '@nf-internal/chunk-APTZXQMF',
      '@nf-internal/chunk-V2SUVJ7R',
      '@nf-internal/chunk-2VMXMS7J',
    ]);
    expect(vm.sections[1].groups).toHaveLength(1);
  });

  it('marks the group holding the selected row for fold auto-expansion', () => {
    const selected = vmOf('frankenstein-live', '@nf-internal/chunk-WW26EZ22');
    const fold = groupOf(selected, 1, 'chunk-wiring');
    expect(fold.containsSelection).toBe(true);
    expect(selected.sections[0].groups.every((group) => group.containsSelection === false)).toBe(
      true,
    );
  });

  it('SEEDED: fold selection tolerates the literal /./ infix', () => {
    const vm = seededVm(
      {
        remotes: { [NF_HOST]: seededRemote('./'), 'emit-a': seededRemote('./shared/') },
        sharedChunks: { 'emit-a': { 'bundle-a': ['x.js'] } },
        documentMaps: [mapTag({ 'weird/./wire': './shared/x.js' })],
      },
      'weird/wire',
    );
    const fold = groupOf(vm, 0, 'chunk-wiring');
    expect(fold.rows[0].selected).toBe(true);
    expect(fold.containsSelection).toBe(true);
  });

  it('compresses one-source captures into a single signature group (non-dense)', () => {
    const vm45 = vmOf('non-dense');
    expect(
      vm45.sections[0].groups.map((group) => [group.kind, group.countClaim, group.integrityHoist]),
    ).toEqual([
      ['exposes', '1', false],
      ['signature', '14 entries', false],
    ]);
    expect(vm45.sections[0].groups[1].sources.map((source) => source.display)).toEqual(['mfe3']);
    expect(vm45.sections[0].groups[1].packagesHead?.countClaim).toBe('14 entries');
  });
});

describe('buildImportMapVm — SRI completeness (T9.5-AC-01)', () => {
  it("reads every row's integrity state from exactly one place — head or row", () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      for (const section of buildImportMapVm(modelOf(name), { selected: null }).sections) {
        for (const group of section.groups) {
          if (group.kind === 'ungrouped') {
            // Headless rows always self-mark — never a hoist.
            expect(group.integrityHoist).toBeNull();
            continue;
          }
          if (group.integrityHoist === true) {
            expect(group.rows.every((row) => row.hasIntegrity)).toBe(true);
          } else if (group.integrityHoist === false) {
            expect(group.rows.every((row) => !row.hasIntegrity)).toBe(true);
          } else {
            // Mixed: both states present, the rows mark themselves.
            expect(group.rows.some((row) => row.hasIntegrity)).toBe(true);
            expect(group.rows.some((row) => !row.hasIntegrity)).toBe(true);
          }
        }
      }
    }
  });
});

describe('buildImportMapVm — kinds from canonical joins (T9.5-AC-03)', () => {
  it('folds non-dense wiring rows with their quiet pseudo-external claims intact', () => {
    const vm45 = vmOf('non-dense');
    const fold = groupOf(vm45, 1, 'chunk-wiring');
    expect(fold.countClaim).toBe('7 entries');
    expect(fold.bundleSummary).toBe('in 7 chunk groups');
    // Pseudo-package names would restate the expanded specifiers — no tip.
    expect(fold.bundleSummaryNote).toBeNull();
    for (const row of fold.rows) {
      // Both canonical facts coexist on one row: the recorded chunk group
      // and the private-registration claim — the wiring home wins per the
      // scoped-pseudo-external precedent, nothing drops.
      expect(row.chunks.map((chunk) => chunk.groupLabel)).toEqual([row.specifier]);
      expect(row.chunks[0].groupNoun).toBe('chunk group');
      expect(row.sources[0].qualifier).toBe('exact-target-source');
      expect(row.sourceQuiet).toBe(true);
      expect(row.claims[0].quiet).toBe(true);
      expect(row.claims[0].note).toContain('private registration of mfe3');
      expect(row.packageSelect).toBeNull();
    }
  });

  it('SEEDED: an expose ∧ resolution row keeps the expose home with its annotations', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': {
          scopeUrl: './mfe-a/',
          exposes: [{ moduleName: './C', file: 'lib.js' }],
          integrity: {},
        },
      },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'lib.js')] }),
      documentMaps: [mapTag({ lib: './mfe-a/lib.js', 'mfe-a/./C': './mfe-a/lib.js' })],
    });
    const exposes = groupOf(vm, 0, 'exposes');
    // Both rows share the exposed target — both live in the expose home.
    expect(exposes.rows.map((row) => row.specifier)).toEqual(['lib', 'mfe-a/./C']);
    const overlap = exposes.rows[0];
    // The resolution annotations stay rendered on the row …
    expect(overlap.resolutionIds).toHaveLength(1);
    expect(overlap.claims.map((claim) => claim.display)).toEqual(['mfe-a']);
    expect(overlap.sources.map((source) => source.qualifier)).toEqual(['exact-target-source']);
    expect(overlap.packageSelect).toBe('__GLOBAL__|lib');
    // … and the module word stays visible.
    expect(overlap.exposes.map((expose) => expose.moduleName)).toEqual(['./C']);
    expect(vm.sections[0].groups.map((group) => group.kind)).toEqual(['exposes']);
  });

  it('renders hostile rows as the muted UNREFERENCED tail with no guessed annotation', () => {
    const vm = vmOf('synthetic-hostile');
    const unreferenced = groupOf(vm, 0, 'unreferenced');
    expect(unreferenced.countClaim).toBe('2 entries');
    expect(unreferenced.note).toContain('honest absence, never a guessed owner');
    // Mixed integrity: the head hoists nothing, the rows mark themselves.
    expect(unreferenced.integrityHoist).toBeNull();
    expect(unreferenced.rows.map((row) => [row.specifier, row.hasIntegrity])).toEqual([
      ['sneaky-lib', true],
      ['https://synthetic-fixture.example/hostile/deep/path%20segment/admin', false],
    ]);
    for (const row of unreferenced.rows) {
      expect(row.resolutionIds).toEqual([]);
      expect(row.sources).toEqual([]);
      expect(row.claims).toEqual([]);
      expect(row.chunks).toEqual([]);
      expect(row.exposes).toEqual([]);
      expect(row.packageSelect).toBeNull();
    }
    // Foreign-origin targets keep their absolute URLs (honest signal).
    expect(unreferenced.rows[1].targetDisplay).toBe(
      'https://synthetic-fixture.example/hostile/admin-console/component-admin.js',
    );
  });

  it('annotates private-path rows from private claims without a package link', () => {
    const vm = vmOf('scoped');
    const scopeSections = vm.sections.filter((section) => section.kind === 'scope');
    expect(scopeSections.map((section) => section.owner?.kind)).toEqual(['remote', 'remote']);
    // Scope package rows render ungrouped — the full per-row channel.
    expect(scopeSections.map((section) => section.groups.map((group) => group.kind))).toEqual([
      ['ungrouped'],
      ['ungrouped'],
    ]);
    const first = scopeSections[0].groups[0].rows[0];
    expect(first.sources[0].qualifier).toBe('exact-target-source');
    // A single own-selected private claim restating the identity-owned
    // section is the quiet norm — the annotation stays in the vm.
    expect(first.sourceQuiet).toBe(true);
    expect(first.claims).toHaveLength(1);
    expect(first.claims[0].quiet).toBe(true);
    expect(first.claims[0].note).toContain('private registration of mfe1');
    expect(first.packageSelect).toBeNull();
    expect(first.bundles.map((bundle) => [bundle.label, bundle.status])).toEqual([
      ['browser-shared', 'source-only'],
    ]);
  });

  it('SEEDED: an unmapped resolution invents no row and contaminates none', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({
        lib: [seededParticipant('mfe-a', 'lib.js')],
        // 'ghost' is declared but the recorded map carries no entry for
        // it — the canonical resolution is unmapped and has no map-entry
        // provenance to annotate.
        ghost: [seededParticipant('mfe-a', 'ghost.js')],
      }),
      documentMaps: [mapTag({ lib: './mfe-a/lib.js' })],
    });
    const rows = allRows(vm);
    expect(rows.map((row) => row.specifier)).toEqual(['lib']);
    // The unmapped claim stays out of the mapped row — distinguishable by
    // honest absence, never conflated into an annotation.
    expect(rows[0].claims.map((claim) => claim.note)).toEqual([
      expect.stringContaining("for 'lib'"),
    ]);
  });

  it('renders unknown resolutions as the honest empty state, never as rows', () => {
    // synthetic-multi-version captures no import map: every canonical
    // resolution is status 'unknown' with no map-entry provenance.
    const vm = vmOf('synthetic-multi-version');
    expect(vm.sections).toEqual([]);
    expect(vm.emptyNote).toBe('no import map recorded in this capture');
  });

  it('SEEDED: an alias specifier row stays honestly un-annotated in the unreferenced tail', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'lib.js')] }),
      documentMaps: [mapTag({ lib: './mfe-a/lib.js', 'lib-alias': './mfe-a/lib.js' })],
    });
    expect(rowOf(vm, 'lib').packageSelect).toBe('__GLOBAL__|lib');
    // Same target, different specifier: no canonical binding resolves
    // through the alias row — no source, no claim, no package link.
    const alias = rowOf(vm, 'lib-alias');
    expect(alias.sources).toEqual([]);
    expect(alias.claims).toEqual([]);
    expect(alias.packageSelect).toBeNull();
    expect(groupOf(vm, 0, 'unreferenced').rows).toEqual([alias]);
  });
});

describe('buildImportMapVm — anchors and overrides (T9.5-AC-04)', () => {
  it('keeps the pooling anchor visible on both consumer scopes — never quiet', () => {
    const vm = vmOf('pooling-anchor');
    const scoped = vm.sections.filter((section) => section.kind === 'scope');
    expect(scoped.map((section) => section.owner?.kind)).toEqual(['remote', 'remote']);
    for (const [index, consumer] of (['mfe1', 'mfe2'] as const).entries()) {
      expect(scoped[index].groups.map((group) => group.kind)).toEqual(['ungrouped']);
      expect(scoped[index].groups[0].packagesHead?.countClaim).toBe('1 entry');
      const row = scoped[index].groups[0].rows[0];
      expect(row.sources[0].qualifier).toBe('explicit-anchor');
      expect(row.sources[0].label).toBe('explicit anchor');
      expect(row.sources[0].display).toBe('mfe1');
      // The self-anchor (mfe1's own scope) must speak like the foreign
      // anchor: a non-exact qualifier vetoes the quiet rule.
      expect(row.sourceQuiet).toBe(false);
      expect(row.claims.map((claim) => [claim.display, claim.state])).toEqual([
        [consumer, 'anchored'],
      ]);
      expect(row.claims[0].quiet).toBe(false);
      // The global election maps the host copy; these scope entries take
      // precedence for their consumers — map-structural evidence only.
      expect(row.overridesGlobal).toBe(true);
    }
  });

  it('keeps both claim chips on the multi-claim /extra row of the pooling capture', () => {
    const vm = vmOf('pooling-anchor');
    const extra = rowOf(vm, '@nf-lab/conflict-lib/extra');
    expect(extra.claims.map((claim) => [claim.display, claim.stateLabel])).toEqual([
      ['mfe1', 'selected'],
      ['mfe2', 'not selected'],
    ]);
    expect(extra.claims.every((claim) => !claim.quiet)).toBe(true);
    // Its signature group carries the qualified bundle language in the head.
    const group = vm.sections[0].groups.find((candidate) => candidate.rows.includes(extra))!;
    expect(group.kind).toBe('signature');
    expect(group.sources.map((source) => source.display)).toEqual(['mfe1']);
    expect(group.bundles.map((bundle) => [bundle.label, bundle.status, bundle.qualified])).toEqual([
      ['browser-shared', 'source-only', true],
    ]);
  });

  it('carries no override marker without a differing global entry', () => {
    for (const name of ['scoped', 'strict-scope'] as const) {
      const vm = vmOf(name);
      for (const row of allRows(vm)) {
        expect(row.overridesGlobal).toBe(false);
      }
    }
    // Global rows never carry the marker by definition.
    expect(allRows(vmOf('frankenstein-live')).every((row) => !row.overridesGlobal)).toBe(true);
  });

  it('derives the override marker from map-structural evidence alone (synthetic-hostile)', () => {
    // The hostile capture records 'sneaky-lib' globally AND under the
    // admin-console scope with a different target — a real fixture
    // witness of scope precedence.
    const vm = vmOf('synthetic-hostile');
    const scopeRow = vm.sections[1].groups[0].rows[0];
    expect(scopeRow.specifier).toBe('sneaky-lib');
    expect(scopeRow.overridesGlobal).toBe(true);
    expect(OVERRIDES_GLOBAL_NOTE).toContain('rule: scope-precedence');
  });

  it('SEEDED: a same-target global duplicate carries no override marker', () => {
    const base = {
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'lib.js')] }),
    };
    const same = seededVm({
      ...base,
      documentMaps: [mapTag({ lib: './mfe-a/lib.js' }, { './mfe-a/': { lib: './mfe-a/lib.js' } })],
    });
    const sameScopeRow = same.sections.find((section) => section.kind === 'scope')!.groups[0]
      .rows[0];
    expect(sameScopeRow.overridesGlobal).toBe(false);

    const differing = seededVm({
      ...base,
      documentMaps: [mapTag({ lib: './other/lib.js' }, { './mfe-a/': { lib: './mfe-a/lib.js' } })],
    });
    const overridingRow = differing.sections.find((section) => section.kind === 'scope')!.groups[0]
      .rows[0];
    expect(overridingRow.overridesGlobal).toBe(true);
  });

  it('distinguishes fallback from own-selected claims on the elected row', () => {
    const vm = vmOf('clean-skip');
    const row = rowOf(vm, '@nf-lab/conflict-lib');
    expect(row.sources[0].display).toBe('mfe2');
    expect(row.claims.map((claim) => [claim.display, claim.state])).toEqual([
      ['mfe1', 'fallback'],
      ['mfe2', 'own-selected'],
    ]);
  });
});

describe('buildImportMapVm — canonical claim annotations (T9 carry-over)', () => {
  const vm = vmOf('co-declared-share');
  const row = rowOf(vm, '@nf-lab/conflict-lib');

  it('shows the recorded target with two consumer claims and one exact source', () => {
    expect(row.target).toBe('http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js');
    expect(row.sources).toHaveLength(1);
    expect(row.sources[0].qualifier).toBe('exact-target-source');
    expect(row.sources[0].display).toBe('mfe1');
    expect(row.sources[0].note).toContain('resolved tag 1.0.0');
    expect(row.claims.map((claim) => [claim.display, claim.state, claim.stateLabel])).toEqual([
      ['mfe1', 'own-selected', 'selected'],
      ['mfe2', 'not-selected', 'not selected'],
    ]);
    // The exact candidate match stays claim evidence, not just a label.
    expect(row.claims.map((claim) => claim.ownCandidateSelected)).toEqual([true, false]);
    // Exactly one selected exact source; on a multi-claim row every claim
    // speaks so the multiplicity stays visible.
    expect(row.claims.filter((claim) => claim.state === 'own-selected')).toHaveLength(1);
    expect(row.claims.every((claim) => !claim.quiet)).toBe(true);
  });

  it('links the claimed registry package', () => {
    expect(row.packageSelect).toBe('__GLOBAL__|@nf-lab/conflict-lib');
  });

  it('annotates expose rows from the recorded expose join', () => {
    const live = vmOf('frankenstein-live');
    const expose = rowOf(live, 'whiteboard/./Bootstrap');
    expect(expose.exposes).toEqual([
      {
        remote: 'whiteboard',
        display: 'whiteboard',
        host: false,
        select: 'whiteboard',
        moduleName: './Bootstrap',
        note: "recorded exposed module './Bootstrap' of whiteboard (rule: expose join)",
      },
    ]);
    expect(expose.sources).toEqual([]);
    expect(expose.claims).toEqual([]);
    expect(expose.packageSelect).toBeNull();
    expect(expose.chunks).toEqual([]);
  });

  it('SEEDED: two exposed modules on one target both annotate the row', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': {
          scopeUrl: './mfe-a/',
          exposes: [{ moduleName: './C', file: '../shared/c.js' }],
          integrity: {},
        },
        'mfe-b': {
          scopeUrl: './mfe-b/',
          exposes: [{ moduleName: './C', file: '../shared/c.js' }],
          integrity: {},
        },
      },
      documentMaps: [mapTag({ 'mfe-a/./C': './shared/c.js', 'mfe-b/./C': './shared/c.js' })],
    });
    // Both expose joins land on the shared target — the annotation lists
    // both, never silently just the first.
    for (const specifier of ['mfe-a/./C', 'mfe-b/./C']) {
      expect(rowOf(vm, specifier).exposes.map((expose) => expose.display)).toEqual([
        'mfe-a',
        'mfe-b',
      ]);
    }
  });
});

describe('buildImportMapVm — qualified signature heads (T9.5-AC-04, SEEDED)', () => {
  it('SEEDED: a foreign-origin target forms an unattributable head, never a guessed owner', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lodash: [seededParticipant('mfe-a', 'nope.js')] }),
      documentMaps: [mapTag({ lodash: 'https://cdn.example/lodash.js' })],
    });
    const group = groupOf(vm, 0, 'signature');
    expect(group.sources).toEqual([
      {
        display: null,
        host: false,
        remoteSelect: null,
        qualifier: 'unattributable',
        label: 'unattributable',
        note: 'no registry scope matches this target — CDN or foreign origin (rule: scope-prefix-match)',
      },
    ]);
    expect(group.countClaim).toBe('1 entry');
    const row = group.rows[0];
    expect(row.sources[0].qualifier).toBe('unattributable');
    expect(row.claims.map((claim) => claim.state)).toEqual(['not-selected']);
    // A foreign-origin target keeps its absolute URL — it must stand out.
    expect(row.targetDisplay).toBe('https://cdn.example/lodash.js');
  });

  it('SEEDED: a same-origin target outside every scope stays unattributable', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'nope.js')] }),
      documentMaps: [mapTag({ lib: 'https://seeded.example/outside/lib.js' })],
    });
    expect(rowOf(vm, 'lib').sources[0].qualifier).toBe('unattributable');
  });

  it('SEEDED: equally matching exact candidates render as ambiguity, never a choice', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': seededRemote('./vendor/'),
        'mfe-b': seededRemote('./vendor/'),
      },
      sharedExternals: share({
        lib: [seededParticipant('mfe-a', 'lib.js'), seededParticipant('mfe-b', 'lib.js')],
      }),
      documentMaps: [mapTag({ lib: './vendor/lib.js' })],
    });
    const group = groupOf(vm, 0, 'signature');
    expect(group.sources.map((source) => [source.display, source.qualifier, source.label])).toEqual(
      [[null, 'ambiguous-source', 'ambiguous source']],
    );
    const row = group.rows[0];
    expect(row.sources[0].qualifier).toBe('ambiguous-source');
    // Alias consumers (one scope URL, two names) annotate as two claims on
    // the one row.
    expect(row.claims.map((claim) => claim.display)).toEqual(['mfe-a', 'mfe-b']);
    expect(row.claims.every((claim) => !claim.quiet)).toBe(true);
  });

  it('SEEDED: a blocked claim renders ungrouped — no signature, full per-row channel', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ 'util/x': [seededParticipant('mfe-a', 'x.js')] }),
      documentMaps: [mapTag({ 'util/': './util' })],
    });
    const ungrouped = groupOf(vm, 0, 'ungrouped');
    // Headless home: integrity is never hoisted, the row marks itself.
    expect(ungrouped.integrityHoist).toBeNull();
    const row = ungrouped.rows[0];
    expect(row.specifier).toBe('util/');
    expect(row.blocked).toEqual({
      reasons: ['prefix-target-missing-trailing-slash'],
      note: 'the matching import-map entry terminally blocks this binding (prefix-target-missing-trailing-slash)',
    });
    expect(row.claims.map((claim) => [claim.display, claim.state])).toEqual([['mfe-a', 'blocked']]);
    expect(row.sources).toEqual([]);
  });

  it('SEEDED: a scope URL registered by two remotes names both, none elected', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'team-a': seededRemote('./team/app/'),
        'team-b': seededRemote('./team/app/'),
      },
      documentMaps: [mapTag({}, { './team/app/': { shared: './team/app/shared.js' } })],
    });
    const section = vm.sections.find((candidate) => candidate.kind === 'scope');
    expect(section?.owner).toEqual({
      kind: 'shared-scope-url',
      remotes: [
        { remote: 'team-a', display: 'team-a', host: false, select: 'team-a' },
        { remote: 'team-b', display: 'team-b', host: false, select: 'team-b' },
      ],
      note: 'this scope prefix is the registered scope URL of team-a and team-b (rule: scope-url identity)',
    });
  });

  it('SEEDED: a scope no registered remote matches carries no owner claim', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./') },
      documentMaps: [mapTag({}, { './elsewhere/': { thing: './elsewhere/thing.js' } })],
    });
    const section = vm.sections.find((candidate) => candidate.kind === 'scope');
    expect(section?.owner).toBeNull();
  });
});

describe('buildImportMapVm — attribution precedence (T9 carry-over)', () => {
  it('SEEDED: an exact candidate match outranks the scope-prefix attribution', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': seededRemote('./mfe-a/'),
        'mfe-b': seededRemote('./mfe-b/'),
      },
      // mfe-a's candidate resolves into mfe-b's scope; the exact match
      // must win over the scope owner.
      sharedExternals: share({ lib: [seededParticipant('mfe-a', '../mfe-b/lib.js')] }),
      documentMaps: [mapTag({ lib: './mfe-b/lib.js' })],
    });
    const row = rowOf(vm, 'lib');
    expect(row.sources[0].qualifier).toBe('exact-target-source');
    expect(row.sources[0].display).toBe('mfe-a');
  });

  it('SEEDED: without an exact match the observed scope owner stays qualified', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': seededRemote('./mfe-a/'),
        'mfe-b': seededRemote('./mfe-b/'),
      },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'other.js')] }),
      documentMaps: [mapTag({ lib: './mfe-b/lib.js' })],
    });
    const row = rowOf(vm, 'lib');
    expect(row.sources[0].qualifier).toBe('observed-target-source');
    expect(row.sources[0].display).toBe('mfe-b');
    expect(row.sources[0].note).toContain('scope-prefix match');
  });

  it('SEEDED: the host fallback stays qualified and named', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'nope.js')] }),
      documentMaps: [mapTag({ lib: './lib.js' })],
    });
    const row = rowOf(vm, 'lib');
    expect(row.sources[0].qualifier).toBe('observed-target-source');
    expect(row.sources[0].display).toBe('host');
    expect(row.sources[0].host).toBe(true);
    expect(row.sources[0].note).toContain('host as least-specific fallback');
  });

  it('SEEDED: a prefix entry carries the canonical resolver outcome of its expansion', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ 'util/x': [seededParticipant('mfe-a', 'x.js')] }),
      documentMaps: [mapTag({ 'util/': './util/' })],
    });
    const row = rowOf(vm, 'util/');
    expect(row.resolutionIds).toHaveLength(1);
    // The claim names the expanded specifier — the prefix row is the
    // recorded entry, the outcome comes from the canonical resolver.
    expect(row.claims[0].note).toContain("for 'util/x'");
    // The prefix row is not the claimed registry package — no link.
    expect(row.packageSelect).toBeNull();
  });
});

describe('buildImportMapVm — bundle and chunk annotations (T9 carry-over)', () => {
  const vm = vmOf('frankenstein-live');

  it('annotates copy rows with their canonical bundle claims, qualification visible', () => {
    const rxjs = rowOf(vm, 'rxjs');
    expect(rxjs.bundles.map((bundle) => [bundle.label, bundle.status, bundle.qualified])).toEqual([
      ['browser-rxjs', 'mapped-source', false],
    ]);
    const platform = rowOf(vm, '@angular/platform-browser');
    expect(
      platform.bundles.map((bundle) => [bundle.label, bundle.status, bundle.qualified]),
    ).toEqual([['browser-angular_platform_browser', 'source-only', true]]);
  });

  it('annotates @nf-internal/chunk-* rows from the canonical chunk groups', () => {
    const chunkRow = rowOf(vm, '@nf-internal/chunk-WW26EZ22');
    expect(chunkRow.chunks).toEqual([
      {
        emitterRemote: NF_HOST,
        display: 'host',
        host: true,
        select: NF_HOST,
        groupLabel: 'browser-angular_common',
        groupNoun: 'bundle',
        note: "recorded chunk file of host — the file resolves to this entry's target (rule: chunk-group join)",
      },
    ]);
    expect(chunkRow.packageSelect).toBeNull();
    expect(chunkRow.sources).toEqual([]);
  });

  it('links package rows to the packages detail via the claimed registry package', () => {
    expect(rowOf(vm, '@angular/common').packageSelect).toBe('__GLOBAL__|@angular/common');
    expect(rowOf(vm, '@angular/core/primitives/di').packageSelect).toBe(
      '__GLOBAL__|@angular/core/primitives/di',
    );
    expect(rowOf(vmOf('strict-scope'), '@nf-lab/conflict-lib').packageSelect).toBe(
      'strict|@nf-lab/conflict-lib',
    );
  });

  it('SEEDED: a chunk file recorded by two groups names both bundles', () => {
    const model = modelOf('frankenstein-live');
    const projection = model.resolutionProjection;
    const original = projection.chunkGroups.find((group) =>
      group.files.includes('chunk-WW26EZ22.js'),
    )!;
    const seeded: FederationModel = {
      ...model,
      resolutionProjection: {
        ...projection,
        chunkGroups: [
          ...projection.chunkGroups,
          {
            ...original,
            id: 'chunk-group:seeded-second' as ChunkGroupId,
            bundleName: 'seeded-second',
            files: ['chunk-WW26EZ22.js'],
          },
        ],
      },
    };
    const seededRow = rowOf(
      buildImportMapVm(seeded, { selected: null }),
      '@nf-internal/chunk-WW26EZ22',
    );
    // Same emitter: the labels merge into ONE annotation.
    expect(seededRow.chunks.map((chunk) => chunk.groupLabel)).toEqual([
      'browser-angular_common · seeded-second',
    ]);
    expect(seededRow.chunks[0].groupNoun).toBe('bundles');
  });

  it('SEEDED: emitter-distinct groups on one target never merge', () => {
    // Two emitters share one scope URL and each record the same chunk
    // file under their own bundle — one annotation per emitter, each
    // linking its own remote (T6 emitter doctrine).
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'emit-a': seededRemote('./shared/'),
        'emit-b': seededRemote('./shared/'),
      },
      sharedChunks: {
        'emit-a': { 'bundle-a': ['x.js'] },
        'emit-b': { 'bundle-b': ['x.js'] },
      },
      documentMaps: [mapTag({ '@nf-internal/chunk-x': './shared/x.js' })],
    });
    const row = rowOf(vm, '@nf-internal/chunk-x');
    expect(row.chunks.map((chunk) => [chunk.display, chunk.groupLabel, chunk.select])).toEqual([
      ['emit-a', 'bundle-a', 'emit-a'],
      ['emit-b', 'bundle-b', 'emit-b'],
    ]);
  });
});

describe('buildImportMapVm — quiet norms (only exceptions speak)', () => {
  it('quiets a source chip restating the identity-owned scope section', () => {
    const vm = vmOf('strict-scope');
    const scoped = vm.sections.filter((section) => section.kind === 'scope');
    for (const section of scoped) {
      const row = section.groups[0].rows[0];
      expect(row.sourceQuiet).toBe(true);
      expect(row.claims[0].quiet).toBe(true);
    }
  });

  it('keeps single own-selected claims quiet in the global section, sources speaking', () => {
    const vm = vmOf('frankenstein-live');
    const react = rowOf(vm, 'react');
    expect(react.sourceQuiet).toBe(false);
    expect(react.sources[0].display).toBe('whiteboard');
    expect(react.claims[0].quiet).toBe(true);
  });
});

describe('buildImportMapVm — caption and empty states (T9.5-AC-05)', () => {
  it('carries the honesty caption verbatim', () => {
    expect(vmOf('frankenstein-live').caption).toBe(
      'This layer proves resolution only — an import-mapped file is not necessarily requested, and a requested file is not proof of execution.',
    );
    expect(IMPORT_MAP_CAPTION).toBe(vmOf('synthetic-empty-page').caption);
  });

  it("renders the honest empty state for both mapMode 'none' paths — no invented map", () => {
    for (const fixture of ['synthetic-empty-page', 'synthetic-no-import-maps'] as const) {
      const vm = vmOf(fixture);
      expect(vm.sections).toEqual([]);
      expect(vm.emptyNote).toBe('no import map recorded in this capture');
    }
  });
});

describe('buildImportMapVm — select matching (T9.5-AC-05)', () => {
  it('tolerates the literal /./ infix from both sender conventions', () => {
    const collapsed = vmOf('frankenstein-live', 'whiteboard/Bootstrap');
    const literal = vmOf('frankenstein-live', 'whiteboard/./Bootstrap');
    for (const vm of [collapsed, literal]) {
      const selected = allRows(vm).filter((row) => row.selected);
      expect(selected.map((row) => row.specifier)).toEqual(['whiteboard/./Bootstrap']);
    }
  });

  it('marks the packages-entry payload and stays empty without a match', () => {
    const vm = vmOf('frankenstein-live', '@angular/common/http');
    expect(
      allRows(vm)
        .filter((row) => row.selected)
        .map((row) => row.specifier),
    ).toEqual(['@angular/common/http']);
    expect(allRows(vmOf('frankenstein-live', 'not-in-this-map')).some((row) => row.selected)).toBe(
      false,
    );
  });
});

describe('buildImportMapVm — canonical ID chains (provenance references)', () => {
  it('resolves every annotated ID against its canonical collection, in every fixture', () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const model = modelOf(name);
      const projection = model.resolutionProjection;
      const resolutionIds = new Set<string>(
        model.effectiveConsumerResolutions.map((resolution) => resolution.id),
      );
      const claimIds = new Set<string>(
        projection.declarationResolutionClaims.map((claim) => claim.id),
      );
      const copyIds = new Set<string>(projection.copies.map((copy) => copy.id));
      const bundleClaimIds = new Set<string>(projection.bundleClaims.map((claim) => claim.id));
      for (const row of allRows(buildImportMapVm(model, { selected: null }))) {
        for (const id of row.resolutionIds) {
          expect(resolutionIds.has(id)).toBe(true);
        }
        for (const claim of row.claims) {
          expect(claimIds.has(claim.claimId)).toBe(true);
        }
        for (const source of row.sources) {
          expect(copyIds.has(source.copyId)).toBe(true);
        }
        for (const bundle of row.bundles) {
          expect(bundleClaimIds.has(bundle.bundleClaimId)).toBe(true);
        }
      }
    }
  });
});

describe('buildImportMapVm — purity (T9.5-AC-05)', () => {
  it('same inputs yield deep-equal output and the model stays unmodified', () => {
    const model = modelOf('frankenstein-live');
    const before = structuredClone(model);
    const first = buildImportMapVm(model, { selected: 'react' });
    const second = buildImportMapVm(model, { selected: 'react' });
    expect(second).toEqual(first);
    expect(model).toEqual(before);
  });
});
