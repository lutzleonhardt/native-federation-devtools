/**
 * mergeDocumentMaps specs:
 *  - T6-AC-02: the store-computed merge over the frankenstein-live tags
 *    equals the recorded shim map for imports, scopes, AND integrity
 *    (absolute-URL keys).
 *  - T6-AC-03: merging both dynamic-init-shim tags reproduces the
 *    recorded `getImportMap()` exactly; the dynamic-init-native merge is
 *    computed from tags while the empty shim map is ignored.
 *  - T6-AC-06 (SEEDED): the later-tag-wins collision branch — adopted
 *    from es-module-shims semantics, no capture demonstrates it.
 *
 * deriveResolutionBase specs (SPA navigation, playground-backed): the
 * parse-time document base recovered from the shim's effective map, with
 * the `pageUrl` fallback whenever the oracle is absent or disagrees.
 */
import { FIXTURES } from 'devtools-bridge';
import type { DocumentImportMapV1, EffectiveImportMapV1 } from 'devtools-bridge';

import { deriveResolutionBase, detectMapMode, mergeDocumentMaps } from './merge-document-maps';

/** Recorded shim map (entry arrays) → record shape comparable to the merge. */
function asRecords(effective: EffectiveImportMapV1) {
  return {
    imports: Object.fromEntries(effective.imports.map((e) => [e.specifier, e.target])),
    scopes: Object.fromEntries(
      effective.scopes.map((s) => [
        s.scope,
        Object.fromEntries(s.imports.map((e) => [e.specifier, e.target])),
      ]),
    ),
  };
}

function seededTag(
  kind: string,
  imports: Record<string, string>,
  parsed = true,
): DocumentImportMapV1 {
  return {
    kind,
    parsed,
    importCount: Object.keys(imports).length,
    scopeCount: 0,
    imports: Object.entries(imports).map(([specifier, target]) => ({ specifier, target })),
    scopes: [],
    integrity: {},
  };
}

const SEEDED_BASE = 'https://seeded.example/app/';

