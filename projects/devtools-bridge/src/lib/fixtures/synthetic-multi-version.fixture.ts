// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: one shared package carries two version tags. No duplicate-version
// resolution was demonstrated in research, so views must render this as
// unresolved ambiguity — all versions visible, never an interpreted winner.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticMultiVersionFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/multi-version/',
    capturedAt: '2026-07-31T00:00:00.000Z',
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
        exposes: [],
        integrity: {},
      },
      chat: {
        scopeUrl: 'https://synthetic-fixture.example/chat/',
        exposes: [],
        integrity: {},
      },
    },
    scopedExternals: {},
    sharedExternals: {
      __GLOBAL__: {
        'ui-lib': {
          dirty: false,
          versions: [
            {
              tag: '1.2.3',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'calendar',
                  requiredVersion: '^1.2.0',
                  strictVersion: true,
                  file: 'ui-lib.AAAA1111.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'ui-lib.AAAA1111.js' }],
                  generation: 'v4',
                },
              ],
            },
            {
              tag: '2.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'chat',
                  requiredVersion: '^2.0.0',
                  strictVersion: true,
                  file: 'ui-lib.BBBB2222.js',
                  entries: null,
                  cached: false,
                  bundle: null,
                  servedFiles: [{ entry: null, file: 'ui-lib.BBBB2222.js' }],
                  generation: 'v4',
                },
              ],
            },
          ],
        },
      },
    },
    sharedChunks: {},
    generation: 'v4',
  },
  importMaps: {
    documentMaps: [],
    effective: null,
  },
  errors: [],
} satisfies SnapshotV1;
