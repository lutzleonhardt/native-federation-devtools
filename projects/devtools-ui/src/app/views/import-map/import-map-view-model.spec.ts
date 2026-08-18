/**
 * Import Map view-model specs — fixture-driven acceptance plus seeded
 * cases for outcomes no capture exhibits (tagged SEEDED):
 *  - T12-AC-01: frankenstein-live — GLOBAL IMPORTS first, then the
 *    page-base scope section in map order; the scope section names its
 *    owning remote (host, least-specific fallback); SRI markers match
 *    the integrity data.
 *  - T12-AC-02: `@nf-internal/chunk-*` rows carry their owning
 *    remote/bundle (shared chunk-map join) and the /remotes select;
 *    package rows carry the /packages select payload. SEEDED: an alias
 *    specifier on a shared target carries no package link; a chunk file
 *    claimed by two bundle lists names both bundles.
 *  - T12-AC-03: honesty caption verbatim; both mapMode 'none' paths
 *    render the same neutral empty state.
 *  - T12-AC-04: SEEDED foreign-origin target → unattributable; SEEDED
 *    most-specific tie → ambiguous — no guessed owner in either case.
 *  - T12-AC-05 (builder half): pure — same inputs, same output; inputs
 *    stay unmodified.
 *  - Select matching tolerates the literal `/./` infix from both sender
 *    conventions and marks every matching row.
 */
import { FIXTURES, NF_HOST } from 'devtools-bridge';
import type {
  DocumentImportMapV1,
  ExternalRemoteV1,
  ExternalScopesV1,
  RemoteV1,
  SnapshotV1,
} from 'devtools-bridge';

import type { DerivedFederation } from '../../shared/store/derived-model';
import { deriveFederation } from '../../shared/store/derivations';
import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import {
  IMPORT_MAP_CAPTION,
  ImportMapVm,
  buildImportMapVm,
} from './import-map-view-model';

const LIVE_BASE = 'https://lutzleonhardt.de/frankenstein-meeting-room/';
const SEEDED_PAGE = 'https://seeded.example/app/';

function inputsOf(name: keyof typeof FIXTURES): {
  model: FederationModel;
  derived: DerivedFederation;
} {
  const model = ingestSnapshot(FIXTURES[name]);
  return { model, derived: deriveFederation(model) };
}

function vmOf(name: keyof typeof FIXTURES, selected: string | null = null): ImportMapVm {
  const { model, derived } = inputsOf(name);
  return buildImportMapVm(model, derived, { selected });
}

function seededRemote(scopeUrl: string): RemoteV1 {
  return { scopeUrl, exposes: [], integrity: {} };
}

