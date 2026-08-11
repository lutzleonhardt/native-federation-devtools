/**
 * ingestSnapshot specs — fixture-driven acceptance plus seeded cases for
 * what no capture can show (each tagged SEEDED: they prove the store
 * reads a shape, not that the runtime produces it):
 *  - T6-AC-01: clean-skip skip-row participants intact; strict-split's
 *    same tag yields distinct skip/scope rows with their own participants.
 *  - T6-AC-02: frankenstein-live — 20 packages, one participant each,
 *    every row joined to an integrity-covered map target.
 *  - T6-AC-04: chunk union — scoped pseudo-externals (non-dense) and
 *    shared-chunks (frankenstein-live, host only); true scoped packages
 *    stay; chunks never count as packages.
 *  - T6-AC-05: version rows sort (semver desc, action) regardless of
 *    input order; absent and `{}` repository keys are equivalent.
 *  - T6-AC-06: SEEDED mixed-generation participants and the
 *    neither-spelling row; the `/./` expose join (corpus-backed).
 */
import { FIXTURES } from 'devtools-bridge';
import type {
  DocumentImportMapV1,
  ExternalRemoteV1,
  ExternalScopesV1,
  SnapshotV1,
} from 'devtools-bridge';

import { ingestSnapshot } from './ingest';

const SEEDED_PAGE = 'https://seeded.example/app/';

