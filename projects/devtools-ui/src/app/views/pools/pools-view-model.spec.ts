/**
 * Pools view model (grouping-and-pooling Task 6) against the wording
 * contract in docs/work/grouping-and-pooling/design/pools-explainer-mock.md.
 * Fixture cases are the contract's acceptance reference; the membership notes
 * no capture reaches run on hand-built projections.
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES, NF_HOST, type FixtureId } from 'devtools-bridge';

import { ingestSnapshot } from '../../shared/store/ingest';
import type { CanonicalResolutionProjection } from '../../shared/store/resolution';
import { buildPoolsVm, hasPoolTags } from './pools-view-model';

const projectionOf = (id: FixtureId) => ingestSnapshot(FIXTURES[id]).resolutionProjection;
const vmOf = (id: FixtureId) => buildPoolsVm(projectionOf(id));
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
    const [card, pendingCard] = buildPoolsVm(projection).pools;
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
});
