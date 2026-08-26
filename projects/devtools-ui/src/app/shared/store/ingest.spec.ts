/**
 * ingestSnapshot specs — fixture-driven acceptance plus seeded cases for
 * what no capture can show (each tagged SEEDED: they prove the store
 * reads a shape, not that the runtime produces it):
 *  - T6-AC-01: clean-skip skip registration and its participant intact;
 *    strict-split's same tag yields distinct skip/scope registrations with
 *    their own participants, in raw registry order.
 *  - T6-AC-02: frankenstein-live — 20 packages, one participant each,
 *    every consumer resolution mapped to an integrity-covered target.
 *  - T6-AC-04: chunk union — scoped pseudo-externals (non-dense) and
 *    shared-chunks (frankenstein-live, host only) become canonical chunk
 *    groups; true scoped packages are private registrations; chunks never
 *    count as packages.
 *  - T6-AC-05: absent and `{}` repository keys are equivalent (the legacy
 *    store-side row sort died with the Task-11 cutover — canonical
 *    registrations retain raw order, views sort).
 *  - T6-AC-06: SEEDED mixed-generation participants and the
 *    neither-spelling declaration; the `/./` expose join (corpus-backed).
 *  - T3-AC-02/03: consumer-scoped import-map outcomes, including missing
 *    consumer scopes and alias de-duplication.
 * Every pin reads the canonical evidence, resolutions, and projection —
 * the model carries no legacy participant rows.
 */
import { FIXTURES } from 'devtools-bridge';
import type {
  DocumentImportMapV1,
  ExternalRemoteV1,
  ExternalScopesV1,
  RemoteV1,
  SnapshotV1,
} from 'devtools-bridge';

import { ingestSnapshot } from './ingest';

const SEEDED_PAGE = 'https://seeded.example/app/';

