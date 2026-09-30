/**
 * Pools view model (grouping-and-pooling Task 6) against the wording
 * contract in docs/work/grouping-and-pooling/design/pools-explainer-mock.md.
 * Fixture cases are the contract's acceptance reference; the membership notes
 * no capture reaches run on hand-built projections. The pool-tag fixtures are
 * orchestrator 4.7.0 captures, pooling-anchor is 4.6.0.
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES, NF_HOST, type FixtureId, type SnapshotV1 } from 'devtools-bridge';

import { ingestSnapshot } from '../../shared/store/ingest';
import type { CanonicalResolutionProjection } from '../../shared/store/resolution';
import { buildPoolsVm, hasPoolTags } from './pools-view-model';

const projectionOf = (id: FixtureId) => ingestSnapshot(FIXTURES[id]).resolutionProjection;
// Each fixture carries the version its page exposed: 4.7.0 for the nf-lab corpus, none for the v2
// corpus (orchestrator 4.6.0) behind pooling-anchor.
const vmOfSnapshot = (snapshot: SnapshotV1) => {
  const model = ingestSnapshot(snapshot);
  return buildPoolsVm(model.resolutionProjection, model.provenance.orchestratorVersion);
};
const vmOf = (id: FixtureId) => vmOfSnapshot(FIXTURES[id]);
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

  // Real 4.7.0 capture: gate 1 islands mfe1, which leaves mfe2's ui-core without a provider.
  it('T6-AC-02: pool-tag-islanded — own copy of every package with its stored cause', () => {
    const [pool] = vmOf('pool-tag-islanded').pools;
    expect(pool.rows[0].cells.map((cell) => [cell.text, cell.causeNote])).toEqual([
      [
        '1.1.0 (own copy: version conflict)',
        'version conflict: not all its packages accept the shared versions',
      ],
      ['1.0.0 (own copy: no shared copy)', 'no remote shares it any more'],
    ]);
    expect(sentences('pool-tag-islanded')).toEqual({
      mfe1: 'own copy of every package (2) — version conflict: not all its packages accept the shared versions (@nf-lab/ui-dom needs ^1.0.0, shared is 2.0.0)',
      mfe2: 'every package from its own build — no remote shares @nf-lab/ui-core any more',
    });
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
  // (native-federation/orchestrator#87); the nf-lab corpus is captured on 4.7.0.
  describe('v4.7 stored pool name and causes', () => {
    // Variations on the real islanded capture, for states it doesn't reach on its own.
    const islandedWith = (edit: (snapshot: SnapshotV1) => void) => {
      const snapshot: SnapshotV1 = structuredClone(FIXTURES['pool-tag-islanded']);
      edit(snapshot);
      return vmOfSnapshot(snapshot);
    };
    const mfe1DomCopy = (snapshot: SnapshotV1) =>
      snapshot.runtime!.sharedExternals['__GLOBAL__']['@nf-lab/ui-dom'].versions.find(
        (v) => v.action === 'scope',
      )!.remotes[0];

    it('names the pool as stored; a pre-4.7 pool keeps its first-member name', () => {
      expect(vmOf('pool-tag-islanded').pools[0].name).toBe('ui');
      expect(vmOf('pooling-anchor').pools[0].name).toBe('@nf-lab/conflict-lib');
    });

    it('shows a cause it does not know raw', () => {
      const [pool] = islandedWith((snapshot) => {
        mfe1DomCopy(snapshot).poolCause = 'future';
        const core = snapshot.runtime!.sharedExternals['__GLOBAL__']['@nf-lab/ui-core'];
        for (const version of core.versions)
          for (const remote of version.remotes)
            if (remote.name === 'mfe1') remote.poolCause = 'future';
      }).pools;
      expect(pool.outcomes.find((o) => o.remote.name === 'mfe1')!.sentence).toBe(
        'own copy of every package (2) — pooling cause "future"',
      );
    });

    // mfe1's ui-dom copy (strict ^1.0.0 against the shared 2.0.0) is the capture's one real conflict.
    // A package is only named when its strict range certainly rejects the shared tag; otherwise the
    // line falls back to the generic reason rather than blame a package that may be fine.
    it.each([
      ['a range that accepts the shared tag', { requiredVersion: '>=1.0.0' }],
      ['a range it cannot read', { requiredVersion: 'latest' }],
      ['a non-strict copy', { strictVersion: false }],
    ])('names no package for %s', (_case, override) => {
      const [pool] = islandedWith((snapshot) =>
        Object.assign(mfe1DomCopy(snapshot), override),
      ).pools;
      expect(pool.outcomes.find((o) => o.remote.name === 'mfe1')!.sentence).toBe(
        'own copy of every package (2) — version conflict: not all its packages accept the shared versions',
      );
    });
  });

  describe('pre-4.7.0 warning', () => {
    // pooling-anchor is from the v2 corpus (orchestrator 4.6.0): no version, no stored pool state.
    const warningOf = (version: string | null, snapshot: SnapshotV1 = FIXTURES['pooling-anchor']) =>
      buildPoolsVm(ingestSnapshot(snapshot).resolutionProjection, version).versionWarning;

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
      expect(warningOf(null, FIXTURES['pool-tag-islanded'])).toBeNull();
      expect(vmOf('pool-tag-islanded').versionWarning).toBeNull();
    });
  });
});
