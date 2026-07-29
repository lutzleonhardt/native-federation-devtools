// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: a page without any federation evidence. The DOM scan ran and
// found zero import maps (an observation, not missing evidence); the
// global and the shim are absent.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticEmptyPageFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/empty-page/',
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
    documentMaps: [],
    effective: null,
  },
  errors: [],
} satisfies SnapshotV1;