function seededSnapshot(overrides: {
  sharedExternals?: ExternalScopesV1;
  documentMaps?: DocumentImportMapV1[];
  remotes?: Record<string, RemoteV1>;
}): SnapshotV1 {
  return {
    schemaVersion: 1,
    capture: {
      pageUrl: SEEDED_PAGE,
      capturedAt: '2026-08-11T00:00:00.000Z',
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

function seededParticipant(
  name: string,
  overrides: Partial<ExternalRemoteV1> = {},
): ExternalRemoteV1 {
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
    ...overrides,
  };
}

describe('ingestSnapshot — canonical registry evidence (T1-AC-06)', () => {
  it('wires canonical records into the model', () => {
    const model = ingestSnapshot(FIXTURES['co-declared-share']);
    const evidence = model.registryEvidence;

    expect(evidence.sharedExternals).toHaveLength(1);
    expect(evidence.versionRegistrations).toHaveLength(1);
    expect(evidence.participantDeclarations).toHaveLength(2);
    expect(evidence.versionRegistrations[0].participantDeclarationIds).toEqual(
      evidence.participantDeclarations.map((declaration) => declaration.id),
    );
    expect(evidence.participantDeclarations.map((declaration) => declaration.participant)).toEqual([
      'mfe1',
      'mfe2',
    ]);
  });
});

describe('ingestSnapshot — effective consumer resolutions (T3-AC-02, T3-AC-03)', () => {
  it('resolves a co-declared share independently for the two consumer scope contexts', () => {
    const resolutions = ingestSnapshot(FIXTURES['co-declared-share']).effectiveConsumerResolutions;
    const mapped = resolutions.filter((resolution) => resolution.status === 'mapped');

    expect(resolutions).toHaveLength(2);
    expect(mapped).toHaveLength(2);
    expect(new Set(mapped.map((resolution) => resolution.id)).size).toBe(2);
    expect(new Set(mapped.map((resolution) => resolution.scopeContextKey)).size).toBe(2);
    expect(
      mapped.map((resolution) => ({
        consumerScopeUrl: resolution.consumerScopeUrl,
        specifier: resolution.specifier,
        consumerRemotes: resolution.consumerRemotes,
        targetUrl: resolution.targetUrl,
        hasIntegrity: resolution.hasIntegrity,
        mapEntry: resolution.mapEntry,
      })),
    ).toEqual([
      {
        consumerScopeUrl: 'http://localhost:4300/mfe1/',
        specifier: '@nf-lab/conflict-lib',
        consumerRemotes: ['mfe1'],
        targetUrl: 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
        hasIntegrity: false,
        mapEntry: {
          source: 'effective-import-map',
          scope: null,
          specifier: '@nf-lab/conflict-lib',
          target: 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
          match: 'exact',
        },
      },
      {
        consumerScopeUrl: 'http://localhost:4300/mfe2/',
        specifier: '@nf-lab/conflict-lib',
        consumerRemotes: ['mfe2'],
        targetUrl: 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
        hasIntegrity: false,
        mapEntry: {
          source: 'effective-import-map',
          scope: null,
          specifier: '@nf-lab/conflict-lib',
          target: 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
          match: 'exact',
        },
      },
    ]);
  });

  it('SEEDED: collapses remote aliases with the same normalized consumer scope URL', () => {
    const snapshot = seededSnapshot({
      remotes: {
        'z-alias': { scopeUrl: './consumer/', exposes: [], integrity: {} },
        'a-alias': {
          scopeUrl: 'https://seeded.example/app/consumer/',
          exposes: [],
          integrity: {},
        },
      },
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [seededParticipant('z-alias'), seededParticipant('a-alias')],
              },
            ],
          },
        },
      },
    });

    const resolutions = ingestSnapshot(snapshot).effectiveConsumerResolutions;

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].id.length).toBeGreaterThan(0);
    expect(resolutions[0].scopeContextKey.length).toBeGreaterThan(0);
    expect(resolutions[0]).toEqual({
      id: resolutions[0].id,
      scopeContextKey: resolutions[0].scopeContextKey,
      consumerScopeUrl: 'https://seeded.example/app/consumer/',
      specifier: 'pkg',
      consumerRemotes: ['a-alias', 'z-alias'],
      status: 'unmapped',
      targetUrl: null,
      mapEntry: null,
    });
  });

  it('SEEDED: retains a top-level blocking entry', () => {
    const snapshot = seededSnapshot({
      remotes: {
        consumer: { scopeUrl: './consumer/', exposes: [], integrity: {} },
      },
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [seededParticipant('consumer')],
              },
            ],
          },
        },
      },
      documentMaps: [
        {
          kind: 'importmap',
          parsed: true,
          importCount: 1,
          scopeCount: 0,
          imports: [{ specifier: 'pkg', target: 'http://[' }],
          scopes: [],
          integrity: {},
        },
      ],
    });

    const model = ingestSnapshot(snapshot);

    expect(model.effectiveConsumerResolutions[0]).toMatchObject({
      status: 'blocked',
      targetUrl: null,
      blockedReason: 'invalid-target-url',
      mapEntry: {
        source: 'effective-import-map',
        scope: null,
        specifier: 'pkg',
        target: 'http://[',
        match: 'exact',
      },
    });
  });

  it('SEEDED: keeps a missing consumer scope unknown despite a top-level mapping', () => {
    const snapshot = seededSnapshot({
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [seededParticipant('missing-remote')],
              },
            ],
          },
        },
      },
      documentMaps: [
        {
          kind: 'importmap',
          parsed: true,
          importCount: 1,
          scopeCount: 0,
          imports: [{ specifier: 'pkg', target: './mapped.js' }],
          scopes: [],
          integrity: {},
        },
      ],
    });

    const model = ingestSnapshot(snapshot);
    const [resolution] = model.effectiveConsumerResolutions;

    expect(model.effectiveConsumerResolutions).toHaveLength(1);
    expect(resolution.id.length).toBeGreaterThan(0);
    expect(resolution.scopeContextKey).not.toBe(SEEDED_PAGE);
    expect(resolution).toEqual({
      id: resolution.id,
      scopeContextKey: resolution.scopeContextKey,
      consumerScopeUrl: null,
      specifier: 'pkg',
      consumerRemotes: ['missing-remote'],
      status: 'unknown',
      targetUrl: null,
      mapEntry: null,
      unknownReasons: ['missing-consumer-scope'],
    });
  });

  it('SEEDED: keeps shim-only evidence unknown when document-map collection is unavailable', () => {
    const snapshot = seededSnapshot({
      remotes: {
        consumer: { scopeUrl: './consumer/', exposes: [], integrity: {} },
      },
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [seededParticipant('consumer')],
              },
            ],
          },
        },
      },
    });
    snapshot.channels.domImportMaps = {
      state: 'unavailable',
      reason: 'seeded: document-map collection failed',
    };
    snapshot.channels.importShim = { state: 'available' };
    snapshot.importMaps!.effective = {
      imports: [{ specifier: 'pkg', target: './shim-only.js' }],
      scopes: [],
      integrityFor: [],
    };

    const model = ingestSnapshot(snapshot);

    expect(model.effectiveMap).toEqual({ imports: {}, scopes: {}, integrity: {} });
    expect(model.effectiveConsumerResolutions[0]).toMatchObject({
      status: 'unknown',
      targetUrl: null,
      mapEntry: null,
      unknownReasons: ['missing-map-channel'],
    });
  });

  it('uses native document maps when the captured shim effective map is empty', () => {
    const snapshot = FIXTURES['dynamic-init-native'];
    const model = ingestSnapshot(snapshot);

    expect(snapshot.importMaps?.effective).toEqual({ imports: [], scopes: [], integrityFor: [] });
    expect(model.mapMode).toBe('native');
    expect(model.effectiveMap.imports['@nf-lab/conflict-lib']).toBe(
      'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
    );
    expect(
      model.effectiveConsumerResolutions.map((resolution) => [
        resolution.consumerScopeUrl,
        resolution.consumerRemotes,
        resolution.status,
        resolution.targetUrl,
      ]),
    ).toEqual([
      [
        'http://localhost:4300/mfe1/',
        ['mfe1'],
        'mapped',
        'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
      ],
      [
        'http://localhost:4300/mfe2/',
        ['mfe2'],
        'mapped',
        'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
      ],
    ]);
  });
});

