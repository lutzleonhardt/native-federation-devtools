/**
 * Pool families (grouping-and-pooling Task 6): per tag pool, who serves each
 * consumer each member and whether the result is one some single build
 * shipped — read off the rows pooling wrote back. Expectations follow the
 * stored rows of each capture (see the Task 2 log's evidence table).
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES, NF_HOST, type FixtureId, type SnapshotV1 } from 'devtools-bridge';

import { ingestSnapshot } from '../ingest';
import { deriveTagPools } from './derive-grouping-facets';
import { derivePoolFamilies } from './derive-pool-families';
import { normalizeRegistryEvidence } from './normalize-registry-evidence';

const familyOf = (id: FixtureId) => {
  const projection = ingestSnapshot(FIXTURES[id]).resolutionProjection;
  expect(projection.poolFamilies).toHaveLength(projection.tagPools.length);
  return projection.poolFamilies[0];
};
const consumer = (id: FixtureId, remote: string) =>
  familyOf(id).consumers.find((entry) => entry.remote === remote)!;

describe('derivePoolFamilies — outcomes from stored rows', () => {
  it('pooling-anchor: mfe2 is redirected onto mfe1, whose build it serves', () => {
    expect(consumer('pooling-anchor', NF_HOST)).toMatchObject({
      outcome: 'one-build',
      coherent: null,
    });
    expect(consumer('pooling-anchor', 'mfe1')).toMatchObject({
      outcome: 'one-build',
      servesOthers: ['mfe2'],
      coherent: true,
    });
    expect(consumer('pooling-anchor', 'mfe2')).toMatchObject({
      outcome: 'redirected',
      servingBuilds: { '@nf-lab/conflict-lib': 'mfe1', '@nf-lab/conflict-lib/extra': 'mfe1' },
      coherent: true,
      sharedCombinationMixes: ['@nf-lab/conflict-lib/extra@1.0.0', '@nf-lab/conflict-lib@2.0.0'],
    });
  });

  it('pool-tag-anchored: both remotes anchored on mfe1, untagged mfe3 included', () => {
    const family = familyOf('pool-tag-anchored');
    expect(family.consumers.map(({ remote, outcome }) => `${remote}:${outcome}`)).toEqual([
      `${NF_HOST}:one-build`,
      'mfe1:one-build',
      'mfe2:redirected',
      'mfe3:redirected',
    ]);
    expect(consumer('pool-tag-anchored', 'mfe1').servesOthers).toEqual(['mfe2', 'mfe3']);
    expect(consumer('pool-tag-anchored', 'mfe3').sharedCombinationMixes).toEqual([
      '@nf-lab/ui-core@2.0.0',
      '@nf-lab/ui-dom@1.0.0',
    ]);
    expect(family.matrix[0]).toEqual([
      { kind: 'declared', tag: '2.0.0', poolTag: null, scoped: false, poolCause: null },
      { kind: 'declared', tag: '1.0.0', poolTag: 'ui', scoped: false, poolCause: null },
      { kind: 'declared', tag: '1.0.0', poolTag: 'ui', scoped: false, poolCause: null },
      { kind: 'declared', tag: '1.0.0', poolTag: null, scoped: false, poolCause: null },
    ]);
    expect(family.matrix[1][0]).toEqual({ kind: 'not-declared' });
  });

  it('pool-tag-islanded: mfe1 runs its own copy of everything; ui-core is left unshared', () => {
    const family = familyOf('pool-tag-islanded');
    expect(consumer('pool-tag-islanded', 'mfe1').outcome).toBe('own-copy');
    expect(consumer('pool-tag-islanded', 'mfe2')).toMatchObject({
      outcome: 'one-build',
      coherent: true,
    });
    expect(family.members.find((member) => member.packageName === '@nf-lab/ui-core')).toEqual({
      packageName: '@nf-lab/ui-core',
      followsPackage: null,
      unshared: true,
      scopedRemotes: ['mfe1', 'mfe2'],
    });
  });

  it('pool-tag-coherent: every consumer one build, nothing redirected, not pending', () => {
    const family = familyOf('pool-tag-coherent');
    expect(family.pending).toBe(false);
    expect(family.consumers.every((entry) => entry.outcome === 'one-build' && entry.coherent)).toBe(
      true,
    );
    expect(consumer('pool-tag-coherent', 'mfe2').servingBuilds).toEqual({
      '@nf-lab/ui-core': 'mfe1',
      '@nf-lab/ui-dom': 'mfe1',
    });
  });
});

// Hand-built rows for states no capture reaches: a torn combination (which
// pooling prevents), a dirty record, and an entrypoint joining untagged.
describe('derivePoolFamilies — hand-built records', () => {
  type Row = { remote: string; tag: string; action: string; pool?: string; servedBy?: string };
  const familyFrom = (packages: Record<string, Row[]>, dirty = false) => {
    const base = FIXTURES['pool-tag-coherent'];
    const shared: NonNullable<SnapshotV1['runtime']>['sharedExternals'] = { __GLOBAL__: {} };
    for (const [pkg, rows] of Object.entries(packages)) {
      const versions = [...new Set(rows.map((row) => `${row.tag}|${row.action}`))].map((key) => {
        const [tag, action] = key.split('|');
        return {
          tag,
          action,
          host: false,
          remotes: rows
            .filter((row) => row.tag === tag && row.action === action)
            .map((row) => ({
              name: row.remote,
              requiredVersion: '*',
              strictVersion: false,
              file: null,
              entries: { [pkg]: `${row.remote}-${pkg}-${tag}.js` },
              cached: false,
              bundle: null,
              ...(row.pool ? { pool: row.pool } : {}),
              ...(row.servedBy ? { servedBy: row.servedBy } : {}),
              servedFiles: [{ entry: pkg, file: `${row.remote}-${pkg}-${tag}.js` }],
              generation: 'v4.5' as const,
            })),
        };
      });
      shared['__GLOBAL__'][pkg] = { dirty, versions };
    }
    const snapshot = {
      ...base,
      runtime: { ...base.runtime!, scopedExternals: {}, sharedExternals: shared },
    };
    const evidence = normalizeRegistryEvidence(snapshot);
    return derivePoolFamilies(evidence, deriveTagPools(evidence).tagPools, NF_HOST)[0];
  };

  it('flags a torn combination no single build shipped', () => {
    // mfe2 takes a@2 from mfe3 and b@1 from mfe1; no build ships a@2 + b@1.
    const family = familyFrom({
      a: [
        { remote: 'mfe3', tag: '2.0.0', action: 'share', pool: 'p' },
        { remote: 'mfe2', tag: '1.0.0', action: 'skip', pool: 'p' },
        { remote: 'mfe1', tag: '1.0.0', action: 'skip', pool: 'p' },
      ],
      b: [
        { remote: 'mfe1', tag: '1.0.0', action: 'share', pool: 'p' },
        { remote: 'mfe2', tag: '1.0.0', action: 'skip', pool: 'p' },
      ],
    });
    const mfe2 = family.consumers.find((entry) => entry.remote === 'mfe2')!;
    expect(mfe2).toMatchObject({
      outcome: 'mixed-builds',
      coherent: false,
      combination: ['a@2.0.0', 'b@1.0.0'],
    });
  });

  it('marks a dirty record pending and names an untagged entrypoint joining its package', () => {
    const family = familyFrom(
      {
        '@x/core': [
          { remote: 'mfe1', tag: '1.0.0', action: 'share', pool: 'x' },
          { remote: 'mfe2', tag: '1.0.0', action: 'skip' },
        ],
        '@x/core/sub': [{ remote: 'mfe1', tag: '1.0.0', action: 'share' }],
      },
      true,
    );
    expect(family.pending).toBe(true);
    expect(
      family.members.map(({ packageName, followsPackage }) => ({ packageName, followsPackage })),
    ).toEqual([
      { packageName: '@x/core', followsPackage: null },
      { packageName: '@x/core/sub', followsPackage: '@x/core' },
    ]);
  });
});
