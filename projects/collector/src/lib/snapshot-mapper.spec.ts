/**
 * Mapper tests:
 *  - T7-AC-06: the full probe→mapper pipeline over the frankenstein
 *    fixture page reproduces the checked-in fixture's evidence layers and
 *    round-trips as `SnapshotV1`.
 *  - T7-AC-04 (→ XC-02): an unrecognized `__NATIVE_FEDERATION__` shape
 *    yields `not-recognized` with no raw copy of unrecognized data.
 *  - T7-AC-05 (→ XC-02): every URL in mapper output is stripped of
 *    userinfo, query, and fragment (verified with the repo privacy scan).
 */
import { describe, expect, it } from 'vitest';
import type { SnapshotV1 } from '../../../devtools-bridge/src/lib/snapshot-v1';
import { frankensteinProductionFixture } from '../../../devtools-bridge/src/lib/fixtures/frankenstein-production.fixture';
import { scanForPrivacyViolations } from '../../../../guards/privacy-scan';
import { COLLECTOR_VERSION } from './constants';
import { PASSIVE_PROBE_SOURCE } from './passive-probe';
import { SHIM_MAP_PROBE_SOURCE } from './shim-map-probe';
import { mapProbeResult } from './snapshot-mapper';
import {
  buildFrankensteinPage,
  buildHostilePage,
  evaluateProbe,
  makeBarePage,
} from '../testing/fixture-pages';

const CAPTURED_AT = '2026-07-24T13:50:22Z';

function capturePage(sandbox: Record<string, unknown>): SnapshotV1 {
  const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
  const shim = evaluateProbe(SHIM_MAP_PROBE_SOURCE, sandbox);
  return mapProbeResult(raw, shim, { capturedAt: CAPTURED_AT });
}

describe('frankenstein pipeline (T7-AC-06)', () => {
  it('reproduces the derived fixture evidence layers from a live-shaped page', () => {
    const page = buildFrankensteinPage();
    const snapshot = capturePage(page.sandbox);

    expect(snapshot.channels).toEqual(frankensteinProductionFixture.channels);
    expect(snapshot.runtime).toEqual(frankensteinProductionFixture.runtime);
    expect(snapshot.importMaps).toEqual(frankensteinProductionFixture.importMaps);
    expect(snapshot.capture.pageUrl).toBe(frankensteinProductionFixture.capture.pageUrl);
    expect(snapshot.capture.capturedAt).toBe(CAPTURED_AT);
    expect(snapshot.capture.mode).toBe('passive');
    expect(snapshot.capture.collectorVersion).toBe(COLLECTOR_VERSION);
    expect(snapshot.errors).toEqual([]);
  });

  it('round-trips through JSON without loss', () => {
    const page = buildFrankensteinPage();
    const snapshot = capturePage(page.sandbox);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });
});