describe('ingestSnapshot — SPA-navigated capture (resolution base recovery)', () => {
  // Miniature of the playground bug: the map parsed at the load URL, then
  // history.pushState moved pageUrl into a directory that textually equals
  // another remote's scope. Resolving relative targets and the host's
  // `./` scope against pageUrl makes host and checkout candidates collide
  // on the same URL — every share degrades to an ambiguous target-URL
  // copy. The recovered parse-time base keeps the attribution unique.
  function spaNavigatedSnapshot(): SnapshotV1 {
    const snapshot = seededSnapshot({
      remotes: {
        '__NF-HOST__': { scopeUrl: './', exposes: [], integrity: {} },
        '@seeded/checkout': { scopeUrl: '/playground/checkout/', exposes: [], integrity: {} },
      },
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: true,
                remotes: [
                  seededParticipant('__NF-HOST__', {
                    file: 'pkg.hash.js',
                    servedFiles: [{ entry: null, file: 'pkg.hash.js' }],
                  }),
                  seededParticipant('@seeded/checkout', {
                    file: 'pkg.hash.js',
                    servedFiles: [{ entry: null, file: 'pkg.hash.js' }],
                  }),
                ],
              },
            ],
          },
        },
      },
      documentMaps: [
        {
          kind: 'importmap-shim',
          parsed: true,
          importCount: 1,
          scopeCount: 0,
          imports: [{ specifier: 'pkg', target: './pkg.hash.js' }],
          scopes: [],
          integrity: {},
        },
      ],
    });
    snapshot.capture.pageUrl = 'https://seeded.example/playground/checkout/cart';
    snapshot.channels.importShim = { state: 'available' };
    snapshot.importMaps!.effective = {
      imports: [{ specifier: 'pkg', target: 'https://seeded.example/playground/pkg.hash.js' }],
      scopes: [],
      integrityFor: [],
    };
    return snapshot;
  }

  it('SEEDED: resolves load-time-relative values against the recovered base, not pageUrl', () => {
    const model = ingestSnapshot(spaNavigatedSnapshot());

    const host = model.remotes.find((remote) => remote.isHost)!;
    expect(host.resolvedScopeUrl).toBe('https://seeded.example/playground/');
    expect(model.effectiveMap.imports['pkg']).toBe('https://seeded.example/playground/pkg.hash.js');

    const projection = model.resolutionProjection;
    expect(projection.copies).toHaveLength(1);
    expect(projection.copies[0]).toMatchObject({
      sourcePackage: 'pkg',
      sourceDisposition: 'share-registration',
      source: { kind: 'shared-declaration', participant: '__NF-HOST__' },
    });
    expect(projection.completeness.total.ambiguousSourceClaims).toBe(0);
  });

  it('resolves the live playground checkout export with every source unique', () => {
    // The real capture behind the seeded miniature: pageUrl
    // /playground/checkout/cart, map parsed at /playground/. Before base
    // recovery this export degraded into 12 ambiguous target-URL copies
    // (24 ambiguous source claims).
    const model = ingestSnapshot(FIXTURES['exported-playground-checkout']);

    const host = model.remotes.find((remote) => remote.isHost)!;
    expect(host.resolvedScopeUrl).toBe('https://native-federation.github.io/playground/');
    expect(model.effectiveMap.imports['@angular/common']).toBe(
      'https://native-federation.github.io/playground/_angular_common.G-CZnQLQoU.js',
    );

    const projection = model.resolutionProjection;
    expect(projection.copies).toHaveLength(12);
    expect(
      projection.copies
        .map((copy) => [copy.sourcePackage, copy.sourceDisposition])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual(
      [
        '@angular/common',
        '@angular/core',
        '@angular/elements',
        '@angular/forms',
        '@angular/platform-browser',
        '@angular/router',
        '@ng-internal/event-bus',
        '@ng-internal/navigation',
        '@ng-internal/ui',
        '@ng-internal/url',
        'rxjs',
        'tslib',
      ].map((packageName) => [packageName, 'share-registration']),
    );
    expect(projection.completeness.total).toEqual({
      unknownResolutions: 0,
      unmappedResolutions: 0,
      blockedResolutions: 0,
      ambiguousSourceClaims: 0,
    });
  });
});

