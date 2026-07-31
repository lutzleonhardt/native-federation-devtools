import { FIXTURES, SnapshotV1 } from 'devtools-bridge';

import { runtimeViewState } from './runtime-view-state';

function captured(snapshot: SnapshotV1) {
  return { status: 'captured', snapshot } as const;
}

describe('runtimeViewState', () => {
  it('maps the capturing store state without capture meta', () => {
    expect(runtimeViewState({ status: 'capturing' })).toEqual({ kind: 'capturing', capture: null });
  });

  it('maps a capture error with the message embedded in the reason', () => {
    expect(runtimeViewState({ status: 'error', message: 'boom' })).toEqual({
      kind: 'error',
      reason: 'Snapshot capture failed: boom',
      capture: null,
    });
  });

  it('maps a not-recognized channel to not-detected with the verbatim reason', () => {
    const snapshot = FIXTURES['synthetic-not-recognized'];
    const channel = snapshot.channels.nativeFederationGlobals;
    expect(runtimeViewState(captured(snapshot))).toEqual({
      kind: 'not-detected',
      reason: channel.reason,
      capture: snapshot.capture,
    });
  });

  it('maps an unavailable channel to missing with the verbatim reason', () => {
    const snapshot = FIXTURES['synthetic-missing-channel'];
    const channel = snapshot.channels.nativeFederationGlobals;
    expect(runtimeViewState(captured(snapshot))).toEqual({
      kind: 'missing',
      reason: channel.reason,
      capture: snapshot.capture,
    });
  });

  it('maps a null runtime despite an available channel to a defensive missing state', () => {
    const snapshot: SnapshotV1 = {
      ...structuredClone(FIXTURES['frankenstein-production']),
      runtime: null,
    };
    const result = runtimeViewState(captured(snapshot));
    expect(result.kind).toBe('missing');
    expect(result.kind === 'missing' && result.reason).toContain('inconsistent snapshot');
    // The capture identity stays visible even for an inconsistent snapshot.
    expect(result.capture).toEqual(snapshot.capture);
  });

  it('maps an available channel with a runtime projection to ready', () => {
    const snapshot = FIXTURES['frankenstein-production'];
    const result = runtimeViewState(captured(snapshot));
    expect(result).toEqual({
      kind: 'ready',
      capture: snapshot.capture,
      snapshot,
      runtime: snapshot.runtime!,
    });
  });

  it('stays ready for an available channel with empty repositories (zero data is an observation)', () => {
    const result = runtimeViewState(captured(FIXTURES['synthetic-collision']));
    expect(result.kind).toBe('ready');
  });
});
