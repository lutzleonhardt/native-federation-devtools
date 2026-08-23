/**
 * Chunk claims of one resolved copy — rendered exclusively from the copy's
 * canonical `BundleClaim` records (T7-AC-04) and nested inside the copy's
 * block since the T7.5 redesign. Only a `mapped-source` claim presents
 * registered chunk files without qualification; `source-only` and
 * `ambiguous` claims surface their uncertainty instead of implying mapped
 * backing chunks. Files are recorded registry evidence — available for
 * loading, never proof of requests or downloads.
 */
import type { BundleClaimStatus, ResolvedDependencyCopy } from '../../shared/store/resolution';
import {
  CanonicalIndexes,
  chunkFileClaim,
  isHostRemote,
  participantDisplay,
} from './packages-vm-shared';

/** One canonical bundle claim of a resolved copy, render-ready. */
export interface ChunkClaimVm {
  /** Canonical bundle-claim ID (structural tuple; render tracking key). */
  claimId: string;
  bundle: string;
  status: BundleClaimStatus;
  /** Grounded qualification of the claim (tooltip). */
  note: string;
  /**
   * Source remote of the claim; under ambiguity the candidate remote —
   * surfaced, never chosen. Null when no remote is named.
   */
  source: { display: string; host: boolean; remoteSelect: string } | null;
  /** True when the claim's source differs from the block's source chip. */
  showSource: boolean;
  /** Registered chunk files of the claim's chunk groups, registry order. */
  files: string[];
  /** Shared chunk-file wording (`view-conventions.ts`); claims absence explicitly. */
  fileClaim: string;
}

function claimNote(status: BundleClaimStatus, sourceDisplay: string | null): string {
  switch (status) {
    case 'mapped-source':
      return `registered chunk list of this source's bundle — available for loading, not proof of delivery`;
    case 'source-only':
      return 'the source names this bundle, but the capture registers no chunk list for it';
    case 'ambiguous':
      return `ambiguous source — ${
        sourceDisplay ?? 'a candidate'
      } is one candidate for this bundle; chunks are not attributed`;
  }
}

/** Chunk claims of one copy; `blockSourceRemote` mutes the redundant chip. */
export function buildCopyChunkClaims(
  copy: ResolvedDependencyCopy,
  indexes: CanonicalIndexes,
  blockSourceRemote: string | null,
): ChunkClaimVm[] {
  const claims: ChunkClaimVm[] = [];
  for (const claimId of copy.bundleClaimIds) {
    const claim = indexes.bundleClaimById.get(claimId);
    if (claim === undefined) {
      continue;
    }
    const files = claim.chunkGroupIds.flatMap(
      (groupId) => indexes.chunkGroupById.get(groupId)?.files ?? [],
    );
    const sourceDisplay =
      claim.sourceRemote === null ? null : participantDisplay(claim.sourceRemote);
    claims.push({
      claimId: claim.id,
      bundle: claim.bundle,
      status: claim.status,
      note: claimNote(claim.status, sourceDisplay),
      source:
        claim.sourceRemote === null
          ? null
          : {
              display: sourceDisplay!,
              host: isHostRemote(claim.sourceRemote),
              remoteSelect: claim.sourceRemote,
            },
      showSource: claim.sourceRemote !== null && claim.sourceRemote !== blockSourceRemote,
      files,
      fileClaim: chunkFileClaim(files),
    });
  }
  return claims;
}