describe('ingestSnapshot — core relation (T6-AC-01)', () => {
  it('keeps the clean-skip skip registration and its participant intact', () => {
    const model = ingestSnapshot(FIXTURES['clean-skip']);
    const { sharedExternals, versionRegistrations, participantDeclarations } =
      model.registryEvidence;

    expect(sharedExternals.map((external) => [external.shareScope, external.packageName])).toEqual([
      ['__GLOBAL__', '@nf-lab/conflict-lib'],
    ]);
    expect(
      versionRegistrations.map((registration) => [
        registration.tag,
        registration.action,
        registration.host,
        registration.participantDeclarationIds.length,
      ]),
    ).toEqual([
      ['2.0.0', 'share', false, 1],
      ['1.0.0', 'skip', false, 1],
    ]);
    expect(
      participantDeclarations.map((declaration) => [
        declaration.participant,
        declaration.requiredVersion,
        declaration.strictVersion,
        declaration.bundle,
        declaration.cached,
        declaration.generation,
      ]),
    ).toEqual([
      ['mfe2', '>=1.0.0 <3.0.0', false, 'browser-shared', true, 'v4.5'],
      ['mfe1', '>=1.0.0 <3.0.0', false, 'browser-shared', false, 'v4.5'],
    ]);
    // The map serves the winning 2.0.0 copy to every consumer scope context —
    // the skip participant's own file has no map entry.
    expect(
      model.effectiveConsumerResolutions.map((resolution) => [
        resolution.consumerRemotes,
        resolution.status,
        resolution.targetUrl,
      ]),
    ).toEqual([
      [['mfe1'], 'mapped', 'http://localhost:4300/mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js'],
      [['mfe2'], 'mapped', 'http://localhost:4300/mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js'],
    ]);
  });

  it('splits the strict-split 1.0.0 tag into distinct skip and scope registrations with their own participants', () => {
    const model = ingestSnapshot(FIXTURES['strict-split']);
    const { versionRegistrations, participantDeclarations } = model.registryEvidence;
    const declarationById = new Map(
      participantDeclarations.map((declaration) => [declaration.id, declaration]),
    );

    // Raw registry order retained — canonical evidence never re-sorts.
    expect(
      versionRegistrations.map((registration) => [
        registration.tag,
        registration.action,
        registration.participantDeclarationIds.map((id) => declarationById.get(id)?.participant),
      ]),
    ).toEqual([
      ['2.0.0', 'share', ['__NF-HOST__']],
      ['1.0.0', 'skip', ['mfe1']],
      ['1.0.0', 'scope', ['mfe3']],
    ]);
  });
});

