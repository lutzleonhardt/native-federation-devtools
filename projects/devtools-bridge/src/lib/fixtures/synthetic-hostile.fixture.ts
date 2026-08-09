// SYNTHETIC fixture — hand-written, not derived from a real capture.
// Hostile shape: models a page that tries to smuggle data through the passive
// channels, as it looks AFTER collector-level sanitization. Everything here is
// adversarial but clean — URLs at the maximal allowed shape (origin + path,
// no userinfo/query/fragment), SRI look-alike values that must not trip the
// hash rule, and non-empty collection errors with nested detail. The export
// privacy guard scans this fixture's serialized export (T6-AC-02).

import { SnapshotV1 } from '../snapshot-v1';

export const syntheticHostileFixture = {
  schemaVersion: 1,
  capture: {
    pageUrl: 'https://synthetic-fixture.example/hostile/deep/path%20segment/',
    capturedAt: '2026-08-09T00:00:00.000Z',
    mode: 'passive',
    collectorVersion: 'synthetic-fixture/1',
  },
  channels: {
    nativeFederationGlobals: { state: 'available' },
    domImportMaps: { state: 'available' },
    importShim: { state: 'available' },
  },
  runtime: {
    remotes: {
      '__NF-HOST__': {
        scopeUrl: 'https://synthetic-fixture.example/hostile/',
        exposes: [],
      },
      'admin-console': {
        scopeUrl: 'https://synthetic-fixture.example/hostile/admin-console/',
        exposes: [{ moduleName: './admin', file: 'component-admin.js' }],
      },
    },
    scopedExternals: {},
    sharedExternals: {
      __GLOBAL__: {
        'sneaky-lib': {
          dirty: false,
          versions: [
            {
              tag: '0.0.0-rc.1',
              action: 'share',
              host: false,
              remotes: [
                {
                  name: 'admin-console',
                  requiredVersion: '^0.0.0',
                  strictVersion: false,
                  file: 'sneaky-lib.js',
                  cached: false,
                },
              ],
            },
          ],
        },
      },
    },
    sharedChunks: {},
  },
  importMaps: {
    documentMaps: [
      { kind: 'importmap-shim', parsed: true, importCount: 2, scopeCount: 1 },
      { kind: 'importmap-shim', parsed: false, importCount: 0, scopeCount: 0 },
    ],
    effective: {
      imports: [
        {
          specifier: 'sneaky-lib',
          target: 'https://synthetic-fixture.example/hostile/sneaky-lib.js',
        },
        {
          specifier: './admin',
          target: 'https://synthetic-fixture.example/hostile/admin-console/component-admin.js',
        },
      ],
      scopes: [
        {
          scope: 'https://synthetic-fixture.example/hostile/admin-console/',
          imports: [
            {
              specifier: 'sneaky-lib',
              target: 'https://synthetic-fixture.example/hostile/admin-console/sneaky-lib.js',
            },
          ],
        },
      ],
      integrityFor: ['https://synthetic-fixture.example/hostile/sneaky-lib.js'],
    },
  },
  errors: [
    {
      stage: 'runtime',
      code: 'repository-shape-mismatch',
      detail: {
        repository: 'sharedChunks',
        expected: 'object',
        // SRI look-alike: starts like a hash but is not one — must stay clean.
        received: 'sha256-lookalike_not_base64',
      },
    },
    { stage: 'import-maps', code: 'document-map-parse-failure' },
  ],
} satisfies SnapshotV1;