describe('mergeDocumentMaps', () => {
  it('reproduces the recorded frankenstein-live shim map (T6-AC-02)', () => {
    const fixture = FIXTURES['frankenstein-live'];
    const tags = fixture.importMaps!.documentMaps;
    const recorded = fixture.importMaps!.effective!;

    expect(detectMapMode(tags)).toBe('shim');
    const merged = mergeDocumentMaps(tags, fixture.capture.pageUrl);
    expect(merged.imports).toEqual(asRecords(recorded).imports);
    expect(merged.scopes).toEqual(asRecords(recorded).scopes);

    const integrityKeys = Object.keys(merged.integrity).sort();
    expect(integrityKeys).toEqual([...recorded.integrityFor].sort());
    expect(integrityKeys).toHaveLength(29);
    for (const key of integrityKeys) {
      expect(key).toMatch(/^https:\/\/lutzleonhardt\.de\//);
    }
  });

  it('merges both dynamic-init-shim tags into the recorded getImportMap() (T6-AC-03)', () => {
    const fixture = FIXTURES['dynamic-init-shim'];
    const tags = fixture.importMaps!.documentMaps;
    const recorded = fixture.importMaps!.effective!;
    expect(tags).toHaveLength(2);

    const merged = mergeDocumentMaps(tags, fixture.capture.pageUrl);
    expect(merged.imports).toEqual(asRecords(recorded).imports);
    expect(merged.scopes).toEqual(asRecords(recorded).scopes);
    expect(Object.keys(merged.integrity).sort()).toEqual([...recorded.integrityFor].sort());
  });

  it('computes the native-mode merge from tags and ignores the empty shim map (T6-AC-03)', () => {
    const fixture = FIXTURES['dynamic-init-native'];
    const tags = fixture.importMaps!.documentMaps;
    expect(tags).toHaveLength(2);
    expect(detectMapMode(tags)).toBe('native');

    const merged = mergeDocumentMaps(tags, fixture.capture.pageUrl);
    expect(merged.imports).toEqual({
      '@nf-lab/conflict-lib': 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
      'mfe1/./Component': 'http://localhost:4300/mfe1/Component-RJXV7SVT.js',
      'mfe2/./Component': 'http://localhost:4300/mfe2/Component-52VOYNCY.js',
    });
    // The shim is on the page but uninvolved: its recorded map is empty —
    // "empty shim map" means exactly that, never "no map".
    expect(fixture.channels.importShim).toEqual({ state: 'available' });
    expect(fixture.importMaps!.effective).toEqual({ imports: [], scopes: [], integrityFor: [] });
  });

  it('SEEDED: a same-specifier collision across tags resolves later-tag-wins (T6-AC-06)', () => {
    // No capture demonstrates a collision; this pins the es-module-shims
    // semantics the merge adopts.
    const merged = mergeDocumentMaps(
      [seededTag('importmap-shim', { pkg: './first.js' }), seededTag('importmap-shim', { pkg: './second.js' })],
      SEEDED_BASE,
    );
    expect(merged.imports).toEqual({ pkg: 'https://seeded.example/app/second.js' });
  });

  it('SEEDED: skips tags of the inactive kind and unparsable tags', () => {
    const merged = mergeDocumentMaps(
      [
        seededTag('importmap-shim', { pkg: './shim.js' }),
        seededTag('importmap', { pkg: './native.js' }),
        seededTag('importmap-shim', { broken: './never.js' }, false),
      ],
      SEEDED_BASE,
    );
    expect(merged.imports).toEqual({ pkg: 'https://seeded.example/app/shim.js' });
  });

  it('SEEDED: normalizes URL-shaped specifier keys against the page base', () => {
    const merged = mergeDocumentMaps(
      [seededTag('importmap-shim', { './local': './local.js', bare: './bare.js' })],
      SEEDED_BASE,
    );
    expect(merged.imports).toEqual({
      'https://seeded.example/app/local': 'https://seeded.example/app/local.js',
      bare: 'https://seeded.example/app/bare.js',
    });
  });

  it('returns mode none and the empty map for a page without tags', () => {
    expect(detectMapMode([])).toBe('none');
    expect(mergeDocumentMaps([], SEEDED_BASE)).toEqual({ imports: {}, scopes: {}, integrity: {} });
  });
});

describe('deriveResolutionBase', () => {
  // The playground shape: the map was parsed at the load URL, then
  // history.pushState moved the page deeper. Relative targets still
  // resolve against the load-time base — only the shim map records that.
  const NAVIGATED_PAGE = 'https://playground.example/playground/checkout/cart';
  const LOAD_BASE = 'https://playground.example/playground/';

  function shimEffective(imports: Record<string, string>): EffectiveImportMapV1 {
    return {
      imports: Object.entries(imports).map(([specifier, target]) => ({ specifier, target })),
      scopes: [],
      integrityFor: [],
    };
  }

  it('recovers the parse-time base from a relative target the shim resolved', () => {
    const base = deriveResolutionBase(
      [seededTag('importmap-shim', { pkg: './pkg.hash.js' })],
      shimEffective({ pkg: `${LOAD_BASE}pkg.hash.js` }),
      NAVIGATED_PAGE,
    );
    expect(base).toEqual({ url: LOAD_BASE, source: 'shim-effective-map' });
    // The recovered base makes the merge reproduce the shim's resolution.
    expect(
      mergeDocumentMaps([seededTag('importmap-shim', { pkg: './pkg.hash.js' })], base.url).imports,
    ).toEqual({ pkg: `${LOAD_BASE}pkg.hash.js` });
  });

  it('falls back to pageUrl without a shim map and in native mode', () => {
    const fallback = { url: NAVIGATED_PAGE, source: 'page-url' };
    expect(
      deriveResolutionBase([seededTag('importmap-shim', { pkg: './pkg.js' })], null, NAVIGATED_PAGE),
    ).toEqual(fallback);
    expect(
      deriveResolutionBase(
        [seededTag('importmap', { pkg: './pkg.js' })],
        shimEffective({ pkg: `${LOAD_BASE}pkg.js` }),
        NAVIGATED_PAGE,
      ),
    ).toEqual(fallback);
  });

  it('falls back to pageUrl when no entry carries base information', () => {
    // Absolute and root-relative targets resolve the same against any
    // same-origin base; URL-shaped specifiers never match the shim map
    // verbatim.
    const base = deriveResolutionBase(
      [
        seededTag('importmap-shim', {
          abs: 'https://cdn.example/abs.js',
          rooted: '/playground/rooted.js',
          './local': './local.js',
        }),
      ],
      shimEffective({
        abs: 'https://cdn.example/abs.js',
        rooted: 'https://playground.example/playground/rooted.js',
      }),
      NAVIGATED_PAGE,
    );
    expect(base).toEqual({ url: NAVIGATED_PAGE, source: 'page-url' });
  });

  it('cannot derive from ../ targets but verifies them; a sibling ./ entry pins the base', () => {
    // `../` suffix arithmetic is ambiguous, so such an entry never sources
    // a candidate — but it still participates in the consensus check.
    const base = deriveResolutionBase(
      [
        seededTag('importmap-shim', {
          up: '../up.js',
          pkg: './nested/pkg.js',
        }),
      ],
      shimEffective({
        up: 'https://playground.example/up.js',
        pkg: `${LOAD_BASE}nested/pkg.js`,
      }),
      NAVIGATED_PAGE,
    );
    expect(base).toEqual({ url: LOAD_BASE, source: 'shim-effective-map' });
  });

  it('never uses a shadowed entry as oracle (later tag wins, like the merge)', () => {
    // Codex-review repro: tag 1 writes `pkg` relative, a later tag shadows
    // it with a CDN target. The shim's final target for `pkg` is tag 2's
    // resolution — pairing it with tag 1's relative form would "verify"
    // https://cdn.example/ as base and poison every other relative entry.
    // Only winning entries may act as oracles; `other` (unshadowed) pins
    // the real base.
    const tags = [
      seededTag('importmap-shim', { pkg: './pkg.js', other: './other.js' }),
      seededTag('importmap-shim', { pkg: 'https://cdn.example/pkg.js' }),
    ];
    const base = deriveResolutionBase(
      tags,
      shimEffective({
        pkg: 'https://cdn.example/pkg.js',
        other: `${LOAD_BASE}other.js`,
      }),
      NAVIGATED_PAGE,
    );
    expect(base).toEqual({ url: LOAD_BASE, source: 'shim-effective-map' });
    expect(mergeDocumentMaps(tags, base.url).imports['other']).toBe(`${LOAD_BASE}other.js`);
  });

  it('falls back to pageUrl when winning entries imply conflicting bases', () => {
    // Two winning relative entries whose shim targets pin different
    // directories (diverging per-tag parse bases, dynamically altered shim
    // state): no single base explains the evidence — recovery must refuse
    // instead of trusting whichever entry comes first.
    const base = deriveResolutionBase(
      [
        seededTag('importmap-shim', {
          pkg: './pkg.js',
          stale: './stale.js',
        }),
      ],
      shimEffective({
        pkg: `${LOAD_BASE}pkg.js`,
        stale: 'https://elsewhere.example/stale.js',
      }),
      NAVIGATED_PAGE,
    );
    expect(base).toEqual({ url: NAVIGATED_PAGE, source: 'page-url' });
  });
});
