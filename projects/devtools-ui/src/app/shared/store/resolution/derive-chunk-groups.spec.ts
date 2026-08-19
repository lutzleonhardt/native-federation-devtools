/**
 * Chunk-group derivation specs (Task 6): emitter-aware identity that never
 * merges equal filenames from different emitters (T6-AC-03), both witnessed
 * origins (`shared-chunks`, `@nf-internal/...` pseudo-externals) with their
 * provenance kept separate, and the structural zero-entry rule
 * (`mapping-or-exposed` contributes nothing).
 */
import { FIXTURES, type RuntimeRepositoriesV1, type SnapshotV1 } from 'devtools-bridge';

import { deriveChunkGroups } from './derive-chunk-groups';
import type { CanonicalRegistryEvidence } from './model';
import { normalizeRegistryEvidence } from './normalize-registry-evidence';

const EMPTY_EVIDENCE: CanonicalRegistryEvidence = {
  sharedExternals: [],
  versionRegistrations: [],
  participantDeclarations: [],
  privateRegistrations: [],
  entrypointCandidates: [],
  diagnostics: [],
};

function corpusInputs(snapshot: SnapshotV1): {
  evidence: CanonicalRegistryEvidence;
  sharedChunks: RuntimeRepositoriesV1['sharedChunks'];
} {
  return {
    evidence: normalizeRegistryEvidence(snapshot),
    sharedChunks: snapshot.runtime?.sharedChunks ?? {},
  };
}

describe('deriveChunkGroups — dense shared-chunks origin', () => {
  it('derives the host bundle groups of frankenstein-live and skips zero-entry lists', () => {
    const { evidence, sharedChunks } = corpusInputs(FIXTURES['frankenstein-live']);
    const groups = deriveChunkGroups(evidence, sharedChunks);
    const dense = groups.filter((group) => group.origin === 'shared-chunks');

    expect(dense.map((group) => group.bundleName).sort()).toEqual([
      'browser-angular_common',
      'browser-angular_core',
      'browser-rxjs',
    ]);
    for (const group of dense) {
      expect(group.emitterRemote).toBe('__NF-HOST__');
      expect(group.pseudoPackage).toBeNull();
      expect(group.files.length).toBeGreaterThan(0);
    }
    const core = dense.find((group) => group.bundleName === 'browser-angular_core');
    expect(core?.files).toEqual([
      'chunk-RCIWTGS7.js',
      'chunk-K6ZMRNMW.js',
      'chunk-APTZXQMF.js',
      'chunk-V2SUVJ7R.js',
      'chunk-2VMXMS7J.js',
    ]);
    expect(core?.provenance.evidence).toEqual([
      {
        source: 'snapshot',
        path: ['runtime', 'sharedChunks', '__NF-HOST__', 'browser-angular_core'],
        state: 'present',
      },
    ]);
    // The structurally empty 'mapping-or-exposed' list never becomes a group.
    expect(groups.some((group) => group.bundleName === 'mapping-or-exposed')).toBe(false);
  });

  it('keeps equal filenames from different emitters as distinct groups (T6-AC-03)', () => {
    const sharedChunks: RuntimeRepositoriesV1['sharedChunks'] = {
      mfe1: { 'browser-shared': ['chunk-EQUAL.js'] },
      mfe2: { 'browser-shared': ['chunk-EQUAL.js'] },
    };
    const groups = deriveChunkGroups(EMPTY_EVIDENCE, sharedChunks);

    expect(groups).toHaveLength(2);
    expect(groups[0].id).not.toBe(groups[1].id);
    expect(groups.map((group) => group.emitterRemote).sort()).toEqual(['mfe1', 'mfe2']);
    expect(groups[0].files).toEqual(['chunk-EQUAL.js']);
    expect(groups[1].files).toEqual(['chunk-EQUAL.js']);
  });
});

describe('deriveChunkGroups — legacy pseudo-external origin', () => {
  it('derives non-dense @nf-internal groups with raw provenance and no dense group', () => {
    const snapshot = FIXTURES['non-dense'];
    const { evidence, sharedChunks } = corpusInputs(snapshot);
    const groups = deriveChunkGroups(evidence, sharedChunks);
    const pseudoRegistrations = evidence.privateRegistrations.filter((registration) =>
      registration.packageName.startsWith('@nf-internal/'),
    );

    expect(pseudoRegistrations.length).toBeGreaterThan(0);
    expect(groups).toHaveLength(pseudoRegistrations.length);
    for (const group of groups) {
      expect(group.origin).toBe('scoped-pseudo-external');
      expect(group.emitterRemote).toBe('mfe3');
      expect(group.pseudoPackage).toMatch(/^@nf-internal\//);
      expect(group.bundleName).toBeNull();
      expect(group.files).toHaveLength(1);
    }
    const sample = groups.find((group) => group.pseudoPackage === '@nf-internal/chunk-G4MQRHIT');
    expect(sample?.files).toEqual(['chunk-G4MQRHIT.js']);
  });

  it('is deterministic and sorted by id', () => {
    const { evidence, sharedChunks } = corpusInputs(FIXTURES['non-dense']);
    const first = deriveChunkGroups(evidence, sharedChunks);
    const second = deriveChunkGroups(evidence, sharedChunks);

    expect(second).toEqual(first);
    expect(first.map((group) => group.id)).toEqual([...first.map((group) => group.id)].sort());
  });
});
