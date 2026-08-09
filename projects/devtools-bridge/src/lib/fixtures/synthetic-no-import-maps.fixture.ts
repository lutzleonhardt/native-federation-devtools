// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: no import-map evidence at all. Both import-map channels are
// unavailable, so `importMaps` is null — the Import Map view must render
// the missing state with the channel reasons. The runtime global is absent
// too, keeping the whole snapshot evidence-free.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticNoImportMapsFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/no-import-maps/',
    capturedAt: '2026-07-31T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'synthetic-fixture/1',
  },
  channels: {
    nativeFederationGlobals: {
      state: 'unavailable',
      reason: 'window.__NATIVE_FEDERATION__ is not defined',
    },
    domImportMaps: {
      state: 'unavailable',
      reason: 'document scan did not run — page context was not accessible',
    },
    importShim: { state: 'unavailable', reason: 'window.importShim is not present' },
  },
  runtime: null,
  importMaps: null,
  errors: [],
} satisfies SnapshotV1;
