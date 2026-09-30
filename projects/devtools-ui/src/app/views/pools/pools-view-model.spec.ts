/**
 * Pools view model (grouping-and-pooling Task 6) against the wording
 * contract in docs/work/grouping-and-pooling/design/pools-explainer-mock.md.
 * Fixture cases are the contract's acceptance reference; the membership notes
 * no capture reaches run on hand-built projections.
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES, NF_HOST, type FixtureId, type SnapshotV1 } from 'devtools-bridge';

import { ingestSnapshot } from '../../shared/store/ingest';
import type { CanonicalResolutionProjection } from '../../shared/store/resolution';
import { buildPoolsVm, hasPoolTags } from './pools-view-model';

const projectionOf = (id: FixtureId) => ingestSnapshot(FIXTURES[id]).resolutionProjection;
// The corpus is orchestrator v4.6.0, which publishes no version.
const vmOf = (id: FixtureId) => buildPoolsVm(projectionOf(id), null);
const sentences = (id: FixtureId) =>
  Object.fromEntries(vmOf(id).pools[0].outcomes.map((o) => [o.remote.name, o.sentence]));

describe('buildPoolsVm (grouping-and-pooling T6)', () => {
  it('T6-AC-01: pooling-anchor — header, matrix, outcomes, untagged footnote', () => {
    const [pool] = vmOf('pooling-anchor').pools;
    expect(pool).toMatchObject({
      name: '@nf-lab/conflict-lib',
      scopeLabel: null,
      counts: '2 packages · 3 remotes',
      formedBy: 'family',
    });
    expect(
      pool.rows.map((row) => [
        row.packageName,
        ...row.cells.map((c) => c.text + (c.poolTag ? ` ⬡${c.poolTag}` : '')),
      ]),
    ).toEqual([
      ['@nf-lab/conflict-lib', '2.0.0', '1.0.0 ⬡family', '1.0.0'],
      ['@nf-lab/conflict-lib/extra', '—', '1.0.0 ⬡family', '1.0.0'],
    ]);
    expect(sentences('pooling-anchor')).toEqual({
      [NF_HOST]: 'every package from its own build (host precedence)',
      mfe1: 'every package from its own build · mfe2 uses this build',
      mfe2: "redirected: every package from mfe1's build — the shared versions would have mixed @nf-lab/conflict-lib/extra@1.0.0 + @nf-lab/conflict-lib@2.0.0",
    });
    expect(pool.footnote).toBe(
      'a tag pulls a package into the pool; every remote using that package takes part (host, mfe2 declare no tag)',
    );
  });

  it('T6-AC-02: pool-tag-islanded — own copy of every package, unshared note', () => {
    const [pool] = vmOf('pool-tag-islanded').pools;
    expect(sentences('pool-tag-islanded')['mfe1']).toBe('own copy of every package (2)');
    expect(pool.rows[0].cells.map((cell) => cell.text)).toEqual([
      '1.1.0 (own copy)',
      '1.0.0 (own copy)',
    ]);
    expect(pool.notes).toEqual(['no remote shares @nf-lab/ui-core — 2 remotes run their own copy']);
  });

  it('T6-AC-03: pool-tag-coherent — one build for everyone, no notes, no findings', () => {
    const [pool] = vmOf('pool-tag-coherent').pools;
    expect(sentences('pool-tag-coherent')).toEqual({
      mfe1: 'every package from its own build',
      mfe2: "every package from mfe1's build",
    });
    expect(pool.notes).toEqual([]);
    expect(pool.footnote).toBeNull();
    expect(pool.outcomes.every((outcome) => outcome.finding === null)).toBe(true);
  });

  it('T6-AC-04: pool-tag-orphan — no pool, the orphan line, the tab still has content', () => {
    const vm = vmOf('pool-tag-orphan');
    expect(vm.pools).toEqual([]);
    expect(vm.orphans).toEqual([
      '@nf-lab/ui-core: tag "ui" by mfe1 joined nothing — likely a typo or a missing sibling',
    ]);
    expect(vm.emptyNote).toBeNull();
    expect(hasPoolTags(projectionOf('pool-tag-orphan'))).toBe(true);
  });

  it('T6-AC-06: no pool tags — empty note, no tab', () => {
    expect(vmOf('frankenstein-live')).toEqual({
      versionWarning: null,
      pools: [],
      orphans: [],
      emptyNote: 'No pool tags in this capture.',
    });
    expect(hasPoolTags(projectionOf('frankenstein-live'))).toBe(false);
  });

  it('T6-AC-05: torn combination, pending record, and membership notes', () => {
    const base = projectionOf('pool-tag-coherent');
    const [pool] = base.tagPools;
    const [family] = base.poolFamilies;
    const tornConsumer = {
      ...family.consumers[1],
      coherent: false,
      combination: ['a@2.0.0', 'b@1.0.0'],
    };
    const other = {
      ...pool,
      id: 'tag-pool:["__GLOBAL__","zz",0]' as typeof pool.id,
      name: 'zz',
      members: ['zz'],
    };
    const projection: CanonicalResolutionProjection = {
      ...base,
      tagPools: [
        {
          ...pool,
          tags: [
            ...pool.tags,
            {
              remote: 'mfe2',
              tag: 'dom',
              packageName: '@nf-lab/ui-dom',
              declarationId: pool.tags[0].declarationId,
            },
          ],
        },
        other,
      ],
      poolFamilies: [
        {
          ...family,
          consumers: [family.consumers[0], tornConsumer],
          members: [family.members[0], { ...family.members[1], followsPackage: '@nf-lab/ui-core' }],
        },
        { ...family, poolId: other.id, pending: true },
      ],
    };
    const [card, pendingCard] = buildPoolsVm(projection, null).pools;
    expect(card.outcomes[1].finding).toBe(
      'no single build ships this combination: a@2.0.0 + b@1.0.0',
    );
    expect(card.notes).toEqual([
      'tags "dom", "ui" form one pool — they meet through @nf-lab/ui-dom',
      'tag "ui" also forms pool zz — tags only connect through a shared package',
      '@nf-lab/ui-dom follows its package @nf-lab/ui-core',
    ]);
    expect(pendingCard.pendingNote).toBe('pending re-election — outcomes not settled yet');
    expect(pendingCard.outcomes).toEqual([]);
  });

  // Orchestrator v4.7 stores `SharedExternal.poolName` and `SharedVersionMeta.poolCause`
  // (native-federation/orchestrator#87). No v4.7 capture exists yet, so this adds the fields to
  // the v4.6 islanded capture the way v4.7 would write them: mfe1 islanded by gate 1, which
  // leaves mfe2's ui-core copy without a provider.
  describe('v4.7 stored pool name and causes', () => {
    const withV47Fields = (causes: Record<string, string>): SnapshotV1 => {
      const snapshot: SnapshotV1 = structuredClone(FIXTURES['pool-tag-islanded']);
      for (const external of Object.values(snapshot.runtime!.sharedExternals['__GLOBAL__'])) {
        external.poolName = 'ui';
        for (const version of external.versions) {
          if (version.action !== 'scope') continue;
          for (const remote of version.remotes) remote.poolCause = causes[remote.name];
        }
      }
      return snapshot;
    };
    const vmFrom = (snapshot: SnapshotV1) =>
      buildPoolsVm(ingestSnapshot(snapshot).resolutionProjection, '4.7.0');

    it('names the pool as stored, keeping the pre-v4.7 pool ID', () => {
      const [legacy] = vmOf('pool-tag-islanded').pools;
      const [pool] = vmFrom(withV47Fields({ mfe1: 'incompatible', mfe2: 'unshared' })).pools;
      expect(legacy.name).toBe('@nf-lab/ui-core');
      expect(pool.name).toBe('ui');
      expect(pool.id).toBe(legacy.id);
    });

    it('states the stored cause in the cells and outcome lines', () => {
      const [pool] = vmFrom(withV47Fields({ mfe1: 'incompatible', mfe2: 'unshared' })).pools;
      expect(pool.rows[0].cells.map((cell) => [cell.text, cell.causeNote])).toEqual([
        [
          '1.1.0 (own copy: version conflict)',
          'version conflict: not all its packages accept the shared versions',
        ],
        ['1.0.0 (own copy: no shared copy)', 'no remote shares it any more'],
      ]);
      expect(Object.fromEntries(pool.outcomes.map((o) => [o.remote.name, o.sentence]))).toEqual({
        mfe1: 'own copy of every package (2) — version conflict: not all its packages accept the shared versions (@nf-lab/ui-dom needs ^1.0.0, shared is 2.0.0)',
        mfe2: 'every package from its own build — no remote shares @nf-lab/ui-core any more',
      });
      expect(pool.notes).toEqual([
        'no remote shares @nf-lab/ui-core — 2 remotes run their own copy',
      ]);
    });

    it('shows a cause it does not know raw', () => {
      const [pool] = vmFrom(withV47Fields({ mfe1: 'future', mfe2: 'unshared' })).pools;
      expect(pool.outcomes.find((o) => o.remote.name === 'mfe1')!.sentence).toBe(
        'own copy of every package (2) — pooling cause "future"',
      );
    });

    // mfe1's ui-dom copy (strict ^1.0.0 against the shared 2.0.0) is the fixture's one real conflict.
    // A package is only named when its strict range certainly rejects the shared tag; otherwise the
    // line falls back to the generic reason rather than blame a package that may be fine.
    it.each([
      ['a range that accepts the shared tag', { requiredVersion: '>=1.0.0' }],
      ['a range it cannot read', { requiredVersion: 'latest' }],
      ['a non-strict copy', { strictVersion: false }],
    ])('names no package for %s', (_case, override) => {
      const snapshot = withV47Fields({ mfe1: 'incompatible', mfe2: 'unshared' });
      const dom = snapshot.runtime!.sharedExternals['__GLOBAL__']['@nf-lab/ui-dom'];
      Object.assign(dom.versions.find((v) => v.action === 'scope')!.remotes[0], override);
      const [pool] = vmFrom(snapshot).pools;
      expect(pool.outcomes.find((o) => o.remote.name === 'mfe1')!.sentence).toBe(
        'own copy of every package (2) — version conflict: not all its packages accept the shared versions',
      );
    });
  });

  describe('pre-4.7.0 warning', () => {
    const warningOf = (
      version: string | null,
      snapshot: SnapshotV1 = FIXTURES['pool-tag-islanded'],
    ) => buildPoolsVm(ingestSnapshot(snapshot).resolutionProjection, version).versionWarning;

    it('warns once, at the top, for an older or unpublished version', () => {
      expect(warningOf(null)).toBe(
        'No orchestrator version found (exposed from 4.7.0). Pool names and reasons may be missing.',
      );
      expect(warningOf('4.6.0')).toBe(
        "This page runs orchestrator 4.6.0, which doesn't store pool names or why a remote got its own copy — this tab may be incomplete.",
      );
    });

    it('does not warn from 4.7.0 on, for an unreleased build, or when there is nothing to show', () => {
      expect(warningOf('4.7.0')).toBeNull();
      expect(warningOf('5.0.0-rc.1')).toBeNull();
      expect(warningOf('dev')).toBeNull();
      expect(warningOf(null, FIXTURES['frankenstein-live'])).toBeNull();
    });

    // The version is published by a best-effort write; a stored poolName proves v4.7 without it.
    it('does not warn when the record carries v4.7 pool state but no version was published', () => {
      const snapshot: SnapshotV1 = structuredClone(FIXTURES['pool-tag-islanded']);
      for (const external of Object.values(snapshot.runtime!.sharedExternals['__GLOBAL__']))
        external.poolName = 'ui';
      expect(warningOf(null, snapshot)).toBeNull();
    });
  });
});
