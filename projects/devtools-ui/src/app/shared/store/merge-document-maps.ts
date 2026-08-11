/**
 * `mergeDocumentMaps` — the map ground truth. Replicates the loader's
 * document-order merge of import-map tags into one effective map,
 * corpus-verified for imports, scopes, AND integrity. The later-tag-wins
 * collision branch is adopted from es-module-shims semantics, not
 * corpus-proven — it is pinned by a seeded unit test.
 *
 * The active mode comes from observed tag types (`importmap` = native,
 * `importmap-shim` = shim; zero tags of the other type is the corpus
 * norm). In native mode the shim's `getImportMap()` is empty and must be
 * ignored; in shim mode it serves as a cross-check only. An empty shim map
 * means "shim uninvolved", never "no map".
 */
import type { DocumentImportMapV1 } from 'devtools-bridge';
import type { EffectiveMap, MapMode } from './federation-model';

export function detectMapMode(tags: readonly DocumentImportMapV1[]): MapMode {
  const kinds = new Set(tags.map((tag) => tag.kind));
  // Corpus pages carry exactly one tag type. On a (never observed) page
  // mixing both, the shim tags are the ones es-module-shims drives —
  // prefer them.
  if (kinds.has('importmap-shim')) {
    return 'shim';
  }
  if (kinds.has('importmap')) {
    return 'native';
  }
  return 'none';
}

export function mergeDocumentMaps(
  tags: readonly DocumentImportMapV1[],
  pageBaseUrl: string,
): EffectiveMap {
  const mode = detectMapMode(tags);
  const effective: EffectiveMap = { imports: {}, scopes: {}, integrity: {} };
  if (mode === 'none') {
    return effective;
  }
  const activeKind = mode === 'shim' ? 'importmap-shim' : 'importmap';
  for (const tag of tags) {
    if (tag.kind !== activeKind || !tag.parsed) {
      continue;
    }
    for (const entry of tag.imports) {
      // Later tag wins on specifier collision.
      setKey(
        effective.imports,
        normalizeSpecifier(entry.specifier, pageBaseUrl),
        resolveUrl(entry.target, pageBaseUrl),
      );
    }
    for (const scope of tag.scopes) {
      const scopeKey = resolveUrl(scope.scope, pageBaseUrl);
      const scopeImports = getOrCreateScope(effective.scopes, scopeKey);
      for (const entry of scope.imports) {
        setKey(
          scopeImports,
          normalizeSpecifier(entry.specifier, pageBaseUrl),
          resolveUrl(entry.target, pageBaseUrl),
        );
      }
    }
    for (const [url, hash] of Object.entries(tag.integrity)) {
      setKey(effective.integrity, resolveUrl(url, pageBaseUrl), hash);
    }
  }
  return effective;
}

/**
 * Resolves a URL against the page base. A value no URL parse accepts is
 * kept verbatim — the observation stays representable either way.
 */
export function resolveUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

/**
 * Import-map key normalization: URL-shaped specifier keys (absolute, or
 * starting with '/', './', '../') resolve against the page base like the
 * loader normalizes them; bare specifiers pass through untouched.
 */
export function normalizeSpecifier(specifier: string, baseUrl: string): string {
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(specifier) ||
    specifier.startsWith('/') ||
    specifier.startsWith('./') ||
    specifier.startsWith('../')
  ) {
    return resolveUrl(specifier, baseUrl);
  }
  return specifier;
}

/** Own-property assignment — a bare specifier like '__proto__' must never hit the prototype. */
function setKey(record: Record<string, string>, key: string, value: string): void {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function getOrCreateScope(
  scopes: Record<string, Record<string, string>>,
  scopeKey: string,
): Record<string, string> {
  if (!Object.prototype.hasOwnProperty.call(scopes, scopeKey)) {
    Object.defineProperty(scopes, scopeKey, {
      value: {},
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return scopes[scopeKey];
}
