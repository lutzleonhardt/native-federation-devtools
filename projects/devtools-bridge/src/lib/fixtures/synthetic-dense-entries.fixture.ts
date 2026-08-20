// SYNTHETIC fixture — hand-written, not derived from a real capture.
// UI state: dense multi-entry registrations, the only real path to an
// `entries` map carrying more than one specifier. Source-verified provenance
// (orchestrator + core repos, 2026-08-20): the dense format is DOUBLE opt-in —
// build-side `features.denseExternals` (wire format since core v4.3.0) or
// host-side `feature.convertFlatSharedInfo` (densifies flat remoteEntries at
// fetch); both flags default to false in v4.5.0/v4.6.0. Default builds emit
// one single-entry registration per full specifier (see the corpus-derived
// `non-dense` fixture: every secondary entrypoint is its own registry key),
// so a default-config capture can never witness this state.
//
// Two cases, both under the same double-opt-in output format:
// - `@nf-lab/dense-lib` (happy): parent + secondary entrypoint share one
//   metadata signature, so densification emits ONE registration whose
//   `entries` map carries both specifiers — the pipeline must materialize
//   one resolved copy with both entrypoints.
// - `@nf-lab/split-lib` (split): the secondary's metadata deviates
//   (different version), so densification emits a SEPARATE registration
//   under the SAME registry key — the pipeline must keep separate copies.

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticDenseEntriesFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/dense-entries/',
    capturedAt: '2026-08-20T00:00:00.000Z',
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
        scopeUrl: 'https://synthetic-fixture.example/dense-entries/',
        exposes: [],
        integrity: {},
      },
      'mfe-dense': {
        scopeUrl: 'https://synthetic-fixture.example/dense-entries/mfe-dense/',
        exposes: [],
        integrity: {},
      },
    },
    scopedExternals: {},
    sharedExternals: {
      __GLOBAL__: {
        '@nf-lab/dense-lib': {
          dirty: false,
          versions: [
            {
              tag: '1.2.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-dense',
                  requiredVersion: '^1.2.0',
                  strictVersion: false,
                  file: null,
                  entries: {
                    '@nf-lab/dense-lib': '_nf_lab_dense_lib.h4PpYcAsEa.js',
                    '@nf-lab/dense-lib/secondary': '_nf_lab_dense_lib_secondary.s3CnDaRyEa.js',
                  },
                  cached: true,
                  bundle: null,
                  servedFiles: [
                    {
                      entry: '@nf-lab/dense-lib',
                      file: '_nf_lab_dense_lib.h4PpYcAsEa.js',
                    },
                    {
                      entry: '@nf-lab/dense-lib/secondary',
                      file: '_nf_lab_dense_lib_secondary.s3CnDaRyEa.js',
                    },
                  ],
                  generation: 'v4.5',
                },
              ],
            },
          ],
        },
        '@nf-lab/split-lib': {
          dirty: false,
          versions: [
            {
              tag: '3.0.0',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-dense',
                  requiredVersion: '^3.0.0',
                  strictVersion: false,
                  file: null,
                  entries: {
                    '@nf-lab/split-lib': '_nf_lab_split_lib.p4R3nTcAsE.js',
                  },
                  cached: true,
                  bundle: null,
                  servedFiles: [
                    {
                      entry: '@nf-lab/split-lib',
                      file: '_nf_lab_split_lib.p4R3nTcAsE.js',
                    },
                  ],
                  generation: 'v4.5',
                },
              ],
            },
            {
              tag: '3.1.4',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'mfe-dense',
                  requiredVersion: '^3.1.0',
                  strictVersion: false,
                  file: null,
                  entries: {
                    '@nf-lab/split-lib/secondary': '_nf_lab_split_lib_secondary.d3Vi4tInGa.js',
                  },
                  cached: true,
                  bundle: null,
                  servedFiles: [
                    {
                      entry: '@nf-lab/split-lib/secondary',
                      file: '_nf_lab_split_lib_secondary.d3Vi4tInGa.js',
                    },
                  ],
                  generation: 'v4.5',
                },
              ],
            },
          ],
        },
      },
    },
    sharedChunks: {},
    generation: 'v4.5',
  },
  importMaps: {
    documentMaps: [
      {
        kind: 'importmap',
        parsed: true,
        importCount: 4,
        scopeCount: 0,
        imports: [
          {
            specifier: '@nf-lab/dense-lib',
            target: './mfe-dense/_nf_lab_dense_lib.h4PpYcAsEa.js',
          },
          {
            specifier: '@nf-lab/dense-lib/secondary',
            target: './mfe-dense/_nf_lab_dense_lib_secondary.s3CnDaRyEa.js',
          },
          {
            specifier: '@nf-lab/split-lib',
            target: './mfe-dense/_nf_lab_split_lib.p4R3nTcAsE.js',
          },
          {
            specifier: '@nf-lab/split-lib/secondary',
            target: './mfe-dense/_nf_lab_split_lib_secondary.d3Vi4tInGa.js',
          },
        ],
        scopes: [],
        integrity: {},
      },
    ],
    effective: null,
  },
  errors: [],
} satisfies SnapshotV1;
