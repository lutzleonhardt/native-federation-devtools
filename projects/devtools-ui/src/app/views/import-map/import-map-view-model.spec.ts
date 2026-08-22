/**
 * Import Map view-model specs — fixture-driven acceptance plus seeded
 * cases for outcomes no capture exhibits (tagged SEEDED):
 *  - T9-AC-01: co-declared-share — one global package row with its
 *    recorded target, two consumer claims/resolutions, one copy, exactly
 *    one selected exact source.
 *  - T9-AC-02: every effective (scope, specifier) entry of every fixture
 *    renders once and only once with its recorded target; multiple
 *    claims/resolutions annotate rather than duplicate.
 *  - T9-AC-03: private paths, anchors, exact/ambiguous matches, scope
 *    ownership, host fallback, CDN/unattributable, blocked claims, and
 *    alias consumers stay distinguishable and qualified; unmapped and
 *    unknown resolutions carry no map-entry provenance and stay
 *    distinguishable by honest absence — they never invent or
 *    contaminate a row.
 *  - T9-AC-04: exact candidate attribution outranks scope attribution;
 *    prefix/nested outcomes come from the canonical resolver.
 *  - T9-AC-05 (builder half): map order, integrity, selection, and the
 *    honest empty states are preserved; the builder is pure over the
 *    model alone.
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
  ImportMapRowVm,
  ImportMapVm,
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
  return vm.sections.flatMap((section) => section.rows);
}

function rowOf(vm: ImportMapVm, specifier: string): ImportMapRowVm {
  const row = allRows(vm).find((candidate) => candidate.specifier === specifier);
  if (row === undefined) {
    throw new Error(`row not rendered: ${specifier}`);
  }
  return row;
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

function seededVm(overrides: Parameters<typeof seededSnapshot>[0]): ImportMapVm {
  return buildImportMapVm(ingestSnapshot(seededSnapshot(overrides)), { selected: null });
}

describe('buildImportMapVm — sections in map order (T9-AC-05)', () => {
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

  it('keeps rows in map order within their sections', () => {
    const globalRows = vm.sections[0].rows;
    expect(globalRows[0].specifier).toBe('@excalidraw/excalidraw');
    expect(globalRows[globalRows.length - 1].specifier).toBe('mermaid/./Bootstrap');
    expect(vm.sections[1].rows[0].specifier).toBe('@nf-internal/chunk-WW26EZ22');
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
    expect(vm.sections[1].rows[0].targetDisplay).toBe('chunk-WW26EZ22.js');
  });

  it('marks SRI exactly where the integrity data covers the target', () => {
    const model = modelOf('frankenstein-live');
    for (const row of allRows(vm)) {
      expect(row.hasIntegrity).toBe(row.target in model.effectiveMap.integrity);
    }
    expect(allRows(vm).every((row) => row.hasIntegrity)).toBe(true);
  });
});

describe('buildImportMapVm — one row per effective entry (T9-AC-02)', () => {
  it('renders every effective (scope, specifier) entry of every fixture exactly once', () => {
    for (const name of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const model = modelOf(name);
      const rendered = buildImportMapVm(model, { selected: null });
      const triples = rendered.sections.flatMap((section) =>
        section.rows.map((row) => `${section.scope ?? ''} ${row.specifier} ${row.target}`),
      );
      const recorded = model.importMapEntries.map(
        (entry) => `${entry.scope ?? ''} ${entry.specifier} ${entry.target}`,
      );
      expect(triples).toEqual(recorded);
      expect(new Set(triples).size).toBe(triples.length);
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

describe('buildImportMapVm — canonical claim annotations (T9-AC-01)', () => {
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
});

describe('buildImportMapVm — distinguishable outcomes (T9-AC-03)', () => {
  it('annotates private-path rows from private claims without a package link', () => {
    const vm = vmOf('scoped');
    const scopeSections = vm.sections.filter((section) => section.kind === 'scope');
    expect(scopeSections.map((section) => section.owner?.kind)).toEqual(['remote', 'remote']);
    const first = scopeSections[0].rows[0];
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

  it('keeps the pooling anchor visible on both consumer scopes — never quiet', () => {
    const vm = vmOf('pooling-anchor');
    const scoped = vm.sections.filter((section) => section.kind === 'scope');
    expect(scoped.map((section) => section.owner?.kind)).toEqual(['remote', 'remote']);
    for (const [index, consumer] of (['mfe1', 'mfe2'] as const).entries()) {
      const row = scoped[index].rows[0];
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
    }
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

  it('annotates expose rows from the recorded expose join', () => {
    const vm = vmOf('frankenstein-live');
    const expose = rowOf(vm, 'whiteboard/./Bootstrap');
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

  it('SEEDED: a foreign-origin target renders unattributable, never a guessed owner', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lodash: [seededParticipant('mfe-a', 'nope.js')] }),
      documentMaps: [mapTag({ lodash: 'https://cdn.example/lodash.js' })],
    });
    const row = rowOf(vm, 'lodash');
    expect(row.sources[0].qualifier).toBe('unattributable');
    expect(row.sources[0].display).toBeNull();
    expect(row.sources[0].note).toContain('CDN or foreign origin');
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
    const row = rowOf(vm, 'lib');
    expect(row.sources[0].qualifier).toBe('ambiguous-source');
    expect(row.sources[0].display).toBeNull();
    // Alias consumers (one scope URL, two names) annotate as two claims on
    // the one row.
    expect(row.claims.map((claim) => claim.display)).toEqual(['mfe-a', 'mfe-b']);
    expect(row.claims.every((claim) => !claim.quiet)).toBe(true);
  });

  it('SEEDED: a blocked claim annotates its matching map row', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ 'util/x': [seededParticipant('mfe-a', 'x.js')] }),
      documentMaps: [mapTag({ 'util/': './util' })],
    });
    const row = rowOf(vm, 'util/');
    expect(row.blocked).toEqual({
      reasons: ['prefix-target-missing-trailing-slash'],
      note: 'the matching import-map entry terminally blocks this binding (prefix-target-missing-trailing-slash)',
    });
    expect(row.claims.map((claim) => [claim.display, claim.state])).toEqual([['mfe-a', 'blocked']]);
    expect(row.sources).toEqual([]);
  });

  it('SEEDED: an alias specifier row stays honestly un-annotated', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./'), 'mfe-a': seededRemote('./mfe-a/') },
      sharedExternals: share({ lib: [seededParticipant('mfe-a', 'lib.js')] }),
      documentMaps: [mapTag({ lib: './mfe-a/lib.js', 'lib-alias': './mfe-a/lib.js' })],
    });
    expect(rowOf(vm, 'lib').packageSelect).toBe('__GLOBAL__|lib');
    const alias = rowOf(vm, 'lib-alias');
    // Same target, different specifier: no canonical binding resolves
    // through the alias row — no source, no claim, no package link.
    expect(alias.sources).toEqual([]);
    expect(alias.claims).toEqual([]);
    expect(alias.packageSelect).toBeNull();
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

describe('buildImportMapVm — attribution precedence (T9-AC-04)', () => {
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

describe('buildImportMapVm — bundle and chunk annotations', () => {
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

  it('annotates non-dense pseudo-external rows with group AND private claim', () => {
    const vm45 = vmOf('non-dense');
    const pseudo = allRows(vm45).find((row) => row.specifier.startsWith('@nf-internal/'))!;
    // Both canonical facts coexist on one row: the recorded chunk group
    // and the private-registration claim materializing the binding.
    expect(pseudo.chunks.map((chunk) => chunk.groupLabel)).toEqual([pseudo.specifier]);
    expect(pseudo.chunks[0].groupNoun).toBe('chunk group');
    expect(pseudo.sources[0].qualifier).toBe('exact-target-source');
    expect(pseudo.claims[0].note).toContain('private registration of mfe3');
    expect(pseudo.packageSelect).toBeNull();
  });
});

describe('buildImportMapVm — quiet norms (only exceptions speak)', () => {
  it('quiets a source chip restating the identity-owned scope section', () => {
    const vm = vmOf('strict-scope');
    const scoped = vm.sections.filter((section) => section.kind === 'scope');
    for (const section of scoped) {
      expect(section.rows[0].sourceQuiet).toBe(true);
      expect(section.rows[0].claims[0].quiet).toBe(true);
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

describe('buildImportMapVm — caption and empty states (T9-AC-05)', () => {
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

describe('buildImportMapVm — select matching (T9-AC-05)', () => {
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

describe('buildImportMapVm — purity (T9-AC-05)', () => {
  it('same inputs yield deep-equal output and the model stays unmodified', () => {
    const model = modelOf('frankenstein-live');
    const before = structuredClone(model);
    const first = buildImportMapVm(model, { selected: 'react' });
    const second = buildImportMapVm(model, { selected: 'react' });
    expect(second).toEqual(first);
    expect(model).toEqual(before);
  });
});
