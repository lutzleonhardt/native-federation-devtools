/**
 * Structural privacy scan over fixture snapshots and checked-in captures
 * (contributes to XC-02).
 *
 * Walks a JSON value and reports:
 *  - keys that suggest raw page data (cookies, headers, bodies, credentials,
 *    tokens, business data)
 *  - URL values carrying userinfo, query, or fragment
 *  - SRI integrity hashes copied as values (presence lists only)
 */

export interface PrivacyViolation {
  path: string;
  message: string;
}

export interface PrivacyScanOptions {
  /** Captures may keep SRI hashes; the fixture projection drops them. */
  allowSriHashes?: boolean;
  /** Exact key names exempt from the forbidden-key rule (e.g. `encodedBodySize`). */
  allowedKeys?: string[];
}

const FORBIDDEN_KEY = /(cookie|header|body|credential|password|secret|token|authorization|session[-_]?id|account|customer|business)/i;
const SRI_HASH = /^sha(256|384|512)-[A-Za-z0-9+/=]+$/;

export function scanForPrivacyViolations(
  value: unknown,
  path = '$',
  options: PrivacyScanOptions = {},
): PrivacyViolation[] {
  const violations: PrivacyViolation[] = [];

  if (typeof value === 'string') {
    if (!options.allowSriHashes && SRI_HASH.test(value)) {
      violations.push({ path, message: 'SRI integrity hash copied — presence only is allowed' });
    }
    if (/^https?:\/\//.test(value)) {
      const url = new URL(value);
      if (url.username !== '' || url.password !== '') {
        violations.push({ path, message: 'URL carries userinfo' });
      }
      if (url.search !== '') {
        violations.push({ path, message: 'URL carries a query string' });
      }
      if (url.hash !== '') {
        violations.push({ path, message: 'URL carries a fragment' });
      }
    }
    return violations;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      violations.push(...scanForPrivacyViolations(item, `${path}[${index}]`, options));
    });
    return violations;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (FORBIDDEN_KEY.test(key) && !options.allowedKeys?.includes(key)) {
        violations.push({ path: childPath, message: `forbidden key '${key}'` });
      }
      violations.push(...scanForPrivacyViolations(child, childPath, options));
    }
  }

  return violations;
}