function seededParticipant(name: string): ExternalRemoteV1 {
  return {
    name,
    requiredVersion: '^1.0.0',
    strictVersion: false,
    file: 'entry.js',
    entries: null,
    cached: false,
    bundle: null,
    servedFiles: [{ entry: null, file: 'entry.js' }],
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

function seededSnapshot(overrides: {
  remotes?: Record<string, RemoteV1>;
  sharedExternals?: ExternalScopesV1;
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
      sharedChunks: {},
      generation: 'unknown',
    },
    importMaps: { documentMaps: overrides.documentMaps ?? [], effective: null },
    errors: [],
  };
}

function seededVm(overrides: Parameters<typeof seededSnapshot>[0]): ImportMapVm {
  const model = ingestSnapshot(seededSnapshot(overrides));
  return buildImportMapVm(model, deriveFederation(model), { selected: null });
}

describe('buildImportMapVm — sections in map order (T12-AC-01)', () => {
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

  it('names the scope section owner via the providers derivation (host fallback)', () => {
    const owner = vm.sections[1].owner;
    expect(owner?.kind).toBe('remote');
    if (owner?.kind === 'remote') {
      expect(owner.remote).toBe(NF_HOST);
      expect(owner.display).toBe('host');
      expect(owner.host).toBe(true);
      expect(owner.hostFallback).toBe(true);
      expect(owner.select).toBe(NF_HOST);
    }
  });

  it('quiets owner-restating providers in the scope section — only exceptions speak', () => {
    const scopeSection = vm.sections[1];
    expect(scopeSection.rows.every((row) => row.providerQuiet)).toBe(true);
    expect(scopeSection.showProvider).toBe(false);
    expect(scopeSection.showBundle).toBe(true);
    expect(scopeSection.trailingLabel).toBe('bundle');

    const globalSection = vm.sections[0];
    expect(globalSection.rows.some((row) => row.providerQuiet)).toBe(false);
    expect(globalSection.showProvider).toBe(true);
    expect(globalSection.showBundle).toBe(false);
    expect(globalSection.trailingLabel).toBe('served by');
  });

  it('labels the trailing column empty when neither providers nor bundles render', () => {
    // strict-scope: each remote's scope section holds only its own copy —
    // providers restate the owner, no chunk evidence exists.
    const strictVm = vmOf('strict-scope');
    const scopeSections = strictVm.sections.filter((section) => section.kind === 'scope');
    expect(scopeSections.length).toBeGreaterThan(0);
    for (const section of scopeSections) {
      expect(section.showProvider).toBe(false);
      expect(section.showBundle).toBe(false);
      expect(section.trailingLabel).toBe('');
    }
  });

  it('renders targets relative to the page base — verbatim URL kept as evidence', () => {
    const common = vm.sections[0].rows.find((row) => row.specifier === '@angular/common')!;
    expect(common.targetDisplay).toBe('_angular_common.Ucn2BmyRM1.js');
    expect(common.target).toBe(`${LIVE_BASE}_angular_common.Ucn2BmyRM1.js`);

    const react = vm.sections[0].rows.find((row) => row.specifier === 'react')!;
    expect(react.targetDisplay).toBe('whiteboard/react.QYXZqQxJ1j.js');

    const chunkRow = vm.sections[1].rows[0];
    expect(chunkRow.targetDisplay).toBe('chunk-WW26EZ22.js');
  });

  it('annotates per-row providers from the derivation, sentinel display mapped', () => {
    const react = vm.sections[0].rows.find((row) => row.specifier === 'react');
    expect(react?.provider.outcome).toBe('derived');
    if (react?.provider.outcome === 'derived') {
      expect(react.provider.remote).toBe('whiteboard');
      expect(react.provider.hostFallback).toBe(false);
    }
    const common = vm.sections[0].rows.find((row) => row.specifier === '@angular/common');
    expect(common?.provider.outcome).toBe('derived');
    if (common?.provider.outcome === 'derived') {
      expect(common.provider.display).toBe('host');
      expect(common.provider.hostFallback).toBe(true);
    }
  });

  it('marks SRI exactly where the integrity data covers the target', () => {
    const { model } = inputsOf('frankenstein-live');
    for (const section of vm.sections) {
      for (const row of section.rows) {
        expect(row.hasIntegrity).toBe(row.target in model.effectiveMap.integrity);
      }
    }
    expect(
      vm.sections.flatMap((section) => section.rows).every((row) => row.hasIntegrity),
    ).toBe(true);
  });
});

describe('buildImportMapVm — attribution annotations (T12-AC-02)', () => {
  const vm = vmOf('frankenstein-live');

  it('annotates @nf-internal/chunk-* rows with their owning bundle and remote', () => {
    const chunkRow = vm.sections[1].rows.find(
      (row) => row.specifier === '@nf-internal/chunk-WW26EZ22',
    );
    expect(chunkRow?.chunk).toEqual({
      owningRemote: NF_HOST,
      display: 'host',
      select: NF_HOST,
      bundleName: 'browser-angular_common',
      pseudoPackage: null,
      groupLabel: 'browser-angular_common',
      groupNoun: 'bundle',
      note: 'chunk file of host — joined via the effective-map target (rule: bundle-chunk join)',
    });
    expect(chunkRow?.packageSelect).toBeNull();
  });

  it('links package rows to the packages detail via the select payload', () => {
    const common = vm.sections[0].rows.find((row) => row.specifier === '@angular/common');
    expect(common?.packageSelect).toBe('__GLOBAL__|@angular/common');
    const subpath = vm.sections[0].rows.find(
      (row) => row.specifier === '@angular/core/primitives/di',
    );
    expect(subpath?.packageSelect).toBe('__GLOBAL__|@angular/core/primitives/di');
  });

  it('leaves expose rows package-free — the provider annotation carries them', () => {
    const expose = vm.sections[0].rows.find(
      (row) => row.specifier === 'whiteboard/./Bootstrap',
    );
    expect(expose?.packageSelect).toBeNull();
    expect(expose?.chunk).toBeNull();
    if (expose?.provider.outcome === 'derived') {
      expect(expose.provider.remote).toBe('whiteboard');
    } else {
      expect.unreachable('expose provider must derive to whiteboard');
    }
  });

  it('SEEDED: an alias specifier on the same target carries no package link', () => {
    const vm = seededVm({
      remotes: {
        [NF_HOST]: seededRemote('./'),
        'mfe-a': seededRemote('./mfe-a/'),
      },
      sharedExternals: {
        __GLOBAL__: {
          lib: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [seededParticipant('mfe-a')],
              },
            ],
          },
        },
      },
      documentMaps: [mapTag({ lib: './lib.js', 'lib-alias': './lib.js' })],
    });
    const rows = vm.sections[0].rows;
    expect(rows.find((row) => row.specifier === 'lib')?.packageSelect).toBe('__GLOBAL__|lib');
    // Same target, different specifier: the alias row is not the package
    // and must not pretend to be.
    expect(rows.find((row) => row.specifier === 'lib-alias')?.packageSelect).toBeNull();
  });

  it('SEEDED: a chunk file claimed by two bundle lists names both bundles', () => {
    const { model, derived } = inputsOf('frankenstein-live');
    const seeded: FederationModel = {
      ...model,
      chunkGroups: [
        ...model.chunkGroups,
        {
          owningRemote: NF_HOST,
          bundleName: 'seeded-second',
          pseudoPackage: null,
          origin: 'shared-chunks',
          files: ['chunk-WW26EZ22.js'],
          mapped: true,
        },
      ],
    };
    const vm = buildImportMapVm(seeded, derived, { selected: null });
    const chunkRow = vm.sections[1].rows.find(
      (row) => row.specifier === '@nf-internal/chunk-WW26EZ22',
    );
    expect(chunkRow?.chunk?.groupLabel).toBe('browser-angular_common · seeded-second');
    expect(chunkRow?.chunk?.groupNoun).toBe('bundles');
  });

  it('annotates non-dense pseudo-external rows with their owning remote group', () => {
    const vm45 = vmOf('non-dense');
    const scopeSections = vm45.sections.filter((section) => section.kind === 'scope');
    const pseudoRow = scopeSections
      .flatMap((section) => section.rows)
      .find((row) => row.specifier.startsWith('@nf-internal/'));
    expect(pseudoRow).toBeDefined();
    expect(pseudoRow!.chunk).not.toBeNull();
    expect(pseudoRow!.chunk!.pseudoPackage).toBe(pseudoRow!.specifier);
    // A pseudo-external group carries no bundle — the annotation must not
    // claim one.
    expect(pseudoRow!.chunk!.groupNoun).toBe('chunk group');
  });
});

