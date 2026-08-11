import { FIXTURES, SnapshotV1 } from 'devtools-bridge';

import { importMapViewState } from './import-map-view-state';

function captured(snapshot: SnapshotV1) {
  return { status: 'captured', snapshot } as const;
}

describe('importMapViewState', () => {
  it('maps the capturing store state without capture meta', () => {
    expect(importMapViewState({ status: 'capturing' })).toEqual({
      kind: 'capturing',
      capture: null,
    });
  });

  it('maps a capture error with the message embedded in the reason', () => {
    expect(importMapViewState({ status: 'error', message: 'boom' })).toEqual({
      kind: 'error',
      reason: 'Snapshot capture failed: boom',
      capture: null,
    });
  });

  it('maps null importMaps to missing with both channel reasons', () => {
    const snapshot = FIXTURES['synthetic-no-import-maps'];
    const result = importMapViewState(captured(snapshot));
    expect(result.kind).toBe('missing');
    expect(result.kind === 'missing' && result.reason).toContain(
      'page context was not accessible',
    );
    expect(result.kind === 'missing' && result.reason).toContain(
      'window.importShim is not present',
    );
    expect(result.capture).toEqual(snapshot.capture);
  });

  it('maps null importMaps despite an available channel to a defensive missing state', () => {
    const snapshot: SnapshotV1 = {
      ...structuredClone(FIXTURES['frankenstein-live']),
      importMaps: null,
    };
    const result = importMapViewState(captured(snapshot));
    expect(result.kind).toBe('missing');
    expect(result.kind === 'missing' && result.reason).toContain('inconsistent snapshot');
    // The capture identity stays visible even for an inconsistent snapshot.
    expect(result.capture).toEqual(snapshot.capture);
  });

  it('maps two not-recognized channels to not-detected with both reasons', () => {
    const snapshot: SnapshotV1 = structuredClone(FIXTURES['synthetic-no-import-maps']);
    snapshot.channels.domImportMaps = { state: 'not-recognized', reason: 'script tag unreadable' };
    snapshot.channels.importShim = { state: 'not-recognized', reason: 'shim without getImportMap' };
    const result = importMapViewState(captured(snapshot));
    expect(result).toEqual({
      kind: 'not-detected',
      reason: 'Document maps: script tag unreadable · Import shim: shim without getImportMap',
      capture: snapshot.capture,
    });
  });

  it('maps document maps without an effective map to document-only with the shim reason', () => {
    const snapshot = FIXTURES['synthetic-missing-channel'];
    expect(importMapViewState(captured(snapshot))).toEqual({
      kind: 'document-only',
      documentMaps: snapshot.importMaps!.documentMaps,
      reason: 'window.importShim is not present',
      capture: snapshot.capture,
    });
  });

  it('stays document-only for zero document maps (zero data is an observation)', () => {
    const result = importMapViewState(captured(FIXTURES['synthetic-empty-page']));
    expect(result.kind).toBe('document-only');
    expect(result.kind === 'document-only' && result.documentMaps).toEqual([]);
  });

  it('maps a null effective map despite an available shim channel to a defensive document-only reason', () => {
    const snapshot: SnapshotV1 = structuredClone(FIXTURES['frankenstein-live']);
    snapshot.importMaps!.effective = null;
    const result = importMapViewState(captured(snapshot));
    expect(result.kind).toBe('document-only');
    expect(result.kind === 'document-only' && result.reason).toContain('inconsistent snapshot');
  });

  it('maps an effective map to ready', () => {
    const snapshot = FIXTURES['frankenstein-live'];
    expect(importMapViewState(captured(snapshot))).toEqual({
      kind: 'ready',
      capture: snapshot.capture,
      effective: snapshot.importMaps!.effective!,
    });
  });
});
