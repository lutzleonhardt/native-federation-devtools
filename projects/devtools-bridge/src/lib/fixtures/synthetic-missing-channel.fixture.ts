// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: the native-federation global and the shim are absent, but the
// document declares one import map. Runtime views must show honest
// unavailable states; the Import Map view has partial evidence.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticMissingChannelFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/missing-channel/',
    capturedAt: '2026-07-29T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'synthetic-fixture/1',
  },
  channels: {
    nativeFederationGlobals: {
      state: 'unavailable',
      reason: 'window.__NATIVE_FEDERATION__ is not defined',
    },
    domImportMaps: { state: 'available' },
    importShim: { state: 'unavailable', reason: 'window.importShim is not present' },
  },
  runtime: null,
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap',
        parsed: true,
        importCount: 2,
        scopeCount: 0,
        imports: [
          { specifier: 'app', target: './main.js' },
          { specifier: 'vendor', target: './vendor.js' },
        ],
        scopes: [],
        integrity: {},
      },
    ],
    effective: null,
  },
  errors: [],
} satisfies SnapshotV1;