describe('ingestSnapshot — frankenstein-live (T6-AC-02)', () => {
  const model = ingestSnapshot(FIXTURES['frankenstein-live']);

  it('yields 20 packages with one registration and one participant each', () => {
    const { sharedExternals, versionRegistrations, participantDeclarations } =
      model.registryEvidence;
    expect(sharedExternals).toHaveLength(20);
    expect(new Set(sharedExternals.map((external) => external.packageName)).size).toBe(20);
    expect(versionRegistrations).toHaveLength(20);
    expect(participantDeclarations).toHaveLength(20);
  });

  it('maps every consumer resolution to an integrity-covered absolute target', () => {
    expect(model.effectiveConsumerResolutions).toHaveLength(20);
    for (const resolution of model.effectiveConsumerResolutions) {
      expect(resolution.status).toBe('mapped');
      expect(resolution.targetUrl).toMatch(/^https:\/\/lutzleonhardt\.de\//);
      expect(resolution.status === 'mapped' && resolution.hasIntegrity).toBe(true);
    }
  });

  it('flattens the effective map into 22 top-level and 7 scoped entries', () => {
    expect(model.mapMode).toBe('shim');
    expect(model.importMapEntries).toHaveLength(29);
    expect(model.importMapEntries.filter((entry) => entry.scope === null)).toHaveLength(22);
  });
});

describe('ingestSnapshot — chunk union (T6-AC-04)', () => {
  it('reclassifies non-dense @nf-internal scoped externals into chunk groups', () => {
    const model = ingestSnapshot(FIXTURES['non-dense']);
    const groups = model.resolutionProjection.chunkGroups;

    expect(groups).toHaveLength(7);
    for (const group of groups) {
      expect(group.origin).toBe('scoped-pseudo-external');
      expect(group.emitterRemote).toBe('mfe3');
      expect(group.pseudoPackage).toMatch(/^@nf-internal\//);
      expect(group.bundleName).toBeNull();
      expect(group.files).toHaveLength(1);
    }
    // The registry records the pseudo-externals as private registrations
    // (raw evidence is retained, never dropped); they never become shared
    // externals — the views keep them out of the package surfaces via the
    // chunk groups.
    const { sharedExternals, privateRegistrations } = model.registryEvidence;
    expect(privateRegistrations).toHaveLength(7);
    for (const registration of privateRegistrations) {
      expect(registration.packageName).toMatch(/^@nf-internal\//);
    }
    const isChunkPseudoPackage = (packageName: string) => packageName.startsWith('@nf-internal/');
    expect(sharedExternals.some((external) => isChunkPseudoPackage(external.packageName))).toBe(
      false,
    );
    expect(new Set(sharedExternals.map((external) => external.packageName)).size).toBe(14);
    // Every pseudo-external became a canonical chunk group of its emitter.
    expect(groups.map((group) => group.pseudoPackage).sort()).toEqual(
      privateRegistrations.map((registration) => registration.packageName).sort(),
    );
  });

  it('collects frankenstein-live chunks from shared-chunks bundle lists (host only)', () => {
    const model = ingestSnapshot(FIXTURES['frankenstein-live']);
    const groups = model.resolutionProjection.chunkGroups;

    expect(
      groups
        .map((group) => [group.emitterRemote, group.bundleName, group.files.length, group.origin])
        .sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
    ).toEqual([
      ['__NF-HOST__', 'browser-angular_common', 1, 'shared-chunks'],
      ['__NF-HOST__', 'browser-angular_core', 5, 'shared-chunks'],
      ['__NF-HOST__', 'browser-rxjs', 1, 'shared-chunks'],
    ]);
    // The structural zero-entry 'mapping-or-exposed' list contributes no group.
    expect(groups.some((group) => group.bundleName === 'mapping-or-exposed')).toBe(false);
  });

  it('keeps true scoped packages as private registrations', () => {
    const model = ingestSnapshot(FIXTURES['scoped']);

    expect(model.resolutionProjection.chunkGroups).toEqual([]);
    expect(model.registryEvidence.sharedExternals).toEqual([]);
    expect(
      model.registryEvidence.privateRegistrations.map((registration) => [
        registration.ownerRemote,
        registration.packageName,
        registration.tag,
      ]),
    ).toEqual([
      ['mfe1', '@nf-lab/conflict-lib', '1.0.0'],
      ['mfe2', '@nf-lab/conflict-lib', '2.0.0'],
    ]);
  });
});

describe('ingestSnapshot — lazy repositories (T6-AC-05)', () => {
  it('SEEDED: retains raw registration order — the canonical evidence never re-sorts', () => {
    const snapshot = seededSnapshot({
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              { tag: '1.0.0', action: 'share', host: false, remotes: [seededParticipant('a')] },
              { tag: '10.0.0', action: 'share', host: false, remotes: [seededParticipant('b')] },
              {
                tag: '2.0.0-rc.1',
                action: 'share',
                host: false,
                remotes: [seededParticipant('c')],
              },
              { tag: '2.0.0', action: 'skip', host: false, remotes: [seededParticipant('d')] },
              { tag: '2.0.0', action: 'share', host: false, remotes: [seededParticipant('e')] },
            ],
          },
        },
      },
    });

    expect(
      ingestSnapshot(snapshot).registryEvidence.versionRegistrations.map((registration) => [
        registration.tag,
        registration.action,
      ]),
    ).toEqual([
      ['1.0.0', 'share'],
      ['10.0.0', 'share'],
      ['2.0.0-rc.1', 'share'],
      ['2.0.0', 'skip'],
      ['2.0.0', 'share'],
    ]);
  });

  it('treats the absent and the empty repository key alike', () => {
    // scoped: shared-externals ABSENT in the capture; frankenstein-live:
    // scoped-externals present as {} — both ingest to zero records.
    expect(ingestSnapshot(FIXTURES['scoped']).registryEvidence.sharedExternals).toEqual([]);
    expect(
      ingestSnapshot(FIXTURES['frankenstein-live']).registryEvidence.privateRegistrations,
    ).toEqual([]);
  });

  it('ingests a runtime-less snapshot to empty entities with unknown generation', () => {
    const model = ingestSnapshot(FIXTURES['synthetic-missing-channel']);

    expect(model.registryEvidence.sharedExternals).toEqual([]);
    expect(model.registryEvidence.privateRegistrations).toEqual([]);
    expect(model.remotes).toEqual([]);
    expect(model.resolutionProjection.chunkGroups).toEqual([]);
    expect(model.resolutionProjection.copies).toEqual([]);
    expect(model.provenance.generation).toBe('unknown');
    expect(model.mapMode).toBe('native');
  });
});

