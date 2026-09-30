import type { TagPoolId } from './grouping-model';

/** One cell of a pool's tag matrix: what a remote declared for a member. */
export type PoolMatrixCell =
  | { kind: 'not-declared' }
  | {
      kind: 'declared';
      tag: string;
      poolTag: string | null;
      scoped: boolean;
      /** Stored `poolCause` (v4.7+); null when absent. */
      poolCause: string | null;
    };

export interface PoolFamilyMember {
  packageName: string;
  /** The declared owning package this untagged entrypoint joined through; null otherwise. */
  followsPackage: string | null;
  /** True when no row of the member is `share` (the orchestrator's "scoped-only" case). */
  unshared: boolean;
  /** Remotes whose rows of the member are `scope`. */
  scopedRemotes: string[];
}

export type PoolConsumerOutcome = 'one-build' | 'redirected' | 'own-copy' | 'mixed-builds';

/** How one remote runs a pool's members, read off its stored rows. */
export interface PoolConsumer {
  remote: string;
  host: boolean;
  outcome: PoolConsumerOutcome;
  /** Stored `poolCause`s of this consumer's member copies, sorted by cause; empty before v4.7. */
  poolCauses: { cause: string; members: string[] }[];
  /** Members whose strict range definitely rejects the shared tag; a range it cannot read is left out. */
  conflicts: PoolVersionConflict[];
  /** Member package → the remote whose build serves it to this consumer. */
  servingBuilds: Record<string, string>;
  /** Consumers whose `servedBy` names this remote's build. */
  servesOthers: string[];
  /** Whether some single build ships the resolved specifier → tag combination; null for the host. */
  coherent: boolean | null;
  /** Resolved `specifier@tag` combination (sorted). */
  combination: string[];
  /**
   * For a redirected consumer: the combination the shared versions alone
   * would have produced, when no single build ships it; null otherwise.
   */
  sharedCombinationMixes: string[] | null;
}

export interface PoolVersionConflict {
  member: string;
  requiredVersion: string;
  sharedTag: string;
}

/** A tag pool's family view: matrix, per-consumer outcomes, pending state. */
export interface PoolFamily {
  poolId: TagPoolId;
  members: PoolFamilyMember[];
  /** Matrix rows follow `members`, columns follow the pool's `remotes`. */
  matrix: PoolMatrixCell[][];
  consumers: PoolConsumer[];
  /** A member record is `dirty`: pending re-election, outcomes not settled. */
  pending: boolean;
  /** A member carries a stored `poolName`: the record was written by orchestrator v4.7+. */
  recorded: boolean;
}
