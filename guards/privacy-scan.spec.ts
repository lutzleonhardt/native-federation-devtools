import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXTURES, PRIMARY_FIXTURE_ID } from '../projects/devtools-bridge/src/lib/fixtures';
import { scanForPrivacyViolations } from './privacy-scan';

const FIXTURES_DIR = join(__dirname, '../projects/devtools-bridge/src/lib/fixtures');
const CAPTURES_DIR = join(__dirname, '../captures');

describe('fixture privacy scan (T2-AC-03)', () => {
  it.each(Object.entries(FIXTURES))('%s contains no privacy violations', (_id, fixture) => {
    expect(scanForPrivacyViolations(fixture)).toEqual([]);
  });

  it('every fixture file on disk is registered — the scan cannot silently skip one', () => {
    const onDisk = readdirSync(FIXTURES_DIR)
      .filter((file) => file.endsWith('.fixture.ts'))
      .map((file) => file.replace(/\.fixture\.ts$/, ''))
      .sort();
    expect(onDisk).toEqual(Object.keys(FIXTURES).sort());
  });

  it('flags a deliberately poisoned fixture', () => {
    const poisoned = structuredClone(FIXTURES[PRIMARY_FIXTURE_ID]) as Record<string, unknown>;
    poisoned['capture'] = {
      ...(poisoned['capture'] as Record<string, unknown>),
      pageUrl: 'https://user:pw@app.example/dashboard?customerId=42#section',
    };
    poisoned['cookies'] = 'sessionid=abc123';
    (poisoned['importMaps'] as { effective: { integrityFor: string[] } }).effective.integrityFor.push(
      'sha384-57khIiCnWo5tC9kEt0ibpdoHhHGtPXp1KmeWeJyyX0+UPwenA+Wj+0qvj7ajI3As',
      '/assets/app.js?signature=leaked#state',
    );

    const violations = scanForPrivacyViolations(poisoned);
    const messages = violations.map((v) => v.message).join('; ');
    expect(messages).toContain('userinfo');
    expect(messages).toContain('query');
    expect(messages).toContain('fragment');
    expect(messages).toContain("forbidden key 'cookies'");
    expect(messages).toContain('SRI integrity hash');
    expect(messages).toContain('relative URL carries a query string');
    expect(messages).toContain('relative URL carries a fragment');
  });

  it('allows SRI hash values only inside an integrity-keyed map (V2 policy)', () => {
    const hash = 'sha384-57khIiCnWo5tC9kEt0ibpdoHhHGtPXp1KmeWeJyyX0+UPwenA+Wj+0qvj7ajI3As';
    // Per-remote integrity in SnapshotV1 keeps hash values by policy.
    expect(
      scanForPrivacyViolations({ runtime: { remotes: { r: { integrity: { 'main.js': hash } } } } }),
    ).toEqual([]);
    // The same value anywhere else stays a violation.
    const stray = scanForPrivacyViolations({ integrityFor: [hash] });
    expect(stray.map((v) => v.message).join('; ')).toContain('SRI integrity hash');
  });
});

// Checked-in captures follow the lab-data-only policy (captures/README.md):
// SRI hashes and standard resource-timing keys are fine, everything else is
// held to the same URL and key rules as the fixtures.
describe('checked-in capture privacy scan', () => {
  const captureFiles = readdirSync(CAPTURES_DIR, { recursive: true, encoding: 'utf8' }).filter(
    (file) => file.endsWith('.json'),
  );

  it('finds the frankenstein source capture', () => {
    expect(captureFiles).toContain('frankenstein/production-04-remote-interaction.json');
  });

  it.each(captureFiles)('%s contains no privacy violations', (file) => {
    const capture = JSON.parse(readFileSync(join(CAPTURES_DIR, file), 'utf8'));
    const violations = scanForPrivacyViolations(capture, '$', {
      allowSriHashes: true,
      allowedKeys: ['encodedBodySize', 'decodedBodySize', 'businessValuesRecorded'],
    });
    expect(violations).toEqual([]);
  });
});
