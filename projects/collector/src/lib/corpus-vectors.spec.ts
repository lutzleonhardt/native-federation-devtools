/**
 * Corpus-shaped vectors (T4-AC-01/02/04/05, contributes to XC-02): the
 * probe→mapper pipeline runs over registries taken verbatim from the
 * checked-in lossless corpus (captures/) — both orchestrator generations
 * project through the corpus-validated schemas without collection errors,
 * and the projections equal the captured ground truth.
 */
import { describe, expect, it } from 'vitest';
import type { SnapshotV1 } from '../../../devtools-bridge/src/lib/snapshot-v1';
import { scanForPrivacyViolations } from '../../../../guards/privacy-scan';
import { PASSIVE_PROBE_SOURCE } from './passive-probe';
import { mapProbeResult } from './snapshot-mapper';
import { evaluateProbe, makeBarePage } from '../testing/fixture-pages';
import { labNamespace, loadLabCapture } from '../testing/lab-corpus';

const CAPTURED_AT = '2026-08-11T00:00:00Z';

function captureScenario(
  scenario: string,
  fileName?: string,
): { snapshot: SnapshotV1; raw: Record<string, any> } {
  const raw = labNamespace(loadLabCapture(scenario, fileName)) as Record<string, any>;
  const sandbox = makeBarePage({ __NATIVE_FEDERATION__: structuredClone(raw) });
  const probeResult = evaluateProbe(PASSIVE_PROBE_SOURCE, sandbox);
  return { snapshot: mapProbeResult(probeResult, null, { capturedAt: CAPTURED_AT }), raw };
}

describe('v4.5-generation registries (T4-AC-01)', () => {
  it('clean-skip: participants keep bundle + entries, the package wrapper stays intact', () => {
    const { snapshot, raw } = captureScenario('clean-skip');

    expect(snapshot.channels.nativeFederationGlobals).toEqual({ state: 'available' });
    expect(snapshot.errors).toEqual([]);

    const external = snapshot.runtime!.sharedExternals['__GLOBAL__']['@nf-lab/conflict-lib'];
    // The { dirty, versions } wrapper and the conflict rows survive.
    expect(external.dirty).toBe(false);
    expect(external.versions.map((version) => [version.tag, version.action])).toEqual([
      ['2.0.0', 'share'],
      ['1.0.0', 'skip'],
    ]);

    const rawVersions = raw['shared-externals']['__GLOBAL__']['@nf-lab/conflict-lib'].versions;
    external.versions.forEach((version, index) => {
      version.remotes.forEach((participant, remoteIndex) => {
        const rawParticipant = rawVersions[index].remotes[remoteIndex];
        expect(participant.name).toBe(rawParticipant.name);
        expect(participant.requiredVersion).toBe(rawParticipant.requiredVersion);
        expect(participant.strictVersion).toBe(rawParticipant.strictVersion);
        expect(participant.cached).toBe(rawParticipant.cached);
        expect(participant.bundle).toBe(rawParticipant.bundle);
        expect(participant.entries).toEqual(rawParticipant.entries);
        expect(participant.file).toBeNull();
        expect(participant.generation).toBe('v4.5');
        expect(participant.servedFiles).toEqual(
          Object.entries(rawParticipant.entries).map(([entry, file]) => ({ entry, file })),
        );
      });
    });
    expect(snapshot.runtime!.generation).toBe('v4.5');
  });

  it('dynamic-init-shim: per-remote integrity maps keep their SRI values, empty maps included (T4-AC-05)', () => {
    const { snapshot, raw } = captureScenario('dynamic-init-shim');

    expect(snapshot.errors).toEqual([]);
    for (const [name, remote] of Object.entries(raw['remotes'])) {
      expect(snapshot.runtime!.remotes[name].integrity).toEqual(
        (remote as Record<string, unknown>)['integrity'],
      );
    }
    // SRI values under integrity maps are collected by policy — the
    // privacy scan's structural rule accepts exactly that placement.
    expect(scanForPrivacyViolations(snapshot)).toEqual([]);
  });
});