describe('buildImportMapVm — caption and empty states (T12-AC-03)', () => {
  it('carries the honesty caption verbatim', () => {
    expect(vmOf('frankenstein-live').caption).toBe(
      'This layer proves resolution only — an import-mapped file is not necessarily requested, and a requested file is not proof of execution.',
    );
    expect(IMPORT_MAP_CAPTION).toBe(vmOf('synthetic-empty-page').caption);
  });

  it("renders the honest empty state for both mapMode 'none' paths — no invented map", () => {
    // documentMaps [] (the scan ran) and importMaps null (the scan never
    // ran) both land here; the view must not claim an observation the
    // capture lacks, and channel talk belongs to the strip (XC-05) — so
    // one neutral note for both.
    for (const fixture of ['synthetic-empty-page', 'synthetic-no-import-maps'] as const) {
      const vm = vmOf(fixture);
      expect(vm.sections).toEqual([]);
      expect(vm.emptyNote).toBe('no import map recorded in this capture');
    }
  });
});

describe('buildImportMapVm — honest provider outcomes (T12-AC-04, SEEDED)', () => {
  it('SEEDED: a foreign-origin target renders unattributable, never a guessed owner', () => {
    const vm = seededVm({
      remotes: { [NF_HOST]: seededRemote('./') },
      documentMaps: [mapTag({ lodash: 'https://cdn.example/lodash.js' })],
    });
    const row = vm.sections[0].rows.find((candidate) => candidate.specifier === 'lodash');
    expect(row?.provider.outcome).toBe('unattributable');
    if (row?.provider.outcome === 'unattributable') {
      expect(row.provider.note).toContain('CDN or foreign origin');
    }
    expect(row?.packageSelect).toBeNull();
    // A foreign-origin target keeps its absolute URL — it must stand out.
    expect(row?.targetDisplay).toBe('https://cdn.example/lodash.js');
  });

  it('SEEDED: a most-specific scope-prefix tie renders ambiguous with its candidates', () => {
    const vm = seededVm({
      remotes: {
        'team-a': seededRemote('./team/app/'),
        'team-b': seededRemote('./team/app/'),
        [NF_HOST]: seededRemote('./'),
      },
      documentMaps: [
        mapTag({}, { './team/app/': { shared: './team/app/shared.js' } }),
      ],
    });
    const scopeSection = vm.sections.find((section) => section.kind === 'scope');
    const row = scopeSection?.rows.find((candidate) => candidate.specifier === 'shared');
    expect(row?.provider.outcome).toBe('ambiguous');
    if (row?.provider.outcome === 'ambiguous') {
      // Most specific first, host always last (T7 candidates contract).
      expect(row.provider.candidates).toEqual(['team-a', 'team-b', NF_HOST]);
      expect(row.provider.note).toContain('team-a, team-b, host');
    }
    // The note claims only non-derivability — with a single ambiguous row
    // nothing "differs", so it must not say so.
    expect(scopeSection?.owner).toEqual({
      kind: 'mixed',
      note: 'no single owning remote derivable for this scope',
    });
  });
});

