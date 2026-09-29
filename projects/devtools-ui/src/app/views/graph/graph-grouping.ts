import type {
  CanonicalResolutionProjection,
  ResolvedDependencyCopy,
  TagPool,
} from '../../shared/store/resolution';
import { GLOBAL_SCOPE, STRICT_SCOPE } from '../../shared/view-conventions';
import { compareStrings } from './graph-element-factories';
import type { GroupBy } from './graph-types';

/** One dependency cluster of a non-provider grouping, in display order. */
export interface DependencyGroup<Entry> {
  key: string;
  label: string;
  tooltip: string | null;
  poolId: string | null;
  entries: Entry[];
}

interface GroupKey {
  key: string;
  label: string;
  tooltip: string | null;
  poolId?: string;
  /** Sort rank first, then label: named keys 1, pinned-first 0, pinned-last 2, buckets 3. */
  rank: number;
}

/**
 * Clusters of the share-scope, pool, and bundle groupings, keyed only by the
 * projection's `copyGroupingFacets`. Buckets (no key evidenced) sort last;
 * clusters are neutral — a hue is a participant identity claim.
 */
export function groupDependencies<Entry extends { copy: ResolvedDependencyCopy }>(
  groupBy: Exclude<GroupBy, 'provider'>,
  entries: readonly Entry[],
  projection: CanonicalResolutionProjection,
): DependencyGroup<Entry>[] {
  const facetsByCopy = new Map(projection.copyGroupingFacets.map((f) => [f.copyId, f]));
  const poolById = new Map(projection.tagPools.map((pool) => [pool.id, pool]));

  const keyOf = (copy: ResolvedDependencyCopy): GroupKey => {
    const facets = facetsByCopy.get(copy.id);
    switch (groupBy) {
      case 'shareScope':
        return scopeKey(facets?.shareScope ?? null, copy);
      case 'pool': {
        const pool = facets?.tagPoolId == null ? undefined : poolById.get(facets.tagPoolId);
        return pool === undefined ? NOT_POOLED : poolKey(pool);
      }
      case 'bundle':
        return bundleKey(facets?.bundles ?? []);
    }
  };

  const groups = new Map<string, GroupKey & { entries: Entry[] }>();
  for (const entry of entries) {
    const key = keyOf(entry.copy);
    const group = groups.get(key.key) ?? { ...key, entries: [] };
    group.entries.push(entry);
    groups.set(key.key, group);
  }
  return [...groups.values()]
    .sort(
      (a, b) => a.rank - b.rank || compareStrings(a.label, b.label) || compareStrings(a.key, b.key),
    )
    .map(({ key, label, tooltip, poolId, entries: grouped }) => ({
      key,
      label,
      tooltip,
      poolId: poolId ?? null,
      entries: grouped,
    }));
}

function scopeKey(scope: string | null, copy: ResolvedDependencyCopy): GroupKey {
  if (scope === null) {
    return copy.sourceDisposition === 'private-registration'
      ? {
          key: 'dependencies:scope-bucket:private',
          label: '(private)',
          tooltip: 'private registration — a scoped external belongs to no share scope',
          rank: 3,
        }
      : {
          key: 'dependencies:scope-bucket:unknown',
          label: '(no share scope evidenced)',
          tooltip: 'no unique shared source registration names a share scope for this copy',
          rank: 3,
        };
  }
  const key = `dependencies:scope:${JSON.stringify(scope)}`;
  if (scope === GLOBAL_SCOPE) {
    return {
      key,
      label: 'default share scope',
      tooltip: `${GLOBAL_SCOPE} — the default share scope (no shareScope configured)`,
      rank: 0,
    };
  }
  if (scope === STRICT_SCOPE) {
    return {
      key,
      label: STRICT_SCOPE,
      tooltip:
        "special strict share scope — no election, every exact version is shared side by side (config: shareScope: 'strict')",
      rank: 2,
    };
  }
  return { key, label: scope, tooltip: `configured via shareScope: ${scope}`, rank: 1 };
}

const NOT_POOLED: GroupKey = {
  key: 'dependencies:pool-bucket:none',
  label: '(not pooled)',
  tooltip:
    'no explicit pool tag reaches this package (auto-pooling by npm scope is not recorded in the registry)',
  rank: 3,
};

function poolKey(pool: TagPool): GroupKey {
  const formedBy = [...new Set(pool.tags.map((tag) => `${tag.remote} "${tag.tag}"`))].join(', ');
  const lines = [`formed by: ${formedBy}`];
  if (pool.remotes.length < 2) {
    lines.push('only one remote declares its members — nothing to coordinate');
  }
  return {
    key: `dependencies:pool:${pool.id}`,
    label:
      pool.shareScope === GLOBAL_SCOPE
        ? `pool ${pool.name}`
        : `pool ${pool.name} · ${pool.shareScope}`,
    tooltip: lines.join('\n'),
    poolId: pool.id,
    rank: 1,
  };
}

function bundleKey(bundles: readonly string[]): GroupKey {
  if (bundles.length === 0) {
    return {
      key: 'dependencies:bundle-bucket:none',
      label: '(no bundle)',
      tooltip: 'no bundle claim — built without features.denseChunking, or no evidenced source',
      rank: 3,
    };
  }
  return {
    key: `dependencies:bundle:${JSON.stringify(bundles)}`,
    label: bundles.join(' + '),
    tooltip: "bundle named by the copy's source registration (config: features.denseChunking)",
    rank: 1,
  };
}
