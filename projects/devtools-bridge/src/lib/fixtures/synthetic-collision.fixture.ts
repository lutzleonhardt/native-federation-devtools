// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: two distinct remotes expose the same module key. The identity
// pair (remote name, expose key) must keep them apart — views render one
// entry per remote and never merge entries keyed by the expose key alone.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticCollisionFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/collision/',
    capturedAt: '2026-07-30T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'synthetic-fixture/1',
  },
  channels: {
    nativeFederationGlobals: { state: 'available' },
    domImportMaps: { state: 'available' },
    importShim: { state: 'unavailable', reason: 'window.importShim is not present' },
  },
  runtime: {
    remotes: {
      '__NF-HOST__': {
        scopeUrl: 'https://synthetic-fixture.example/',
        exposes: [],
        integrity: {},
      },
      calendar: {
        scopeUrl: 'https://synthetic-fixture.example/calendar/',
        exposes: [
          {
            moduleName: 'https://synthetic-fixture.example/Widget',
            file: 'Widget-AAAA1111.js',
          },
        ],
        integrity: {},
      },
      chat: {
        scopeUrl: 'https://synthetic-fixture.example/chat/',
        exposes: [
          {
            moduleName: 'https://synthetic-fixture.example/Widget',
            file: 'Widget-BBBB2222.js',
          },
        ],
        integrity: {},
      },
    },
    scopedExternals: {},
    sharedExternals: {},
    sharedChunks: {},
    generation: 'unknown',
  },
  importMaps: {
    documentMaps: [],
    effective: null,
  },
  errors: [],
} satisfies SnapshotV1;
