import type {
  CanonicalResolutionProjection,
  PoolConsumer,
  PoolFamily,
  TagPool,
} from '../../shared/store/resolution';
import { GLOBAL_SCOPE, isHostRemote, participantDisplay } from '../../shared/view-conventions';

// Wording contract: docs/work/grouping-and-pooling/design/pools-explainer-mock.md.

export const POOLS_DEFINITION =
  'A pool is a set of packages that must come from the same build. Remotes opt packages in with a pool tag; the orchestrator then makes sure each remote gets all of them from one build.';
export const POOLING_DOCS_URL = 'https://native-federation.com/docs/v4/orchestrator/pooling';

export const LEGACY_POOL_NOTE = 'orchestrator before 4.7: pool name and reasons not recorded';

// The orchestrator's `PoolCause` (v4.7+): cell label and outcome explanation. An unknown value is shown raw.
const POOL_CAUSES: Record<string, { label: string; text: string }> = {
  incompatible: { label: 'version conflict', text: 'version conflict with the shared versions' },
  uncovered: { label: 'not covered', text: 'no single build has every package it imports' },
  torn: { label: 'would mix builds', text: 'the shared versions would mix builds' },
  unshared: { label: 'no shared copy', text: 'no remote shares it any more' },
};

export interface PoolRemoteVm {
  name: string;
  host: boolean;
}

export interface PoolCellVm {
  /** Declared tag version, or `—` when the remote does not declare the member. */
  text: string;
  poolTag: string | null;
  scoped: boolean;
  /** Why pooling gave this copy its own build; `unknown` before v4.7. */
  causeNote: string | null;
}

export interface PoolRowVm {
  packageName: string;
  cells: PoolCellVm[];
}

export interface PoolOutcomeVm {
  remote: PoolRemoteVm;
  sentence: string;
  /** Coherence finding — pooling guarantees none; null on every healthy consumer. */
  finding: string | null;
}

export interface PoolCardVm {
  /** Canonical pool ID (tracking key and `select` payload). */
  id: string;
  name: string;
  /** Share scope when not the default one. */
  scopeLabel: string | null;
  counts: string;
  formedBy: string;
  remotes: PoolRemoteVm[];
  rows: PoolRowVm[];
  /** Replaces the outcome lines while a member record is pending re-election. */
  pendingNote: string | null;
  outcomes: PoolOutcomeVm[];
  notes: string[];
  footnote: string | null;
}

export interface PoolsVm {
  pools: PoolCardVm[];
  orphans: string[];
  /** Set when the capture holds no pool tag at all. */
  emptyNote: string | null;
}

export function buildPoolsVm(projection: CanonicalResolutionProjection): PoolsVm {
  const pools = projection.tagPools.map((pool, index) =>
    poolCardOf(pool, projection.poolFamilies[index], projection.tagPools),
  );
  const orphans = projection.orphanPoolTags.flatMap((orphan) =>
    orphan.tags.map(
      (tag) =>
        `${orphan.packageName}${scopeSuffix(orphan.shareScope)}: tag "${tag.tag}" by ${participantDisplay(tag.remote)} joined nothing — likely a typo or a missing sibling`,
    ),
  );
  return {
    pools,
    orphans,
    emptyNote: pools.length === 0 && orphans.length === 0 ? 'No pool tags in this capture.' : null,
  };
}

/** Whether the Pools tab has anything to show. */
export function hasPoolTags(projection: CanonicalResolutionProjection): boolean {
  return projection.tagPools.length > 0 || projection.orphanPoolTags.length > 0;
}

