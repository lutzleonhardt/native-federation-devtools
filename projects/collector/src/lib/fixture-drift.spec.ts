/**
 * Fixture drift guard (T5-AC-01/02/03, contributes to XC-02): every
 * corpus-derived fixture module equals a fresh run of the real collector
 * pipeline over its source capture — the same capture-pipeline step
 * `scripts/derive-fixtures.mjs` uses. Catches hand-edited fixture modules
 * and collector-schema changes whose fixtures were not re-derived.
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../../../devtools-bridge/src/lib/fixtures';
import { deriveCaptureSnapshot } from '../testing/capture-pipeline';
import { loadLabCapture } from '../testing/lab-corpus';

const LIVE_ID = 'frankenstein-live';
const LIVE_FILE = '20260811T115536Z-01-initial.json';

const derivedIds = Object.keys(FIXTURES).filter((id) => !id.startsWith('synthetic-'));

describe('corpus-derived fixtures equal fresh pipeline output (T5-AC-01)', () => {
  it.each(derivedIds)('%s', (id) => {
    const capture = loadLabCapture(id, id === LIVE_ID ? LIVE_FILE : undefined);
    expect(deriveCaptureSnapshot(capture)).toEqual(FIXTURES[id as keyof typeof FIXTURES]);
  });

  it('covers all ten lab scenarios plus the live capture', () => {
    expect(derivedIds).toHaveLength(11);
    expect(derivedIds).toContain(LIVE_ID);
  });
});

describe('frankenstein-live fixture provenance (T5-AC-02)', () => {
  it('is the released-generation snapshot of the public deployment', () => {
    const fixture = FIXTURES[LIVE_ID];
    expect(fixture.capture.pageUrl).toBe('https://lutzleonhardt.de/frankenstein-meeting-room/');
    expect(fixture.runtime?.generation).toBe('v4');

    const participants = Object.values(fixture.runtime!.sharedExternals['__GLOBAL__']).flatMap(
      (external) => external.versions.flatMap((version) => version.remotes),
    );
    expect(participants).toHaveLength(20);
    for (const participant of participants) {
      expect(typeof participant.file).toBe('string');
      expect(participant.entries).toBeNull();
    }
  });
});
