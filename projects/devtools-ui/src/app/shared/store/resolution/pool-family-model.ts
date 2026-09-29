import type { TagPoolId } from './grouping-model';

/** One cell of a pool's tag matrix: what a remote declared for a member. */
export type PoolMatrixCell =
  | { kind: 'not-declared' }
  | { kind: 'declared'; tag: string; poolTag: string | null; scoped: boolean };

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

/** A tag pool's family view: matrix, per-consumer outcomes, pending state. */
export interface PoolFamily {
  poolId: TagPoolId;
  members: PoolFamilyMember[];
  /** Matrix rows follow `members`, columns follow the pool's `remotes`. */
  matrix: PoolMatrixCell[][];
  consumers: PoolConsumer[];
  /** A member record is `dirty`: pending re-election, outcomes not settled. */
  pending: boolean;
}