function poolCardOf(pool: TagPool, family: PoolFamily, allPools: readonly TagPool[]): PoolCardVm {
  const remotes = pool.remotes.map((name) => ({ name, host: isHostRemote(name) }));
  const tagStrings = [...new Set(pool.tags.map((tag) => tag.tag))].sort();
  const untagged = pool.remotes.filter((remote) => !pool.tags.some((tag) => tag.remote === remote));

  const notes: string[] = [];
  if (!family.recorded) notes.push(LEGACY_POOL_NOTE);
  if (pool.remotes.length < 2) {
    notes.push('only one remote declares its members — nothing to coordinate');
  }
  if (tagStrings.length > 1) {
    const linking = pool.members.filter(
      (member) =>
        new Set(pool.tags.filter((t) => t.packageName === member).map((t) => t.tag)).size > 1,
    );
    notes.push(
      `tags ${tagStrings.map((t) => `"${t}"`).join(', ')} form one pool — they meet through ${linking.length > 0 ? linking.join(', ') : 'a shared package'}`,
    );
  }
  for (const tag of tagStrings) {
    for (const other of allPools) {
      if (
        other.id !== pool.id &&
        other.shareScope === pool.shareScope &&
        other.tags.some((t) => t.tag === tag)
      ) {
        notes.push(
          `tag "${tag}" also forms pool ${other.name} — tags only connect through a shared package`,
        );
      }
    }
  }
  for (const member of family.members) {
    if (member.followsPackage !== null) {
      notes.push(`${member.packageName} follows its package ${member.followsPackage}`);
    }
    if (member.unshared && member.scopedRemotes.length > 1) {
      notes.push(
        `no remote shares ${member.packageName} — ${member.scopedRemotes.length} remotes run their own copy`,
      );
    }
  }

  return {
    id: pool.id,
    name: pool.name,
    scopeLabel: pool.shareScope === GLOBAL_SCOPE ? null : pool.shareScope,
    counts: `${pool.members.length} packages · ${pool.remotes.length} remotes`,
    formedBy: tagStrings.join(', '),
    remotes,
    rows: pool.members.map((packageName, row) => ({
      packageName,
      cells: family.matrix[row].map((cell) =>
        cell.kind === 'not-declared'
          ? { text: '—', poolTag: null, scoped: false, causeNote: null }
          : {
              text: cell.scoped
                ? `${cell.tag} (own copy: ${causeLabel(cell.poolCause)})`
                : cell.tag,
              poolTag: cell.poolTag,
              scoped: cell.scoped,
              causeNote: cell.scoped ? causeText(cell.poolCause) : null,
            },
      ),
    })),
    pendingNote: family.pending ? 'pending re-election — outcomes not settled yet' : null,
    outcomes: family.pending ? [] : family.consumers.map((c) => outcomeOf(c, family.recorded)),
    notes,
    footnote:
      untagged.length > 0
        ? `a tag pulls a package into the pool; every remote using that package takes part (${untagged.map(participantDisplay).join(', ')} ${untagged.length === 1 ? 'declares' : 'declare'} no tag)`
        : null,
  };
}

function outcomeOf(consumer: PoolConsumer, recorded: boolean): PoolOutcomeVm {
  const builds = [...new Set(Object.values(consumer.servingBuilds))];
  const own = builds.length === 1 && builds[0] === consumer.remote;
  const fromBuilds =
    builds.length === 1
      ? `${participantDisplay(builds[0])}'s build`
      : builds.map(participantDisplay).join(', ');
  let sentence: string;
  switch (consumer.outcome) {
    case 'own-copy':
      sentence = `own copy of every package (${Object.keys(consumer.servingBuilds).length})`;
      break;
    case 'redirected':
      sentence = `redirected: every package from ${fromBuilds}`;
      if (consumer.sharedCombinationMixes !== null) {
        sentence += ` — the shared versions would have mixed ${consumer.sharedCombinationMixes.join(' + ')}`;
      }
      break;
    case 'mixed-builds':
      sentence = `packages from different builds: ${Object.entries(consumer.servingBuilds)
        .map(([member, build]) => `${member} from ${participantDisplay(build)}`)
        .join(', ')}`;
      break;
    case 'one-build':
      sentence = own
        ? `every package from its own build${consumer.host ? ' (host precedence)' : ''}`
        : `every package from ${fromBuilds}`;
      break;
  }
  const why = reasonOf(consumer, recorded);
  if (why !== null) sentence += ` — ${why}`;
  if (consumer.servesOthers.length > 0) {
    sentence += ` · ${consumer.servesOthers.map(participantDisplay).join(', ')} ${consumer.servesOthers.length === 1 ? 'uses' : 'use'} this build`;
  }
  return {
    remote: { name: consumer.remote, host: consumer.host },
    sentence,
    finding:
      consumer.coherent === false
        ? `no single build ships this combination: ${consumer.combination.join(' + ')}`
        : null,
  };
}

function reasonOf(consumer: PoolConsumer, recorded: boolean): string | null {
  if (!recorded) return consumer.outcome === 'own-copy' ? 'reason unknown' : null;
  if (consumer.poolCauses.length === 0) return null;
  return consumer.poolCauses
    .map(({ cause, members }) => {
      if (cause === 'incompatible' && consumer.conflicts.length > 0) {
        return `version conflict: ${consumer.conflicts
          .map((c) => `needs ${c.member}@${c.requiredVersion}, shared is ${c.sharedTag}`)
          .join('; ')}`;
      }
      if (cause === 'unshared') return `no remote shares ${members.join(', ')} any more`;
      return causeText(cause);
    })
    .join('; ');
}

function causeLabel(cause: string | null): string {
  return cause === null ? 'unknown' : (POOL_CAUSES[cause]?.label ?? cause);
}

function causeText(cause: string | null): string {
  if (cause === null) return 'reason unknown';
  return POOL_CAUSES[cause]?.text ?? `pooling cause "${cause}"`;
}

function scopeSuffix(scope: string): string {
  return scope === GLOBAL_SCOPE ? '' : ` (${scope})`;
}
