import { satisfiesRange } from '../semver-range';
import { owningPackage } from './derive-grouping-facets';
import type { TagPool } from './grouping-model';
import type { CanonicalRegistryEvidence, VersionRegistration } from './model';
import type {
  PoolConsumer,
  PoolConsumerOutcome,
  PoolFamily,
  PoolFamilyMember,
  PoolMatrixCell,
} from './pool-family-model';

interface MemberRow {
  remote: string;
  tag: string;
  requiredVersion: string;
  strictVersion: boolean;
  action: VersionRegistration['action'];
  poolTag: string | null;
  servedBy: string | null;
  poolCause: string | null;
  specifiers: string[];
}

/**
 * Family view of every tag pool, read off the rows pooling wrote back
 * (`rebuildMember` in the orchestrator's `pool-shared-externals.ts`): who
 * serves each consumer each member, and whether the resolved combination is
 * one some single build shipped (the `findTornRemotes` contract).
 */
export function derivePoolFamilies(
  evidence: CanonicalRegistryEvidence,
  tagPools: readonly TagPool[],
  hostRemote: string,
): PoolFamily[] {
  const externalById = new Map(evidence.sharedExternals.map((e) => [e.id, e]));
  const registrationById = new Map(evidence.versionRegistrations.map((r) => [r.id, r]));
  const declarationById = new Map(evidence.participantDeclarations.map((d) => [d.id, d]));
  const candidateById = new Map(evidence.entrypointCandidates.map((c) => [c.id, c]));

  return tagPools.map((pool) => {
    const externals = pool.sharedExternalIds.map((id) => externalById.get(id)!);
    const rowsByMember = new Map<string, MemberRow[]>();
    // The global mapping publishes the first participant of the `share` row (`remotes[0]`).
    const basisByMember = new Map<string, { remote: string; tag: string }>();
    for (const external of externals) {
      const rows = rowsByMember.get(external.packageName) ?? [];
      rowsByMember.set(external.packageName, rows);
      for (const registration of external.versionRegistrationIds.map((id) =>
        registrationById.get(id)!,
      )) {
        const declarations = registration.participantDeclarationIds.map((id) =>
          declarationById.get(id)!,
        );
        if (
          registration.action === 'share' &&
          declarations.length > 0 &&
          !basisByMember.has(external.packageName)
        ) {
          basisByMember.set(external.packageName, {
            remote: declarations[0].participant,
            tag: registration.tag,
          });
        }
        for (const declaration of declarations) {
          rows.push({
            remote: declaration.participant,
            tag: registration.tag,
            requiredVersion: declaration.requiredVersion,
            strictVersion: declaration.strictVersion,
            action: registration.action,
            poolTag: declaration.pool?.trim() || null,
            servedBy: declaration.servedBy,
            poolCause: declaration.poolCause,
            specifiers: declaration.entrypointCandidateIds.map(
              (id) => candidateById.get(id)!.specifier,
            ),
          });
        }
      }
    }

    const rowOf = (remote: string, member: string) =>
      rowsByMember.get(member)?.find((row) => row.remote === remote);
    const servingBuildOf = (row: MemberRow, member: string): string => {
      if (row.action === 'scope') return row.remote;
      if (row.servedBy !== null) return row.servedBy;
      return basisByMember.get(member)?.remote ?? row.remote;
    };
    // Every build's own specifier → tag table, `scope` rows included: a build is coherent by construction.
    const buildTags = new Map<string, Map<string, string>>();
    for (const [, rows] of rowsByMember) {
      for (const row of rows) {
        const tags = buildTags.get(row.remote) ?? new Map<string, string>();
        buildTags.set(row.remote, tags);
        for (const specifier of row.specifiers)
          if (!tags.has(specifier)) tags.set(specifier, row.tag);
      }
    }
    const shipped = (combination: Map<string, string>) =>
      [...buildTags.values()].some((tags) =>
        [...combination].every(([spec, tag]) => tags.get(spec) === tag),
      );
    const listOf = (combination: Map<string, string>) =>
      [...combination].map(([spec, tag]) => `${spec}@${tag}`).sort(compareText);

    const members: PoolFamilyMember[] = pool.members.map((packageName) => {
      const rows = rowsByMember.get(packageName) ?? [];
      const owner = owningPackage(packageName);
      return {
        packageName,
        followsPackage:
          rows.every((row) => row.poolTag === null) &&
          owner !== undefined &&
          pool.members.includes(owner)
            ? owner
            : null,
        unshared: !rows.some((row) => row.action === 'share'),
        scopedRemotes: [
          ...new Set(rows.filter((row) => row.action === 'scope').map((row) => row.remote)),
        ].sort(compareText),
      };
    });

    const matrix: PoolMatrixCell[][] = pool.members.map((member) =>
      pool.remotes.map((remote): PoolMatrixCell => {
        const row = rowOf(remote, member);
        return row === undefined
          ? { kind: 'not-declared' }
          : {
              kind: 'declared',
              tag: row.tag,
              poolTag: row.poolTag,
              scoped: row.action === 'scope',
              poolCause: row.poolCause,
            };
      }),
    );

    const consumers: PoolConsumer[] = pool.remotes.map((remote) => {
      const consumed = pool.members.flatMap((member) => {
        const row = rowOf(remote, member);
        return row === undefined ? [] : [{ member, row }];
      });
      const servingBuilds = Object.fromEntries(
        consumed.map(({ member, row }) => [member, servingBuildOf(row, member)]),
      );
      const combination = new Map<string, string>();
      const sharedCombination = new Map<string, string>();
      for (const { member, row } of consumed) {
        const servedTag = rowOf(servingBuilds[member], member)?.tag ?? row.tag;
        const basis = basisByMember.get(member);
        for (const specifier of row.specifiers) {
          combination.set(specifier, servedTag);
          if (basis !== undefined) sharedCombination.set(specifier, basis.tag);
        }
      }
      const outcome = outcomeOf(
        remote,
        consumed.map(({ row }) => row),
        Object.values(servingBuilds),
      );
      const host = remote === hostRemote;
      return {
        remote,
        host,
        outcome,
        poolCauses: causesOf(consumed),
        // `determine`'s objector: only a strict copy whose range rejects the shared tag keeps its own build.
        conflicts: consumed.flatMap(({ member, row }) => {
          const basis = basisByMember.get(member);
          return basis !== undefined &&
            row.strictVersion &&
            satisfiesRange(basis.tag, row.requiredVersion) === false
            ? [{ member, requiredVersion: row.requiredVersion, sharedTag: basis.tag }]
            : [];
        }),
        servingBuilds,
        servesOthers: pool.remotes
          .filter((other) => other !== remote)
          .filter((other) =>
            pool.members.some((member) => rowOf(other, member)?.servedBy === remote),
          ),
        coherent: host ? null : combination.size === 0 || shipped(combination),
        combination: listOf(combination),
        sharedCombinationMixes:
          outcome === 'redirected' && sharedCombination.size > 0 && !shipped(sharedCombination)
            ? listOf(sharedCombination)
            : null,
      };
    });

    return {
      poolId: pool.id,
      members,
      matrix,
      consumers,
      pending: externals.some((external) => external.dirty),
      recorded: externals.some((external) => external.poolName !== null),
    };
  });
}

function causesOf(consumed: { member: string; row: MemberRow }[]): PoolConsumer['poolCauses'] {
  const members = new Map<string, string[]>();
  for (const { member, row } of consumed) {
    if (row.poolCause !== null)
      members.set(row.poolCause, [...(members.get(row.poolCause) ?? []), member]);
  }
  return [...members]
    .sort(([a], [b]) => compareText(a, b))
    .map(([cause, names]) => ({ cause, members: names }));
}

function outcomeOf(
  remote: string,
  rows: MemberRow[],
  servingBuilds: string[],
): PoolConsumerOutcome {
  if (rows.length > 0 && rows.every((row) => row.action === 'scope')) return 'own-copy';
  if (rows.some((row) => row.servedBy !== null && row.servedBy !== remote)) return 'redirected';
  return new Set(servingBuilds).size <= 1 ? 'one-build' : 'mixed-builds';
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
