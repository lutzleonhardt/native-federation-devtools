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
 */
import { FIXTURES } from 'devtools-bridge';
import type { DocumentImportMapV1, EffectiveImportMapV1 } from 'devtools-bridge';

import { detectMapMode, mergeDocumentMaps } from './merge-document-maps';

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