describe('unrecognized shapes (T7-AC-04)', () => {
  it('yields not-recognized without copying unrecognized data', () => {
    const sandbox = makeBarePage({
      __NATIVE_FEDERATION__: {
        totallySurprising: { customerRecord: 'RAW_SECRET_VALUE' },
      },
    });
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
    const snapshot = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });

    expect(snapshot.channels.nativeFederationGlobals).toEqual({
      state: 'not-recognized',
      reason: expect.stringContaining('repositories missing or unreadable'),
    });
    expect(snapshot.runtime).toBeNull();
    // No raw copy anywhere — neither in the probe result nor the snapshot.
    expect(JSON.stringify(raw)).not.toContain('totallySurprising');
    expect(JSON.stringify(raw)).not.toContain('RAW_SECRET_VALUE');
    expect(JSON.stringify(snapshot)).not.toContain('totallySurprising');
    expect(JSON.stringify(snapshot)).not.toContain('RAW_SECRET_VALUE');
  });

  it('yields not-recognized for a primitive global', () => {
    const sandbox = makeBarePage({ __NATIVE_FEDERATION__: 'not-an-object' });
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
    const snapshot = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });
    expect(snapshot.channels.nativeFederationGlobals).toEqual({
      state: 'not-recognized',
      reason: "global has type 'string' instead of object",
    });
    expect(snapshot.runtime).toBeNull();
    expect(JSON.stringify(snapshot)).not.toContain('not-an-object');
  });

  it('projects a lazily-absent scoped-externals repository as zero entries', () => {
    // Playground-shaped global: the runtime creates `scoped-externals`
    // lazily, so a page without scoped externals has no such key at all.
    const sandbox = makeBarePage({
      __NATIVE_FEDERATION__: {
        remotes: {},
        'shared-externals': {},
        'shared-chunks': {},
      },
    });
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
    const snapshot = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });

    expect(snapshot.channels.nativeFederationGlobals).toEqual({ state: 'available' });
    expect(snapshot.runtime).toEqual({
      remotes: {},
      scopedExternals: {},
      sharedExternals: {},
      sharedChunks: {},
    });
    expect(snapshot.errors).toEqual([]);
  });

  it('projects newer-runtime external remotes without a file field (entries map dropped)', () => {
    // Playground-shaped shared external (Angular 22 runtime): remotes carry
    // `bundle` + `entries` instead of a single `file`.
    const sandbox = makeBarePage({
      __NATIVE_FEDERATION__: {
        remotes: {},
        'shared-externals': {
          __GLOBAL__: {
            '@angular/core': {
              dirty: false,
              versions: [
                {
                  tag: '22.0.8',
                  action: 'share',
                  host: true,
                  remotes: [
                    {
                      name: '__NF-HOST__',
                      bundle: 'browser-angular_core',
                      strictVersion: true,
                      cached: true,
                      requiredVersion: '~22.0.0',
                      entries: { '@angular/core': '_angular_core.EWio10v_5e.js' },
                    },
                  ],
                },
              ],
            },
          },
        },
        'shared-chunks': {},
      },
    });
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
    const snapshot = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });

    expect(snapshot.channels.nativeFederationGlobals).toEqual({ state: 'available' });
    expect(snapshot.runtime?.sharedExternals['__GLOBAL__']['@angular/core'].versions[0].remotes).toEqual([
      {
        name: '__NF-HOST__',
        requiredVersion: '~22.0.0',
        strictVersion: true,
        file: null,
        cached: true,
      },
    ]);
    expect(snapshot.errors).toEqual([]);
    // The uncollected newer-runtime fields never cross the allowlist.
    expect(JSON.stringify(snapshot)).not.toContain('browser-angular_core');
    expect(JSON.stringify(snapshot)).not.toContain('_angular_core.EWio10v_5e.js');
  });

  it('keeps not-recognized when scoped-externals exists but is unreadable', () => {
    const nf: Record<string, unknown> = {
      remotes: {},
      'shared-externals': {},
      'shared-chunks': {},
    };
    Object.defineProperty(nf, 'scoped-externals', { get: () => ({}) });
    const sandbox = makeBarePage({ __NATIVE_FEDERATION__: nf });
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
    const snapshot = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });

    expect(snapshot.channels.nativeFederationGlobals).toEqual({
      state: 'not-recognized',
      reason: 'global present but repositories missing or unreadable: scoped-externals',
    });
    expect(snapshot.runtime).toBeNull();
  });

  it('yields unavailable when the global is absent', () => {
    const snapshot = capturePage(makeBarePage());
    expect(snapshot.channels.nativeFederationGlobals).toEqual({
      state: 'unavailable',
      reason: 'window.__NATIVE_FEDERATION__ is not defined',
    });
    expect(snapshot.channels.importShim).toEqual({
      state: 'unavailable',
      reason: 'window.importShim is not present',
    });
    // Zero DOM maps is a real observation, not missing evidence.
    expect(snapshot.channels.domImportMaps).toEqual({ state: 'available' });
    expect(snapshot.importMaps).toEqual({ documentMaps: [], effective: null });
  });
});