describe('released-v4 registry: frankenstein-live (T4-AC-02, T4-AC-05)', () => {
  const phase1 = () => captureScenario('frankenstein-live', '20260811T115536Z-01-initial.json');

  it('accepts the file spelling on every participant and derives the v4 generation', () => {
    const { snapshot } = phase1();

    expect(snapshot.channels.nativeFederationGlobals).toEqual({ state: 'available' });
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.runtime!.generation).toBe('v4');

    const participants = Object.values(snapshot.runtime!.sharedExternals['__GLOBAL__']).flatMap(
      (external) => external.versions.flatMap((version) => version.remotes),
    );
    expect(participants).toHaveLength(20);
    for (const participant of participants) {
      expect(participant.generation).toBe('v4');
      expect(participant.entries).toBeNull();
      expect(typeof participant.file).toBe('string');
      // Both spellings feed the same normalized representation.
      expect(participant.servedFiles).toEqual([{ entry: null, file: participant.file }]);
    }
  });

  it('collects per-remote integrity with SRI values and the shared-chunks bundle lists verbatim', () => {
    const { snapshot, raw } = phase1();

    for (const [name, remote] of Object.entries(raw['remotes'])) {
      expect(snapshot.runtime!.remotes[name].integrity).toEqual(
        (remote as Record<string, unknown>)['integrity'],
      );
    }
    expect(snapshot.runtime!.sharedChunks).toEqual(raw['shared-chunks']);
    // Present-but-empty scoped-externals is the same zero-entry observation.
    expect(snapshot.runtime!.scopedExternals).toEqual({});
    expect(scanForPrivacyViolations(snapshot)).toEqual([]);
  });
});

describe('scoped-externals own schema and repository laziness (T4-AC-04)', () => {
  it('scoped: single-object packages project; the absent shared-externals key is zero entries', () => {
    const { snapshot, raw } = captureScenario('scoped');

    expect(snapshot.channels.nativeFederationGlobals).toEqual({ state: 'available' });
    expect(snapshot.errors).toEqual([]);
    // shared-externals is ABSENT in this capture — lazily zero, still available.
    expect(raw['shared-externals']).toBeUndefined();
    expect(snapshot.runtime!.sharedExternals).toEqual({});
    // No spelling evidence without participants.
    expect(snapshot.runtime!.generation).toBe('unknown');

    for (const [scope, packages] of Object.entries(raw['scoped-externals'])) {
      for (const [pkg, scoped] of Object.entries(packages as Record<string, any>)) {
        expect(snapshot.runtime!.scopedExternals[scope][pkg]).toEqual({
          tag: scoped.tag,
          bundle: scoped.bundle ?? null,
          entries: scoped.entries,
        });
      }
    }
  });

  it('non-dense: chunk pseudo-externals without a bundle project with bundle null', () => {
    const { snapshot, raw } = captureScenario('non-dense');

    expect(snapshot.errors).toEqual([]);
    const rawScoped = raw['scoped-externals']['mfe3'];
    const projected = snapshot.runtime!.scopedExternals['mfe3'];
    expect(Object.keys(projected).sort()).toEqual(Object.keys(rawScoped).sort());
    for (const [pkg, scoped] of Object.entries<any>(rawScoped)) {
      expect(scoped.bundle).toBeUndefined();
      expect(projected[pkg]).toEqual({ tag: scoped.tag, bundle: null, entries: scoped.entries });
    }
  });

  it('strict-scope: the populated scope is strict, __GLOBAL__ stays an empty observation', () => {
    const { snapshot } = captureScenario('strict-scope');

    expect(snapshot.errors).toEqual([]);
    // No __GLOBAL__ assumption in either direction: the capture's empty
    // __GLOBAL__ projects as-is, and all packages live under 'strict'.
    expect(Object.keys(snapshot.runtime!.sharedExternals).sort()).toEqual([
      '__GLOBAL__',
      'strict',
    ]);
    expect(snapshot.runtime!.sharedExternals['__GLOBAL__']).toEqual({});
    const versions = snapshot.runtime!.sharedExternals['strict']['@nf-lab/conflict-lib'].versions;
    expect(versions.map((version) => version.tag)).toEqual(['2.0.0', '1.0.0']);
    expect(snapshot.runtime!.generation).toBe('v4.5');
  });
});
