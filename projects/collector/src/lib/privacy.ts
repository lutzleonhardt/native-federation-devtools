/**
 * URL sanitization and SRI validation. Ported from the research collector
 * (privacy.js); the artifact-URL allowlist helpers are not part of the
 * passive Phase-1 surface and were dropped.
 *
 * `sanitizeUrl` strips userinfo, query, and fragment — every URL that ends
 * up in a snapshot must have passed through it.
 */
import { DEFAULT_LIMITS } from './constants';

const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/u;
const ABSOLUTE_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const SRI_DIGEST_LENGTHS = Object.freeze({
  sha256: 44,
  sha384: 64,
  sha512: 88,
});

export function sanitizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const value = raw.trim();
  if (
    value.length === 0 ||
    value.length > DEFAULT_LIMITS.maxUrlLength ||
    CONTROL_PATTERN.test(value) ||
    value.includes('\\')
  ) {
    return null;
  }

  if (value.startsWith('//')) {
    try {
      const parsed = new URL(`https:${value}`);
      if (!isHttpProtocol(parsed.protocol)) {
        return null;
      }
      return `//${parsed.host}${parsed.pathname}`;
    } catch {
      return null;
    }
  }

  if (ABSOLUTE_SCHEME_PATTERN.test(value)) {
    try {
      const parsed = new URL(value);
      if (!isHttpProtocol(parsed.protocol)) {
        return null;
      }
      parsed.username = '';
      parsed.password = '';
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    } catch {
      return null;
    }
  }

  const fragmentIndex = value.indexOf('#');
  const withoutFragment = fragmentIndex === -1 ? value : value.slice(0, fragmentIndex);
  const queryIndex = withoutFragment.indexOf('?');
  const withoutQuery = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
  if (withoutQuery.length === 0 || CONTROL_PATTERN.test(withoutQuery)) {
    return null;
  }
  return withoutQuery;
}

export function isValidSri(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const match = /^(sha256|sha384|sha512)-(.+)$/u.exec(value);
  if (!match) {
    return false;
  }
  const [, algorithm, digest] = match as unknown as [string, keyof typeof SRI_DIGEST_LENGTHS, string];
  const hasCanonicalPadding =
    algorithm === 'sha256'
      ? digest.endsWith('=') && !digest.endsWith('==')
      : algorithm === 'sha384'
        ? !digest.endsWith('=')
        : digest.endsWith('==');
  return (
    digest.length === SRI_DIGEST_LENGTHS[algorithm] &&
    hasCanonicalPadding &&
    BASE64_PATTERN.test(digest)
  );
}

function isHttpProtocol(protocol: string): boolean {
  return protocol === 'http:' || protocol === 'https:';
}