function seededSnapshot(overrides: {
  sharedExternals?: ExternalScopesV1;
  documentMaps?: DocumentImportMapV1[];
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
      remotes: {},
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

describe('ingestSnapshot — core relation (T6-AC-01)', () => {
  it('keeps the clean-skip skip row and its participant intact', () => {
    const model = ingestSnapshot(FIXTURES['clean-skip']);

    expect(model.sharedRows).toEqual([
      {
        scope: '__GLOBAL__',
        packageName: '@nf-lab/conflict-lib',
        tag: '2.0.0',
        action: 'share',
        dirty: false,
        host: false,
        participant: 'mfe2',
        requiredVersion: '>=1.0.0 <3.0.0',
        strictVersion: false,
        bundle: 'browser-shared',
        cached: true,
        servedFiles: [
          { entry: '@nf-lab/conflict-lib', file: '_nf_lab_conflict_lib.jvcc6K1csg.js' },
        ],
        generation: 'v4.5',
        resolution: {
          targetUrl: 'http://localhost:4300/mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js',
          hasIntegrity: false,
        },
      },
      {
        scope: '__GLOBAL__',
        packageName: '@nf-lab/conflict-lib',
        tag: '1.0.0',
        action: 'skip',
        dirty: false,
        host: false,
        participant: 'mfe1',
        requiredVersion: '>=1.0.0 <3.0.0',
        strictVersion: false,
        bundle: 'browser-shared',
        cached: false,
        servedFiles: [
          { entry: '@nf-lab/conflict-lib', file: '_nf_lab_conflict_lib.JF7uEdSVsN.js' },
        ],
        generation: 'v4.5',
        // The map serves the winning 2.0.0 copy to every importer — the
        // skip participant's own file has no map entry.
        resolution: {
          targetUrl: 'http://localhost:4300/mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js',
          hasIntegrity: false,
        },
      },
    ]);
  });

  it('splits the strict-split 1.0.0 tag into distinct skip and scope rows with their own participants', () => {
    const model = ingestSnapshot(FIXTURES['strict-split']);

    expect(
      model.sharedRows.map((row) => [row.tag, row.action, row.participant]),
    ).toEqual([
      ['2.0.0', 'share', '__NF-HOST__'],
      ['1.0.0', 'scope', 'mfe3'],
      ['1.0.0', 'skip', 'mfe1'],
    ]);
  });
});

describe('ingestSnapshot — frankenstein-live (T6-AC-02)', () => {
  const model = ingestSnapshot(FIXTURES['frankenstein-live']);

  it('yields 20 packages with one participant each', () => {
    expect(model.sharedRows).toHaveLength(20);
    const packageNames = new Set(model.sharedRows.map((row) => row.packageName));
    expect(packageNames.size).toBe(20);
  });

  it('joins every row to an integrity-covered absolute map target', () => {
    for (const row of model.sharedRows) {
      expect(row.resolution).not.toBeNull();
      expect(row.resolution!.targetUrl).toMatch(/^https:\/\/lutzleonhardt\.de\//);
      expect(row.resolution!.hasIntegrity).toBe(true);
    }
  });

  it('flattens the effective map into 22 top-level and 7 scoped entries', () => {
    expect(model.mapMode).toBe('shim');
    expect(model.importMapEntries).toHaveLength(29);
    expect(model.importMapEntries.filter((entry) => entry.scope === null)).toHaveLength(22);
  });
});

describe('ingestSnapshot — chunk union (T6-AC-04)', () => {
  it('reclassifies non-dense @nf-internal scoped externals into mapped chunk groups', () => {
    const model = ingestSnapshot(FIXTURES['non-dense']);

    expect(model.chunkGroups).toHaveLength(7);
    for (const group of model.chunkGroups) {
      expect(group.origin).toBe('scoped-pseudo-external');
      expect(group.owningRemote).toBe('mfe3');
      expect(group.pseudoPackage).toMatch(/^@nf-internal\//);
      expect(group.bundleName).toBeNull();
      expect(group.files).toHaveLength(1);
      expect(group.mapped).toBe(true);
    }
    // Chunks never count as packages — in either package entity.
    expect(model.scopedPackages).toEqual([]);
    expect(model.sharedRows.some((row) => row.packageName.startsWith('@nf-internal/'))).toBe(
      false,
    );
    expect(new Set(model.sharedRows.map((row) => row.packageName)).size).toBe(14);
  });

  it('collects frankenstein-live chunks from shared-chunks bundle lists (host only)', () => {
    const model = ingestSnapshot(FIXTURES['frankenstein-live']);

    expect(model.chunkGroups.map((group) => [group.owningRemote, group.bundleName, group.files.length, group.origin, group.mapped])).toEqual([
      ['__NF-HOST__', 'browser-angular_common', 1, 'shared-chunks', true],
      ['__NF-HOST__', 'browser-rxjs', 1, 'shared-chunks', true],
      ['__NF-HOST__', 'browser-angular_core', 5, 'shared-chunks', true],
    ]);
    // The structural zero-entry 'mapping-or-exposed' list contributes no group.
    expect(model.chunkGroups.some((group) => group.bundleName === 'mapping-or-exposed')).toBe(
      false,
    );
  });

  it('keeps true scoped packages as scoped externals', () => {
    const model = ingestSnapshot(FIXTURES['scoped']);

    expect(model.chunkGroups).toEqual([]);
    expect(model.sharedRows).toEqual([]);
    expect(model.scopedPackages.map((row) => [row.scope, row.packageName, row.tag])).toEqual([
      ['mfe1', '@nf-lab/conflict-lib', '1.0.0'],
      ['mfe2', '@nf-lab/conflict-lib', '2.0.0'],
    ]);
  });
});

describe('ingestSnapshot — ordering and lazy repositories (T6-AC-05)', () => {
  it('SEEDED: sorts version rows (semver desc, action) regardless of input order', () => {
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

    expect(ingestSnapshot(snapshot).sharedRows.map((row) => [row.tag, row.action])).toEqual([
      ['10.0.0', 'share'],
      ['2.0.0', 'share'],
      ['2.0.0', 'skip'],
      ['2.0.0-rc.1', 'share'],
      ['1.0.0', 'share'],
    ]);
  });

  it('treats the absent and the empty repository key alike', () => {
    // scoped: shared-externals ABSENT in the capture; frankenstein-live:
    // scoped-externals present as {} — both ingest to zero rows.
    expect(ingestSnapshot(FIXTURES['scoped']).sharedRows).toEqual([]);
    expect(ingestSnapshot(FIXTURES['frankenstein-live']).scopedPackages).toEqual([]);
  });

  it('ingests a runtime-less snapshot to empty entities with unknown generation', () => {
    const model = ingestSnapshot(FIXTURES['synthetic-missing-channel']);

    expect(model.sharedRows).toEqual([]);
    expect(model.scopedPackages).toEqual([]);
    expect(model.remotes).toEqual([]);
    expect(model.chunkGroups).toEqual([]);
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

    const rows = ingestSnapshot(snapshot).sharedRows;
    expect(rows.map((row) => [row.participant, row.generation])).toEqual([
      ['released', 'v4'],
      ['v45', 'v4.5'],
    ]);
  });

  it('SEEDED: reads a row carrying neither spelling without inventing served files', () => {
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

    const rows = ingestSnapshot(snapshot).sharedRows;
    expect(rows).toHaveLength(1);
    expect(rows[0].servedFiles).toEqual([]);
    expect(rows[0].resolution).toBeNull();
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
      collectorVersion: 'nf-devtools-collector/2',
      generation: 'v4',
    });
    expect(model.channels).toEqual(FIXTURES['frankenstein-live'].channels);
  });
});
