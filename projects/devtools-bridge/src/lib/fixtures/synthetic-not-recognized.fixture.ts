// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: a __NATIVE_FEDERATION__ global exists but does not have the
// four expected repositories, so the channel is 'not-recognized' and no
// runtime projection is invented. Import-map evidence is unaffected.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticNotRecognizedFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/not-recognized/',
    capturedAt: '2026-07-29T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'synthetic-fixture/1',
  },
  channels: {
    nativeFederationGlobals: {
      state: 'not-recognized',
      reason: 'global present but carries none of the four repository keys',
    },
    domImportMaps: { state: 'available' },
    importShim: { state: 'available' },
  },
  runtime: null,
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap-shim',
        parsed: true,
        importCount: 1,
        scopeCount: 0,
        imports: [{ specifier: 'lodash', target: '/vendor/lodash.js' }],
        scopes: [],
        integrity: {},
      },
    ],
    effective: {
      imports: [
        {
          specifier: 'lodash',
          target: 'https://synthetic-fixture.example/vendor/lodash.js',
        },
      ],
      scopes: [],
      integrityFor: [],
    },
  },
  errors: [
    {
      stage: 'runtime-globals',
      code: 'shape-not-recognized',
      detail: 'expected repositories: remotes, scoped-externals, shared-externals, shared-chunks',
    },
  ],
} satisfies SnapshotV1;
