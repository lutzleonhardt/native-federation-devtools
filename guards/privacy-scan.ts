/**
 * Structural privacy scan over fixture snapshots and checked-in captures
 * (contributes to XC-02).
 *
 * Walks a JSON value and reports:
 *  - keys that suggest raw page data (cookies, headers, bodies, credentials,
 *    tokens, business data)
 *  - URL values carrying userinfo, query, or fragment — absolute URLs and
 *    relative URL-shaped strings (`/`, `./`, `../`) alike
 *  - SRI integrity hashes copied as values OUTSIDE an `integrity`-keyed
 *    map. Inside such a map the hash values are collected by policy
 *    (V2 corpus decision — per-remote integrity in SnapshotV1); everywhere
 *    else, e.g. `integrityFor`, presence lists remain the rule.
 */

export interface PrivacyViolation {
  path: string;
  message: string;
}

export interface PrivacyScanOptions {
  /** Blanket SRI exemption (captures keep hashes everywhere). Snapshots and
   * fixtures rely on the structural rule instead: hash values are allowed
   * only inside `integrity`-keyed maps. */
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
    } else if (/^(\/|\.\/|\.\.\/)/.test(value)) {
      if (value.includes('?')) {
        violations.push({ path, message: 'relative URL carries a query string' });
      }
      if (value.includes('#')) {
        violations.push({ path, message: 'relative URL carries a fragment' });
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
      // Descending into an `integrity` map switches the SRI rule to
      // by-policy: its values ARE hashes. The exemption covers only that
      // subtree — an SRI hash anywhere else stays a violation.
      const childOptions =
        key === 'integrity' && !options.allowSriHashes
          ? { ...options, allowSriHashes: true }
          : options;
      violations.push(...scanForPrivacyViolations(child, childPath, childOptions));
    }
  }

  return violations;
}
