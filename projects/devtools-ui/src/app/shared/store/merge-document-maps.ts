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
import type { DocumentImportMapV1, EffectiveImportMapV1 } from 'devtools-bridge';
import type { EffectiveMap, MapMode } from './federation-model';

/**
 * The URL base every load-time-relative capture value resolves against: the
 * document base at import-map parse time, recovered from evidence — or the
 * capture `pageUrl` when no evidence disagrees. The two diverge on SPA pages:
 * `history.pushState` moves `capture.pageUrl` away from the URL the loader
 * (and the Native Federation runtime) already resolved relative targets and
 * scope URLs against.
 */
export interface ResolutionBase {
  url: string;
  /** Recovered from the shim's parse-time map, or the `capture.pageUrl` fallback. */
  source: 'shim-effective-map' | 'page-url';
}

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
 * Recovers the parse-time document base from the shim's effective map: for a
 * document-tag import whose target is path-relative (`./`/`../`) and whose
 * bare specifier the shim map also carries, the shim's absolute target —
 * resolved by es-module-shims when the tag was parsed — pins the base
 * directory. Only WINNING entries (later tag wins, mirroring the merge the
 * shim map is the result of) act as oracles, and a candidate base counts
 * only when EVERY oracle pair re-resolves to its shim target (consensus).
 * Falls back to `pageUrl` in native mode (nothing exposes the parsed map),
 * without a shim map, without a derivable candidate, or on inconsistent
 * evidence — matching the pre-SPA-navigation behavior, where `pageUrl` and
 * the parse-time base coincide.
 *
 * The consensus rule is also what contains the one-base-for-all-tags
 * approximation: tags parsed against diverging bases (appended after an SPA
 * navigation) disagree and drop the recovery to the fallback instead of
 * trusting whichever entry comes first.
 */
export function deriveResolutionBase(
  tags: readonly DocumentImportMapV1[],
  shimEffective: EffectiveImportMapV1 | null,
  pageUrl: string,
): ResolutionBase {
  const fallback: ResolutionBase = { url: pageUrl, source: 'page-url' };
  if (shimEffective === null || detectMapMode(tags) !== 'shim') {
    return fallback;
  }
  const shimTargets = new Map(shimEffective.imports.map((entry) => [entry.specifier, entry.target]));

  // Winning as-authored target per bare specifier (later tag wins). The
  // shim's final target for a specifier is the resolution of the WINNING
  // entry — pairing it with a shadowed entry's relative form would let a
  // coincidental suffix match "verify" a foreign base (e.g. a CDN
  // directory) and poison every other relative entry.
  const winners = new Map<string, string>();
  for (const tag of tags) {
    if (tag.kind !== 'importmap-shim' || !tag.parsed) {
      continue;
    }
    for (const entry of tag.imports) {
      // Only bare specifiers match the shim map verbatim.
      if (!isUrlLikeSpecifier(entry.specifier)) {
        winners.set(entry.specifier, entry.target);
      }
    }
  }

  // Oracle pairs: winning entries with a path-relative target (an absolute
  // or root-relative target resolves the same against any same-origin base
  // and carries no base information) and a shim counterpart.
  const oracles: { relative: string; resolved: string }[] = [];
  for (const [specifier, target] of winners) {
    if (!target.startsWith('./') && !target.startsWith('../')) {
      continue;
    }
    const resolved = shimTargets.get(specifier);
    if (resolved !== undefined) {
      oracles.push({ relative: target, resolved });
    }
  }

  for (const oracle of oracles) {
    const candidate = baseCandidateFor(oracle.relative, oracle.resolved);
    if (candidate === null) {
      continue;
    }
    // Consensus: every oracle pair — including `../` pairs that cannot
    // source a candidate themselves — must re-resolve to its shim target.
    if (oracles.every((pair) => resolveUrl(pair.relative, candidate) === pair.resolved)) {
      return { url: candidate, source: 'shim-effective-map' };
    }
    // A refuted candidate means the pairs imply different directories; no
    // other candidate can satisfy them all — refuse instead of guessing.
    return fallback;
  }
  return fallback;
}

/**
 * The base directory implied by one (relative target, shim-resolved target)
 * pair: the resolved URL minus the relative path. `../` targets are skipped —
 * their suffix arithmetic is ambiguous, and any sibling entry can still pin
 * the base. The caller verifies the candidate by re-resolving.
 */
function baseCandidateFor(relativeTarget: string, resolvedTarget: string): string | null {
  let rest = relativeTarget;
  while (rest.startsWith('./')) {
    rest = rest.slice(2);
  }
  if (rest.length === 0 || rest.startsWith('../') || !resolvedTarget.endsWith(rest)) {
    return null;
  }
  return resolvedTarget.slice(0, resolvedTarget.length - rest.length);
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
  if (isUrlLikeSpecifier(specifier)) {
    return resolveUrl(specifier, baseUrl);
  }
  return specifier;
}

function isUrlLikeSpecifier(specifier: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(specifier) ||
    specifier.startsWith('/') ||
    specifier.startsWith('./') ||
    specifier.startsWith('../')
  );
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