describe('ingestSnapshot — seeded shapes and joins (T6-AC-06)', () => {
  it('SEEDED: ingests mixed-generation participants per participant', () => {
    const snapshot = seededSnapshot({
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [
                  seededParticipant('released'),
                  seededParticipant('v45', {
                    file: null,
                    entries: { pkg: './pkg.js' },
                    servedFiles: [{ entry: 'pkg', file: './pkg.js' }],
                    generation: 'v4.5',
                  }),
                ],
              },
            ],
          },
        },
      },
    });

    const declarations = ingestSnapshot(snapshot).registryEvidence.participantDeclarations;
    expect(
      declarations.map((declaration) => [declaration.participant, declaration.generation]),
    ).toEqual([
      ['released', 'v4'],
      ['v45', 'v4.5'],
    ]);
  });

  it('SEEDED: reads a declaration carrying neither spelling without inventing entrypoints', () => {
    // The mapper never emits this shape (it drops the row with an error);
    // the store must still read it.
    const snapshot = seededSnapshot({
      sharedExternals: {
        __GLOBAL__: {
          pkg: {
            dirty: false,
            versions: [
              {
                tag: '1.0.0',
                action: 'share',
                host: false,
                remotes: [
                  seededParticipant('spellingless', { file: null, entries: null, servedFiles: [] }),
                ],
              },
            ],
          },
        },
      },
    });

    const model = ingestSnapshot(snapshot);
    const { participantDeclarations, entrypointCandidates } = model.registryEvidence;
    expect(participantDeclarations).toHaveLength(1);
    expect(participantDeclarations[0].participant).toBe('spellingless');
    expect(participantDeclarations[0].entrypointCandidateIds).toEqual([]);
    expect(entrypointCandidates).toEqual([]);
    expect(model.effectiveConsumerResolutions[0].status).not.toBe('mapped');
  });

  it('joins an expose through the literal /./ specifier infix (corpus-backed)', () => {
    const model = ingestSnapshot(FIXTURES['dynamic-init-shim']);

    const mfe1 = model.remotes.find((remote) => remote.name === 'mfe1')!;
    expect(mfe1.exposes).toEqual([
      {
        moduleName: './Component',
        file: 'Component-RJXV7SVT.js',
        // Joined via the naive 'mfe1/./Component' map specifier.
        mapTarget: 'http://localhost:4300/mfe1/Component-RJXV7SVT.js',
      },
    ]);
  });
});

