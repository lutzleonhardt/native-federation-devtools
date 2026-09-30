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
export const POOLING_DOCS_URL = 'https://native-federation.com/docs/v4/orchestrator/pooling/';

// The orchestrator's `PoolCause` (v4.7+): cell label and outcome explanation. An unknown value is shown raw.
const POOL_CAUSES: Record<string, { label: string; text: string }> = {
  incompatible: {
    label: 'version conflict',
    text: 'version conflict: not all its packages accept the shared versions',
  },
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
  /** Why pooling gave this copy its own build, when the runtime stored it (v4.7+). */
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
  /** Set when the capture comes from an orchestrator before 4.7.0, which stores no pool results. */
  versionWarning: string | null;
  pools: PoolCardVm[];
  orphans: string[];
  /** Set when the capture holds no pool tag at all. */
  emptyNote: string | null;
}

export function buildPoolsVm(
  projection: CanonicalResolutionProjection,
  orchestratorVersion: string | null,
): PoolsVm {
  const pools = projection.tagPools.map((pool, index) =>
    poolCardOf(pool, projection.poolFamilies[index], projection.tagPools),
  );
  const orphans = projection.orphanPoolTags.flatMap((orphan) =>
    orphan.tags.map(
      (tag) =>
        `${orphan.packageName}${scopeSuffix(orphan.shareScope)}: tag "${tag.tag}" by ${participantDisplay(tag.remote)} joined nothing — likely a typo or a missing sibling`,
    ),
  );
  const hasContent = pools.length > 0 || orphans.length > 0;
  return {
    versionWarning: hasContent ? versionWarningOf(projection, orchestratorVersion) : null,
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
                ? `${cell.tag} (own copy${cell.poolCause === null ? '' : `: ${causeLabel(cell.poolCause)}`})`
                : cell.tag,
              poolTag: cell.poolTag,
              scoped: cell.scoped,
              causeNote: cell.poolCause === null ? null : causeText(cell.poolCause),
            },
      ),
    })),
    pendingNote: family.pending ? 'pending re-election — outcomes not settled yet' : null,
    outcomes: family.pending ? [] : family.consumers.map(outcomeOf),
    notes,
    footnote:
      untagged.length > 0
        ? `a tag pulls a package into the pool; every remote using that package takes part (${untagged.map(participantDisplay).join(', ')} ${untagged.length === 1 ? 'declares' : 'declare'} no tag)`
        : null,
  };
}

function outcomeOf(consumer: PoolConsumer): PoolOutcomeVm {
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
  const why = reasonOf(consumer);
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

function reasonOf(consumer: PoolConsumer): string | null {
  if (consumer.poolCauses.length === 0) return null;
  return consumer.poolCauses
    .map(({ cause, members }) => {
      // Evidence, not attribution: the record doesn't say which conflict isolated the remote.
      if (cause === 'incompatible' && consumer.conflicts.length > 0) {
        return `${causeText(cause)} (${consumer.conflicts
          .map((c) => `${c.member} needs ${c.requiredVersion}, shared is ${c.sharedTag}`)
          .join('; ')})`;
      }
      if (cause === 'unshared') return `no remote shares ${members.join(', ')} any more`;
      return causeText(cause);
    })
    .join('; ');
}

function causeLabel(cause: string): string {
  return POOL_CAUSES[cause]?.label ?? cause;
}

function causeText(cause: string): string {
  return POOL_CAUSES[cause]?.text ?? `pooling cause "${cause}"`;
}

// Without a published version (it arrived in v4.7 too), stored pool results are the only evidence of v4.7.
function versionWarningOf(
  projection: CanonicalResolutionProjection,
  version: string | null,
): string | null {
  const legacy =
    version === null
      ? !projection.poolFamilies.some((family) => family.recorded)
      : isBefore47(version);
  if (!legacy) return null;
  if (version === null) {
    return 'No orchestrator version found (exposed from 4.7.0). Pool names and reasons may be missing.';
  }
  return `This page runs orchestrator ${version}, which doesn't store pool names or why a remote got its own copy — this tab may be incomplete.`;
}

// A non-semver version ('dev', from an unreleased build) is taken as current.
function isBefore47(version: string): boolean {
  const match = /^(\d+)\.(\d+)\./.exec(version);
  if (match === null) return false;
  const [major, minor] = [Number(match[1]), Number(match[2])];
  return major < 4 || (major === 4 && minor < 7);
}

function scopeSuffix(scope: string): string {
  return scope === GLOBAL_SCOPE ? '' : ` (${scope})`;
}
