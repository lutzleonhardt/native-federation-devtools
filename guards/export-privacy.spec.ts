/**
 * Privacy scan over the serialized export path (T6-AC-02, contributes to
 * XC-02).
 *
 * Honest scope: while the exporter is a verbatim JSON.stringify, "export
 * clean" already follows from T6-AC-01 (export deep-equals the DTO) plus the
 * fixture privacy guard in privacy-scan.spec.ts (DTO clean) — a JSON
 * round-trip cannot add data. These tests therefore anchor the acceptance
 * criterion literally and validate the measuring point itself, nothing more.
 * Their real target arrives with the live collector (Task 8): point the same
 * scan at actually captured snapshots, where data is no longer hand-curated.
 */

import { describe, expect, it } from 'vitest';
import { FIXTURES, PRIMARY_FIXTURE_ID } from '../projects/devtools-bridge/src/lib/fixtures';
import { serializeSnapshot } from '../projects/devtools-ui/src/app/shared/snapshot-export';
import { scanForPrivacyViolations } from './privacy-scan';

describe('export privacy scan (T6-AC-02)', () => {
  // The literal AC anchor: the two fixtures the criterion names, scanned as
  // the parsed export bytes a shared file would carry.
  it.each([PRIMARY_FIXTURE_ID, 'synthetic-hostile'] as const)(
    'exported %s JSON contains no forbidden material',
    (id) => {
      const exported = JSON.parse(serializeSnapshot(FIXTURES[id]));
      expect(scanForPrivacyViolations(exported)).toEqual([]);
    },
  );

  // Validates the detector over serialized bytes — the tool Task 8 must
  // point at live captures: a poisoned snapshot reaching the exporter is
  // flagged in every violation class.
  it('flags every violation class when a poisoned snapshot reaches the exporter', () => {
    const poisoned = structuredClone(FIXTURES[PRIMARY_FIXTURE_ID]) as Record<string, unknown>;
    poisoned['capture'] = {
      ...(poisoned['capture'] as Record<string, unknown>),
      pageUrl: 'https://user:pw@app.example/dashboard?customerId=42#section',
    };
    poisoned['cookies'] = 'sessionid=abc123';
    (poisoned['importMaps'] as { effective: { integrityFor: string[] } }).effective.integrityFor.push(
      'sha384-57khIiCnWo5tC9kEt0ibpdoHhHGtPXp1KmeWeJyyX0+UPwenA+Wj+0qvj7ajI3As',
    );

    const exported = JSON.parse(serializeSnapshot(poisoned as never));
    const messages = scanForPrivacyViolations(exported)
      .map((violation) => violation.message)
      .join('; ');
    expect(messages).toContain('userinfo');
    expect(messages).toContain('query');
    expect(messages).toContain('fragment');
    expect(messages).toContain("forbidden key 'cookies'");
    expect(messages).toContain('SRI integrity hash');
  });
});