describe('ingestSnapshot — provenance carry', () => {
  it('carries generation, capture timestamp, and schema version into the store', () => {
    const model = ingestSnapshot(FIXTURES['frankenstein-live']);

    expect(model.provenance).toEqual({
      schemaVersion: 1,
      pageUrl: 'https://lutzleonhardt.de/frankenstein-meeting-room/',
      capturedAt: '2026-08-11T11:56:25.504Z',
      collectorVersion: 'nf-devtools-collector/3',
      generation: 'v4',
    });
    expect(model.channels).toEqual(FIXTURES['frankenstein-live'].channels);
  });
});

describe('ingestSnapshot — canonical resolution projection (resolution-model Task 6)', () => {
  it('publishes the complete attached pipeline with consistent references', () => {
    const model = ingestSnapshot(FIXTURES['pooling-anchor']);
    const projection = model.resolutionProjection;

    expect(projection.remotes.map((remote) => remote.name)).toEqual(
      model.remotes.map((remote) => remote.name),
    );
    // The published claims are the attached collection: mapped claims carry
    // their copy link, everything else an explicit null.
    const copyIds = new Set(projection.copies.map((copy) => copy.id));
    expect(
      projection.declarationResolutionClaims.some(
        (claim) => claim.copyId !== null && copyIds.has(claim.copyId),
      ),
    ).toBe(true);
    for (const relation of projection.consumerRelations) {
      expect(copyIds.has(relation.copyId)).toBe(true);
    }
    expect(projection.packageMeasures.length).toBeGreaterThan(0);
    expect(projection.completeness.total).toEqual({
      unknownResolutions: 0,
      unmappedResolutions: 0,
      blockedResolutions: 0,
      ambiguousSourceClaims: 0,
    });
  });

  it('joins frankenstein-live host bundles to dense chunk groups as mapped-source', () => {
    const model = ingestSnapshot(FIXTURES['frankenstein-live']);
    const projection = model.resolutionProjection;

    const rxjsClaims = projection.bundleClaims.filter(
      (bundleClaim) => bundleClaim.bundle === 'browser-rxjs',
    );
    expect(rxjsClaims.length).toBeGreaterThan(0);
    const chunkGroupsById = new Map(projection.chunkGroups.map((group) => [group.id, group]));
    for (const bundleClaim of rxjsClaims) {
      expect(bundleClaim.status).toBe('mapped-source');
      expect(bundleClaim.sourceRemote).toBe('__NF-HOST__');
      expect(bundleClaim.chunkGroupIds).toHaveLength(1);
      expect(chunkGroupsById.get(bundleClaim.chunkGroupIds[0])?.files).toEqual([
        'chunk-PAMKM67I.js',
      ]);
    }
  });
});