describe('URL sanitization (T7-AC-05)', () => {
  it('strips userinfo, query, and fragment from every URL in the output', () => {
    const importShim = () => {};
    Object.assign(importShim, {
      getImportMap: () => ({
        imports: {
          bare: 'https://cdn.example/lib.js?version=1#hash',
          'https://scoped.example/pkg?q=1': 'https://user:pw@cdn.example/pkg.js',
          '/a.js?token=hidden-secret': 'https://cdn.example/a.js',
          'foo?x': 'https://cdn.example/foo.js',
        },
        scopes: {
          'https://scope.example/app/?scope-query=1': {
            inner: 'https://cdn.example/inner.js#frag',
          },
          '/app/?q=scope-leaked': {
            './b?y=also-leaked': 'https://cdn.example/b.js',
          },
        },
        integrity: {
          'https://cdn.example/lib.js?integrity-query=1': `sha384-${'A'.repeat(64)}`,
        },
      }),
    });
    const mapNode = {
      getAttribute: (name: string) => (name === 'type' ? 'importmap' : null),
      textContent: '{"imports":{"a":"/a.js?token-like=1"}}',
    };
    const sandbox = makeBarePage({
      __NATIVE_FEDERATION__: {
        remotes: {
          r: {
            scopeUrl: 'https://user:pw@remote.example/app/?query=1#frag',
            exposes: [
              {
                file: './entry.js?v=session-token-123',
                moduleName: 'https://remote.example/entry.js?m=1',
              },
            ],
          },
        },
        'scoped-externals': {},
        'shared-externals': {
          __GLOBAL__: {
            pkg: {
              dirty: false,
              versions: [
                {
                  tag: '1.0.0',
                  action: 'share',
                  host: false,
                  remotes: [
                    {
                      name: 'r',
                      requiredVersion: '^1.0.0',
                      strictVersion: false,
                      file: 'chunk.js?sig=file-leaked',
                      cached: true,
                    },
                  ],
                },
              ],
            },
          },
        },
        'shared-chunks': {},
      },
      document: { readyState: 'complete', querySelectorAll: () => [mapNode] },
      importShim,
    });

    const snapshot = capturePage(sandbox);

    expect(snapshot.runtime!.remotes['r'].scopeUrl).toBe('https://remote.example/app/');
    expect(snapshot.runtime!.remotes['r'].exposes[0]).toEqual({
      moduleName: 'https://remote.example/entry.js',
      file: './entry.js',
    });
    // `file` fields are URLs too — sanitized even without a path prefix.
    expect(
      snapshot.runtime!.sharedExternals['__GLOBAL__']['pkg'].versions[0].remotes[0].file,
    ).toBe('chunk.js');
    const effective = snapshot.importMaps!.effective!;
    expect(effective.imports).toEqual([
      { specifier: 'bare', target: 'https://cdn.example/lib.js' },
      { specifier: 'https://scoped.example/pkg', target: 'https://cdn.example/pkg.js' },
      { specifier: '/a.js', target: 'https://cdn.example/a.js' },
      // Bare specifiers are names, not URLs — nothing may be stripped.
      { specifier: 'foo?x', target: 'https://cdn.example/foo.js' },
    ]);
    expect(effective.scopes).toEqual([
      {
        scope: 'https://scope.example/app/',
        imports: [{ specifier: 'inner', target: 'https://cdn.example/inner.js' }],
      },
      {
        scope: '/app/',
        imports: [{ specifier: './b', target: 'https://cdn.example/b.js' }],
      },
    ]);
    expect(effective.integrityFor).toEqual(['https://cdn.example/lib.js']);
    for (const leak of ['hidden-secret', 'scope-leaked', 'also-leaked', 'session-token-123', 'file-leaked']) {
      expect(JSON.stringify(snapshot)).not.toContain(leak);
    }

    // The raw document map text (with its query) is reduced to counts.
    expect(snapshot.importMaps!.documentMaps).toEqual([
      { kind: 'importmap', parsed: true, importCount: 1, scopeCount: 0 },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain('token-like');

    expect(scanForPrivacyViolations(snapshot)).toEqual([]);
  });

  it('produces a scan-clean snapshot for the hostile page', () => {
    const page = buildHostilePage();
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, page.sandbox);
    const shim = evaluateProbe(SHIM_MAP_PROBE_SOURCE, page.sandbox);
    const snapshot = mapProbeResult(raw, shim, { capturedAt: CAPTURED_AT });

    // The getter-backed remote lacks a readable scopeUrl and is dropped.
    expect(snapshot.runtime!.remotes).toEqual({});
    expect(snapshot.errors.some((error) => error.code === 'remote-incomplete')).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain('should-never-be-read');
    // The hostile getImportMap threw — the channel says so honestly.
    expect(snapshot.channels.importShim).toEqual({
      state: 'not-recognized',
      reason: 'importShim present but the effective map could not be read',
    });
    expect(snapshot.errors.some((error) => error.code === 'map-call-threw')).toBe(true);
    // The hostile document map's query URL exists only as counts.
    expect(JSON.stringify(snapshot)).not.toContain('hidden');
    expect(scanForPrivacyViolations(snapshot)).toEqual([]);
  });
});

describe('degenerate probe input', () => {
  it('maps garbage probe results to explicit unavailable states', () => {
    for (const garbage of [null, undefined, 42, 'nope', { schemaVersion: 'other/1' }]) {
      const snapshot = mapProbeResult(garbage, null, { capturedAt: CAPTURED_AT });
      expect(snapshot.channels.nativeFederationGlobals.state).toBe('unavailable');
      expect(snapshot.channels.domImportMaps.state).toBe('unavailable');
      expect(snapshot.channels.importShim.state).toBe('unavailable');
      expect(snapshot.runtime).toBeNull();
      expect(snapshot.importMaps).toBeNull();
      expect(snapshot.capture.pageUrl).toBe('');
      expect(snapshot.errors.some((error) => error.code === 'probe-result-invalid')).toBe(true);
      expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    }
  });

  it('marks the shim channel not-recognized when the shim probe result is missing or invalid', () => {
    const page = buildFrankensteinPage();
    const raw = evaluateProbe(PASSIVE_PROBE_SOURCE, page.sandbox);

    const withoutShim = mapProbeResult(raw, null, { capturedAt: CAPTURED_AT });
    expect(withoutShim.channels.importShim).toEqual({
      state: 'not-recognized',
      reason: 'importShim present but the shim map probe returned no result',
    });
    expect(withoutShim.importMaps!.effective).toBeNull();
    // The DOM channel still carries the document maps.
    expect(withoutShim.importMaps!.documentMaps.length).toBe(1);

    const withGarbageShim = mapProbeResult(raw, 'garbage', { capturedAt: CAPTURED_AT });
    expect(withGarbageShim.channels.importShim.state).toBe('not-recognized');
    expect(withGarbageShim.errors.some((error) => error.code === 'shim-result-invalid')).toBe(true);
  });
});