describe('buildImportMapVm — select matching', () => {
  it('tolerates the literal /./ infix from both sender conventions', () => {
    const collapsed = vmOf('frankenstein-live', 'whiteboard/Bootstrap');
    const literal = vmOf('frankenstein-live', 'whiteboard/./Bootstrap');
    for (const vm of [collapsed, literal]) {
      const selected = vm.sections
        .flatMap((section) => section.rows)
        .filter((row) => row.selected);
      expect(selected.map((row) => row.specifier)).toEqual(['whiteboard/./Bootstrap']);
    }
  });

  it('marks the packages-entry payload and stays empty without a match', () => {
    const vm = vmOf('frankenstein-live', '@angular/common/http');
    const selected = vm.sections
      .flatMap((section) => section.rows)
      .filter((row) => row.selected);
    expect(selected.map((row) => row.specifier)).toEqual(['@angular/common/http']);

    const none = vmOf('frankenstein-live', 'not-in-this-map');
    expect(
      none.sections.flatMap((section) => section.rows).some((row) => row.selected),
    ).toBe(false);
  });
});

describe('buildImportMapVm — purity (T12-AC-05)', () => {
  it('same inputs yield deep-equal output and inputs stay unmodified', () => {
    const { model, derived } = inputsOf('frankenstein-live');
    const modelBefore = structuredClone(model);
    const derivedBefore = structuredClone(derived);
    const first = buildImportMapVm(model, derived, { selected: 'react' });
    const second = buildImportMapVm(model, derived, { selected: 'react' });
    expect(second).toEqual(first);
    expect(model).toEqual(modelBefore);
    expect(derived).toEqual(derivedBefore);
  });
});
